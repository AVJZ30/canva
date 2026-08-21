// =====================================================================
// CANVASOLUCION - Script de creación del administrador inicial
// =====================================================================
// Ejecutar UNA SOLA VEZ, de forma local (nunca en el navegador ni en
// producción del frontend), después de haber aplicado supabase/schema.sql
//
// Uso:
//   SUPABASE_URL="https://ktmolgqoktuulvdwuoum.supabase.co" \
//   SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key" \
//   ADMIN_USERNAME="solucionesavj" \
//   ADMIN_PASSWORD="solucionesavj" \
//   ADMIN_EMAIL="solucionesavj@canvasolucion.local" \
//   node scripts/create-admin.mjs
//
// La Service Role Key se obtiene en Supabase -> Project Settings -> API.
// NUNCA la coloques en el frontend ni en el repositorio.
// =====================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERNAME = process.env.ADMIN_USERNAME || 'solucionesavj';
const PASSWORD = process.env.ADMIN_PASSWORD || 'solucionesavj';
const EMAIL = process.env.ADMIN_EMAIL || 'solucionesavj@canvasolucion.local';
const FULL_NAME = process.env.ADMIN_FULL_NAME || 'Administrador';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Faltan variables de entorno. Debes definir SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`Creando usuario de autenticación (${EMAIL})...`);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  let userId;

  if (createError) {
    if (createError.message?.toLowerCase().includes('already') || createError.status === 422) {
      console.log('El usuario ya existe en auth.users, buscándolo...');
      const { data: list, error: listError } = await admin.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error('No se pudo localizar el usuario existente.');
      userId = existing.id;
    } else {
      throw createError;
    }
  } else {
    userId = created.user.id;
  }

  console.log(`Usuario de auth listo: ${userId}`);
  console.log('Creando/actualizando perfil de administrador en public.profiles...');

  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        username: USERNAME,
        full_name: FULL_NAME,
        role: 'admin',
        credits: 0,
        is_active: true,
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) throw upsertError;

  console.log('\n✅ Administrador creado correctamente.');
  console.log(`   Usuario:    ${USERNAME}`);
  console.log(`   Contraseña: ${PASSWORD}`);
  console.log(`   Email interno: ${EMAIL}`);
  console.log('\nYa puedes iniciar sesión en Canvasolucion con estas credenciales.');
}

main().catch((err) => {
  console.error('\n❌ Error creando el administrador:', err.message || err);
  process.exit(1);
});
