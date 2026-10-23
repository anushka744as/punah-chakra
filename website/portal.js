// Signed-in experience: mirrors the app's Home / Map / Donate (Schedule) / Alerts / Profile tabs.
// Queries match src/services/api.ts so the website and the app share the same data.
(() => {
  const sb = window.sb;
  const $ = (id) => document.getElementById(id);

  const ITEM_TYPES = [
    { id: 'clothes', label: 'Clothes' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'blankets', label: 'Blankets/Bedsheets' },
    { id: 'bags', label: 'Bags' },
  ];
  const TIME_SLOTS = (() => {
    const out = [];
    for (let m = 11 * 60; m < 17 * 60 + 30; m += 30) {
      const h24 = Math.floor(m / 60);
      out.push(`${h24 % 12 === 0 ? 12 : h24 % 12}:${String(m % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`);
    }
    return out;
  })();
  const slotToMinutes = (slot) => {
    const m = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    return h * 60 + parseInt(m[2], 10);
  };
  const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dayStr = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const sameDay = (a, b) => dayKey(a) === dayKey(b);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const statusLabel = (s) =>
    ({ collected: 'Collected', assessed: 'Collected', completed: 'Completed', cancelled: 'Cancelled' }[s] || 'Pickup Scheduled');

  const state = {
    user: null,
    profile: null,
    donations: [],
    tab: 'home',
    pincode: '',
    serviceable: [],
    items: new Set(['clothes']),
    qty: 5,
    weekStart: today(),
    date: today(),
    slot: '',
    avail: { slots: [], booked: [], closed: false },
    map: null,
    coords: null,
    pickMap: null,
  };

  const TITLES = { home: '', map: 'Donation Map', donate: 'Schedule', alerts: 'Alerts', profile: 'Profile' };

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.hidden = true), 3500);
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab-pane').forEach((p) => p.classList.toggle('on', p.id === `pane-${tab}`));
    document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $('p-top').className = `p-top ${tab === 'home' ? 'plain' : 'green'}`;
    $('p-brand').hidden = tab !== 'home';
    $('p-title').textContent = TITLES[tab];
    $('p-back').hidden = tab === 'home';
    document.getElementById('portal').dataset.current = tab;
    window.scrollTo(0, 0);
    if (tab === 'map') renderMap();
    if (tab === 'alerts') loadAlerts();
    if (tab === 'donate') openDonate();
    if (tab === 'profile') renderProfile();
  }

  // ---------- data ----------
  async function loadAll() {
    const [{ data: profile }, { data: donations }, { data: pins }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', state.user.id).single(),
      sb.from('donations').select('*').eq('donor_id', state.user.id).order('created_at', { ascending: false }),
      sb.from('serviceable_pincodes').select('pincode').order('pincode', { ascending: true }),
    ]);
    state.profile = profile || {};
    state.donations = donations || [];
    state.serviceable = (pins || []).map((p) => p.pincode);
    const latest = state.donations.find((d) => d.pincode);
    state.pincode = latest?.pincode || state.profile.pincode || '';
    renderHome();
    pollBell();
  }

  async function pollBell() {
    const { count } = await sb
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', state.user.id)
      .eq('is_read', false);
    $('bell-dot').hidden = !count;
  }

  // ---------- home ----------
  function pickupRow(d, withBadge) {
    return `<div class="contrib">
      <div><b>${esc(d.category)}</b><span>${esc(d.pickup_day)} · ${esc(d.time_slot)}</span></div>
      ${withBadge ? `<em class="badge ${d.status === 'cancelled' ? 'bad' : ''}">${statusLabel(d.status)}</em>` : ''}
    </div>`;
  }

  function renderHome() {
    const latest = state.donations.find((d) => d.status !== 'cancelled');
    $('latest-pickup').innerHTML = latest
      ? `<div class="latest">
          <span class="ic big"><svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 16H5V10h14zm-9-3-3-3 1.4-1.4L10 14.2l5.6-5.6L17 10z" fill="currentColor"/></svg></span>
          <div class="latest-txt"><b>${statusLabel(latest.status)}</b><p>${esc(latest.pickup_day)} · ${esc(latest.time_slot)}</p><small>${esc(latest.address.replace(/\s*\(Lat:.*\)$/, ''))}</small></div>
          <button class="btn btn-outline small" data-tab="profile">VIEW DETAILS</button>
        </div>`
      : `<p class="muted">No pickups yet. Schedule your first one!</p>`;
    $('recent-list').innerHTML = state.donations.length
      ? state.donations.slice(0, 5).map((d) => `<div class="white-card">${pickupRow(d, true)}</div>`).join('')
      : `<div class="white-card"><p class="muted">Your contributions will show up here.</p></div>`;
  }

  // ---------- map ----------
  const geoCache = {};
  async function geocode(pin) {
    if (!pin) return null;
    if (geoCache[pin]) return geoCache[pin];
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pin)}&country=India&format=json&limit=1`);
      const j = await r.json();
      if (j[0]) return (geoCache[pin] = [parseFloat(j[0].lat), parseFloat(j[0].lon)]);
    } catch (_) { /* offline: fall back to default centre */ }
    return null;
  }

  async function renderMap() {
    const latest = state.donations.find((d) => d.status !== 'cancelled');
    $('map-pin-chip').textContent = state.pincode ? `Pincode ${state.pincode}` : 'Pincode —';
    const dest = $('map-dest');
    dest.hidden = !latest;
    if (latest) dest.innerHTML = `<span class="nav-ic">▲</span><div><b>Doorstep Destination: ${esc(latest.category)}</b><p>${esc(latest.address.replace(/\s*\(Lat:.*\)$/, ''))}</p></div>`;
    const active = state.donations.filter((d) => d.status !== 'cancelled').length;
    $('map-activity').textContent = `You have ${active} pickup${active === 1 ? '' : 's'} shown on the map above.`;

    if (!state.map) {
      state.map = L.map('map', { zoomControl: true }).setView([28.4595, 77.0266], 14);
      state.layers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri' }),
      };
      state.layers.street.addTo(state.map);
      state.marker = L.marker([28.4595, 77.0266]).addTo(state.map);
    }
    setTimeout(() => state.map.invalidateSize(), 50);
    const pos = await geocode(state.pincode);
    if (pos) {
      state.map.setView(pos, 15);
      state.marker.setLatLng(pos);
    }
  }

  document.querySelectorAll('#map-seg button').forEach((b) =>
    b.addEventListener('click', () => {
      if (!state.map) return;
      document.querySelectorAll('#map-seg button').forEach((x) => x.classList.toggle('active', x === b));
      Object.values(state.layers).forEach((l) => state.map.removeLayer(l));
      state.layers[b.dataset.layer].addTo(state.map);
    }),
  );

  // ---------- donate / schedule ----------
  function openDonate() {
    // Like the app, ask the donor to confirm their pincode every time they open Schedule.
    $('pin-input').value = state.pincode || '';
    $('pin-error').hidden = true;
    $('pin-modal').hidden = false;
    renderDonate();
    if (state.pincode) loadSlots();
    initPickMap();
  }

  $('pin-go').addEventListener('click', async () => {
    const pin = $('pin-input').value.trim();
    const err = $('pin-error');
    if (!/^\d{6}$/.test(pin)) { err.textContent = 'Please enter a valid 6-digit pincode.'; err.hidden = false; return; }
    if (!state.serviceable.includes(pin)) {
      err.textContent = 'PunahChakra pickup is currently unavailable in your area. We’re working to expand our service and hope to reach you soon.';
      err.hidden = false;
      return;
    }
    state.pincode = pin;
    $('pin-modal').hidden = true;
    sb.from('profiles').update({ pincode: pin }).eq('id', state.user.id).then(() => {}, () => {});
    state.coords = null;
    renderDonate();
    loadSlots();
    initPickMap();
  });
  $('pin-cancel').addEventListener('click', () => { $('pin-modal').hidden = true; setTab('home'); });
  $('change-pin').addEventListener('click', () => { $('pin-input').value = state.pincode; $('pin-error').hidden = true; $('pin-modal').hidden = false; });

  async function loadSlots() {
    const [{ data: day }, { data: bookings }] = await Promise.all([
      sb.from('day_availability').select('available_slots, is_closed').eq('pincode', state.pincode).eq('day', dayKey(state.date)).maybeSingle(),
      sb.from('donations').select('id, time_slot').eq('pickup_day', dayStr(state.date)).neq('status', 'cancelled'),
    ]);
    state.avail = {
      slots: day?.available_slots || [],
      closed: Boolean(day?.is_closed),
      booked: (bookings || []).map((b) => b.time_slot).filter(Boolean),
    };
    if (!state.slot || slotDisabled(state.slot)) state.slot = TIME_SLOTS.find((s) => !slotDisabled(s)) || '';
    renderDonate();
  }

  // Admin edits (slots opened/closed in the admin panel) can land at any moment, so re-read them
  // every 12s while the Schedule tab is open — same cadence as the app — and when the tab regains focus.
  setInterval(() => {
    if (state.tab === 'donate' && state.pincode && !document.hidden) loadSlots();
  }, 12000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.tab === 'donate' && state.pincode) loadSlots();
  });

  const slotPast = (s) => sameDay(state.date, today()) && slotToMinutes(s) <= new Date().getHours() * 60 + new Date().getMinutes();
  const slotDisabled = (s) =>
    state.avail.closed || slotPast(s) || (state.avail.slots.length > 0 && !state.avail.slots.includes(s)) || state.avail.booked.includes(s);

  function renderDonate() {
    $('pin-row-text').textContent = state.pincode || 'Pincode not verified';
    $('item-grid').innerHTML = ITEM_TYPES.map(
      (i) => `<button type="button" class="item ${state.items.has(i.id) ? 'sel' : ''}" data-item="${i.id}">${i.label}<span class="box">${state.items.has(i.id) ? '✓' : ''}</span></button>`,
    ).join('');
    $('qty-val').textContent = `${state.qty} kg`;
    $('wk-label').textContent = state.weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    $('wk-prev').disabled = state.weekStart <= today();
    $('week-strip').innerHTML = Array.from({ length: 7 }, (_, i) => addDays(state.weekStart, i))
      .map((d) => {
        const past = d < today();
        return `<button type="button" class="day ${sameDay(d, state.date) ? 'sel' : ''}" ${past ? 'disabled' : ''} data-day="${dayKey(d)}"><small>${d.toLocaleDateString('en-US', { weekday: 'short' })}</small><b>${d.getDate()}</b></button>`;
      })
      .join('');
    $('slot-grid').innerHTML = state.avail.closed
      ? '<p class="muted center">Not available on this day</p>'
      : TIME_SLOTS.map((s) => {
          const booked = state.avail.booked.includes(s) && !slotPast(s);
          const unavail = !booked && !slotPast(s) && state.avail.slots.length > 0 && !state.avail.slots.includes(s);
          return `<button type="button" class="slot ${s === state.slot ? 'sel' : ''}" data-slot="${s}" ${slotDisabled(s) ? 'disabled' : ''}>${s}${booked ? '<small>Booked</small>' : unavail ? '<small>Unavailable</small>' : ''}</button>`;
        }).join('');
  }

  $('item-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-item]');
    if (!b) return;
    state.items.has(b.dataset.item) ? state.items.delete(b.dataset.item) : state.items.add(b.dataset.item);
    renderDonate();
  });
  $('qty-minus').addEventListener('click', () => { state.qty = Math.max(1, state.qty - 1); renderDonate(); });
  $('qty-plus').addEventListener('click', () => { state.qty += 1; renderDonate(); });
  $('wk-prev').addEventListener('click', () => { if (state.weekStart > today()) { state.weekStart = addDays(state.weekStart, -7); renderDonate(); } });
  $('wk-next').addEventListener('click', () => { state.weekStart = addDays(state.weekStart, 7); renderDonate(); });
  $('week-strip').addEventListener('click', (e) => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    const [y, m, d] = b.dataset.day.split('-').map(Number);
    state.date = new Date(y, m - 1, d);
    state.slot = '';
    loadSlots();
  });
  $('slot-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (b && !b.disabled) { state.slot = b.dataset.slot; renderDonate(); }
  });

  $('schedule-btn').addEventListener('click', async () => {
    const err = $('donate-error');
    err.hidden = true;
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    if (!state.items.size) return fail('Select at least one item type.');
    if (!state.pincode) return ($('pin-modal').hidden = false);
    if (!state.slot || slotDisabled(state.slot)) return fail('Please pick an available time slot.');
    const line1 = $('addr1').value.trim();
    if (!line1) return fail('Please enter your pickup address.');

    const btn = $('schedule-btn');
    btn.disabled = true;
    try {
      const category = ITEM_TYPES.filter((i) => state.items.has(i.id)).map((i) => i.label).join(', ');
      const base = [line1, $('addr2').value.trim(), state.pincode].filter(Boolean).join(', ');
      const address = state.coords ? `${base} (Lat: ${state.coords.lat.toFixed(4)}, Long: ${state.coords.lng.toFixed(4)})` : base;
      const instructions = $('notes').value.trim() || 'Doorstep pickup';
      const pickup_day = dayStr(state.date);
      const { data, error } = await sb
        .from('donations')
        .insert([{
          donor_id: state.user.id,
          request_id: `#PC-${Math.floor(10000 + Math.random() * 90000)}`,
          is_picked_up: false,
          category,
          weight_kg: state.qty,
          estimated_quantity_kg: state.qty,
          pickup_day,
          time_slot: state.slot,
          instructions,
          address,
          pincode: state.pincode,
          status: 'pending',
        }])
        .select()
        .single();
      if (error) throw error;

      // Same follow-up rows the app creates: collector pickup job + donor notification.
      await sb.from('pickups').insert([{
        donation_id: data.id,
        donor_name: state.profile?.full_name || 'PunahChakra Donor',
        donor_phone: state.profile?.phone || '',
        address,
        zone: 'Noida Sector 15A & 44',
        weight_summary: `${state.qty} kg`,
        time_window: state.slot,
        status: 'pending',
      }]).then(() => {}, () => {});
      await sb.from('notifications').insert([{
        user_id: state.user.id,
        title: 'Pickup Scheduled',
        body: `Your ${category} pickup is scheduled for ${pickup_day} (${state.slot}).`,
        tag: 'PICKUP REMINDER',
      }]).then(() => {}, () => {});

      toast('Pickup scheduled!');
      $('addr1').value = $('addr2').value = $('notes').value = '';
      await loadAll();
      setTab('home');
    } catch (ex) {
      fail(ex.message || 'Could not schedule pickup. Please try again.');
    } finally {
      btn.disabled = false;
    }
  });

  // Draggable pickup pin, as in the app's Leaflet preview.
  async function initPickMap() {
    if (!state.pickMap) {
      state.pickMap = L.map('pick-map').setView([28.4595, 77.0266], 15);
      state.pickLayers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri' }),
      };
      state.pickLayers.street.addTo(state.pickMap);
      state.pickMarker = L.marker([28.4595, 77.0266], { draggable: true }).addTo(state.pickMap);
      state.pickMarker.on('dragend', () => { const p = state.pickMarker.getLatLng(); state.coords = { lat: p.lat, lng: p.lng }; });
      state.pickMap.on('click', (e) => { state.pickMarker.setLatLng(e.latlng); state.coords = { lat: e.latlng.lat, lng: e.latlng.lng }; });
    }
    setTimeout(() => state.pickMap.invalidateSize(), 50);
    if (!state.coords && state.pincode) {
      const pos = await geocode(state.pincode);
      if (pos) {
        state.pickMap.setView(pos, 16);
        state.pickMarker.setLatLng(pos);
      }
    }
  }

  document.querySelectorAll('#pick-seg button').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('#pick-seg button').forEach((x) => x.classList.toggle('active', x === b));
      Object.values(state.pickLayers).forEach((l) => state.pickMap.removeLayer(l));
      state.pickLayers[b.dataset.layer].addTo(state.pickMap);
    }),
  );

  $('locate-btn').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Location is not supported in this browser.');
    const btn = $('locate-btn');
    btn.textContent = 'Detecting...';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        state.coords = { lat, lng };
        state.pickMap.setView([lat, lng], 17);
        state.pickMarker.setLatLng([lat, lng]);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const a = (await r.json()).address || {};
          if (!$('addr1').value) $('addr1').value = [a.house_number, a.road].filter(Boolean).join(' ');
          if (!$('addr2').value) $('addr2').value = [a.suburb || a.neighbourhood, a.city || a.town].filter(Boolean).join(', ');
        } catch (_) { /* coordinates are still saved */ }
        btn.textContent = '◎ Use Current Location';
      },
      () => { btn.textContent = '◎ Use Current Location'; toast('Could not get your location. Please allow access or drag the pin.'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });

  // ---------- alerts ----------
  async function loadAlerts() {
    const { data } = await sb.from('notifications').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
    $('alerts-list').innerHTML = (data || []).length
      ? data.map((n) => `<div class="white-card note ${n.is_read ? '' : 'unread'}"><small>${esc(n.tag)}</small><b>${esc(n.title)}</b><p>${esc(n.body)}</p></div>`).join('')
      : '<div class="white-card"><p class="muted">No alerts yet.</p></div>';
    if ((data || []).some((n) => !n.is_read)) {
      await sb.from('notifications').update({ is_read: true }).eq('user_id', state.user.id).eq('is_read', false);
      $('bell-dot').hidden = true;
    }
  }

  // ---------- profile ----------
  function renderProfile() {
    const p = state.profile || {};
    $('profile-card').innerHTML = `<h3 class="card-h">${esc(p.full_name || 'Your profile')}</h3>
      <p class="muted">${esc(p.phone || state.user.phone || '')}</p>
      ${p.email ? `<p class="muted">${esc(p.email)}</p>` : ''}`;
    $('profile-pickups').innerHTML = state.donations.length
      ? state.donations.map((d) => `<div class="white-card">${pickupRow(d, true)}
          ${d.status === 'pending' ? `<button class="link cancel-pickup" data-cancel="${d.id}">Cancel pickup</button>` : ''}</div>`).join('')
      : '<div class="white-card"><p class="muted">No pickups yet.</p></div>';
  }

  $('profile-pickups').addEventListener('click', async (e) => {
    const id = e.target.dataset.cancel;
    if (!id || !confirm('Cancel this pickup request?')) return;
    // eq('status','pending') keeps this atomic: it fails if a collector already confirmed it.
    const { data, error } = await sb.from('donations').update({ status: 'cancelled' }).eq('id', id).eq('status', 'pending').select();
    if (error || !data?.length) return toast('This pickup can no longer be cancelled.');
    await sb.from('pickups').update({ status: 'cancelled' }).eq('donation_id', id).then(() => {}, () => {});
    await loadAll();
    renderProfile();
  });

  // ---------- wiring ----------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button[data-tab]');
    if (t) setTab(t.dataset.tab);
  });
  $('p-back').addEventListener('click', () => setTab('home'));

  $('signout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
    state.user = null;
    window.resetAuth();
    window.showView('landing');
  });

  window.enterPortal = async (user) => {
    state.user = user;
    window.showView('portal');
    setTab('home');
    await loadAll();
  };

  // Restore an existing session on page load.
  sb.auth.getSession().then(({ data }) => {
    if (data.session?.user) window.enterPortal(data.session.user);
  });
})();
