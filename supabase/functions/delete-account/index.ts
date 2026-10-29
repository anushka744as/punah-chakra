// Deletes the calling user's own account. The caller's JWT identifies who to delete; the profile,
// donations, notifications and area requests all cascade from auth.users, so removing the auth
// user erases the account's data. Called by the app's "Delete account" button.
//
// Deploy with: supabase functions deploy delete-account   (verify_jwt stays on — the gateway
// rejects requests without a valid user token, and we re-check it below).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...CORS } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return reply(401, { error: 'Not signed in' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return reply(401, { error: 'Not signed in' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return reply(500, { error: error.message });

  return reply(200, { deleted: true });
});
