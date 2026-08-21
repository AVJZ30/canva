// =====================================================================
// Edge Function: delete-reseller
// ---------------------------------------------------------------------
// Elimina por completo a un revendedor: fila en public.profiles y su
// usuario en auth.users. Requiere que quien invoque sea administrador.
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

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: 'No autenticado.' }, 401);
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return json({ error: 'Solo un administrador puede eliminar revendedores.' }, 403);
    }

    const { reseller_id } = await req.json();
    if (!reseller_id) return json({ error: 'reseller_id es obligatorio.' }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: target, error: targetError } = await admin
      .from('profiles')
      .select('id, user_id, username')
      .eq('id', reseller_id)
      .single();

    if (targetError || !target) return json({ error: 'Revendedor no encontrado.' }, 404);

    await admin.from('profiles').delete().eq('id', target.id);
    await admin.auth.admin.deleteUser(target.user_id);

    return json({ success: true }, 200);
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
