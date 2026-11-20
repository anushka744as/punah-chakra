// Admin workspace: mirrors the app's Routes / Map / Calendar / Areas / Drives screens (+ Alerts, Profile).
// Every query and write matches src/services/api.ts, so admin changes show up in the app and here alike.
(() => {
  const sb = window.sb;
  const $ = (id) => document.getElementById(id);
  const DEFAULT_CAPACITY = 5;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayStr = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const stripMeta = (a) => String(a || '').replace(/\s*\(Lat:.*\)$/, '');
  const slotToMinutes = (slot) => {
    const m = String(slot).match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    return h * 60 + parseInt(m[2], 10);
  };
  const fmtSlot = (m) => { const h24 = Math.floor(m / 60); return `${h24 % 12 === 0 ? 12 : h24 % 12}:${String(m % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`; };
  const SLOT_CHOICES = []; for (let m = 6 * 60; m <= 21 * 60 + 30; m += 30) SLOT_CHOICES.push(fmtSlot(m));
  let TIME_SLOTS = []; for (let m = 11 * 60; m < 17 * 60 + 30; m += 30) TIME_SLOTS.push(fmtSlot(m));
  const TITLES = { routes: 'Routes', map: 'Pickup Routes & Map', calendar: 'Calendar', areas: 'Pincode requests', drives: 'Collection Drives', alerts: 'Alerts', profile: 'Profile' };

  const S = {
    user: null, profile: null, tab: 'routes', donations: [], serviceable: [], area: 'all',
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), calPin: '', monthMap: {}, selDate: null, day: null,
    slotDraft: [], driveView: 'drives', drives: [], drops: [], editDrive: null, editDrop: null, requests: [], map: null,
  };

  function toast(msg) {
    const t = $('a-toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3500);
  }
  const modal = (html) => { $('a-modal-card').innerHTML = html; $('a-modal').hidden = false; };
  const closeModal = () => { $('a-modal').hidden = true; };

  async function loadTimeSlots() {
    const { data } = await sb.from('app_settings').select('value').eq('key', 'time_slots').maybeSingle();
    if (data && Array.isArray(data.value)) {
      const l = data.value.filter((x) => typeof x === 'string');
      if (l.length) TIME_SLOTS = [...l].sort((a, b) => slotToMinutes(a) - slotToMinutes(b));
    }
  }

  // ---------- shell ----------
  function setTab(tab) {
    S.tab = tab;
    document.querySelectorAll('.a-pane').forEach((p) => p.classList.toggle('on', p.id === `apane-${tab}`));
    document.querySelectorAll('#a-tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.atab === tab));
    $('a-title').textContent = TITLES[tab];
    $('a-back').hidden = ['routes', 'map', 'calendar', 'areas', 'drives'].includes(tab);
    window.scrollTo(0, 0);
    if (tab === 'routes') loadRoutes();
    if (tab === 'map') renderMap();
    if (tab === 'calendar') renderCalendar();
    if (tab === 'areas') loadAreas();
    if (tab === 'drives') loadDrives();
    if (tab === 'alerts') loadAlerts();
    if (tab === 'profile') renderProfile();
  }

  async function loadBase() {
    const [{ data: pins }] = await Promise.all([sb.from('serviceable_pincodes').select('pincode').order('pincode'), loadTimeSlots()]);
    S.serviceable = (pins || []).map((p) => p.pincode);
    if (!S.calPin || !S.serviceable.includes(S.calPin)) S.calPin = S.serviceable[0] || '';
    pollBell(); pollAreas();
  }
  async function pollBell() {
    const { count } = await sb.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', S.user.id).eq('is_read', false);
    $('a-bell-dot').hidden = !count;
  }
  async function pollAreas() {
    const { data } = await sb.from('area_requests').select('pincode');
    let seen = []; try { seen = JSON.parse(localStorage.getItem('pc_seen_area_pins') || '[]'); } catch (_) {}
    const fresh = [...new Set((data || []).map((r) => r.pincode))].filter((p) => !S.serviceable.includes(p) && !seen.includes(p));
    $('a-areas-dot').hidden = !fresh.length;
  }

  // ---------- routes ----------
  async function fetchDonations() {
    const { data, error } = await sb.from('donations').select('*, profiles!donations_donor_id_fkey(full_name, phone)').order('created_at', { ascending: false });
    if (error) { toast('Could not load pickups.'); return; }
    S.donations = (data || []).map(({ profiles, ...r }) => ({ ...r, donor_name: profiles?.full_name, donor_phone: profiles?.phone }));
  }
  const isDone = (d) => Boolean(d.is_picked_up || d.status === 'completed' || d.status === 'collected');

  function areaOptions() {
    const sel = $('a-area');
    sel.innerHTML = `<option value="all">All Areas</option>` + S.serviceable.map((p) => `<option value="${p}">${p}</option>`).join('');
    sel.value = S.area;
  }

  async function loadRoutes() {
    await fetchDonations();
    areaOptions();
    renderRoutes();
  }

  function visible() {
    const live = S.donations.filter((d) => d.status !== 'cancelled');
    return S.area === 'all' ? live : live.filter((d) => d.pincode === S.area);
  }

  function renderRoutes() {
    const list = visible();
    const open = list.filter((d) => !isDone(d));
    $('a-assigned').textContent = open.length;
    $('a-weight').textContent = `${open.reduce((s, d) => s + Number(d.weight_kg || d.estimated_quantity_kg || 10), 0).toFixed(1)} kg`;
    $('a-pickups').innerHTML = list.length ? list.map((d, i) => {
      const done = isDone(d);
      return `<div class="white-card a-pick ${done ? 'done' : ''}">
        <div class="contrib"><div><b>${esc(d.donor_name || `${d.category} Donor`)}</b><span>ID ${esc(d.request_id || `#REC-982${i + 1}`)}</span></div><b>${esc(d.weight_kg || d.estimated_quantity_kg || 10)} kg</b></div>
        <ul class="a-info"><li>👕 ${esc(d.category)}</li>
          ${d.donor_phone ? `<li>📞 <a href="tel:${esc(d.donor_phone)}">${esc(d.donor_phone)}</a></li>` : ''}
          <li>📍 ${esc(stripMeta(d.address))}</li>
          <li>🕒 ${esc(d.pickup_day ? `${d.pickup_day} • ${d.time_slot}` : d.time_slot)}</li>
          ${d.pincode ? `<li>✔ Pincode: ${esc(d.pincode)}</li>` : ''}</ul>
        ${done ? '<p class="a-done">✓ This is already picked up</p>'
          : `<div class="a-actions"><button class="btn btn-outline small" data-done="${d.id}">Complete</button>
            <button class="btn btn-primary small" data-viewmap="${d.id}">View Map</button>
            <button class="btn btn-outline small" data-edit="${d.id}">Edit</button></div>`}
      </div>`;
    }).join('') : '<div class="white-card"><p class="muted center">No pickup requests available.</p></div>';
  }

  $('a-area').addEventListener('change', (e) => { S.area = e.target.value; renderRoutes(); });

  // Same writes as the app's Quality / "Mark Done" flow.
  async function completePickup(d) {
    const now = new Date().toISOString();
    const { error } = await sb.from('donations').update({ status: 'completed', is_picked_up: true, picked_up_at: now, collector_id: S.user.id, confirmed_by: S.user.id }).eq('id', d.id);
    if (error) return toast(error.message || 'Could not mark this pickup as done.');
    await sb.from('pickups').update({ status: 'completed', collector_id: S.user.id }).or(`id.eq.${d.id},donation_id.eq.${d.id}`).then(() => {}, () => {});
    await sb.from('quality_inspections').insert([{ batch_identifier: `${d.category} Cluster ${d.request_id || ''}`, weight_kg: d.weight_kg || d.estimated_quantity_kg || 0, notes: 'Picked up & completed by collector' }]).then(() => {}, () => {});
    toast('Pickup marked as collected.');
    await loadRoutes();
  }

  function openEdit(d) {
    const days = Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + i); return x; });
    S.edit = { d, day: days.find((x) => dayStr(x) === d.pickup_day) || days[0], slot: d.time_slot || TIME_SLOTS[0] };
    const draw = () => modal(`<h3>Edit pickup</h3><p class="sub">${esc(d.donor_name || d.category)} · the donor is notified of changes</p>
      <div class="a-scroll"><label class="a-lbl">DATE</label><div class="a-chips">${days.map((x) => `<button type="button" class="a-chip ${dayStr(x) === dayStr(S.edit.day) ? 'on' : ''}" data-eday="${dayKey(x)}">${dayStr(x)}</button>`).join('')}</div>
      <label class="a-lbl">TIME</label><div class="a-chips">${TIME_SLOTS.map((s) => `<button type="button" class="a-chip ${s === S.edit.slot ? 'on' : ''}" data-eslot="${s}">${s}</button>`).join('')}</div>
      <label class="a-lbl">WEIGHT (KG)</label><input id="e-weight" inputmode="decimal" value="${esc(S.edit.weight ?? (d.weight_kg || d.estimated_quantity_kg || 1))}" />
      <label class="a-lbl">ADDRESS</label><textarea id="e-addr" rows="3">${esc(S.edit.addr ?? stripMeta(d.address))}</textarea></div>
      <p class="error" id="e-err" hidden></p>
      <button class="btn btn-primary full" id="e-save">Save changes</button>
      <button class="btn btn-outline full" id="e-cancel-pickup" style="margin-top:10px;color:var(--error);border-color:var(--error)">Cancel this pickup</button>
      <button class="link cancel" id="e-close">Close</button>`);
    S.edit.draw = draw;
    draw();
  }

  const keepEditFields = () => { if ($('e-weight')) { S.edit.weight = $('e-weight').value; S.edit.addr = $('e-addr').value; } };

  $('a-modal-card').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.dataset.eday) { keepEditFields(); const [y, m, dd] = t.dataset.eday.split('-').map(Number); S.edit.day = new Date(y, m - 1, dd); return S.edit.draw(); }
    if (t.dataset.eslot) { keepEditFields(); S.edit.slot = t.dataset.eslot; return S.edit.draw(); }
    if (t.id === 'e-close' || t.id === 'm-close') return closeModal();
    if (t.id === 'e-save') {
      const d = S.edit.d, err = $('e-err');
      const addr = $('e-addr').value.trim(), weight = parseFloat($('e-weight').value) || 1;
      if (addr.length < 10) { err.textContent = 'Enter the full pickup address.'; err.hidden = false; return; }
      const changed = addr !== stripMeta(d.address).trim();
      const upd = { pickup_day: dayStr(S.edit.day), time_slot: S.edit.slot, address: changed ? addr : d.address, weight_kg: weight };
      t.disabled = true;
      const { error } = await sb.from('donations').update({ ...upd, estimated_quantity_kg: weight }).eq('id', d.id);
      if (error) { err.textContent = error.message || 'Try again.'; err.hidden = false; t.disabled = false; return; }
      await sb.from('pickups').update({ address: upd.address, weight_summary: `${weight} kg`, time_window: upd.time_slot }).eq('donation_id', d.id).then(() => {}, () => {});
      if (d.donor_id) await sb.from('notifications').insert([{ user_id: d.donor_id, title: 'Pickup Updated', body: `Your ${d.category} pickup is now scheduled for ${upd.pickup_day} (${upd.time_slot}).`, tag: 'UPDATE' }]).then(() => {}, () => {});
      closeModal(); toast('Pickup updated.'); return loadRoutes();
    }
    if (t.id === 'e-cancel-pickup') {
      const d = S.edit.d;
      if (!confirm('Cancel this pickup? The donor will be notified.')) return;
      const { error } = await sb.from('donations').update({ status: 'cancelled' }).eq('id', d.id);
      if (error) return toast(error.message || 'Could not cancel.');
      await sb.from('pickups').update({ status: 'cancelled' }).eq('donation_id', d.id).then(() => {}, () => {});
      if (d.donor_id) await sb.from('notifications').insert([{ user_id: d.donor_id, title: 'Pickup Cancelled', body: `Your ${d.category} pickup for ${d.pickup_day}, ${d.time_slot} was cancelled by PunahChakra. Please book a new slot.`, tag: 'CANCELLED' }]).then(() => {}, () => {});
      closeModal(); toast('Pickup cancelled.'); return loadRoutes();
    }
    if (t.dataset.pinrm) {
      if (!confirm(`Stop providing pickup service in ${t.dataset.pinrm}? Users in this pincode will see it as not serviceable.`)) return;
      const { error } = await sb.from('serviceable_pincodes').delete().eq('pincode', t.dataset.pinrm);
      if (error) return toast(error.message);
      await loadBase(); return pinModal();
    }
    if (t.id === 'pin-add') {
      const v = $('pin-new').value.trim(), err = $('pin-err');
      err.hidden = false;
      if (!/^\d{6}$/.test(v)) return (err.textContent = 'Enter a valid 6-digit pincode.');
      if (S.serviceable.includes(v)) return (err.textContent = 'This pincode is already serviceable.');
      const { error } = await sb.from('serviceable_pincodes').insert([{ pincode: v }]);
      if (error) return (err.textContent = error.message || 'Could not add this pincode.');
      S.calPin = v; await loadBase(); renderCalendar(); return pinModal();
    }
    if (t.id === 'pin-done') { closeModal(); renderCalendar(); }
  });

  $('a-pickups').addEventListener('click', (e) => {
    const t = e.target;
    const find = (id) => S.donations.find((x) => x.id === id);
    if (t.dataset.done) { const d = find(t.dataset.done); if (d && confirm(`Mark this ${d.category} pickup as completed? It will be removed from the map.`)) completePickup(d); }
    if (t.dataset.edit) openEdit(find(t.dataset.edit));
    if (t.dataset.viewmap) { S.focusId = t.dataset.viewmap; setTab('map'); }
  });

  // ---------- map ----------
  const geoCache = {};
  async function geocode(pin) {
    if (!pin) return null;
    if (geoCache[pin]) return geoCache[pin];
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&country=India&format=json&limit=1`);
      const j = await r.json();
      if (j[0]) return (geoCache[pin] = [parseFloat(j[0].lat), parseFloat(j[0].lon)]);
    } catch (_) { /* fall back to default centre */ }
    return null;
  }

  async function renderMap() {
    await fetchDonations();
    $('a-map-chip').textContent = S.area === 'all' ? 'All Areas' : `Pincode ${S.area}`;
    if (!S.map) {
      S.map = L.map('a-map').setView([28.4595, 77.0266], 12);
      S.layers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' }),
      };
      S.layers.street.addTo(S.map);
      S.markers = L.layerGroup().addTo(S.map);
    }
    setTimeout(() => S.map.invalidateSize(), 50);
    S.markers.clearLayers();
    const jobs = visible().filter((d) => !isDone(d));
    const pts = [];
    for (const d of jobs) {
      const m = String(d.address || '').match(/Lat:\s*([0-9.-]+),\s*Long:\s*([0-9.-]+)/i);
      const pos = m ? [parseFloat(m[1]), parseFloat(m[2])] : await geocode(d.pincode);
      if (!pos) continue;
      pts.push({ id: d.id, pos });
      L.marker(pos).addTo(S.markers).bindPopup(`<b>${esc(d.donor_name || d.category)}</b><br>${esc(d.category)} · ${esc(d.weight_kg || d.estimated_quantity_kg || '')} kg<br>${esc(d.pickup_day)} • ${esc(d.time_slot)}<br>${esc(stripMeta(d.address))}`);
    }
    $('a-map-note').textContent = `${jobs.length} open pickup${jobs.length === 1 ? '' : 's'} shown on the map.`;
    const focus = S.focusId && pts.find((p) => p.id === S.focusId);
    S.focusId = null;
    if (focus) S.map.setView(focus.pos, 16);
    else if (pts.length) S.map.fitBounds(L.latLngBounds(pts.map((p) => p.pos)), { padding: [40, 40], maxZoom: 15 });
  }

  $('a-map-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !S.map) return;
    document.querySelectorAll('#a-map-seg button').forEach((x) => x.classList.toggle('active', x === b));
    Object.values(S.layers).forEach((l) => S.map.removeLayer(l));
    S.layers[b.dataset.layer].addTo(S.map);
  });

  // ---------- calendar ----------
  function pinModal() {
    modal(`<h3>Serviceable Pincodes</h3><div class="a-scroll">${S.serviceable.map((p) => `<div class="a-pinrow"><span>${p}</span><button class="link cancel-pickup" data-pinrm="${p}">Remove</button></div>`).join('') || '<p class="muted">No serviceable pincodes yet.</p>'}</div>
      <label class="a-lbl">ADD A NEW PINCODE</label><input id="pin-new" inputmode="numeric" maxlength="6" placeholder="e.g. 110001" />
      <p class="error" id="pin-err" hidden></p><button class="btn btn-primary full" id="pin-add">Add pincode</button><button class="link cancel" id="pin-done">Done</button>`);
  }
  $('a-manage-pins').addEventListener('click', pinModal);
  $('a-cal-pin').addEventListener('change', (e) => { S.calPin = e.target.value; S.selDate = null; renderCalendar(); });
  $('a-m-prev').addEventListener('click', () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1); renderCalendar(); });
  $('a-m-next').addEventListener('click', () => { S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1); renderCalendar(); });

  async function renderCalendar() {
    $('a-cal-pin').innerHTML = S.serviceable.map((p) => `<option ${p === S.calPin ? 'selected' : ''}>${p}</option>`).join('');
    $('a-m-label').textContent = S.month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    S.slotDraft = [...TIME_SLOTS];
    drawSlotChoices();
    if (!S.calPin) { $('a-cal').innerHTML = '<p class="muted center">Add a serviceable pincode to manage its calendar.</p>'; $('a-day-editor').innerHTML = ''; return; }
    const first = new Date(S.month), last = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 0);
    const { data } = await sb.from('day_availability').select('day, available_slots, is_closed').eq('pincode', S.calPin).gte('day', dayKey(first)).lte('day', dayKey(last));
    S.monthMap = {};
    (data || []).forEach((r) => { S.monthMap[r.day] = { slots: r.available_slots || [], closed: Boolean(r.is_closed) }; });
    drawCal(first, last);
    drawDayEditor();
  }

  function drawCal(first, last) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    let h = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => `<b class="wd">${w}</b>`).join('');
    for (let i = 0; i < first.getDay(); i++) h += '<span></span>';
    for (let n = 1; n <= last.getDate(); n++) {
      const d = new Date(S.month.getFullYear(), S.month.getMonth(), n), k = dayKey(d), row = S.monthMap[k];
      const past = d < t;
      h += `<button class="cd ${row ? (row.closed ? 'closed' : 'set') : ''} ${S.selDate && dayKey(S.selDate) === k ? 'sel' : ''}" ${past ? 'disabled' : ''} data-cday="${k}">${n}</button>`;
    }
    $('a-cal').innerHTML = h;
  }
  $('a-cal').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-cday]'); if (!b) return;
    const [y, m, d] = b.dataset.cday.split('-').map(Number);
    S.selDate = new Date(y, m - 1, d);
    const { data } = await sb.from('day_availability').select('available_slots, is_closed, slot_capacity').eq('pincode', S.calPin).eq('day', b.dataset.cday).maybeSingle();
    S.day = { slots: data?.available_slots || [], closed: Boolean(data?.is_closed), cap: data?.slot_capacity ?? DEFAULT_CAPACITY };
    drawCal(new Date(S.month), new Date(S.month.getFullYear(), S.month.getMonth() + 1, 0));
    drawDayEditor();
  });

  function drawDayEditor() {
    const box = $('a-day-editor');
    if (!S.selDate || !S.day) { box.innerHTML = '<p class="muted center">Pick a date to open or close its slots.</p>'; return; }
    box.innerHTML = `<div class="white-card"><h4 class="card-h">${esc(S.selDate.toDateString())} · ${esc(S.calPin)}</h4>
      <label class="a-check"><input type="checkbox" id="d-closed" ${S.day.closed ? 'checked' : ''}/> Close this day (no pickups)</label>
      <h4 class="eyebrow">${S.day.closed ? 'Slots (disabled while this day is closed)' : 'Open slots for this day'}</h4>
      <div class="slot-grid">${TIME_SLOTS.map((s) => `<button type="button" class="slot ${S.day.slots.includes(s) ? 'sel' : ''}" ${S.day.closed ? 'disabled' : ''} data-dslot="${s}">${s}</button>`).join('')}</div>
      <h4 class="eyebrow">SEATS PER TIME SLOT</h4>
      <div class="qty"><button type="button" id="cap-minus">−</button><span>${S.day.cap}</span><button type="button" id="cap-plus">+</button></div>
      <p class="muted">Leave every slot unselected to keep this day open with all slots bookable (default).</p>
      <button class="btn btn-primary full" id="d-save" style="margin-top:12px">Save availability</button></div>`;
  }
  $('a-day-editor').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.dataset.dslot) { const i = S.day.slots.indexOf(t.dataset.dslot); i < 0 ? S.day.slots.push(t.dataset.dslot) : S.day.slots.splice(i, 1); return drawDayEditor(); }
    if (t.id === 'cap-minus') { S.day.cap = Math.max(1, S.day.cap - 1); return drawDayEditor(); }
    if (t.id === 'cap-plus') { S.day.cap += 1; return drawDayEditor(); }
    if (t.id === 'd-save') {
      t.disabled = true;
      const { error } = await sb.from('day_availability').upsert({ pincode: S.calPin, day: dayKey(S.selDate), available_slots: S.day.slots, is_closed: S.day.closed, slot_capacity: S.day.cap, updated_at: new Date().toISOString() }, { onConflict: 'pincode,day' });
      t.disabled = false;
      if (error) return toast(error.message || 'Could not save availability.');
      toast(`Availability updated for ${S.selDate.toDateString()} (${S.calPin}).`);
      renderCalendar();
    }
  });
  $('a-day-editor').addEventListener('change', (e) => { if (e.target.id === 'd-closed') { S.day.closed = e.target.checked; drawDayEditor(); } });

  function drawSlotChoices() {
    $('a-slot-choices').innerHTML = SLOT_CHOICES.map((s) => `<button type="button" class="slot ${S.slotDraft.includes(s) ? 'sel' : ''}" data-choice="${s}">${s}</button>`).join('');
  }
  $('a-slot-choices').addEventListener('click', (e) => {
    const s = e.target.closest('[data-choice]')?.dataset.choice; if (!s) return;
    const i = S.slotDraft.indexOf(s); i < 0 ? S.slotDraft.push(s) : S.slotDraft.splice(i, 1); drawSlotChoices();
  });
  $('a-save-slots').addEventListener('click', async () => {
    if (!S.slotDraft.length) return toast('Keep at least one time slot.');
    const next = [...S.slotDraft].sort((a, b) => slotToMinutes(a) - slotToMinutes(b));
    const { error } = await sb.from('app_settings').upsert({ key: 'time_slots', value: next, updated_at: new Date().toISOString() });
    if (error) return toast(error.message || 'Could not save time slots.');
    TIME_SLOTS = next; toast('Time slots saved.'); drawDayEditor();
  });

  // ---------- areas ----------
  async function loadAreas() {
    const { data, error } = await sb.from('area_requests').select('id, full_name, phone, pincode, address, latitude, longitude, created_at').order('created_at', { ascending: false });
    S.requests = error ? [] : data || [];
    try { localStorage.setItem('pc_seen_area_pins', JSON.stringify([...new Set(S.requests.map((r) => r.pincode))])); } catch (_) {}
    $('a-areas-dot').hidden = true;
    const demand = Object.entries(S.requests.reduce((a, r) => { if (!S.serviceable.includes(r.pincode)) a[r.pincode] = (a[r.pincode] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
    $('a-areas').innerHTML =
      demand.map(([pin, n]) => `<div class="white-card contrib"><div><b>${pin}</b><span>${n} request${n === 1 ? '' : 's'}</span></div><button class="btn btn-outline small" data-start="${pin}">Start service</button></div>`).join('') +
      (S.requests.length ? '<h4 class="eyebrow">INDIVIDUAL REQUESTS</h4>' : '<div class="white-card"><p class="muted center">No requests yet.</p></div>') +
      S.requests.map((r) => `<div class="white-card contrib"><div><b>${esc(r.full_name || 'Unnamed donor')} · ${esc(r.pincode)}</b>${r.phone ? `<span>${esc(r.phone)}</span>` : ''}${r.address ? `<span>${esc(r.address)}</span>` : ''}<span>${new Date(r.created_at).toLocaleDateString('en-IN')}</span></div>
        ${r.latitude != null && r.longitude != null ? `<a class="link strong" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${r.latitude},${r.longitude}">Map</a>` : ''}</div>`).join('');
  }
  $('a-areas').addEventListener('click', async (e) => {
    const pin = e.target.dataset.start; if (!pin) return;
    if (!confirm(`Start service in ${pin}? Donors there will be able to book pickups.`)) return;
    const { error } = await sb.from('serviceable_pincodes').insert([{ pincode: pin }]);
    if (error) return toast(error.message || 'Could not add.');
    await loadBase(); loadAreas();
  });

  // ---------- drives & drop-offs ----------
  const longDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const pinChips = (id, cur) => S.serviceable.length ? `<div class="a-chips">${S.serviceable.map((p) => `<button type="button" class="a-chip ${cur === p ? 'on' : ''}" data-pinchip="${id}" data-pin="${p}">${p}</button>`).join('')}</div>` : '';

  async function loadDrives() {
    const [{ data: dr }, { data: dp }] = await Promise.all([
      sb.from('collection_drives').select('id, title, drive_date, time_window, location, pincode, description').eq('is_active', true).order('drive_date'),
      sb.from('drop_off_points').select('id, name, address, pincode, start_date, end_date, open_time, close_time, contact, description, is_active').order('end_date', { ascending: false }),
    ]);
    S.drives = dr || []; S.drops = dp || [];
    drawDrives(); drawDrops();
  }

  function drawDrives() {
    const e = S.editDrive, t = dayKey(new Date());
    const up = S.drives.filter((d) => d.drive_date >= t), past = S.drives.filter((d) => d.drive_date < t).reverse();
    const card = (d, muted) => `<div class="white-card contrib ${muted ? 'a-muted' : ''}"><div><b>${esc(d.title)}</b><span>${esc(longDate(d.drive_date))}${d.time_window ? ` · ${esc(d.time_window)}` : ''}</span><span>${esc(d.location)}${d.pincode ? ` · ${esc(d.pincode)}` : ' · All areas'}</span>${d.description ? `<span>${esc(d.description)}</span>` : ''}</div>
      <div class="a-actions"><button class="link strong" data-dedit="${d.id}">Edit</button><button class="link cancel-pickup" data-ddel="${d.id}">Remove</button></div></div>`;
    $('a-drives-view').innerHTML = `<h4 class="eyebrow" style="margin-top:0">${e.id ? 'EDIT DRIVE' : 'ADD A DRIVE'}</h4>
      <div class="white-card a-form"><p class="muted">Every donor sees it on their Collection Drives page.</p>
        <input id="f-title" placeholder="Title (e.g. Diwali clothes drive)" value="${esc(e.title)}" />
        <input id="f-date" type="date" min="${t}" value="${esc(e.drive_date)}" />
        <input id="f-time" placeholder="Time (e.g. 10 AM – 2 PM)" value="${esc(e.time_window)}" />
        <input id="f-loc" placeholder="Location / venue" value="${esc(e.location)}" />
        <input id="f-pin" inputmode="numeric" maxlength="6" placeholder="Pincode (leave empty for all areas)" value="${esc(e.pincode)}" />${pinChips('drive', e.pincode)}
        <textarea id="f-desc" rows="3" placeholder="Details (what to bring, contact…) — optional">${esc(e.description)}</textarea>
        <p class="error" id="f-err" hidden></p>
        <button class="btn btn-primary full" id="f-save">${e.id ? 'Save changes' : 'Add collection drive'}</button>
        ${e.id ? '<button class="link cancel" id="f-cancel">Cancel editing</button>' : ''}</div>
      <h4 class="eyebrow">UPCOMING DRIVES</h4>${up.length ? up.map((d) => card(d)).join('') : '<div class="white-card"><p class="muted center">No upcoming drives.</p></div>'}
      ${past.length ? `<button class="link" id="f-past">${S.showPast ? 'Hide' : 'Show'} past drives (${past.length})</button>${S.showPast ? past.map((d) => card(d, true)).join('') : ''}` : ''}`;
  }

  function drawDrops() {
    const e = S.editDrop, t = dayKey(new Date());
    $('a-drop-view').innerHTML = `<h4 class="eyebrow" style="margin-top:0">${e.id ? 'EDIT DROP-OFF POINT' : 'ADD A DROP-OFF POINT'}</h4>
      <div class="white-card a-form"><p class="muted">A fixed place donors can bring items to between two dates.</p>
        <input id="p-name" placeholder="Name (e.g. Community centre)" value="${esc(e.name)}" />
        <input id="p-addr" placeholder="Address" value="${esc(e.address)}" />
        <input id="p-pin" inputmode="numeric" maxlength="6" placeholder="Pincode (leave empty for all areas)" value="${esc(e.pincode)}" />${pinChips('drop', e.pincode)}
        <div class="a-two"><label>Start date<input id="p-start" type="date" value="${esc(e.start_date)}" /></label><label>End date<input id="p-end" type="date" value="${esc(e.end_date)}" /></label></div>
        <div class="a-two"><input id="p-open" placeholder="Opens (10:00 AM)" value="${esc(e.open_time)}" /><input id="p-close" placeholder="Closes (6:00 PM)" value="${esc(e.close_time)}" /></div>
        <input id="p-contact" placeholder="Contact (phone / name)" value="${esc(e.contact)}" />
        <textarea id="p-desc" rows="3" placeholder="Details — optional">${esc(e.description)}</textarea>
        <p class="error" id="p-err" hidden></p>
        <button class="btn btn-primary full" id="p-save">${e.id ? 'Save changes' : 'Add drop-off point'}</button>
        ${e.id ? '<button class="link cancel" id="p-cancel">Cancel editing</button>' : ''}</div>
      <h4 class="eyebrow">ALL DROP-OFF POINTS</h4>
      ${S.drops.length ? S.drops.map((p) => { const ended = p.end_date < t; return `<div class="white-card contrib ${ended || !p.is_active ? 'a-muted' : ''}"><div><b>${esc(p.name)}</b><span>${esc(p.address)}${p.pincode ? ` · ${esc(p.pincode)}` : ' · All areas'}</span><span>${esc(longDate(p.start_date))} – ${esc(longDate(p.end_date))}${ended ? ' (ended)' : ''}</span>${p.open_time || p.close_time ? `<span>Daily ${esc([p.open_time, p.close_time].filter(Boolean).join(' – '))}</span>` : ''}${p.contact ? `<span>${esc(p.contact)}</span>` : ''}</div>
        <div class="a-actions"><label class="a-check"><input type="checkbox" data-ptoggle="${p.id}" ${p.is_active ? 'checked' : ''}/> Active</label><button class="link strong" data-pedit="${p.id}">Edit</button><button class="link cancel-pickup" data-pdel="${p.id}">Remove</button></div></div>`; }).join('') : '<div class="white-card"><p class="muted center">No drop-off points yet.</p></div>'}`;
  }

  const blankDrive = () => ({ id: '', title: '', drive_date: '', time_window: '', location: '', pincode: '', description: '' });
  const blankDrop = () => ({ id: '', name: '', address: '', pincode: '', start_date: '', end_date: '', open_time: '', close_time: '', contact: '', description: '' });
  S.editDrive = blankDrive(); S.editDrop = blankDrop();
  const val = (id) => $(id).value.trim();
  const captureDrive = () => { if ($('f-title')) Object.assign(S.editDrive, { title: val('f-title'), drive_date: $('f-date').value, time_window: val('f-time'), location: val('f-loc'), pincode: val('f-pin'), description: val('f-desc') }); };
  const captureDrop = () => { if ($('p-name')) Object.assign(S.editDrop, { name: val('p-name'), address: val('p-addr'), pincode: val('p-pin'), start_date: $('p-start').value, end_date: $('p-end').value, open_time: val('p-open'), close_time: val('p-close'), contact: val('p-contact'), description: val('p-desc') }); };
  const fail = (id, m) => { $(id).textContent = m; $(id).hidden = false; };

  $('a-drive-seg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.driveView = b.dataset.v;
    document.querySelectorAll('#a-drive-seg button').forEach((x) => x.classList.toggle('active', x === b));
    $('a-drives-view').hidden = S.driveView !== 'drives'; $('a-drop-view').hidden = S.driveView !== 'dropoff';
  });

  $('apane-drives').addEventListener('input', (e) => { if (e.target.id === 'f-pin') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); if (e.target.id === 'p-pin') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6); });
  $('apane-drives').addEventListener('click', async (e) => {
    const t = e.target;
    if (t.dataset.pinchip) {
      const drive = t.dataset.pinchip === 'drive';
      drive ? captureDrive() : captureDrop();
      const o = drive ? S.editDrive : S.editDrop;
      o.pincode = o.pincode === t.dataset.pin ? '' : t.dataset.pin;
      return drive ? drawDrives() : drawDrops();
    }
    if (t.dataset.dedit) { const d = S.drives.find((x) => x.id === t.dataset.dedit); S.editDrive = { ...blankDrive(), ...d, time_window: d.time_window || '', pincode: d.pincode || '', description: d.description || '' }; drawDrives(); return window.scrollTo(0, 0); }
    if (t.dataset.ddel) { if (!confirm('Remove this drive? It will disappear for donors.')) return; const { error } = await sb.from('collection_drives').delete().eq('id', t.dataset.ddel); if (error) return toast(error.message); return loadDrives(); }
    if (t.id === 'f-cancel') { S.editDrive = blankDrive(); return drawDrives(); }
    if (t.id === 'f-past') { captureDrive(); S.showPast = !S.showPast; return drawDrives(); }
    if (t.id === 'f-save') {
      captureDrive(); const e2 = S.editDrive;
      if (!e2.title || !e2.location) return fail('f-err', 'Enter a title and a location.');
      if (!e2.drive_date) return fail('f-err', 'Choose the date of the drive.');
      if (e2.pincode && !/^\d{6}$/.test(e2.pincode)) return fail('f-err', 'Pincode must be 6 digits (or leave it empty for all areas).');
      const payload = { title: e2.title, drive_date: e2.drive_date, time_window: e2.time_window || null, location: e2.location, pincode: e2.pincode || null, description: e2.description || null };
      const { error } = e2.id ? await sb.from('collection_drives').update(payload).eq('id', e2.id) : await sb.from('collection_drives').insert([payload]);
      if (error) return fail('f-err', error.message || 'Could not save.');
      S.editDrive = blankDrive(); toast('Drive saved.'); return loadDrives();
    }
    if (t.dataset.pedit) { const p = S.drops.find((x) => x.id === t.dataset.pedit); S.editDrop = { ...blankDrop(), ...p, pincode: p.pincode || '', open_time: p.open_time || '', close_time: p.close_time || '', contact: p.contact || '', description: p.description || '' }; drawDrops(); return window.scrollTo(0, 0); }
    if (t.dataset.pdel) { if (!confirm('Remove this drop-off point?')) return; const { error } = await sb.from('drop_off_points').delete().eq('id', t.dataset.pdel); if (error) return toast(error.message); return loadDrives(); }
    if (t.id === 'p-cancel') { S.editDrop = blankDrop(); return drawDrops(); }
    if (t.id === 'p-save') {
      captureDrop(); const e2 = S.editDrop;
      if (!e2.name || !e2.address) return fail('p-err', 'Enter a name and an address for the drop-off point.');
      if (!e2.start_date || !e2.end_date) return fail('p-err', 'Choose the start and end date.');
      if (e2.end_date < e2.start_date) return fail('p-err', 'The end date cannot be before the start date.');
      if (e2.pincode && !/^\d{6}$/.test(e2.pincode)) return fail('p-err', 'Pincode must be 6 digits (or leave it empty for all areas).');
      const payload = { name: e2.name, address: e2.address, pincode: e2.pincode || null, start_date: e2.start_date, end_date: e2.end_date, open_time: e2.open_time || null, close_time: e2.close_time || null, contact: e2.contact || null, description: e2.description || null };
      const { error } = e2.id ? await sb.from('drop_off_points').update(payload).eq('id', e2.id) : await sb.from('drop_off_points').insert([{ ...payload, is_active: true }]);
      if (error) return fail('p-err', error.message || 'Could not save.');
      S.editDrop = blankDrop(); toast('Drop-off point saved.'); return loadDrives();
    }
  });
  $('apane-drives').addEventListener('change', async (e) => {
    const id = e.target.dataset.ptoggle; if (!id) return;
    const { error } = await sb.from('drop_off_points').update({ is_active: e.target.checked }).eq('id', id);
    if (error) { toast(error.message); loadDrives(); }
  });

  // ---------- alerts ----------
  const timeAgo = (iso) => { const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? 'Just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`; };
  async function loadAlerts() {
    const { data } = await sb.from('notifications').select('*').eq('user_id', S.user.id).order('created_at', { ascending: false });
    const rows = data || [];
    $('a-alerts').innerHTML = rows.length ? rows.map((n) => `<div class="white-card note ${n.is_read ? '' : 'unread'}"><span class="n-ic">${String(n.tag).toUpperCase().includes('CANCEL') ? '✕' : '🔔'}</span>
      <div><div class="n-meta"><small>${esc(n.tag || 'ALERT')}</small><em>${timeAgo(n.created_at)}</em></div><b>${esc(n.title)}</b><p>${esc(n.body)}</p></div></div>`).join('')
      : '<div class="white-card"><p class="muted">You\'re all caught up. New pickup requests and cancellations will show up here.</p></div>';
    if (rows.some((n) => !n.is_read)) { await sb.from('notifications').update({ is_read: true }).eq('user_id', S.user.id).eq('is_read', false); $('a-bell-dot').hidden = true; }
  }

  // ---------- profile ----------
  async function renderProfile() {
    await fetchDonations();
    window.mountSettings($('a-settings'), () => ({ user: S.user, profile: S.profile }), (np) => { S.profile = np; renderProfile(); });
    const p = S.profile || {};
    const done = S.donations.filter(isDone);
    const kg = done.reduce((s, d) => s + Number(d.weight_kg || d.estimated_quantity_kg || 10), 0);
    $('a-profile-card').innerHTML = `<h3 class="card-h">${esc(p.full_name || 'Collector')}</h3><p class="muted">${esc(p.phone || S.user.phone || '')}</p>${p.email ? `<p class="muted">${esc(p.email)}</p>` : ''}
      <div class="a-stats"><div><small>WASTE DIVERTED</small><b>${kg >= 1000 ? `${(kg / 1000).toFixed(2)} t` : `${kg.toFixed(1)} kg`}</b></div><div><small>PICKUPS COMPLETED</small><b>${done.length}</b></div></div>`;
    $('a-activity').innerHTML = done.length ? done.slice(0, 10).map((d) => `<div class="white-card"><div class="contrib"><div><b>${esc(d.category || 'Recycling')} Pickup</b><span>${esc(d.pickup_day || 'Today')} • ${esc(stripMeta(d.address).split(',')[0])}</span></div></div></div>`).join('')
      : '<div class="white-card"><p class="muted">No completed pickup activity yet.</p></div>';
  }

  // ---------- wiring ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-atab]');
    if (t) setTab(t.dataset.atab);
  });
  $('a-back').addEventListener('click', () => setTab('routes'));
  $('a-modal').addEventListener('click', (e) => { if (e.target.id === 'a-modal') closeModal(); });
  $('a-signout').addEventListener('click', async () => {
    await sb.auth.signOut();
    S.user = null;
    window.resetAuth();
    window.showView('landing');
  });

  // Live refresh: new bookings, cancellations and seat changes from donors land at any moment.
  setInterval(() => {
    if (!S.user || document.hidden) return;
    pollBell(); pollAreas();
    if (S.tab === 'routes') loadRoutes();
  }, 15000);

  window.enterAdmin = async (user) => {
    S.user = user;
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    S.profile = data || {};
    window.showView('admin');
    await loadBase();
    setTab('routes');
  };
})();
