// Supabase Auth "Send SMS" hook. Supabase generates and verifies the OTP itself
// (via signInWithOtp/verifyOtp) — this function only relays the OTP text through
// SMS Alert instead of Supabase's default SMS provider.
//
// Configure in Supabase Dashboard: Authentication > Hooks > Send SMS hook,
// pointing at this function's URL, type HTTPS. That step generates a signing
// secret — set it as SEND_SMS_HOOK_SECRET via `supabase secrets set`.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const SMSALERT_API_KEY = Deno.env.get('SMSALERT_API_KEY')!;
const SMSALERT_SENDER = Deno.env.get('SMSALERT_SENDER') ?? 'PUNAHC';
// Supabase prefixes the generated secret with "v1," (a version tag for rotation);
// the standardwebhooks library only understands the "whsec_..." part after it.
const HOOK_SECRET = Deno.env.get('SEND_SMS_HOOK_SECRET')!.replace(/^v1,/, '');

// Must match the DLT-registered template exactly, with {#num#} as the OTP slot.
const OTP_TEMPLATE =
  'Use OTP {#num#} to verify your login to the PunahChakra mobile app. The OTP is valid for 10 minutes. Never share your OTP with anyone.';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  let event: { user: { phone?: string }; sms: { otp: string } };
  try {
    const wh = new Webhook(HOOK_SECRET);
    event = wh.verify(payload, headers) as typeof event;
  } catch (err) {
    return new Response(JSON.stringify({ error: `Invalid webhook signature: ${err}` }), { status: 401, headers: JSON_HEADERS });
  }

  const phone = event.user.phone;
  const otp = event.sms.otp;
  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: 'Missing phone or otp in hook payload' }), { status: 400, headers: JSON_HEADERS });
  }

  const text = OTP_TEMPLATE.replace('{#num#}', otp);
  const url = new URL('https://www.smsalert.co.in/api/push.json');
  url.searchParams.set('apikey', SMSALERT_API_KEY);
  url.searchParams.set('sender', SMSALERT_SENDER);
  url.searchParams.set('mobileno', phone);
  url.searchParams.set('text', text);

  const res = await fetch(url.toString());
  const resultText = await res.text();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `SMS Alert send failed (HTTP ${res.status}): ${resultText}` }), { status: 500, headers: JSON_HEADERS });
  }

  console.log('SMS Alert response:', resultText);
  return new Response(JSON.stringify({}), { status: 200, headers: JSON_HEADERS });
});
