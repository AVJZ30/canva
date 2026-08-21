// =====================================================================
// Edge Function: create-reseller
// ---------------------------------------------------------------------
// Crea un revendedor completo: usuario en auth.users + fila en
// public.profiles. Requiere que quien invoque esté autenticado como
// administrador. La Service Role Key vive únicamente aquí, como
// secreto del entorno de la función (nunca en el frontend).
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';

    // Cliente con el JWT del solicitante, para verificar su identidad/rol
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'No autenticado.' }, 401);
    }

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('id, role')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Solo un administrador puede crear revendedores.' }, 403);
    }

    const body = await req.json();
    const { username, full_name, password, credits } = body ?? {};

    if (!username || !full_name || !password) {
      return json({ error: 'username, full_name y password son obligatorios.' }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
    }

    // Cliente con Service Role para operaciones administrativas
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const syntheticEmail = `${String(username).toLowerCase().trim()}@canvasolucion.local`;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      return json({ error: `No se pudo crear el usuario: ${createError.message}` }, 400);
    }

    const { data: newProfile, error: insertError } = await admin
      .from('profiles')
      .insert({
        user_id: created.user.id,
        username: String(username).trim(),
        full_name: String(full_name).trim(),
        role: 'reseller',
        credits: Math.max(0, Number(credits) || 0),
        is_active: true,
      })
      .select('*')
      .single();

    if (insertError) {
      // revertir la creación del usuario de auth si falla el perfil
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: `No se pudo crear el perfil: ${insertError.message}` }, 400);
    }

    await admin.from('activity_logs').insert({
      user_id: callerProfile.id,
      action: 'reseller_created',
      description: `Revendedor creado: ${newProfile.username}`,
    });

    return json({ profile: newProfile }, 200);
  } catch (err) {
    return json({ error: (err as Error).message ?? 'Error inesperado.' }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
