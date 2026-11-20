// Account settings shared by the donor and admin profiles — mirrors the app's Personal Information,
// Privacy & Security (delete account) and Help Center screens.
(() => {
  const sb = window.sb;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FAQS = [
    ['How do I schedule a pickup?', 'Open the Donate tab, select the item types you\'re giving (clothes, shoes, blankets/bedsheets, or bags), pick a pickup slot for the next day onwards, and confirm your address. Your request starts as "Pending" until a nearby collector confirms it — you\'ll get a notification once that happens, and again once the pickup is completed.'],
    ['What materials can I donate?', 'Clothes, shoes, blankets/bedsheets, and bags. Hazardous or heavily soiled items are not accepted.'],
    ['Can I reschedule or cancel?', 'Yes — as long as a collector hasn\'t confirmed your pickup yet, you can edit or cancel it from your Profile\'s Recent Activity list. Once a collector confirms, the pickup is locked in.'],
  ];

  const wrap = document.createElement('div');
  wrap.className = 'modal'; wrap.hidden = true;
  wrap.innerHTML = '<div class="modal-card a-modal-card" id="s-card"></div>';
  document.body.appendChild(wrap);
  const card = wrap.firstChild;
  const open = (h) => { card.innerHTML = h; wrap.hidden = false; };
  const close = () => { wrap.hidden = true; };
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });

  let ctx = null; // { user, profile, saved(profile) }

  function personal() {
    const p = ctx.profile || {};
    open(`<h3>Personal Information</h3>
      <label class="a-lbl">FULL NAME</label><input id="s-name" placeholder="Enter your full name" value="${esc(p.full_name)}" />
      <label class="a-lbl">EMAIL</label><input id="s-email" type="email" placeholder="name@company.com" value="${esc(p.email)}" />
      <label class="a-lbl">PHONE</label><input value="${esc(p.phone || ctx.user.phone || '')}" disabled />
      <p class="muted" style="font-size:12px;margin:6px 0 0">This is the number you log in with, so it can't be changed here. Contact support if you need to change it.</p>
      <label class="a-lbl">DEFAULT PICKUP ADDRESS</label><textarea id="s-addr" rows="3" placeholder="Enter default pickup address">${esc(p.address)}</textarea>
      <p class="error" id="s-err" hidden></p>
      <button class="btn btn-primary full" id="s-save">Save</button><button class="link cancel" data-sclose>Close</button>`);
  }
  const flag = (k) => { try { return localStorage.getItem(k) !== 'false'; } catch (_) { return true; } };
  function alerts() {
    open(`<h3>Collection Alerts</h3>
      <label class="sw"><div><b>Pickup reminders</b><small>Get notified before scheduled pickups</small></div><input type="checkbox" data-flag="alert_pickup_reminders" ${flag('alert_pickup_reminders') ? 'checked' : ''}/></label>
      <label class="sw"><div><b>Status updates</b><small>When a collector accepts or completes a job</small></div><input type="checkbox" data-flag="alert_status_updates" ${flag('alert_status_updates') ? 'checked' : ''}/></label>
      <button class="link cancel" data-sclose>Close</button>`);
  }
  card.addEventListener('change', (e) => { const k = e.target.dataset.flag; if (k) { try { localStorage.setItem(k, String(e.target.checked)); } catch (_) {} } });
  function privacy() {
    open(`<h3>Privacy &amp; Security</h3><p>Manage how your account is protected and how your data is used.</p>
      <p><a class="link strong" href="privacy_policy.html" target="_blank" rel="noopener">Privacy Policy</a> · <a class="link strong" href="terms_of_service.html" target="_blank" rel="noopener">Terms of Service</a></p>
      <p class="error" id="s-err" hidden></p>
      <button class="btn btn-outline full" id="s-delete" style="color:var(--error);border-color:var(--error)">Delete account</button>
      <button class="link cancel" data-sclose>Close</button>`);
  }
  function help(q = '') {
    const list = FAQS.filter(([a, b]) => !q || (a + b).toLowerCase().includes(q.toLowerCase()));
    open(`<h3>Help Center</h3><p>Search our FAQs or contact support directly.</p>
      <input id="s-q" placeholder="Search FAQs" value="${esc(q)}" />
      <div class="a-scroll">${list.map(([a, b]) => `<details class="faq"><summary>${esc(a)}</summary><p>${esc(b)}</p></details>`).join('') || '<p class="muted">No matching questions.</p>'}</div>
      <a class="btn btn-primary full" href="mailto:info.punahchakra@gmail.com">Email support</a><button class="link cancel" data-sclose>Close</button>`);
    const i = document.getElementById('s-q'); i.focus(); i.setSelectionRange(q.length, q.length);
  }

  card.addEventListener('input', (e) => { if (e.target.id === 's-q') help(e.target.value); });
  card.addEventListener('click', async (e) => {
    const t = e.target, err = document.getElementById('s-err');
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    if ('sclose' in t.dataset) return close();
    if (t.id === 's-save') {
      const name = document.getElementById('s-name').value.trim(), mail = document.getElementById('s-email').value.trim();
      if (!name) return fail('Please enter your full name.');
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail('Please enter a valid email address, or leave it empty.');
      t.disabled = true;
      const upd = { full_name: name, email: mail, address: document.getElementById('s-addr').value.trim(), updated_at: new Date().toISOString() };
      const { error } = await sb.from('profiles').update(upd).eq('id', ctx.user.id);
      t.disabled = false;
      if (error) return fail(error.message || 'Could not save. Please try again.');
      ctx.profile = { ...ctx.profile, ...upd };
      ctx.saved(ctx.profile);
      close();
    }
    if (t.id === 's-delete') {
      if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) return;
      t.disabled = true;
      const { data, error } = await sb.functions.invoke('delete-account', { method: 'POST' });
      if (error || !data?.deleted) { t.disabled = false; return fail((error && error.message) || 'Could not delete your account. Please try again, or email info.punahchakra@gmail.com.'); }
      await sb.auth.signOut();
      close(); alert('Your account and data have been deleted.');
      window.resetAuth(); window.showView('landing');
    }
  });

  // Renders the three rows into `el`; `get()` returns { user, profile }, `saved` is called after an edit.
  window.mountSettings = (el, get, saved, withAlerts) => {
    el.innerHTML = `<h4 class="eyebrow">ACCOUNT SETTINGS</h4><div class="white-card s-list">
      <button data-s="personal">Personal Information<b>›</b></button>${withAlerts ? '<button data-s="alerts">Collection Alerts<b>›</b></button>' : ''}<button data-s="privacy">Privacy &amp; Security<b>›</b></button><button data-s="help">Help Center<b>›</b></button></div>`;
    el.onclick = (e) => {
      const k = e.target.closest('[data-s]')?.dataset.s; if (!k) return;
      ctx = { ...get(), saved };
      ({ personal, privacy, help, alerts })[k]();
    };
  };
})();
