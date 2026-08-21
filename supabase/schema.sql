-- =====================================================================
-- CANVASOLUCION - SCHEMA COMPLETO DE BASE DE DATOS
-- =====================================================================
-- Ejecutar este archivo completo en el SQL Editor de Supabase
-- (Project -> SQL Editor -> New query -> pegar todo -> Run)
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONES
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TIPOS ENUM
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'reseller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.credit_tx_type as enum ('credit_added', 'credit_used', 'credit_refunded', 'manual_adjustment');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- TABLA: profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text not null default '',
  role public.user_role not null default 'reseller',
  credits integer not null default 0 check (credits >= 0),
  is_active boolean not null default true,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_username on public.profiles(username);

-- ---------------------------------------------------------------------
-- TABLA: canva_requests
-- ---------------------------------------------------------------------
create table if not exists public.canva_requests (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  status public.request_status not null default 'pending',
  duration_months integer not null default 1 check (duration_months in (1,2,3,4,5,6,7,8,9,10,11,12,24,36)),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

create index if not exists idx_requests_reseller on public.canva_requests(reseller_id);
create index if not exists idx_requests_status on public.canva_requests(status);
create index if not exists idx_requests_created on public.canva_requests(created_at desc);

-- ---------------------------------------------------------------------
-- TABLA: credit_transactions
-- ---------------------------------------------------------------------
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  reseller_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  type public.credit_tx_type not null,
  description text,
  related_request_id uuid references public.canva_requests(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_tx_reseller on public.credit_transactions(reseller_id);
create index if not exists idx_credit_tx_created on public.credit_transactions(created_at desc);

-- ---------------------------------------------------------------------
-- TABLA: activity_logs
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- ---------------------------------------------------------------------
-- FUNCION AUXILIAR: obtener el profile.id del usuario autenticado
-- ---------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- FUNCION: log de actividad (uso interno de otras funciones)
-- ---------------------------------------------------------------------
create or replace function public.log_activity(p_user_id uuid, p_action text, p_description text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_logs (user_id, action, description)
  values (p_user_id, p_action, p_description);
end;
$$;

-- ---------------------------------------------------------------------
-- FUNCION: crear solicitud Canva de forma ATOMICA
-- Descuenta 1 crédito y crea la solicitud en una sola transacción,
-- usando bloqueo de fila (FOR UPDATE) para evitar condiciones de carrera
-- cuando el mismo revendedor envía varias solicitudes simultáneamente.
-- ---------------------------------------------------------------------
create or replace function public.create_canva_request(p_email text, p_duration_months integer)
returns public.canva_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_request public.canva_requests%rowtype;
begin
  -- Bloquea la fila del perfil del usuario actual para evitar doble gasto
  select * into v_profile
  from public.profiles
  where user_id = auth.uid()
  for update;

  if v_profile.id is null then
    raise exception 'PERFIL_NO_ENCONTRADO';
  end if;

  if v_profile.role <> 'reseller' then
    raise exception 'SOLO_REVENDEDORES_PUEDEN_SOLICITAR';
  end if;

  if not v_profile.is_active then
    raise exception 'CUENTA_INACTIVA';
  end if;

  if v_profile.credits < 1 then
    raise exception 'CREDITOS_INSUFICIENTES';
  end if;

  if p_email is null or p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'CORREO_INVALIDO';
  end if;

  if p_duration_months is null or p_duration_months not in (1,2,3,4,5,6,7,8,9,10,11,12,24,36) then
    raise exception 'DURACION_INVALIDA';
  end if;

  -- Descuenta el crédito
  update public.profiles
  set credits = credits - 1, updated_at = now()
  where id = v_profile.id
  returning * into v_profile;

  -- Crea la solicitud
  insert into public.canva_requests (reseller_id, email, status, duration_months)
  values (v_profile.id, lower(trim(p_email)), 'pending', p_duration_months)
  returning * into v_request;

  -- Registra el movimiento de crédito
  insert into public.credit_transactions (reseller_id, amount, type, description, related_request_id, created_by)
  values (v_profile.id, -1, 'credit_used', 'Solicitud de correo a Canva: ' || v_request.email, v_request.id, v_profile.id);

  perform public.log_activity(v_profile.id, 'request_created', 'Solicitud creada para ' || v_request.email);

  return v_request;
end;
$$;

grant execute on function public.create_canva_request(text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: resolver solicitud (aprobar / rechazar) - solo admin
-- ---------------------------------------------------------------------
create or replace function public.resolve_canva_request(
  p_request_id uuid,
  p_status public.request_status,
  p_rejection_reason text default null
)
returns public.canva_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.profiles%rowtype;
  v_request public.canva_requests%rowtype;
begin
  select * into v_admin from public.profiles where user_id = auth.uid();

  if v_admin.id is null or v_admin.role <> 'admin' then
    raise exception 'SOLO_ADMINISTRADORES';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'ESTADO_INVALIDO';
  end if;

  select * into v_request from public.canva_requests where id = p_request_id for update;

  if v_request.id is null then
    raise exception 'SOLICITUD_NO_ENCONTRADA';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'SOLICITUD_YA_RESUELTA';
  end if;

  update public.canva_requests
  set status = p_status,
      rejection_reason = case when p_status = 'rejected' then p_rejection_reason else null end,
      resolved_at = now(),
      resolved_by = v_admin.id,
      updated_at = now()
  where id = p_request_id
  returning * into v_request;

  perform public.log_activity(
    v_admin.id,
    case when p_status = 'approved' then 'request_approved' else 'request_rejected' end,
    'Solicitud ' || v_request.email || ' marcada como ' || p_status::text
  );

  return v_request;
end;
$$;

grant execute on function public.resolve_canva_request(uuid, public.request_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: ajustar créditos manualmente (agregar / devolver) - solo admin
-- ---------------------------------------------------------------------
create or replace function public.adjust_credits(
  p_reseller_id uuid,
  p_amount integer,
  p_type public.credit_tx_type,
  p_description text default null,
  p_related_request_id uuid default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.profiles%rowtype;
  v_reseller public.profiles%rowtype;
begin
  select * into v_admin from public.profiles where user_id = auth.uid();

  if v_admin.id is null or v_admin.role <> 'admin' then
    raise exception 'SOLO_ADMINISTRADORES';
  end if;

  if p_type not in ('credit_added', 'credit_refunded', 'manual_adjustment') then
    raise exception 'TIPO_INVALIDO';
  end if;

  select * into v_reseller from public.profiles where id = p_reseller_id for update;

  if v_reseller.id is null then
    raise exception 'REVENDEDOR_NO_ENCONTRADO';
  end if;

  if v_reseller.credits + p_amount < 0 then
    raise exception 'CREDITOS_RESULTANTES_NEGATIVOS';
  end if;

  update public.profiles
  set credits = credits + p_amount, updated_at = now()
  where id = p_reseller_id
  returning * into v_reseller;

  insert into public.credit_transactions (reseller_id, amount, type, description, related_request_id, created_by)
  values (p_reseller_id, p_amount, p_type, coalesce(p_description, ''), p_related_request_id, v_admin.id);

  perform public.log_activity(
    v_admin.id,
    'credit_adjustment',
    format('%s créditos %s para %s', p_amount, case when p_amount >= 0 then 'agregados' else 'removidos' end, v_reseller.username)
  );

  return v_reseller;
end;
$$;

grant execute on function public.adjust_credits(uuid, integer, public.credit_tx_type, text, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: devolver crédito de una solicitud rechazada - solo admin
-- ---------------------------------------------------------------------
create or replace function public.refund_request_credit(p_request_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.canva_requests%rowtype;
  v_result public.profiles%rowtype;
begin
  select * into v_request from public.canva_requests where id = p_request_id;

  if v_request.id is null then
    raise exception 'SOLICITUD_NO_ENCONTRADA';
  end if;

  if exists (
    select 1 from public.credit_transactions
    where related_request_id = p_request_id and type = 'credit_refunded'
  ) then
    raise exception 'CREDITO_YA_DEVUELTO';
  end if;

  select public.adjust_credits(
    v_request.reseller_id,
    1,
    'credit_refunded',
    'Devolución por solicitud rechazada: ' || v_request.email,
    p_request_id
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.refund_request_credit(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: heartbeat de presencia (actualiza last_seen)
-- ---------------------------------------------------------------------
create or replace function public.heartbeat()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen = now() where user_id = auth.uid();
$$;

grant execute on function public.heartbeat() to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: crear revendedor (solo admin) - crea perfil ligado a un
-- usuario de auth.users ya creado previamente vía Admin API / dashboard,
-- o actualiza username/nombre si ya existe el perfil.
-- ---------------------------------------------------------------------
create or replace function public.create_reseller_profile(
  p_user_id uuid,
  p_username text,
  p_full_name text,
  p_credits integer default 0
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.profiles%rowtype;
  v_new public.profiles%rowtype;
begin
  select * into v_admin from public.profiles where user_id = auth.uid();

  if v_admin.id is null or v_admin.role <> 'admin' then
    raise exception 'SOLO_ADMINISTRADORES';
  end if;

  insert into public.profiles (user_id, username, full_name, role, credits, is_active)
  values (p_user_id, p_username, p_full_name, 'reseller', greatest(p_credits, 0), true)
  returning * into v_new;

  perform public.log_activity(v_admin.id, 'reseller_created', 'Revendedor creado: ' || v_new.username);

  return v_new;
end;
$$;

grant execute on function public.create_reseller_profile(uuid, text, text, integer) to authenticated;

-- ---------------------------------------------------------------------
-- FUNCION: resolver username -> email para permitir login con usuario.
-- Supabase Auth exige correo, pero la UI de Canvasolucion pide
-- "usuario". Esta función security-definer traduce username -> email
-- consultando auth.users (schema no accesible directamente para el
-- cliente). Solo devuelve el email si el usuario existe y está activo;
-- no revela si la contraseña es correcta.
-- ---------------------------------------------------------------------
create or replace function public.get_login_email(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.user_id
  where lower(p.username) = lower(trim(p_username))
    and p.is_active = true;

  return v_email;
end;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- TRIGGER: mantener updated_at actualizado
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_requests_updated_at on public.canva_requests;
create trigger trg_requests_updated_at
  before update on public.canva_requests
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.canva_requests enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.activity_logs enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_limited" on public.profiles;
-- Un reseller solo puede actualizar su propio full_name (password se maneja via auth.updateUser)
create policy "profiles_update_own_limited"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Nota: la creación de perfiles de revendedores se hace vía la función
-- security-definer create_reseller_profile, no vía INSERT directo, por lo
-- que no se requiere policy de INSERT adicional para resellers.

-- ---------- canva_requests ----------
drop policy if exists "requests_select_own_or_admin" on public.canva_requests;
create policy "requests_select_own_or_admin"
  on public.canva_requests for select
  to authenticated
  using (
    reseller_id = public.current_profile_id() or public.is_admin()
  );

-- Los INSERT/UPDATE de solicitudes se realizan exclusivamente a través de
-- las funciones security-definer create_canva_request / resolve_canva_request,
-- por lo que no se otorgan policies de INSERT/UPDATE directas a resellers.
drop policy if exists "requests_admin_update" on public.canva_requests;
create policy "requests_admin_update"
  on public.canva_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- credit_transactions ----------
drop policy if exists "credit_tx_select_own_or_admin" on public.credit_transactions;
create policy "credit_tx_select_own_or_admin"
  on public.credit_transactions for select
  to authenticated
  using (
    reseller_id = public.current_profile_id() or public.is_admin()
  );

-- Los INSERT se hacen únicamente vía funciones security-definer.

-- ---------- activity_logs ----------
drop policy if exists "activity_admin_select" on public.activity_logs;
create policy "activity_admin_select"
  on public.activity_logs for select
  to authenticated
  using (public.is_admin());

-- =====================================================================
-- REALTIME
-- =====================================================================
alter publication supabase_realtime add table public.canva_requests;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.credit_transactions;
alter publication supabase_realtime add table public.activity_logs;

-- =====================================================================
-- FIN DEL SCHEMA
-- =====================================================================
