-- =====================================================================
-- MIGRACION: duración del correo (meses/años) en las solicitudes Canva
-- =====================================================================
-- Ejecuta esto completo en el SQL Editor de Supabase.
-- Es seguro correrlo aunque ya tengas datos existentes.
-- =====================================================================

-- 1) Nueva columna: duración solicitada, en meses.
--    Valores permitidos: 1-12 meses, y 24/36 para 2 y 3 años.
--    (12 = "1 año")
alter table public.canva_requests
  add column if not exists duration_months integer not null default 1;

do $$
begin
  alter table public.canva_requests
    add constraint canva_requests_duration_months_check
    check (duration_months in (1,2,3,4,5,6,7,8,9,10,11,12,24,36));
exception when duplicate_object then null;
end $$;

-- 2) Reemplaza la función que crea la solicitud para que reciba también
--    la duración elegida por el revendedor.
drop function if exists public.create_canva_request(text);

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

  update public.profiles
  set credits = credits - 1, updated_at = now()
  where id = v_profile.id
  returning * into v_profile;

  insert into public.canva_requests (reseller_id, email, status, duration_months)
  values (v_profile.id, lower(trim(p_email)), 'pending', p_duration_months)
  returning * into v_request;

  insert into public.credit_transactions (reseller_id, amount, type, description, related_request_id, created_by)
  values (v_profile.id, -1, 'credit_used', 'Solicitud de correo a Canva: ' || v_request.email, v_request.id, v_profile.id);

  perform public.log_activity(v_profile.id, 'request_created', 'Solicitud creada para ' || v_request.email);

  return v_request;
end;
$$;

grant execute on function public.create_canva_request(text, integer) to authenticated;

-- =====================================================================
-- FIN
-- =====================================================================
