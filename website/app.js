// Same Supabase project as the mobile app (api.ts). The anon key is public by design;
// access is enforced by RLS.
const SUPABASE_URL = 'https://egigfrajfrkclohxksaa.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaWdmcmFqZnJrY2xvaHhrc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODI2MzYsImV4cCI6MjEwMDM1ODYzNn0.f5mTbgLyVaiHU75FuzHrTpuifowF6XkXnsiMaEg65ag';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = (id) => document.getElementById(id);
let mode = 'signin';
let pending = null; // { phone, fullName, email }

function show(view) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $(view).classList.add('active');
  window.scrollTo(0, 0);
}

function setMode(next) {
  mode = next;
  const isSignUp = mode === 'signup';
  $('tab-signin').classList.toggle('active', !isSignUp);
  $('tab-signup').classList.toggle('active', isSignUp);
  $('signup-fields').hidden = !isSignUp;
  $('send-btn').textContent = isSignUp ? 'Send OTP' : 'Login';
  $('switch-text').textContent = isSignUp ? 'Already registered? ' : 'New to PunahChakra? ';
  $('switch-btn').textContent = isSignUp ? 'Login' : 'Sign Up';
  $('phone-error').hidden = true;
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

function step(name) {
  $('phone-form').hidden = name !== 'phone';
  $('otp-form').hidden = name !== 'otp';
  $('switch-row').hidden = name !== 'phone';
}

async function checkPhoneExists(phone) {
  const { data, error } = await sb.from('profiles').select('id').eq('phone', phone).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function sendOtp(phone, fullName, email) {
  const metadata = {};
  if (fullName) metadata.full_name = fullName;
  if (email) metadata.email = email;
  const { error } = await sb.auth.signInWithOtp({
    phone,
    options: Object.keys(metadata).length ? { data: metadata } : undefined,
  });
  if (error) throw error;
}

document.querySelectorAll('[data-go]').forEach((el) =>
  el.addEventListener('click', () => {
    const target = el.dataset.go;
    if (target === 'landing') return show('landing');
    setMode(target);
    step('phone');
    show('auth');
  }),
);

document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));
$('switch-btn').addEventListener('click', () => setMode(mode === 'signup' ? 'signin' : 'signup'));
$('phone').addEventListener('input', (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)));
$('otp').addEventListener('input', (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)));

$('phone-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const isSignUp = mode === 'signup';
  const fullName = $('fullName').value.trim();
  const email = $('email').value.trim();
  const digits = $('phone').value.replace(/\D/g, '');
  const err = $('phone-error');
  err.hidden = true;

  if (isSignUp && !fullName) return showError(err, 'Please enter your full name.');
  if (digits.length !== 10) return showError(err, 'Please enter a valid 10-digit phone number.');
  const phone = `+91${digits}`;

  const btn = $('send-btn');
  btn.disabled = true;
  try {
    const exists = await checkPhoneExists(phone);
    if (!isSignUp && !exists) {
      setMode('signup');
      return showError($('phone-error'), "We couldn't find an account for this number. Please sign up first.");
    }
    if (isSignUp && exists) {
      setMode('signin');
      return showError($('phone-error'), 'An account already exists for this number. Please log in instead.');
    }
    await sendOtp(phone, fullName, email);
    pending = { phone, fullName, email };
    $('otp-phone').textContent = `+91 ${digits}`;
    $('otp').value = '';
    $('otp-error').hidden = true;
    step('otp');
    $('otp').focus();
  } catch (ex) {
    showError(err, ex.message || 'Could not send code. Please try again.');
  } finally {
    btn.disabled = false;
  }
});

$('otp-back').addEventListener('click', () => step('phone'));

$('resend-btn').addEventListener('click', async () => {
  if (!pending) return;
  try {
    await sendOtp(pending.phone, pending.fullName, pending.email);
    showError($('otp-error'), 'A new code has been sent.');
  } catch (ex) {
    showError($('otp-error'), ex.message || 'Could not resend code.');
  }
});

$('otp-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = $('otp').value;
  if (token.length !== 6) return showError($('otp-error'), 'Please enter the 6-digit code.');
  const btn = $('verify-btn');
  btn.disabled = true;
  try {
    const { data, error } = await sb.auth.verifyOtp({ phone: pending.phone, token, type: 'sms' });
    if (error) throw error;
    // Role isn't sent: handle_new_user sets it, and upserting it would reset admins to 'user'.
    await sb.from('profiles').upsert({
      id: data.user.id,
      email: pending.email || data.user.email || '',
      full_name: pending.fullName || data.user.user_metadata?.full_name || '',
      phone: pending.phone,
    });
    window.enterPortal(data.user);
  } catch (ex) {
    showError($('otp-error'), ex.message || 'Invalid or expired code.');
  } finally {
    btn.disabled = false;
  }
});

window.sb = sb;
window.showView = show;
window.resetAuth = () => {
  pending = null;
  setMode('signin');
  step('phone');
};

setMode('signin');
step('phone');

// TEMPORARY dev bypass (localhost only): opens each panel without OTP for UI preview.
// There is no Supabase session, so RLS returns no data and writes fail; remove before launch.
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
  $('dev-bypass').hidden = false;
  const fake = { id: '00000000-0000-0000-0000-000000000000', phone: '+910000000000', email: '' };
  $('bypass-user').addEventListener('click', () => {
    window.showView('portal');
    window.enterPortal({ ...fake, __bypass: true });
  });
  $('bypass-admin').addEventListener('click', () => window.enterAdmin({ ...fake, __bypass: true }));
}
