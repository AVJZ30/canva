-- =====================================================================
-- CREAR ADMINISTRADOR DIRECTAMENTE DESDE EL SQL EDITOR
-- =====================================================================
-- Alternativa al script create-admin.mjs, para cuando no se quiere usar
-- la terminal. Inserta directamente en auth.users y auth.identities
-- (tablas internas de Supabase Auth) con la contraseña correctamente
-- hasheada usando pgcrypto, y crea el perfil de administrador.
--
-- Ejecuta esto UNA SOLA VEZ. Si ya intentaste crear el admin antes
-- (por ejemplo el usuario solavj051@gmail.com), primero bórralo desde
-- Authentication -> Users -> Delete user, para no tener duplicados.
-- =====================================================================

do $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := 'solucionesavj@canvasolucion.local';
  v_password text := 'solucionesavj';
begin
  -- 1) Crear el usuario en auth.users con la contraseña hasheada
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '', '', '', '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    false
  );

  -- 2) Crear la identidad asociada (requerido por Supabase Auth)
  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email',
    now(),
    now(),
    now()
  );

  -- 3) Crear el perfil de administrador
  insert into public.profiles (user_id, username, full_name, role, credits, is_active)
  values (v_user_id, 'solucionesavj', 'Administrador', 'admin', 0, true)
  on conflict (user_id) do update set role = 'admin', username = 'solucionesavj';

  raise notice 'Administrador creado con user_id: %', v_user_id;
end $$;
