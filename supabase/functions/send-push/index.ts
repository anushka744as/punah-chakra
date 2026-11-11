// Sends a push notification (FCM HTTP v1) to every device of the user a new `notifications` row
// belongs to. Triggered by a Database Webhook on INSERT into public.notifications, which POSTs
// { type: 'INSERT', record: { user_id, title, body, tag } }.
//
// Secrets (supabase secrets set ...):
//   FCM_SERVICE_ACCOUNT   the Firebase service-account JSON, as one string
//   PUSH_WEBHOOK_SECRET   random string; the webhook must send it in the x-webhook-secret header
//
// Deploy with: supabase functions deploy send-push --no-verify-jwt   (the webhook isn't a user,
// so it can't carry a JWT; the shared secret above is the gate instead).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Exchange the service account for a short-lived OAuth token (JWT bearer flow, RS256).
async function getAccessToken(sa: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(sig)}`,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`OAuth failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('PUSH_WEBHOOK_SECRET')) {
    return reply(401, { error: 'Unauthorized' });
  }

  const payload = await req.json().catch(() => null);
  const rec = payload?.record;
  if (!rec?.user_id || !rec?.title) return reply(400, { error: 'Missing record' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: rows } = await admin.from('device_tokens').select('token').eq('user_id', rec.user_id);
  const tokens = (rows || []).map((r) => r.token as string);
  if (tokens.length === 0) return reply(200, { sent: 0 });

  const sa = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT')!);
  const accessToken = await getAccessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  let sent = 0;
  for (const token of tokens) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: rec.title, body: rec.body || '' },
          data: { tag: String(rec.tag || ''), screen: 'Alerts' },
          android: { priority: 'HIGH', notification: { channel_id: 'default' } },
        },
      }),
    });
    if (res.ok) {
      sent++;
    } else if (res.status === 404 || res.status === 400) {
      // Token is stale (app uninstalled / token rotated): forget it.
      await admin.from('device_tokens').delete().eq('token', token);
    }
  }
  return reply(200, { sent });
});
