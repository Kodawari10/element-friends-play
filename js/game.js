/* Element Friends — game logic (drag/tap combine, inventory, collection, hints, saving). */
(function () {
  'use strict';
  const D = window.EF_DATA, ART = window.EF_ART, SND = window.EF_AUDIO;
  const $ = s => document.querySelector(s);
  const board = $('#board'), inv = $('#inv'), drawer = $('#drawer'), fx = $('#fx');
  const KEY = 'element-friends-v1';
  const HINT_COOLDOWN = 30000;
  const SIZES = ['small', 'comfy', 'big'];
  const TOTAL = D.elements.length;
  const LEGACY_TOTAL = 140;
  let newFriends = 0;
  const BASE = D.elements.filter(e => e.base).map(e => e.id);

  // ---------- icons ----------
  const ICON = {
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" fill="#ffe27a"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" fill="#cfe6ff"/><path d="M4 19V5M8 7h7M6 21h13"/>',
    broom: '<path d="M15 2l-4 9"/><path d="M6 11h9l2.5 10H3.5z" fill="#ffd6a8"/><path d="M8 15v6M12 15v6"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="#ffd6e8"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="#eee"/><path d="M16 9l5 6M21 9l-5 6"/>',
    gear: '<circle cx="12" cy="12" r="6.5" fill="#e3d6ff"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
  document.querySelectorAll('i[data-icon]').forEach(i => { i.innerHTML = icon(i.dataset.icon); });

  // ---------- state ----------
  let state;
  const found = new Set();
  const tried = new Set(); // pairs that didn't mix, e.g. "fire+fire"
  const TRIED_MAX = 3000;
  const SORTS = {
    az: { icon: '🔤', text: 'A–Z', say: 'A to Z' },
    new: { icon: '🆕', text: 'Newest', say: 'newest first' },
    mix: { icon: '✨', text: 'Most mixes', say: 'most mixes left first' }
  };
  const SORT_ORDER = ['az', 'new', 'mix'];
  // playfield wallpapers, unlocked by how many friends you've found
  const WALLS = [
    { id: 'dots', name: 'Sweet dots', icon: '🍬', need: 0 },
    { id: 'clouds', name: 'Cloud puffs', icon: '☁️', need: 12 },
    { id: 'candy', name: 'Candy stripes', icon: '🍭', need: 25 },
    { id: 'hearts', name: 'Tiny hearts', icon: '💗', need: 45 },
    { id: 'stars', name: 'Starlight', icon: '⭐', need: 70 },
    { id: 'rainbow', name: 'Rainbow', icon: '🌈', need: 100 },
    // seasonal treat: free for everyone, but only shows up from Oct 15 to Nov 5 each year
    { id: 'pumpkin', name: 'Pumpkin patch', icon: '🎃', need: 0, season: { from: [10, 15], to: [11, 5], until: 'Nov 5', untilLong: 'November 5' } }
  ];
  const wallById = Object.fromEntries(WALLS.map(w => [w.id, w]));
  const inSeason = (w, d = new Date()) => { const md = (d.getMonth() + 1) * 100 + d.getDate(); return md >= w.season.from[0] * 100 + w.season.from[1] && md <= w.season.to[0] * 100 + w.season.to[1]; };
  const wallOpen = w => w.season ? inSeason(w) : found.size >= w.need;
  const pairKey = (a, b) => [a, b].sort().join('+');
  // Gentle mode: fewer wiggles and no buzzing (also follows the system reduced-motion setting)
  const still = () => !!(state && state.calm) || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function buzz(ms) {
    if (state && state.calm) return;
    try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive) navigator.vibrate(ms); } catch (err) { /* ignore */ }
  }
  function freshState() { return { found: BASE.slice(), seen: {}, muted: false, hintAt: 0, board: null, tapTip: false, theme: 'auto', mixCounts: true, tried: [], pets: 0, sort: 'az', knownTotal: TOTAL, twinTip: false, music: false, met: {}, faves: [], bestCombo: 0, wall: 'dots', size: 'comfy', calm: false, nicks: {}, seasonTip: '', shinies: [], made: {} }; }
  function load() {
    state = freshState();
    let saved = null;
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.found)) { Object.assign(state, s); saved = s; }
    } catch (e) { /* corrupted save: start fresh */ }
    // new friends added in an update: older saves had no knownTotal and came from the 140-friend version
    const known = !saved ? TOTAL : (typeof saved.knownTotal === 'number' ? saved.knownTotal : LEGACY_TOTAL);
    newFriends = known < TOTAL ? TOTAL - known : 0;
    state.knownTotal = TOTAL;
    state.found = [...new Set(BASE.concat(state.found.filter(id => D.byId[id])))];
    found.clear(); state.found.forEach(id => found.add(id));
    if (state.theme !== 'day' && state.theme !== 'night' && state.theme !== 'auto') state.theme = 'auto';
    if (typeof state.mixCounts !== 'boolean') state.mixCounts = true;
    if (!Array.isArray(state.tried)) state.tried = [];
    if (typeof state.pets !== 'number' || !(state.pets >= 0)) state.pets = 0;
    if (!SORTS[state.sort]) state.sort = 'az';
    if (typeof state.twinTip !== 'boolean') state.twinTip = false;
    if (typeof state.music !== 'boolean') state.music = false;
    if (!state.met || typeof state.met !== 'object' || Array.isArray(state.met)) state.met = {};
    Object.keys(state.met).forEach(k => { if (!D.byId[k] || !/^\d{4}-\d{2}-\d{2}$/.test(state.met[k])) delete state.met[k]; });
    if (typeof state.bestCombo !== 'number' || !(state.bestCombo >= 0) || state.bestCombo > 9999) state.bestCombo = 0;
    state.bestCombo = Math.floor(state.bestCombo);
    if (!Array.isArray(state.faves)) state.faves = [];
    state.faves = [...new Set(state.faves.filter(id => typeof id === 'string' && D.byId[id] && found.has(id)))];
    if (typeof state.wall !== 'string' || !wallById[state.wall] || !wallOpen(wallById[state.wall])) state.wall = 'dots';
    if (!SIZES.includes(state.size)) state.size = 'comfy';
    if (typeof state.calm !== 'boolean') state.calm = false;
    if (typeof state.seasonTip !== 'string') state.seasonTip = '';
    if (!state.nicks || typeof state.nicks !== 'object' || Array.isArray(state.nicks)) state.nicks = {};
    Object.keys(state.nicks).forEach(k => { const v = cleanNick(state.nicks[k]); if (!D.byId[k] || !found.has(k) || !v) delete state.nicks[k]; else state.nicks[k] = v; });
    if (!Array.isArray(state.shinies)) state.shinies = [];
    state.shinies = [...new Set(state.shinies.filter(id => typeof id === 'string' && D.byId[id] && found.has(id)))];
    if (!state.made || typeof state.made !== 'object' || Array.isArray(state.made)) state.made = {};
    Object.keys(state.made).forEach(k => { const v = state.made[k]; if (!D.byId[k] || D.byId[k].base || !found.has(k) || typeof v !== 'number' || !(v >= 1)) delete state.made[k]; else state.made[k] = Math.min(MADE_MAX, Math.floor(v)); });
    tried.clear(); state.tried.forEach(k => tried.add(k));
    if (found.size < TOTAL) state.complete = false; // finished players get to cheer again for new friends
  }
  function save() {
    const w = board.clientWidth || 1, h = board.clientHeight || 1;
    state.board = pieces().filter(p => !p.dataset.busy).map(p => Object.assign({ id: p.dataset.id, x: +(p._x / w).toFixed(4), y: +(p._y / h).toFixed(4) }, p.dataset.shiny ? { s: 1 } : {}));
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full / private mode */ }
  }

  // ---------- helpers ----------
  // local calendar day as YYYY-MM-DD (used for "Friends since")
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function friendSince(id) {
    const e = D.byId[id];
    if (e.base) return { icon: '💛', text: 'Friends from the very start' };
    const k = state.met && state.met[id];
    if (!k) return { icon: '💛', text: 'An old friend' };
    const [y, m, d] = k.split('-').map(Number), day = new Date(y, m - 1, d), now = new Date();
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - day) / 864e5);
    if (diff <= 0) return { icon: '🎉', text: 'Met today!' };
    if (diff === 1) return { icon: '🌙', text: 'Met yesterday' };
    const opts = { month: 'short', day: 'numeric' }; if (y !== now.getFullYear()) opts.year = 'numeric';
    return { icon: '📅', text: 'Friends since ' + day.toLocaleDateString('en-US', opts) };
  }
  // ---------- times made 🧪 (local only: how often you've mixed each friend) ----------
  const MADE_MAX = 99999, MADE_CHEERS = [10, 25, 50, 100, 250, 500, 1000];
  const madeCount = id => (state && state.made && state.made[id]) || 0;
  const ordinal = n => n + ((n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
  function noteMade(id) {
    const n = Math.min(MADE_MAX, madeCount(id) + 1); state.made[id] = n; return n;
  }
  function madeText(id) {
    const n = madeCount(id);
    if (!n) return '';
    return n === 1 ? 'Made once' : n === 2 ? 'Made twice' : `Made ${n.toLocaleString('en-US')} times`;
  }
  function applyMade(id) {
    const el = $('#detailMade'), t = madeText(id);
    el.hidden = !t;
    el.innerHTML = t ? `<span aria-hidden="true">🧪</span> ${t}` : '';
    if (t) el.setAttribute('aria-label', t); else el.removeAttribute('aria-label');
  }
  // ---------- nicknames 🏷️ (local only, never sent on-chain) ----------
  const NICK_MAX = 16;
  function cleanNick(v) {
    if (typeof v !== 'string') return '';
    const t = v.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\s+/g, ' ').trim();
    return Array.from(t).slice(0, NICK_MAX).join('').trim();
  }
  const nickOf = id => (state && state.nicks && state.nicks[id]) || '';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pieces = () => [...board.querySelectorAll('.piece')];
  const art = (id, cls) => `<div class="${cls || 'art'}">${ART.render(D.byId[id], { label: false })}</div>`;
  let toastT;
  function toast(msg, ms) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 2600);
  }
  let lastSaid = 0;
  function announce(msg) { lastSaid = Date.now(); const a = $('#announce'); a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 30); }
  function boardRect() { return board.getBoundingClientRect(); }
  function toLocal(cx, cy) { const r = boardRect(); return [cx - r.left, cy - r.top]; }
  function toClient(x, y) { const r = boardRect(); return [x + r.left, y + r.top]; }
  function inRect(cx, cy, r) { return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom; }

  // ---------- pieces on the board ----------
  // Shiny friends ✨: now and then a mix comes out shiny (rainbow halo + twinkles). Purely cosmetic.
  const SHINE = '<span class="shine" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></span>';
  let shinyChance = 1 / 20;
  function noteShiny(id, cx, cy, isNew) {
    const e = D.byId[id], first = !state.shinies.includes(id);
    if (first && found.has(id)) { state.shinies.push(id); save(); }
    const n = state.shinies.length;
    SND.play('shiny'); buzz([8, 40, 8]);
    floatText(cx, cy - 74, '✨ Shiny!');
    const msg = first
      ? `✨ Wow, a shiny ${e.name}! Shiny friends sparkle with rainbow colors.` + (n > 1 ? ` You've met ${n} shiny friends!` : ' Your very first shiny friend!')
      : `✨ Another shiny ${e.name}! So sparkly!`;
    setTimeout(() => { toast(msg, 4200); announce(msg); }, isNew ? 1400 : 0);
    document.dispatchEvent(new CustomEvent('ef:shiny', { detail: { id, first, count: n } }));
  }
  function setPos(p, x, y) {
    const w = board.clientWidth, h = board.clientHeight, m = 38;
    x = clamp(x, m, Math.max(m, w - m)); y = clamp(y, m + 2, Math.max(m, h - m - 12));
    p._x = x; p._y = y; p.style.left = x + 'px'; p.style.top = y + 'px';
  }
  function makePiece(id, x, y, pop, shiny) {
    const e = D.byId[id];
    const p = document.createElement('button');
    p.type = 'button'; p.className = 'piece' + (pop === false ? '' : ' pop') + (shiny ? ' shiny' : ''); p.dataset.id = id;
    if (shiny) p.dataset.shiny = '1';
    p.setAttribute('aria-label', (shiny ? 'Shiny ' : '') + e.name + ' on the playfield. Press Enter to select, D to make a twin, Delete to remove.');
    p.innerHTML = (shiny ? SHINE : '') + art(id) + `<span class="lbl">${e.name}</span>`;
    board.appendChild(p); setPos(p, x, y);
    p.addEventListener('animationend', ev => { if (ev.animationName === 'popin' || ev.animationName === 'fadein') p.classList.remove('pop'); });
    p.addEventListener('pointerdown', ev => onDown(ev, { type: 'piece', id, el: p }));
    p.addEventListener('click', ev => { if (ev.detail === 0) handleTap({ type: 'piece', id, el: p }); });
    p.addEventListener('keydown', ev => { if (ev.key === 'Delete' || ev.key === 'Backspace') { removePiece(p); save(); } else if ((ev.key === 'd' || ev.key === 'D') && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); twin(p); } });
    updateBoardState();
    return p;
  }
  function removePiece(p) {
    if (sel && sel.el === p) clearSel();
    p.dataset.busy = 1; p.classList.add('poof'); SND.play('poof');
    setTimeout(() => { p.remove(); updateBoardState(); }, 340);
  }
  function freeSpot(nearX, nearY) {
    const w = board.clientWidth, h = board.clientHeight; const ps = pieces();
    let best = null, bestD = -1;
    for (let i = 0; i < 40; i++) {
      const x = nearX != null ? nearX + (Math.random() - .5) * 220 : 60 + Math.random() * (w - 120);
      const y = nearY != null ? nearY + (Math.random() - .5) * 180 : 60 + Math.random() * (h - 130);
      const d = ps.reduce((m, p) => Math.min(m, Math.hypot(p._x - x, p._y - y)), 1e9);
      if (d > 110) return [x, y];
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    return best || [w / 2, h / 2];
  }
  function updateBoardState() {
    board.classList.toggle('has-pieces', board.querySelector('.piece') !== null);
    const t = document.getElementById('btnTidy');
    if (t) { const show = pieces().filter(p => !p.dataset.busy).length >= TIDY_MIN; if (t.hidden === show) t.hidden = !show; }
    const ph = document.getElementById('btnPhoto');
    if (ph) { const show = pieces().filter(p => !p.dataset.busy).length >= PHOTO_MIN; if (ph.hidden === show) ph.hidden = !show; }
  }

  // ---------- tidy up: friends hop into neat rows (sorted by name, twins side by side) ----------
  const TIDY_MIN = 3, PHOTO_MIN = 2;
  let tidyT = 0;
  function tidyLayout(n) {
    // centred rows below the Daily Friend pill; spacing shrinks to fit a crowded board
    const w = board.clientWidth, h = board.clientHeight;
    const top = Math.min(96, h * .24), bottom = 44, side = 44;
    const aw = Math.max(1, w - side * 2), ah = Math.max(1, h - top - bottom);
    const size = parseFloat(getComputedStyle(board).getPropertyValue('--piece')) || 96, cap = size * 1.14, TALL = 1.22; // rows need room for name labels
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const gap = Math.min(cols > 1 ? aw / (cols - 1) : 1e9, rows > 1 ? ah / (rows - 1) / TALL : 1e9, cap);
      const shape = Math.abs(Math.log((cols / rows) / (aw / (ah / TALL)))); // ties: match the board's shape
      if (!best || gap > best.gap + .5 || (gap > best.gap - .5 && shape < best.shape)) best = { cols, rows, gap, shape };
    }
    const { cols, rows, gap } = best, gy = gap * TALL;
    const y0 = top + ah / 2 - (rows - 1) * gy / 2, out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols;
      out.push([w / 2 - (inRow - 1) * gap / 2 + (i % cols) * gap, y0 + r * gy]);
    }
    return out;
  }
  function tidy() {
    if (drag) return 0;
    clearSel(); hidePeek();
    const ps = pieces().filter(p => !p.dataset.busy);
    if (ps.length < 2) { toast('The playfield is already tidy ✨'); return 0; }
    ps.sort((a, b) => D.byId[a.dataset.id].name.localeCompare(D.byId[b.dataset.id].name) || (a._x - b._x));
    const spots = tidyLayout(ps.length);
    clearTimeout(tidyT);
    ps.forEach((p, i) => {
      p.classList.remove('pop', 'wiggle', 'is-confused', 'tidy-hop');
      if (!still()) { p.style.transitionDelay = (Math.min(i, 24) * 22) + 'ms'; p.classList.add('tidying'); }
      setPos(p, spots[i][0], spots[i][1]);
      if (!still) setTimeout(() => { if (p.isConnected) { p.classList.add('tidy-hop'); } }, 430 + Math.min(i, 24) * 22);
    });
    tidyT = setTimeout(() => ps.forEach(p => { p.classList.remove('tidying', 'tidy-hop'); p.style.transitionDelay = ''; }), still ? 0 : 1100 + Math.min(ps.length, 24) * 22);
    const b = document.getElementById('btnTidy'); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    SND.play('tidy');
    announce(`Tidied up ${ps.length} friends into neat rows, sorted by name.`);
    save();
    return ps.length;
  }

  // ---------- mixes left (how many undiscovered friends each friend can still help make) ----------
  const USES = {};
  D.recipes.forEach(([a, b, r]) => { [a, b].forEach(x => { (USES[x] = USES[x] || new Set()).add(r); }); });
  function mixesLeft(id) { let n = 0; (USES[id] || []).forEach(r => { if (!found.has(r)) n++; }); return n; }
  function mixBadge(id) {
    if (!state.mixCounts) return '';
    const n = mixesLeft(id);
    return n ? `<span class="mixes" aria-hidden="true">${n}</span>` : '<span class="mixes done" aria-hidden="true">✓</span>';
  }
  function mixLabel(id) {
    if (!state.mixCounts) return '';
    const n = mixesLeft(id);
    return n ? `, can still help make ${n} new friend${n === 1 ? '' : 's'}` : ', all mixes found';
  }

  // ---------- inventory ----------
  const isFave = id => state.faves.includes(id);
  function sortedFriends(list) { return sortedRaw(list).sort((a, b) => isFave(b.id) - isFave(a.id)); } // best friends float to the top (stable)
  function sortedRaw(list) {
    const byName = (a, b) => a.name.localeCompare(b.name);
    if (state.sort === 'new') {
      const order = new Map(state.found.map((id, i) => [id, i]));
      return list.sort((a, b) => (order.get(b.id) - order.get(a.id)) || byName(a, b));
    }
    if (state.sort === 'mix') return list.sort((a, b) => (mixesLeft(b.id) - mixesLeft(a.id)) || byName(a, b));
    return list.sort(byName);
  }
  function applySort() {
    const b = $('#btnSort'); if (!b) return;
    const s = SORTS[state.sort];
    b.innerHTML = `<span aria-hidden="true">${s.icon}</span><span class="sort-lbl">${s.text}</span>`;
    b.setAttribute('aria-label', `Sort friends: ${s.say}. Tap to change.`);
    b.dataset.sort = state.sort;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  function setSort(mode) {
    if (!SORTS[mode]) return;
    state.sort = mode; save(); applySort(); renderInventory(); inv.scrollTop = 0;
    announce(`Friends sorted ${SORTS[mode].say}`);
  }
  let query = '';
  function renderInventory() {
    const list = sortedFriends(state.found.map(id => D.byId[id]).filter(e => !query || e.name.toLowerCase().includes(query) || nickOf(e.id).toLowerCase().includes(query)));
    inv.innerHTML = '';
    if (!list.length) { inv.innerHTML = `<div class="inv-empty">No friend called “${escapeHtml(query)}” yet…</div>`; return; }
    const frag = document.createDocumentFragment();
    list.forEach(e => {
      const b = document.createElement('button');
      const left = state.mixCounts ? mixesLeft(e.id) : -1;
      b.type = 'button'; b.className = 'inv-item' + (e.final ? ' final' : '') + (left === 0 ? ' all-mixed' : '') + (isFave(e.id) ? ' fave' : ''); b.dataset.id = e.id; b.setAttribute('role', 'listitem');
      if (nickOf(e.id)) b.title = `${e.name} “${nickOf(e.id)}”`;
      b.setAttribute('aria-label', e.name + (nickOf(e.id) ? `, nicknamed ${nickOf(e.id)}` : '') + (isFave(e.id) ? ', best friend' : '') + (state.seen[e.id] === false ? ', new' : '') + mixLabel(e.id) + '. Press Enter to select for mixing.');
      b.innerHTML = art(e.id) + `<span class="lbl">${e.name}</span>` + (state.seen[e.id] === false ? '<span class="new">NEW</span>' : '') + mixBadge(e.id) + (isFave(e.id) ? '<span class="fave-dot" aria-hidden="true">💗</span>' : '');
      b.addEventListener('pointerdown', ev => onDown(ev, { type: 'inv', id: e.id, el: b }));
      b.addEventListener('click', ev => { if (ev.detail === 0) handleTap({ type: 'inv', id: e.id, el: b }); });
      b.addEventListener('dblclick', () => { clearSel(); const [x, y] = freeSpot(); makePiece(e.id, x, y); SND.play('drop'); save(); });
      b.addEventListener('contextmenu', ev => ev.preventDefault());
      frag.appendChild(b);
    });
    inv.appendChild(frag);
    if (sel && sel.type === 'inv') { const el = inv.querySelector(`[data-id="${sel.id}"]`); if (el) { sel.el = el; el.classList.add('selected'); } }
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function markSeen(id) {
    if (state.seen[id] === false) {
      delete state.seen[id];
      const el = inv.querySelector(`[data-id="${id}"] .new`); if (el) el.remove();
      save();
    }
  }
  function updateCounter(bump) {
    $('#count').textContent = found.size; $('#total').textContent = TOTAL;
    const c = $('#counter'); c.setAttribute('aria-label', `${found.size} of ${TOTAL} friends discovered`);
    if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  }

  // ---------- selection (tap-to-combine) ----------
  let sel = null;
  function clearSel() { if (sel && sel.el) sel.el.classList.remove('selected'); sel = null; }
  let lastTap = null; // double-tap a friend on the playfield to make a twin
  const TWIN_MS = 380;
  function handleTap(src) {
    SND.unlock(); markSeen(src.id);
    if (src.type === 'piece') {
      const now = performance.now();
      if (lastTap && lastTap.el === src.el && now - lastTap.t < TWIN_MS) { lastTap = null; clearSel(); twin(src.el); return; }
      lastTap = { el: src.el, t: now };
    } else lastTap = null;
    if (sel && (!sel.el || !sel.el.isConnected)) clearSel();
    if (sel && sel.el === src.el) { clearSel(); SND.play('tap'); return; }
    if (sel) { const a = sel; clearSel(); combine(a, src); return; }
    sel = src; src.el.classList.add('selected'); SND.play('select');
    if (!state.tapTip) { toast('Now tap another friend to mix them! ✨'); state.tapTip = true; save(); }
  }
  board.addEventListener('pointerdown', ev => {
    if (ev.target !== board && !ev.target.closest('.board-tip, .board-deco')) return;
    if (sel && sel.type === 'inv') { const [x, y] = toLocal(ev.clientX, ev.clientY); makePiece(sel.id, x, y); clearSel(); SND.play('drop'); save(); }
    else clearSel();
  });

  function twin(p) {
    if (!p || !p.isConnected || p.dataset.busy) return null;
    const id = p.dataset.id, e = D.byId[id], w = board.clientWidth;
    if (sel && sel.el === p) clearSel();
    // land beside the original, on whichever side has the most room
    const h = board.clientHeight, others = pieces().filter(o => o !== p && !o.dataset.busy);
    const spots = [[86, 8], [-86, 8], [0, 96], [0, -96], [70, 70], [-70, 70], [70, -70], [-70, -70]].map(([dx, dy]) => {
      const x = clamp(p._x + dx, 38, Math.max(38, w - 38)), y = clamp(p._y + dy, 40, Math.max(38, h - 50));
      return [x, y, others.reduce((m, o) => Math.min(m, Math.hypot(o._x - x, o._y - y)), 999) + Math.min(60, Math.hypot(p._x - x, p._y - y))];
    });
    const [tx, ty] = spots.reduce((a, b) => (b[2] > a[2] + 1 ? b : a));
    const side = tx >= p._x ? 1 : -1;
    const q = makePiece(id, tx, ty);
    q.style.setProperty('--twin-from', (-side * 60) + 'px'); q.classList.add('twin-pop'); setTimeout(() => q.classList.remove('twin-pop'), 700);
    p.classList.remove('twin-wink'); void p.offsetWidth; p.classList.add('twin-wink'); setTimeout(() => p.classList.remove('twin-wink'), 600);
    const [cx, cy] = toClient(q._x, q._y); burst(cx, cy, 8);
    SND.play('twin'); buzz(10);
    const self = D.combine(id, id);
    if (!state.twinTip) { state.twinTip = true; toast(self && found.has(self) ? `Twin ${e.name}s! Mix them together to make ${D.byId[self].name} again ✨` : `Twin ${e.name}s! 👯 Double-tap any friend to copy it, then try mixing the pair ✨`, 4200); }
    announce(`Made a twin ${e.name}. There are now two ${e.name} friends on the playfield.`);
    save();
    return q;
  }

  // ---------- mix peek (bubble over the friend you're about to drop onto) ----------
  // Never spoils: an undiscovered result looks exactly like an untried pair ("?").
  function peekInfo(a, b) {
    const r = D.combine(a, b);
    if (r && found.has(r)) return { kind: 'known', id: r, text: D.byId[r].name, label: `${D.byId[a].name} and ${D.byId[b].name} make ${D.byId[r].name}` };
    if (!r && tried.has(pairKey(a, b))) return { kind: 'tried', text: 'tried', label: `You already tried ${D.byId[a].name} and ${D.byId[b].name}` };
    return { kind: 'new', text: '?', label: `${D.byId[a].name} and ${D.byId[b].name}: not tried yet` };
  }
  let peekEl = null;
  function showPeek(srcId, t) {
    if (!t) { hidePeek(); return; }
    const info = peekInfo(srcId, t.dataset.id);
    if (!peekEl) { peekEl = document.createElement('div'); fx.appendChild(peekEl); }
    peekEl.className = 'peek ' + info.kind;
    peekEl.dataset.kind = info.kind;
    peekEl.innerHTML = info.kind === 'known' ? `<span class="eq">=</span><div class="mini">${ART.render(D.byId[info.id], { label: false })}</div><span class="nm">${info.text}</span>`
      : info.kind === 'tried' ? '<span class="nm">💭 tried</span>' : '<span class="nm big">?</span>';
    const r = t.getBoundingClientRect();
    peekEl.style.left = (r.left + r.width / 2) + 'px'; peekEl.style.top = r.top + 'px';
    t.classList.toggle('target-tried', info.kind === 'tried');
    announce(info.label);
  }
  function hidePeek() { if (peekEl) { peekEl.remove(); peekEl = null; } board.querySelectorAll('.target-tried').forEach(x => x.classList.remove('target-tried')); }

  // ---------- dragging ----------
  let drag = null;
  function onDown(ev, src) {
    if (ev.button > 0) return;
    SND.unlock();
    if (drag) endDrag(null);
    const touch = ev.pointerType !== 'mouse';
    drag = { src, pid: ev.pointerId, sx: ev.clientX, sy: ev.clientY, cx: ev.clientX, cy: ev.clientY, active: false, touch, target: null };
    if (src.type === 'piece') {
      try { src.el.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      const [lx, ly] = toLocal(ev.clientX, ev.clientY); drag.ox = src.el._x - lx; drag.oy = src.el._y - ly;
    } else if (touch) {
      drag.timer = setTimeout(() => { if (drag && !drag.active) { startDrag(); buzz(12); } }, 230);
    }
  }
  function startDrag() {
    drag.active = true; clearSel(); markSeen(drag.src.id); SND.play('pick');
    if (drag.src.type === 'inv') {
      const g = document.createElement('div'); g.className = 'ghost';
      g.innerHTML = art(drag.src.id); fx.appendChild(g); drag.ghost = g;
      try { drag.src.el.setPointerCapture(drag.pid); } catch (e) { /* ignore */ }
      document.body.classList.add('drag-inv');
    } else {
      drag.src.el.classList.add('dragging'); document.body.classList.add('drag-board');
    }
    moveDrag();
  }
  function dragPoint() {
    // board-local position of the dragged friend's centre
    if (drag.src.type === 'piece') { const [lx, ly] = toLocal(drag.cx, drag.cy); return [lx + drag.ox, ly + drag.oy]; }
    return toLocal(drag.cx, drag.cy - (drag.touch ? 30 : 0));
  }
  function findTarget(x, y, exclude) {
    let best = null, bd = 58;
    pieces().forEach(p => { if (p === exclude || p.dataset.busy) return; const d = Math.hypot(p._x - x, p._y - y); if (d < bd) { bd = d; best = p; } });
    return best;
  }
  function moveDrag() {
    const [x, y] = dragPoint();
    if (drag.ghost) { const [gx, gy] = toClient(x, y); drag.ghost.style.left = gx + 'px'; drag.ghost.style.top = gy + 'px'; }
    else setPos(drag.src.el, x, y);
    const overBoard = inRect(drag.cx, drag.cy, boardRect());
    const t = overBoard ? findTarget(x, y, drag.src.el) : null;
    if (t !== drag.target) { if (drag.target) drag.target.classList.remove('target', 'target-tried'); if (t) t.classList.add('target'); drag.target = t; showPeek(drag.src.id, t); }
    board.classList.toggle('drop-ok', overBoard && drag.src.type === 'inv');
    drawer.classList.toggle('over', drag.src.type === 'piece' && inRect(drag.cx, drag.cy, drawer.getBoundingClientRect()));
  }
  document.addEventListener('pointermove', ev => {
    if (!drag || ev.pointerId !== drag.pid) return;
    drag.cx = ev.clientX; drag.cy = ev.clientY;
    if (!drag.active) {
      const d = Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy);
      if (drag.src.type === 'inv' && drag.touch) { if (d > 10) { clearTimeout(drag.timer); drag = null; } return; } // let the drawer scroll
      if (d > 5) startDrag(); else return;
    }
    ev.preventDefault(); moveDrag();
  }, { passive: false });
  document.addEventListener('touchmove', ev => { if (drag && drag.active) ev.preventDefault(); }, { passive: false });
  document.addEventListener('pointerup', ev => { if (drag && ev.pointerId === drag.pid) endDrag(ev); });
  document.addEventListener('pointercancel', ev => { if (drag && ev.pointerId === drag.pid) endDrag(null, true); });

  function endDrag(ev, cancelled) {
    const d = drag; drag = null; if (!d) return;
    clearTimeout(d.timer);
    document.body.classList.remove('drag-inv', 'drag-board'); board.classList.remove('drop-ok'); drawer.classList.remove('over');
    if (d.target) d.target.classList.remove('target');
    hidePeek();
    if (d.ghost) d.ghost.remove();
    if (d.src.type === 'piece') d.src.el.classList.remove('dragging');
    if (!d.active) { if (!cancelled && ev) handleTap(d.src); return; }
    drag = d; const [x, y] = dragPoint(); drag = null;
    const overBoard = inRect(d.cx, d.cy, boardRect());
    if (d.src.type === 'inv') {
      if (cancelled || !overBoard) return;
      const p = makePiece(d.src.id, x, y, !d.target);
      if (d.target) combine({ type: 'piece', id: d.src.id, el: p }, { type: 'piece', id: d.target.dataset.id, el: d.target }, true);
      else SND.play('drop');
    } else {
      if (!overBoard) { removePiece(d.src.el); save(); return; }
      if (d.target) combine(d.src, { type: 'piece', id: d.target.dataset.id, el: d.target }, true);
      else SND.play('drop');
    }
    save();
  }

  // ---------- combining ----------
  function combine(a, b, dropped) {
    const r = D.combine(a.id, b.id);
    if (!r) { fail(a, b, dropped); return; }
    // make sure both friends are on the board for the merge animation
    let pa = a.type === 'piece' ? a.el : null, pb = b.type === 'piece' ? b.el : null;
    const w = board.clientWidth, h = board.clientHeight;
    if (!pa && !pb) { pa = makePiece(a.id, w / 2 - 60, h / 2, false); pb = makePiece(b.id, w / 2 + 60, h / 2, false); }
    else if (!pa) pa = makePiece(a.id, pb._x + (pb._x > w / 2 ? -80 : 80), pb._y, false);
    else if (!pb) pb = makePiece(b.id, pa._x + (pa._x > w / 2 ? -80 : 80), pa._y, false);
    mergePieces(pa, pb, r);
  }
  function mergePieces(pa, pb, r) {
    if (sel && (sel.el === pa || sel.el === pb)) clearSel();
    const mx = (pa._x + pb._x) / 2, my = (pa._y + pb._y) / 2;
    [pa, pb].forEach(p => { p.dataset.busy = 1; p.classList.remove('pop', 'wiggle', 'is-confused'); p.classList.add('is-hug', 'merging'); p.style.pointerEvents = 'none'; });
    requestAnimationFrame(() => { setPos(pa, mx - 18, my); setPos(pb, mx + 18, my); });
    SND.play('merge');
    setTimeout(() => { pa.classList.add('swirl'); pb.classList.add('swirl'); }, 340);
    setTimeout(() => {
      pa.remove(); pb.remove();
      const [cx, cy] = toClient(mx, my); burst(cx, cy, 14);
      const isNew = !found.has(r);
      document.dispatchEvent(new CustomEvent('ef:combine', { detail: { id: r, a: pa.dataset.id, b: pb.dataset.id, isNew } }));
      const shiny = Math.random() < shinyChance;
      const times = noteMade(r);
      makePiece(r, mx, my, undefined, shiny); SND.play('pop');
      if (isNew) discover(r, pa.dataset.id, pb.dataset.id);
      else if (MADE_CHEERS.includes(times)) {
        floatText(cx, cy - 50, `${ordinal(times)} ${D.byId[r].name}! 🧪`);
        announce(`That's your ${ordinal(times)} ${D.byId[r].name}!`);
        document.dispatchEvent(new CustomEvent('ef:made', { detail: { id: r, times } }));
      }
      else floatText(cx, cy - 50, D.byId[r].name + '!');
      if (shiny) noteShiny(r, cx, cy, isNew);
      save();
    }, 720);
  }
  function fail(a, b, dropped) {
    SND.play('fail');
    const els = [a.el, b.el].filter(Boolean);
    els.forEach(el => { el.classList.remove('wiggle', 'is-confused'); void el.offsetWidth; el.classList.add('wiggle', 'is-confused'); setTimeout(() => el.classList.remove('wiggle', 'is-confused'), 1100); });
    const anchor = b.el || a.el; const r = anchor.getBoundingClientRect();
    qmark(r.left + r.width / 2, r.top + 4);
    if (dropped && a.type === 'piece' && b.type === 'piece') {
      // nudge the dropped friend aside so they don't overlap
      const dx = a.el._x - b.el._x || 1, dy = a.el._y - b.el._y, len = Math.hypot(dx, dy) || 1;
      a.el.classList.add('merging'); setPos(a.el, b.el._x + dx / len * 84, b.el._y + dy / len * 84);
      setTimeout(() => { a.el.classList.remove('merging'); save(); }, 360);
    }
    const names = [a, b].map(s => D.byId[s.id].name);
    const key = pairKey(a.id, b.id);
    if (tried.has(key)) {
      floatText(r.left + r.width / 2, r.top - 14, 'Already tried 💭');
      announce(`You already tried ${names[0]} and ${names[1]}. They're still just friends!`);
    } else {
      tried.add(key); state.tried.push(key);
      if (state.tried.length > TRIED_MAX) tried.delete(state.tried.shift());
      save();
      announce(`${names[0]} and ${names[1]} don't mix… try something else!`);
    }
  }

  // ---------- discovery ----------
  const revealQueue = [];
  function discover(id, a, b) {
    const ms = milestoneCrossed(found.size, found.size + 1);
    found.add(id); state.found.push(id); state.seen[id] = false; state.met[id] = todayKey();
    noteWallUnlocks(found.size - 1);
    const c = bumpCombo(); save();
    renderInventory(); updateCounter(true);
    announce(`New friend discovered: ${D.byId[id].name}!` + (c.n >= 2 ? ` Discovery combo ${c.n}!` : ''));
    revealQueue.push({ id, a, b, combo: c.n, best: c.best, ms });
    if (revealQueue.length === 1) setTimeout(showReveal, 380);
  }
  function showReveal() {
    const item = revealQueue[0]; if (!item) return;
    const e = D.byId[item.id];
    const m = $('#reveal');
    $('#revealArt').innerHTML = ART.render(e);
    $('#revealName').textContent = e.name + '!';
    $('#revealDesc').textContent = e.desc;
    $('#revealRecipe').textContent = `${D.byId[item.a].name} + ${D.byId[item.b].name} = ${e.name}`;
    m.classList.toggle('legendary', !!e.final);
    const rc = $('#revealCombo');
    const rm = $('#revealMilestone');
    if (item.ms) { rm.hidden = false; rm.textContent = `⭐ ${item.ms.text} ${item.ms.at} of ${TOTAL} friends!`; } else { rm.hidden = true; rm.textContent = ''; }
    if (item.combo >= 2) { rc.hidden = false; rc.textContent = `🌟 Combo ×${item.combo}!` + (item.best ? ' New best!' : ''); } else rc.hidden = true;
    openModal('reveal');
    document.dispatchEvent(new CustomEvent('ef:reveal', { detail: { id: item.id } }));
    if (e.final) { SND.play('legendary'); confetti(110); } else { SND.play('discover'); confetti(36 + Math.min(4, Math.max(0, item.combo - 1)) * 12); }
    if (item.combo >= 2) setTimeout(() => SND.combo(item.combo), 650);
    if (item.ms) { setTimeout(() => { confetti(48); announce(`Milestone star! ${item.ms.text} ${item.ms.at} of ${TOTAL} friends found.`); }, 500); document.dispatchEvent(new CustomEvent('ef:milestone', { detail: { at: item.ms.at, step: item.ms.step } })); }
  }
  function closeReveal() {
    const item = revealQueue.shift();
    closeModal('reveal');
    if (item) markSeen(item.id);
    if (!revealQueue.length && combo.n) { combo.until = Date.now() + comboWindow; tickCombo(); }
    if (revealQueue.length) setTimeout(showReveal, 250);
    else if (found.size === TOTAL && !state.complete) { state.complete = true; save(); setTimeout(() => { confetti(160); SND.play('legendary'); toast('🎉 You found ALL ' + TOTAL + ' friends! You\'re an Element Master! 🎉', 6000); }, 300); }
    else if (wallNews.length) showWallNews();
  }
  $('#revealOk').addEventListener('click', closeReveal);

  // ---------- effects ----------
  const PASTEL = ['#ff9cc4', '#ffd36e', '#a8e6a3', '#9fd0ff', '#c9a6ff', '#ffb38a'];
  function burst(cx, cy, n) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'spark';
      const a = (i / n) * Math.PI * 2 + Math.random() * .4, dist = 50 + Math.random() * 50;
      s.style.left = cx + 'px'; s.style.top = cy + 'px';
      s.style.setProperty('--dx', Math.cos(a) * dist + 'px'); s.style.setProperty('--dy', Math.sin(a) * dist + 'px');
      const c = PASTEL[i % PASTEL.length];
      s.innerHTML = i % 3 === 0 ? `<svg viewBox="0 0 20 20"><path d="M10 17C3 12 1 8 4 5c2-2 5-1 6 1 1-2 4-3 6-1 3 3 1 7-6 12z" fill="${c}"/></svg>`
        : `<svg viewBox="0 0 20 20"><path d="M10 0Q11.5 8.5 20 10Q11.5 11.5 10 20Q8.5 11.5 0 10Q8.5 8.5 10 0Z" fill="${c}"/></svg>`;
      fx.appendChild(s); setTimeout(() => s.remove(), 800);
    }
  }
  function confetti(n) {
    if (still()) n = Math.min(n, 12);
    for (let i = 0; i < n; i++) {
      const c = document.createElement('div'); c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = PASTEL[i % PASTEL.length];
      c.style.setProperty('--t', (1.8 + Math.random() * 1.8) + 's'); c.style.setProperty('--dx', (Math.random() - .5) * 200 + 'px'); c.style.setProperty('--r', (Math.random() * 900) + 'deg');
      c.style.animationDelay = Math.random() * .5 + 's';
      if (i % 4 === 0) c.style.borderRadius = '50%';
      fx.appendChild(c); setTimeout(() => c.remove(), 4200);
    }
  }
  function qmark(cx, cy) { const q = document.createElement('div'); q.className = 'qmark'; q.textContent = '?'; q.style.left = cx + 'px'; q.style.top = cy + 'px'; fx.appendChild(q); setTimeout(() => q.remove(), 950); }
  function floatText(cx, cy, t) { const q = document.createElement('div'); q.className = 'plusone'; q.textContent = t; q.style.left = cx + 'px'; q.style.top = cy + 'px'; fx.appendChild(q); setTimeout(() => q.remove(), 1150); }

  // ---------- modals ----------
  const modalStack = [];
  function openModal(id) {
    const m = document.getElementById(id); if (!m.hidden) return;
    m._ret = document.activeElement; m.hidden = false; modalStack.push(id); SND.play('open');
    const f = m.querySelector('.primary, [data-close], button'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  }
  function closeModal(id) {
    const m = document.getElementById(id); if (m.hidden) return;
    m.hidden = true; const i = modalStack.lastIndexOf(id); if (i >= 0) modalStack.splice(i, 1);
    if (m._ret && m._ret.focus && m._ret.isConnected) m._ret.focus({ preventScroll: true });
  }
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', ev => {
      if (ev.target === m || ev.target.closest('[data-close]')) { if (m.id === 'reveal') closeReveal(); else closeModal(m.id); }
    });
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && modalStack.length) { const id = modalStack[modalStack.length - 1]; if (id === 'reveal') closeReveal(); else closeModal(id); }
    else if (ev.key === 'Escape') clearSel();
  });

  // ---------- collection ----------
  // ---------- milestone stars ⭐ (a quarter, half, three quarters, everyone) ----------
  const MILESTONES = [[0.25, 'A quarter of the way there!'], [0.5, 'Halfway there!'], [0.75, 'Three quarters done!'], [1, 'Every single friend found!']];
  function milestones() { return MILESTONES.map(([f, text], i) => { const at = Math.ceil(TOTAL * f); return { step: i + 1, frac: f, at, text, reached: found.size >= at }; }); }
  function milestoneCrossed(before, after) { return milestones().filter(m => before < m.at && after >= m.at).pop() || null; }
  function renderStars() {
    const box = $('#bookStars'), wrap = $('#bookProgress'); if (!box || !wrap) return;
    const ms = milestones(), lit = ms.filter(m => m.reached).length;
    box.innerHTML = ms.map(m => `<span class="ms${m.reached ? ' lit' : ''}${m.frac === 1 ? ' end' : ''}" style="left:${m.frac * 100}%" title="${m.reached ? '⭐ ' : ''}${m.at} friends">⭐</span>`).join('');
    wrap.setAttribute('aria-valuemax', TOTAL); wrap.setAttribute('aria-valuenow', found.size);
    wrap.setAttribute('aria-valuetext', `${found.size} of ${TOTAL} friends found, ${lit} of ${ms.length} milestone stars`);
  }
  function openBook() {
    const g = $('#bookGrid'); g.innerHTML = '';
    const frag = document.createDocumentFragment();
    const reach = reachable();
    D.elements.forEach((e, i) => {
      const known = found.has(e.id), near = !known && reach.has(e.id);
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem');
      const fav = known && isFave(e.id), shn = known && state.shinies.includes(e.id);
      b.className = 'book-cell' + (known ? '' : ' locked') + (near ? ' reach' : '') + (e.final ? ' final' : '') + (fav ? ' fave' : '') + (shn ? ' shiny-seen' : '');
      b.dataset.id = e.id;
      b.setAttribute('aria-label', known ? `${e.name}${e.final ? ', legendary' : ''}${fav ? ', best friend' : ''}${shn ? ', met a shiny one' : ''}. Show details` : near ? 'Undiscovered friend, within reach: you already have both friends needed to make it' : 'Undiscovered friend');
      if (near) b.title = 'Within reach! You already have both friends you need 🌱';
      b.innerHTML = `<span class="num">${i + 1}</span>` + (fav ? '<span class="fave-dot" aria-hidden="true">💗</span>' : '') + (shn ? '<span class="shiny-dot" aria-hidden="true">✨</span>' : '') + (near ? '<span class="reach-dot" aria-hidden="true">🌱</span>' : '') + `<div class="art">${ART.render(e, { label: false })}</div><span class="lbl">${known ? e.name : '???'}</span>`;
      if (known) b.addEventListener('click', () => openDetail(e.id));
      else if (near) b.addEventListener('click', () => { SND.play('select'); const m = 'Within reach! 🌱 You already have both friends you need for this one. Keep mixing, or try a 💡 Hint.'; toast(m, 3200); announce(m); });
      else b.tabIndex = -1;
      frag.appendChild(b);
    });
    g.appendChild(frag);
    const finals = D.elements.filter(e => e.final), ff = finals.filter(e => found.has(e.id)).length;
    $('#bookBar').style.width = (found.size / TOTAL * 100) + '%';
    renderStars();
    $('#bookSub').textContent = `${found.size} of ${TOTAL} friends found · ${ff}/${finals.length} legendary ★` + (reach.size ? ` · 🌱 ${reach.size} within reach` : '');
    const counts = { all: TOTAL, found: found.size, missing: TOTAL - found.size, legendary: finals.length, faves: state.faves.length, shiny: state.shinies.length, chain: chainFriends().length };
    document.querySelectorAll('#bookFilter .filter-chip').forEach(c => { c.querySelector('.n').textContent = counts[c.dataset.filter]; });
    // the ✨ Shiny chip only shows up once you've met a shiny friend
    const shinyChip = document.querySelector('#bookFilter [data-filter="shiny"]'); if (shinyChip) shinyChip.hidden = !counts.shiny;
    if (bookFilter === 'shiny' && !counts.shiny) bookFilter = 'all';
    // the ✦ On Starknet chip only shows up while a wallet with minted friends is connected
    const chainChip = document.querySelector('#bookFilter [data-filter="chain"]'); if (chainChip) chainChip.hidden = !counts.chain;
    if (bookFilter === 'chain' && !counts.chain) bookFilter = 'all';
    applyBookFilter(bookFilter, false);
    openModal('book');
    document.dispatchEvent(new CustomEvent('ef:book'));
  }
  // 🌱 Within reach: undiscovered friends whose two ingredients you already have (the recipe itself stays a secret).
  function reachable() {
    const out = new Set();
    D.recipes.forEach(([a, b, r]) => { if (!found.has(r) && found.has(a) && found.has(b)) out.add(r); });
    return out;
  }
  // Collection filter chips (session only, nothing saved).
  let bookFilter = 'all';
  // ✦ On Starknet chip: the optional Starknet layer tells us which friends this wallet has minted (never saved here).
  let chainSet = new Set();
  function chainFriends() { return D.elements.filter(e => chainSet.has(e.id) && found.has(e.id)).map(e => e.id); }
  function setChainFriends(ids) {
    chainSet = new Set((ids || []).filter(id => typeof id === 'string' && D.byId[id]));
    const chip = document.querySelector('#bookFilter [data-filter="chain"]'); if (!chip) return;
    const n = chainFriends().length; chip.hidden = !n; chip.querySelector('.n').textContent = n;
    if ($('#book').hidden) { if (!n && bookFilter === 'chain') bookFilter = 'all'; return; }
    if (bookFilter === 'chain') applyBookFilter(n ? 'chain' : 'all', !n);
  }
  const FILTER_NAMES = { all: 'all friends', found: 'found friends', missing: 'missing friends', legendary: 'legendary friends', faves: 'best friends', shiny: 'shiny friends', chain: 'friends minted on Starknet' };
  const FILTER_EMPTY = { found: 'No friends yet. Mix two friends to meet someone new! ✨', missing: 'You found everyone! Every friend is home 💖', legendary: '', faves: 'No best friends yet. Open a friend and tap the 🤍 heart to make them a bestie!', shiny: 'No shiny friends yet. Keep mixing: now and then a friend comes out sparkly! ✨', chain: 'Nothing minted yet. Open a friend and tap ✦ Mint on Starknet to keep them forever!' };
  function applyBookFilter(mode, speak) {
    if (!FILTER_NAMES[mode]) mode = 'all';
    bookFilter = mode;
    let shown = 0;
    $('#bookGrid').querySelectorAll('.book-cell').forEach(c => {
      const locked = c.classList.contains('locked'), fin = c.classList.contains('final');
      const vis = mode === 'all' || (mode === 'found' && !locked) || (mode === 'missing' && locked) || (mode === 'legendary' && fin) || (mode === 'faves' && c.classList.contains('fave')) || (mode === 'shiny' && c.classList.contains('shiny-seen')) || (mode === 'chain' && !locked && chainSet.has(c.dataset.id));
      c.hidden = !vis; if (vis) shown++;
    });
    document.querySelectorAll('#bookFilter .filter-chip').forEach(c => { const on = c.dataset.filter === mode; c.classList.toggle('active', on); c.setAttribute('aria-checked', String(on)); c.tabIndex = on ? 0 : -1; });
    const empty = $('#bookEmpty'); empty.hidden = shown > 0; empty.textContent = shown ? '' : (FILTER_EMPTY[mode] || 'Nobody here yet!');
    $('#bookGrid').scrollTop = 0;
    if (speak) {
      announce(`Showing ${shown} ${FILTER_NAMES[mode]}`);
      const chip = document.querySelector(`#bookFilter [data-filter="${mode}"]`);
      if (chip && !still()) { chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop'); }
      SND.play('select');
    }
    return shown;
  }
  $('#bookFilter').addEventListener('click', ev => { const c = ev.target.closest('.filter-chip'); if (c) applyBookFilter(c.dataset.filter, true); });
  $('#bookFilter').addEventListener('keydown', ev => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(ev.key)) return;
    ev.preventDefault();
    const chips = [...document.querySelectorAll('#bookFilter .filter-chip')].filter(c => !c.hidden), i = chips.findIndex(c => c.dataset.filter === bookFilter);
    const j = ev.key === 'Home' ? 0 : ev.key === 'End' ? chips.length - 1 : (i + ((ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') ? -1 : 1) + chips.length) % chips.length;
    applyBookFilter(chips[j].dataset.filter, true); chips[j].focus();
  });
  $('#bookFilter').addEventListener('animationend', ev => ev.target.classList.remove('pop'));
  // ---------- flip through friends (detail view) ----------
  function flipList(id) {
    let list = D.elements.filter(e => found.has(e.id) && (bookFilter !== 'legendary' || e.final) && (bookFilter !== 'faves' || isFave(e.id)) && (bookFilter !== 'shiny' || state.shinies.includes(e.id)) && (bookFilter !== 'chain' || chainSet.has(e.id))).map(e => e.id);
    if (!list.includes(id)) list = D.elements.filter(e => found.has(e.id)).map(e => e.id);
    return list;
  }
  function flipDetail(dir) {
    const da = $('#detailArt'), id = da.dataset.id; if ($('#detail').hidden || !id) return false;
    const list = flipList(id); if (list.length < 2) return false;
    const next = list[(list.indexOf(id) + dir + list.length) % list.length];
    openDetail(next);
    const sheet = $('#detail .sheet'); sheet.classList.remove('flip-l', 'flip-r'); void sheet.offsetWidth; sheet.classList.add(dir > 0 ? 'flip-r' : 'flip-l');
    SND.play('flip'); announce(`${D.byId[next].name}, friend ${list.indexOf(next) + 1} of ${list.length}`);
    return true;
  }
  $('#detailPrev').addEventListener('click', () => { SND.unlock(); flipDetail(-1); });
  $('#detailNext').addEventListener('click', () => { SND.unlock(); flipDetail(1); });
  $('#detail .sheet').addEventListener('animationend', ev => { if (/^flipin/.test(ev.animationName)) ev.currentTarget.classList.remove('flip-l', 'flip-r'); });
  document.addEventListener('keydown', ev => {
    if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && !ev.ctrlKey && !ev.metaKey && !ev.altKey && modalStack[modalStack.length - 1] === 'detail') {
      if (flipDetail(ev.key === 'ArrowRight' ? 1 : -1)) ev.preventDefault();
    }
  });
  let swipe = null, swiped = 0;
  $('#detail .sheet').addEventListener('pointerdown', ev => { if (ev.isPrimary && !ev.target.closest('.flip-btn, .fave-btn, .sticker-btn, .jp-pill, .nick-row, #detailChain')) swipe = { x: ev.clientX, y: ev.clientY }; });
  $('#detail .sheet').addEventListener('pointerup', ev => {
    if (!swipe) return; const dx = ev.clientX - swipe.x, dy = ev.clientY - swipe.y; swipe = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && flipDetail(dx < 0 ? 1 : -1)) swiped = Date.now();
  });
  $('#detail .sheet').addEventListener('pointercancel', () => { swipe = null; });
  $('#detail .sheet').addEventListener('click', ev => { if (Date.now() - swiped < 400) { ev.stopPropagation(); ev.preventDefault(); swiped = 0; } }, true);
  // 🎲 Surprise me: open a random found friend's card (follows the Collection filter, never the same friend twice in a row)
  let lastSurprise = '';
  function surpriseFriend(rand) {
    const r = typeof rand === 'function' ? rand : Math.random;
    const all = D.elements.filter(e => found.has(e.id)).map(e => e.id);
    const filtered = all.filter(id => (bookFilter !== 'legendary' || D.byId[id].final) && (bookFilter !== 'faves' || isFave(id)) && (bookFilter !== 'shiny' || state.shinies.includes(id)) && (bookFilter !== 'chain' || chainSet.has(id)));
    const list = filtered.length ? filtered : all;
    if (!list.length) return null;
    const cur = !$('#detail').hidden ? $('#detailArt').dataset.id : '';
    const fresh = list.filter(id => id !== lastSurprise && id !== cur);
    const pool = fresh.length ? fresh : list;
    const id = pool[Math.min(pool.length - 1, Math.floor(r() * pool.length))];
    lastSurprise = id;
    const btn = $('#btnSurprise');
    if (btn && !still()) { btn.classList.remove('roll'); void btn.offsetWidth; btn.classList.add('roll'); }
    SND.play('select'); buzz(10);
    openDetail(id);
    const sheet = $('#detail .sheet');
    sheet.classList.remove('flip-l', 'flip-r');
    if (!still()) { void sheet.offsetWidth; sheet.classList.add('flip-r'); }
    const e = D.byId[id], nick = nickOf(id);
    const msg = `🎲 Surprise! It's ${nick ? `${nick} the ${e.name}` : e.name}${e.final ? ' ★' : ''}!`;
    toast(msg, 2200); announce(msg.replace('🎲 ', ''));
    document.dispatchEvent(new CustomEvent('ef:surprise', { detail: { id, filter: bookFilter } }));
    return id;
  }
  $('#btnSurprise').addEventListener('click', () => { SND.unlock(); surpriseFriend(); });
  $('#btnSurprise').addEventListener('animationend', ev => ev.currentTarget.classList.remove('roll'));
  function updateFlip(id) {
    const list = flipList(id), many = list.length > 1;
    ['#detailPrev', '#detailNext'].forEach(s => { $(s).hidden = !many; });
    $('#detailCount').textContent = many ? `${list.indexOf(id) + 1} / ${list.length}` : '';
  }

  function openDetail(id) {
    const e = D.byId[id];
    const da = $('#detailArt'); da.innerHTML = ART.render(e); da.dataset.id = id;
    da.setAttribute('aria-label', `Pet ${e.name}`); da.classList.remove('petted');
    $('#detailName').textContent = e.name + (e.final ? ' ★' : '');
    $('#detailDesc').textContent = e.desc;
    closeNickForm(false); applyNick(id);
    { const fs = friendSince(id), el = $('#detailSince'); el.innerHTML = `<span aria-hidden="true">${fs.icon}</span> ${fs.text}`; el.setAttribute('aria-label', fs.text); }
    applyMade(id);
    { const sp = $('#detailShiny'), on = state.shinies.includes(id); sp.hidden = !on; sp.textContent = on ? `✨ You've met a shiny ${e.name}!` : ''; }
    const box = $('#detailRecipes'); box.innerHTML = '';
    if (e.base) box.innerHTML = '<div class="recipe-row">One of the four original friends!</div>';
    // Friend hops 🐾: known ingredients and "helped make" friends are tappable and open that friend's card
    const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const mini = x => found.has(x) ? `<button type="button" class="mini hop" data-hop="${x}" title="${esc(D.byId[x].name)}" aria-label="Open ${esc(D.byId[x].name)}">${ART.render(D.byId[x])}</button>` : '<div class="q" aria-hidden="true">?</div>';
    D.recipes.filter(r => r[2] === id).slice(0, 5).forEach(([a, b]) => {
      const row = document.createElement('div'); row.className = 'recipe-row';
      const known = found.has(a) && found.has(b);
      row.innerHTML = `${mini(a)}<span aria-hidden="true">+</span>${mini(b)}<span>${known ? esc(D.byId[a].name + ' + ' + D.byId[b].name) : '<span aria-hidden="true">???</span><span class="sr-only">A secret recipe</span>'}</span>` +
        (known ? `<button type="button" class="pair-btn" data-pair="${a},${b}" title="Bring both to the playfield" aria-label="Bring ${esc(D.byId[a].name)} and ${esc(D.byId[b].name)} to the playfield to mix ${esc(e.name)}"><span aria-hidden="true">🧺</span></button>` : '');
      box.appendChild(row);
    });
    const outs = D.recipes.filter(r => r[0] === id || r[1] === id).map(r => r[2]);
    const uniq = [...new Set(outs.filter(x => found.has(x) && x !== id))];
    if (uniq.length) {
      const wrap = document.createElement('div'); wrap.className = 'hop-wrap';
      wrap.innerHTML = `<p class="muted hop-title" id="hopTitle">Helped make <span aria-hidden="true">🐾</span></p><div class="hop-list" role="list" aria-labelledby="hopTitle">${uniq.map(x => `<span role="listitem"><button type="button" class="hop-chip" data-hop="${x}" aria-label="Open ${esc(D.byId[x].name)}"><span class="hop-art" aria-hidden="true">${ART.render(D.byId[x])}</span><span class="hop-name">${esc(D.byId[x].name)}</span></button></span>`).join('')}</div>`;
      box.appendChild(wrap);
    }
    const hiding = new Set(outs.filter(x => !found.has(x))).size;
    if (hiding) { const p = document.createElement('p'); p.className = 'muted hop-hiding'; p.textContent = `✨ ${hiding} more ${hiding === 1 ? 'friend is' : 'friends are'} still hiding with ${e.name}!`; box.appendChild(p); }
    $('#petTip').textContent = 'Tap to pet 💕';
    $('#detailSticker').setAttribute('aria-label', `Save a sticker picture of ${e.name}`);
    $('#detailPlay').setAttribute('aria-label', `Bring ${e.name} to the playfield`);
    applyFaveBtn(id);
    updateFlip(id);
    openModal('detail');
    document.dispatchEvent(new CustomEvent('ef:detail', { detail: { id } }));
  }

  function hopTo(id, fromEl) {
    if (!id || !found.has(id) || $('#detail').hidden || $('#detailArt').dataset.id === id) return false;
    openDetail(id);
    const sheet = $('#detail .sheet');
    sheet.classList.remove('flip-l', 'flip-r');
    if (!still()) { void sheet.offsetWidth; sheet.classList.add('flip-r'); }
    SND.play('flip'); buzz(8);
    announce(`Hopped to ${D.byId[id].name}`);
    $('#detailArt').focus({ preventScroll: true });
    sheet.scrollTop = 0;
    document.dispatchEvent(new CustomEvent('ef:hop', { detail: { id, from: fromEl || null } }));
    return true;
  }
  $('#detailRecipes').addEventListener('click', ev => {
    const pb = ev.target.closest('[data-pair]');
    if (pb) { SND.unlock(); const [a, b] = pb.dataset.pair.split(','); bringPair(a, b, $('#detailArt').dataset.id); return; }
    const b = ev.target.closest('[data-hop]'); if (!b) return;
    SND.unlock(); hopTo(b.dataset.hop, $('#detailArt').dataset.id);
  });

  // ---------- best friends 💗 ----------
  function applyFaveBtn(id) {
    const b = $('#detailFave'), on = isFave(id), name = D.byId[id].name;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? `${name} is a best friend. Tap to unfavorite` : `Make ${name} a best friend`);
    b.title = on ? 'Best friend! 💗' : 'Make best friend';
    b.querySelector('.h').textContent = on ? '💗' : '🤍';
  }
  function toggleFave(id) {
    id = id || $('#detailArt').dataset.id;
    if (!id || !found.has(id)) return false;
    const on = !isFave(id), name = D.byId[id].name;
    state.faves = on ? state.faves.concat(id) : state.faves.filter(x => x !== id);
    save();
    if (!$('#detail').hidden && $('#detailArt').dataset.id === id) {
      applyFaveBtn(id);
      const b = $('#detailFave');
      if (on && !still()) {
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
        const r = b.getBoundingClientRect(), wrap = $('#detail .sheet').getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
          const h = document.createElement('span'); h.className = 'fave-burst'; h.textContent = ['💗', '💖', '✨', '💕', '🌸'][i]; h.setAttribute('aria-hidden', 'true');
          h.style.left = (r.left - wrap.left + r.width / 2) + 'px'; h.style.top = (r.top - wrap.top + r.height / 2) + 'px';
          h.style.setProperty('--dx', (Math.cos(i / 5 * Math.PI * 2 - Math.PI / 2) * 34) + 'px'); h.style.setProperty('--dy', (Math.sin(i / 5 * Math.PI * 2 - Math.PI / 2) * 34) + 'px');
          $('#detail .sheet').appendChild(h); setTimeout(() => h.remove(), 800);
        }
      }
    }
    SND.play(on ? 'fave' : 'unfave');
    if (on) buzz(10);
    announce(on ? `${name} is now a best friend` : `${name} is no longer a best friend`);
    if (on) toast(`${name} is a best friend! 💗`, 1600);
    renderInventory();
    // keep the open Collection in sync
    const cell = document.querySelector(`#bookGrid .book-cell[data-id="${id}"]`);
    if (cell) {
      cell.classList.toggle('fave', on);
      const dot = cell.querySelector('.fave-dot');
      if (on && !dot) cell.insertAdjacentHTML('afterbegin', '<span class="fave-dot" aria-hidden="true">💗</span>'); else if (!on && dot) dot.remove();
      cell.setAttribute('aria-label', `${name}${D.byId[id].final ? ', legendary' : ''}${on ? ', best friend' : ''}. Show details`);
      const n = document.querySelector('#bookFilter [data-filter="faves"] .n'); if (n) n.textContent = state.faves.length;
      if (bookFilter === 'faves') applyBookFilter('faves', false);
    }
    updateFlip(id);
    document.dispatchEvent(new CustomEvent('ef:fave', { detail: { id, on, count: state.faves.length } }));
    return on;
  }
  $('#detailFave').addEventListener('click', () => { SND.unlock(); toggleFave(); });
  function applyNick(id) {
    const n = nickOf(id), name = D.byId[id].name, b = $('#detailNick');
    $('#detailNickTxt').textContent = n ? `“${n}”` : 'Give a nickname';
    b.classList.toggle('has', !!n);
    b.setAttribute('aria-label', n ? `${name}'s nickname is ${n}. Tap to change it` : `Give ${name} a nickname`);
    b.title = n ? 'Change nickname' : 'Give a nickname';
  }
  function openNickForm() {
    const id = $('#detailArt').dataset.id; if (!id || !found.has(id)) return;
    const f = $('#nickForm'), i = $('#nickInput');
    $('#nickLbl').textContent = `Nickname for ${D.byId[id].name}`;
    i.value = nickOf(id); f.hidden = false; $('#detailNick').hidden = true;
    i.focus(); i.select();
  }
  function closeNickForm(refocus) {
    const f = $('#nickForm'); if (f.hidden) return;
    f.hidden = true; $('#detailNick').hidden = false;
    if (refocus) $('#detailNick').focus({ preventScroll: true });
  }
  // set (or clear with '') a friend's nickname; returns the saved nickname
  function setNick(id, v) {
    id = id || $('#detailArt').dataset.id;
    if (!id || !D.byId[id] || !found.has(id)) return null;
    const n = cleanNick(v), name = D.byId[id].name, before = nickOf(id);
    if (n && n.toLowerCase() !== name.toLowerCase()) state.nicks[id] = n; else delete state.nicks[id];
    const now = nickOf(id);
    save(); renderInventory();
    if (!$('#detail').hidden && $('#detailArt').dataset.id === id) {
      applyNick(id);
      const b = $('#detailNick');
      if (now && !still()) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    }
    if (now !== before) {
      SND.play(now ? 'fave' : 'select');
      if (now) { buzz(8); toast(`${name} loves being called “${now}”! 🏷️`, 1800); announce(`${name} is now nicknamed ${now}`); }
      else { toast(`${name} goes by ${name} again ✨`, 1600); announce(`${name}'s nickname removed`); }
    }
    document.dispatchEvent(new CustomEvent('ef:nick', { detail: { id, nick: now } }));
    return now;
  }
  $('#detailNick').addEventListener('click', () => { SND.unlock(); SND.play('select'); openNickForm(); });
  $('#detailNick').addEventListener('animationend', ev => ev.currentTarget.classList.remove('pop'));
  $('#nickForm').addEventListener('submit', ev => { ev.preventDefault(); const id = $('#detailArt').dataset.id; closeNickForm(true); setNick(id, $('#nickInput').value); });
  $('#nickCancel').addEventListener('click', () => closeNickForm(true));
  $('#nickInput').addEventListener('keydown', ev => {
    ev.stopPropagation(); // typing must not flip pages, tidy or close the card
    if (ev.key === 'Escape') { ev.preventDefault(); closeNickForm(true); }
  });
  $('#detailFave').addEventListener('animationend', ev => ev.currentTarget.classList.remove('pop'));

  // ---------- save sticker 📸 ----------
  let stickerBusy = false;
  async function saveSticker(id, opts) {
    opts = opts || {};
    id = id || $('#detailArt').dataset.id;
    const e = D.byId[id];
    if (!e || !found.has(id) || stickerBusy || !window.EF_STICKER) return null;
    stickerBusy = true;
    const btn = $('#detailSticker'); btn.classList.add('busy'); btn.setAttribute('aria-busy', 'true');
    try {
      const night = document.documentElement.dataset.theme === 'night';
      const canvas = await window.EF_STICKER.make(e, { art: ART.render(e, { label: false }), night, since: friendSince(id).text, fave: isFave(id), nick: nickOf(id) });
      const blob = await window.EF_STICKER.toBlob(canvas);
      const name = window.EF_STICKER.fileName(e);
      let how = 'download';
      if (!opts.noSave) {
        let file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch (err) { /* old browser */ }
        const coarse = matchMedia('(pointer: coarse)').matches;
        if (coarse && file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
          how = 'share';
          try { await navigator.share({ files: [file], title: `${e.name} · Element Friends` }); } catch (err) { if (err && err.name === 'AbortError') { return { name, bytes: blob.size, how: 'cancelled' }; } how = 'download'; }
        }
        if (how === 'download') {
          const url = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = url; a.download = name; a.hidden = true; document.body.appendChild(a); a.click();
          setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
        }
      }
      if (!still()) { const da = $('#detailArt'); da.classList.remove('snapped'); void da.offsetWidth; da.classList.add('snapped'); }
      SND.play('snap');
      toast(how === 'share' ? `${e.name}'s sticker is ready to share! 📸` : `Saved ${e.name}'s sticker! 📸`, 1800);
      announce(`Saved a sticker of ${e.name}`);
      const info = { id, name, bytes: blob.size, how, w: canvas.width, h: canvas.height, url: opts.dataUrl ? canvas.toDataURL('image/png') : undefined };
      document.dispatchEvent(new CustomEvent('ef:sticker', { detail: info }));
      return info;
    } catch (err) {
      toast('Oops, the sticker camera got shy. Try again! 🙈', 2000);
      return null;
    } finally {
      stickerBusy = false; btn.classList.remove('busy'); btn.removeAttribute('aria-busy');
    }
  }
  $('#detailSticker').addEventListener('click', () => { SND.unlock(); saveSticker(); });

  // ---------- bring to playfield 🧺 ----------
  // From a friend's card, drop that friend straight onto the playfield (closes the card and the Collection).
  function bringToBoard(id) {
    if (!id || !found.has(id) || !D.byId[id]) return null;
    ['detail', 'book'].forEach(m => { if (!$('#' + m).hidden) closeModal(m); });
    clearSel(); markSeen(id);
    const [x, y] = freeSpot(board.clientWidth / 2, board.clientHeight * .45);
    const p = makePiece(id, x, y);
    if (!still()) { p.classList.remove('pop'); p.classList.add('arrived'); setTimeout(() => p.classList.remove('arrived'), 1600); }
    SND.play('drop'); buzz(10); save();
    const name = D.byId[id].name, msg = `${name} hopped onto the playfield! 🧺 Mix them with a friend.`;
    toast(msg, 2600); announce(msg);
    setTimeout(() => { if (p.isConnected) p.focus({ preventScroll: true }); }, 60);
    document.dispatchEvent(new CustomEvent('ef:bring', { detail: { id } }));
    return p;
  }
  $('#detailPlay').addEventListener('click', () => { SND.unlock(); bringToBoard($('#detailArt').dataset.id); });
  // Bring both 🧺🧺: from a known recipe on a friend's card, drop both ingredients side by side, ready to mix.
  function bringPair(a, b, makes) {
    if (!a || !b || !found.has(a) || !found.has(b) || !D.byId[a] || !D.byId[b]) return null;
    const out = D.combine(a, b); makes = out && found.has(out) ? out : null; // never spoil a friend you haven't met
    ['detail', 'book'].forEach(m => { if (!$('#' + m).hidden) closeModal(m); });
    clearSel(); markSeen(a); markSeen(b);
    const w = board.clientWidth, ps = parseFloat(getComputedStyle(board).getPropertyValue('--piece')) || 96, gap = Math.min(ps / 2 + 10, w / 4);
    let [x, y] = freeSpot(w / 2, board.clientHeight * .45);
    x = Math.max(gap + 40, Math.min(w - gap - 40, x));
    const pa = makePiece(a, x - gap, y), pbb = makePiece(b, x + gap, y);
    [pa, pbb].forEach(p => { if (!still()) { p.classList.remove('pop'); p.classList.add('arrived'); setTimeout(() => p.classList.remove('arrived'), 1600); } });
    SND.play('drop'); buzz(10); save();
    const na = D.byId[a].name, nb = D.byId[b].name;
    const pair = a === b ? `Two ${na} friends are` : `${na} and ${nb} are`;
    const msg = `${pair} on the playfield! 🧺 Drop one on the other${makes ? ' to make ' + D.byId[makes].name : ''} ✨`;
    toast(msg, 2800); announce(msg);
    setTimeout(() => { if (pa.isConnected) pa.focus({ preventScroll: true }); }, 60);
    document.dispatchEvent(new CustomEvent('ef:bringpair', { detail: { a, b, makes } }));
    return [pa, pbb];
  }

  // ---------- group photo 📸: a class photo of the friends on the playfield ----------
  const PHOTO_MAX = 12;
  let photoBusy = false;
  function localDay(d) { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function photoRows(ps) {
    // keep where friends stand: higher on the board = back row, left to right within a row
    const n = ps.length, R = n <= 4 ? 1 : n <= 8 ? 2 : 3, base = Math.floor(n / R), extra = n % R; // extra friends go to the front rows
    const byY = ps.slice().sort((a, b) => a._y - b._y), rows = [];
    let k = 0; for (let r = 0; r < R; r++) { const take = base + (r >= R - extra ? 1 : 0); rows.push(byY.slice(k, k + take).sort((a, b) => a._x - b._x)); k += take; }
    return rows.filter(r => r.length);
  }
  async function groupPhoto(opts) {
    opts = opts || {};
    const all = pieces().filter(p => !p.dataset.busy && D.byId[p.dataset.id]);
    if (all.length < PHOTO_MIN || photoBusy || !window.EF_STICKER || !window.EF_STICKER.makeGroup) { if (all.length < PHOTO_MIN && !opts.quiet) toast('Bring at least two friends to the playfield for a photo 📸'); return null; }
    photoBusy = true;
    const btn = $('#btnPhoto'); btn.classList.add('busy'); btn.setAttribute('aria-busy', 'true');
    try {
      const ps = all.slice(-PHOTO_MAX); // the newest friends get the spots when it's crowded
      const rows = photoRows(ps).map(r => r.map(p => { const e = D.byId[p.dataset.id]; return { e, art: ART.render(e, { label: false }), label: nickOf(e.id) || e.name }; }));
      const night = document.documentElement.dataset.theme === 'night', day = localDay();
      const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      if (!still() && !opts.noFlash) { const f = document.createElement('div'); f.className = 'photo-flash'; f.setAttribute('aria-hidden', 'true'); board.appendChild(f); f.addEventListener('animationend', () => f.remove()); setTimeout(() => f.remove(), 900); }
      ps.forEach(p => { if (!still()) { p.classList.remove('tidy-hop'); void p.offsetWidth; p.classList.add('tidy-hop'); setTimeout(() => p.classList.remove('tidy-hop'), 450); } });
      const canvas = await window.EF_STICKER.makeGroup(rows, { night, date, total: all.length });
      const blob = await window.EF_STICKER.toBlob(canvas);
      const name = window.EF_STICKER.groupFileName(day);
      let how = 'download';
      if (!opts.noSave) {
        let file = null; try { file = new File([blob], name, { type: 'image/png' }); } catch (err) { /* old browser */ }
        const coarse = matchMedia('(pointer: coarse)').matches;
        if (coarse && file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
          how = 'share';
          try { await navigator.share({ files: [file], title: 'Element Friends group photo' }); } catch (err) { if (err && err.name === 'AbortError') return { name, bytes: blob.size, how: 'cancelled' }; how = 'download'; }
        }
        if (how === 'download') {
          const url = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = url; a.download = name; a.hidden = true; document.body.appendChild(a); a.click();
          setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
        }
      }
      SND.play('snap'); buzz(12);
      const n = ps.length;
      toast(how === 'share' ? `Your group photo of ${n} friends is ready to share! 📸` : `Snap! Saved a group photo of ${n} friends 📸`, 2000);
      announce(`Saved a group photo of ${n} friends: ${ps.map(p => nickOf(p.dataset.id) || D.byId[p.dataset.id].name).join(', ')}`);
      const info = { ids: ps.map(p => p.dataset.id), rows: rows.map(r => r.map(f => f.e.id)), name, bytes: blob.size, how, w: canvas.width, h: canvas.height, total: all.length, url: opts.dataUrl ? canvas.toDataURL('image/png') : undefined };
      document.dispatchEvent(new CustomEvent('ef:photo', { detail: info }));
      return info;
    } catch (err) {
      toast('Oops, everyone blinked! Try the photo again 🙈', 2000);
      return null;
    } finally {
      photoBusy = false; btn.classList.remove('busy'); btn.removeAttribute('aria-busy');
    }
  }
  $('#btnPhoto').addEventListener('click', () => { SND.unlock(); groupPhoto(); });
  $('#detailArt').addEventListener('animationend', ev => { if (ev.animationName === 'snapflash') ev.currentTarget.classList.remove('snapped'); });

  // ---------- pet a friend ----------
  const PET_WORDS = ['💕', '💖', '✨', '🌸', '💗'];
  const PET_SAYS = ['Hehe!', 'Yay!', 'Again!', 'So cozy~', 'Love you!', 'Teehee!', 'Mmm~'];
  function pet() {
    const da = $('#detailArt'), id = da.dataset.id, e = D.byId[id];
    if (!e) return;
    SND.unlock(); SND.voice(e);
    buzz(8);
    da.classList.remove('petted'); void da.offsetWidth; da.classList.add('petted');
    const sheet = da.parentElement, sr = sheet.getBoundingClientRect(), ar = da.getBoundingClientRect();
    const n = still() ? 1 : 4;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span'); h.className = 'pet-heart'; h.setAttribute('aria-hidden', 'true');
      h.textContent = PET_WORDS[(state.pets + i) % PET_WORDS.length];
      h.style.left = (ar.left - sr.left + ar.width * (0.2 + Math.random() * 0.6)) + 'px';
      h.style.top = (ar.top - sr.top + ar.height * 0.3) + 'px';
      h.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
      h.style.animationDelay = (i * 0.08) + 's';
      sheet.appendChild(h); setTimeout(() => h.remove(), 1500);
    }
    state.pets = (state.pets | 0) + 1;
    const say = PET_SAYS[state.pets % PET_SAYS.length];
    const tip = $('#petTip'); tip.textContent = `${e.name}: "${say}" 💕`;
    announce(`${e.name} wiggles happily. ${say}`);
    save();
    document.dispatchEvent(new CustomEvent('ef:pet', { detail: { id, pets: state.pets } }));
  }
  $('#detailArt').addEventListener('click', pet);
  $('#detailArt').addEventListener('animationend', ev => { if (ev.animationName === 'petsquish') ev.currentTarget.classList.remove('petted'); });

  // ---------- discovery combo ----------
  // brand-new friends found back to back (within comboWindow after the last reveal closes) build a combo
  let comboWindow = 30000;
  const combo = { n: 0, until: 0 };
  function bumpCombo() {
    const open = !$('#reveal').hidden || revealQueue.length > 0;
    combo.n = (combo.n && (open || Date.now() <= combo.until)) ? combo.n + 1 : 1;
    combo.until = Date.now() + comboWindow;
    const best = combo.n >= 2 && combo.n > state.bestCombo;
    if (best) state.bestCombo = combo.n;
    tickCombo(true);
    if (combo.n >= 2) document.dispatchEvent(new CustomEvent('ef:combo', { detail: { n: combo.n, best: state.bestCombo } }));
    return { n: combo.n, best };
  }
  function comboLeft() { return combo.n ? Math.max(0, combo.until - Date.now()) : 0; }
  function tickCombo(bump) {
    const el = $('#combo'); if (!el) return;
    const open = !$('#reveal').hidden || revealQueue.length > 0;
    let left = comboLeft();
    if (combo.n && !left && !open) { combo.n = 0; }
    if (combo.n < 2) { if (!el.hidden) { el.hidden = true; el.classList.remove('pop'); } return; }
    if (open) left = comboWindow;
    if (el.hidden || bump) {
      el.hidden = false;
      el.querySelector('.combo-n').textContent = '×' + combo.n;
      el.setAttribute('aria-label', `Discovery combo ${combo.n}. Find another new friend soon to keep it going! Best combo ${state.bestCombo}.`);
      el.classList.toggle('hot', combo.n >= 5);
      if (!still()) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    }
    el.style.setProperty('--p', (left / comboWindow * 100).toFixed(1) + '%');
    el.classList.toggle('ending', left < 6000);
  }

  // ---------- hint ----------
  function hint() {
    SND.unlock();
    const left = state.hintAt - Date.now();
    if (left > 0) { toast(`Hint is recharging… ${Math.ceil(left / 1000)}s ⏳`); return; }
    const cands = D.recipes.filter(([a, b, r]) => found.has(a) && found.has(b) && !found.has(r));
    if (!cands.length) { toast('You found every friend! 🎉'); return; }
    const [a, b] = cands[Math.floor(Math.random() * cands.length)];
    const hc = $('#hintcard');
    hc.innerHTML = `<span>Try:</span><div class="mini">${ART.render(D.byId[a])}</div><span class="plus">+</span><div class="mini">${ART.render(D.byId[b])}</div><span class="plus">=</span><div class="q">?</div>`;
    hc.setAttribute('aria-label', `Hint: try mixing ${D.byId[a].name} and ${D.byId[b].name}`);
    hc.hidden = false; clearTimeout(hc._t); hc._t = setTimeout(() => { hc.hidden = true; }, 7000);
    hc.onclick = () => { hc.hidden = true; };
    announce(`Hint: try mixing ${D.byId[a].name} and ${D.byId[b].name}`);
    document.querySelectorAll('.inv-item.hinted').forEach(x => x.classList.remove('hinted'));
    [a, b].forEach(id => { const el = inv.querySelector(`[data-id="${id}"]`); if (el) { el.classList.add('hinted'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); setTimeout(() => el.classList.remove('hinted'), 8000); } });
    state.hintAt = Date.now() + HINT_COOLDOWN; save(); SND.play('hint'); tickHint();
  }
  function tickHint() {
    const btn = $('#btnHint'), left = Math.max(0, state.hintAt - Date.now());
    btn.style.setProperty('--p', (left / HINT_COOLDOWN * 100) + '%');
    btn.classList.toggle('ready', left === 0);
    btn.setAttribute('aria-label', left ? `Hint recharging, ${Math.ceil(left / 1000)} seconds` : 'Hint: show a possible combination');
  }
  setInterval(() => { tickHint(); tickCombo(); }, 250);


  // ---------- theme (cozy night mode) ----------
  const THEMES = ['day', 'auto', 'night'];
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  function resolveTheme(pref) {
    if (pref === 'day' || pref === 'night') return pref;
    const h = new Date().getHours();
    return (h >= 19 || h < 7) ? 'night' : 'day';
  }
  function applyTheme() {
    const pref = (state && THEMES.includes(state.theme)) ? state.theme : 'auto';
    const effective = resolveTheme(pref);
    document.documentElement.dataset.theme = effective;
    if (metaTheme) metaTheme.setAttribute('content', effective === 'night' ? '#2a1f4a' : '#ffd6e8');
    SND.setMusicNight(effective === 'night');
    document.querySelectorAll('[data-theme-pick]').forEach(b => {
      const on = b.dataset.themePick === pref;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('active', on);
    });
  }
  function setTheme(pref) {
    if (!THEMES.includes(pref)) pref = 'auto';
    state.theme = pref;
    save();
    applyTheme();
    SND.play('select');
  }
  let themeTimer;
  function startThemeWatch() {
    clearInterval(themeTimer);
    themeTimer = setInterval(() => { if (state && state.theme === 'auto') applyTheme(); }, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && state && state.theme === 'auto') applyTheme(); });
  }

  // ---------- friend size (small / comfy / big) ----------
  const SIZE_NAMES = { small: 'Small', comfy: 'Comfy', big: 'Big' };
  function applySize() {
    const sz = SIZES.includes(state.size) ? state.size : 'comfy';
    document.documentElement.dataset.size = sz;
    document.querySelectorAll('[data-size-pick]').forEach(b => {
      const on = b.dataset.sizePick === sz;
      b.setAttribute('aria-checked', String(on)); b.classList.toggle('active', on);
    });
  }
  function setSize(sz) {
    if (!SIZES.includes(sz)) return false;
    const changed = sz !== state.size;
    state.size = sz; applySize(); SND.play('select');
    if (changed) {
      // keep everyone inside the playfield at the new size, with a little bouncy hello
      const half = (parseFloat(getComputedStyle(board).getPropertyValue('--piece')) || 96) / 2, w = board.clientWidth, h = board.clientHeight;
      pieces().filter(p => !p.dataset.busy).forEach(p => {
        setPos(p, Math.min(Math.max(p._x, half), Math.max(half, w - half)), Math.min(Math.max(p._y, half), Math.max(half, h - half - 16)));
        p.classList.remove('size-pop'); void p.offsetWidth; p.classList.add('size-pop');
      });
      announce(`Friend size: ${SIZE_NAMES[sz]}`);
      document.dispatchEvent(new CustomEvent('ef:size', { detail: { size: sz } }));
    }
    save();
    return true;
  }
  board.addEventListener('animationend', ev => { if (ev.animationName === 'sizepop') ev.target.closest('.piece') && ev.target.closest('.piece').classList.remove('size-pop'); });
  document.querySelectorAll('[data-size-pick]').forEach(b => b.addEventListener('click', () => { SND.unlock(); setSize(b.dataset.sizePick); }));

  // ---------- playfield wallpapers ----------
  const wallNews = [];
  function buildWalls() {
    const row = $('#wallRow'); if (!row) return;
    row.innerHTML = WALLS.map(w => `<button type="button" class="btn wall-btn" role="radio" data-wall-pick="${w.id}"${w.season ? ' data-season="1"' : ''} aria-checked="false"><span class="wall-swatch" data-wall="${w.id}" aria-hidden="true"><span class="wall-lock">🔒</span></span><span class="wall-name"><span aria-hidden="true">${w.icon}</span> ${w.name}</span><span class="wall-need" aria-hidden="true"></span></button>`).join('');
    row.querySelectorAll('[data-wall-pick]').forEach(b => b.addEventListener('click', () => { SND.unlock(); setWall(b.dataset.wallPick); }));
  }
  function applyWall() {
    if (!wallById[state.wall] || !wallOpen(wallById[state.wall])) state.wall = 'dots';
    board.dataset.wall = state.wall;
    document.querySelectorAll('[data-wall-pick]').forEach(b => {
      const w = wallById[b.dataset.wallPick], open = wallOpen(w), on = w.id === state.wall;
      b.setAttribute('aria-checked', String(on)); b.classList.toggle('active', on);
      b.classList.toggle('locked', !open); b.setAttribute('aria-disabled', String(!open));
      if (w.season) {
        b.hidden = !open; // out of season: tucked away until next year
        b.querySelector('.wall-need').textContent = open ? `🍂 Until ${w.season.until}` : '';
        b.setAttribute('aria-label', `${w.name} playfield, a seasonal treat until ${w.season.untilLong}`);
        return;
      }
      b.querySelector('.wall-need').textContent = open ? '' : `${w.need} friends`;
      b.setAttribute('aria-label', open ? `${w.name} playfield` : `${w.name} playfield, locked. Find ${w.need - found.size} more friends to unlock it.`);
    });
  }
  function setWall(id) {
    const w = wallById[id]; if (!w) return false;
    if (!wallOpen(w) && w.season) { toast(`${w.icon} ${w.name} comes back every autumn!`); return false; }
    if (!wallOpen(w)) {
      const more = w.need - found.size;
      toast(`🔒 Find ${more} more friend${more > 1 ? 's' : ''} to unlock ${w.name}!`);
      announce(`${w.name} is locked. Find ${more} more friends to unlock it.`);
      SND.play('select'); return false;
    }
    state.wall = id; save(); applyWall(); SND.play('select');
    board.classList.remove('wall-pop'); void board.offsetWidth; board.classList.add('wall-pop');
    announce(`Playfield wallpaper: ${w.name}`);
    document.dispatchEvent(new CustomEvent('ef:wall', { detail: { id } }));
    return true;
  }
  board.addEventListener('animationend', ev => { if (ev.animationName === 'wallpop') board.classList.remove('wall-pop'); });
  // remember wallpapers unlocked by going from `before` friends to found.size
  function noteWallUnlocks(before) {
    WALLS.forEach(w => { if (w.need > before && w.need <= found.size) wallNews.push(w); });
    if (wallNews.length) applyWall();
  }
  function showWallNews() {
    const w = wallNews[wallNews.length - 1]; wallNews.length = 0;
    let tries = 0; // wait politely for an achievement toast to finish first
    const go = () => {
      if ($('#toast').classList.contains('show') && tries++ < 16) { setTimeout(go, 500); return; }
      toast(`🎨 New playfield unlocked: ${w.icon} ${w.name}! Pick it in Settings.`, 4200);
      announce(`New playfield wallpaper unlocked: ${w.name}. Pick it in Settings.`);
      SND.play('fave');
    };
    setTimeout(go, 900);
  }

  // seasonal wallpaper: a one-time hello each season (waits politely for other toasts)
  function seasonNews() {
    const w = WALLS.find(x => x.season && wallOpen(x)); if (!w) return;
    const key = `${new Date().getFullYear()}-${w.id}`; if (state.seasonTip === key) return;
    state.seasonTip = key; save();
    let tries = 0;
    const go = () => {
      if (($('#toast').classList.contains('show') || Date.now() - lastSaid < 4000) && tries++ < 24) { setTimeout(go, 500); return; }
      toast(`${w.icon} Spooky-cute season! A ${w.name} playfield is here until ${w.season.until}. Pick it in Settings!`, 4600);
      announce(`Seasonal playfield wallpaper: ${w.name}, until ${w.season.untilLong}. Pick it in Settings.`);
    };
    setTimeout(go, 1500);
  }

  // ---------- mix counts toggle ----------
  function applyMixCounts() {
    const b = $('#btnMixCounts'); if (!b) return;
    b.setAttribute('aria-checked', String(state.mixCounts));
    b.classList.toggle('active', state.mixCounts);
    b.querySelector('.state').textContent = state.mixCounts ? 'On' : 'Off';
  }
  function setMixCounts(on) { state.mixCounts = !!on; save(); applyMixCounts(); renderInventory(); SND.play('select'); }

  // ---------- gentle mode toggle ----------
  function applyCalm() {
    document.documentElement.classList.toggle('calm', !!state.calm);
    const b = $('#btnCalm'); if (!b) return;
    b.setAttribute('aria-checked', String(state.calm));
    b.classList.toggle('active', state.calm);
    b.querySelector('.state').textContent = state.calm ? 'On' : 'Off';
  }
  function setCalm(on) {
    state.calm = !!on; save(); applyCalm(); SND.play('select');
    if (!state.calm) buzz(10);
    toast(state.calm ? '🫧 Gentle mode on. Your friends will keep things calm and still.' : 'Gentle mode off. Wiggles are back! ✨', 2600);
    announce(state.calm ? 'Gentle mode on: fewer wiggles, no buzzing' : 'Gentle mode off');
    document.dispatchEvent(new CustomEvent('ef:calm', { detail: { calm: state.calm } }));
  }

  // ---------- cozy music toggle ----------
  function applyMusic() {
    const b = $('#btnMusic'); if (!b) return;
    b.setAttribute('aria-checked', String(state.music));
    b.classList.toggle('active', state.music);
    b.querySelector('.state').textContent = state.music ? 'On' : 'Off';
    SND.setMusicNight(document.documentElement.dataset.theme === 'night');
    SND.music(state.music);
  }
  function setMusic(on) {
    state.music = !!on; save(); SND.unlock(); applyMusic();
    if (state.music && state.muted) toast('Cozy music is on 🎵 Unmute to hear it!');
    announce(state.music ? 'Cozy music on' : 'Cozy music off');
  }
  // browsers only allow sound after a tap or key press, so saved music starts on the first one
  ['pointerup', 'keydown'].forEach(t => document.addEventListener(t, () => { if (state && state.music) SND.unlock(); }, { capture: true, passive: true }));

  // ---------- buttons ----------
  $('#btnHint').addEventListener('click', hint);
  $('#btnBook').addEventListener('click', openBook);
  // ---------- clear + undo ----------
  let undoSnap = null, undoT = 0;
  function clearBoard() {
    clearSel(); const ps = pieces().filter(p => !p.dataset.busy);
    if (!ps.length) { toast('The playfield is already tidy ✨'); return; }
    const w = board.clientWidth || 1, h = board.clientHeight || 1;
    undoSnap = ps.map(p => ({ id: p.dataset.id, x: p._x / w, y: p._y / h, s: !!p.dataset.shiny }));
    ps.forEach(removePiece); setTimeout(save, 400);
    showUndo(ps.length);
  }
  function showUndo(n) {
    const u = $('#undoBar');
    $('#undoMsg').textContent = `Swept up ${n} friend${n > 1 ? 's' : ''} 🧹`;
    $('#toast').classList.remove('show');
    u.hidden = false; requestAnimationFrame(() => u.classList.add('show'));
    clearTimeout(undoT); undoT = setTimeout(hideUndo, 6000);
    announce(`Playfield cleared. Press Undo to bring ${n} friend${n > 1 ? 's' : ''} back.`);
  }
  function hideUndo() {
    const u = $('#undoBar'); clearTimeout(undoT); undoSnap = null;
    if (u.contains(document.activeElement)) $('#btnClear').focus({ preventScroll: true });
    u.classList.remove('show'); setTimeout(() => { if (!u.classList.contains('show')) u.hidden = true; }, 280);
  }
  function undoClear() {
    if (!undoSnap) return false;
    const snap = undoSnap; hideUndo();
    const w = board.clientWidth, h = board.clientHeight;
    snap.forEach((s, i) => setTimeout(() => makePiece(s.id, s.x * w, s.y * h, undefined, s.s), Math.min(i, 12) * 35));
    SND.play('drop'); setTimeout(save, 500 + Math.min(snap.length, 12) * 35);
    announce(`${snap.length} friend${snap.length > 1 ? 's are' : ' is'} back on the playfield.`);
    return snap.length;
  }
  $('#btnClear').addEventListener('click', clearBoard);
  $('#btnTidy').addEventListener('click', () => { SND.unlock(); tidy(); });
  document.addEventListener('keydown', ev => {
    if ((ev.key === 't' || ev.key === 'T') && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !modalStack.length && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName) && pieces().filter(p => !p.dataset.busy).length >= TIDY_MIN) { ev.preventDefault(); tidy(); }
  });
  // ---------- keyboard shortcuts ----------
  const typing = () => { const a = document.activeElement || {}; return /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || !!a.isContentEditable; };
  function openKeys() {
    const art = $('#keysArt'); if (art && !art.childElementCount) art.innerHTML = ['robot', 'cat', 'owl'].filter(id => D.byId[id]).map(id => `<span class="keys-friend">${ART.render(D.byId[id], { label: false })}</span>`).join('');
    if (!$('#menu').hidden) closeModal('menu');
    openModal('keys');
    document.dispatchEvent(new CustomEvent('ef:keys'));
  }
  $('#btnKeys').addEventListener('click', openKeys);
  document.addEventListener('keydown', ev => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.repeat || typing()) return;
    const top = modalStack[modalStack.length - 1];
    if (ev.key === '?') { ev.preventDefault(); if (top === 'keys') closeModal('keys'); else if (!modalStack.length || top === 'menu' || top === 'howto') { if (top === 'howto') closeModal('howto'); openKeys(); } return; }
    if (modalStack.length) return;
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (k === '/') { ev.preventDefault(); const s = $('#search'); s.focus(); s.select(); }
    else if (k === 'h') { ev.preventDefault(); SND.unlock(); hint(); }
    else if (k === 'c') { ev.preventDefault(); openBook(); }
  });
  $('#btnUndo').addEventListener('click', () => { SND.unlock(); undoClear(); });
  document.addEventListener('keydown', ev => {
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z' && undoSnap && !modalStack.length && !/^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName)) { ev.preventDefault(); undoClear(); }
  });
  function applyMute() { SND.setMuted(state.muted); const b = $('#btnMute'); b.querySelector('i').innerHTML = icon(state.muted ? 'mute' : 'sound'); b.setAttribute('aria-pressed', String(state.muted)); b.setAttribute('aria-label', state.muted ? 'Unmute sounds' : 'Mute sounds'); }
  $('#btnMute').addEventListener('click', () => { state.muted = !state.muted; applyMute(); save(); if (!state.muted) SND.play('select'); });
  $('#btnMenu').addEventListener('click', () => openModal('menu'));
  $('#btnMixCounts').addEventListener('click', () => setMixCounts(!state.mixCounts));
  $('#btnMusic').addEventListener('click', () => setMusic(!state.music));
  $('#btnCalm').addEventListener('click', () => setCalm(!state.calm));
  $('#btnHow').addEventListener('click', () => { closeModal('menu'); openModal('howto'); });
  $('#btnReset').addEventListener('click', () => { closeModal('menu'); openModal('confirm'); });
  $('#confirmNo').addEventListener('click', () => closeModal('confirm'));
  document.querySelectorAll('[data-theme-pick]').forEach(b => {
    b.addEventListener('click', () => setTheme(b.dataset.themePick));
  });
  $('#confirmYes').addEventListener('click', () => {
    closeModal('confirm');
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    clearSel(); pieces().forEach(p => p.remove()); revealQueue.length = 0;
    load(); wallNews.length = 0; applyMute(); applyTheme(); applyMixCounts(); applyCalm(); applyMusic(); applySort(); applyWall(); applySize(); renderInventory(); updateCounter(true); placeStarters(); tickHint(); combo.n = 0; tickCombo();
    toast('Fresh start! Your four first friends say hi ✨');
  });
  $('#btnSort').addEventListener('click', () => { SND.unlock(); setSort(SORT_ORDER[(SORT_ORDER.indexOf(state.sort) + 1) % SORT_ORDER.length]); SND.play('select'); });
  $('#search').addEventListener('input', ev => { query = ev.target.value.trim().toLowerCase(); renderInventory(); });
  $('#drawerHandle').addEventListener('click', () => { const c = drawer.classList.toggle('collapsed'); $('#drawerHandle').setAttribute('aria-expanded', String(!c)); });

  // ---------- sleepy friends: after a quiet spell the friends on the playfield doze off; any touch wakes them ----------
  let dozeDelay = 45000, dozeTimer = null, dozing = false;
  function doze() {
    if (dozing || document.hidden || drag || !board.querySelector('.piece')) { armDoze(); return; }
    dozing = true; clearChatter(); board.classList.remove('waking'); board.classList.add('dozing'); SND.setMusicSoft(true);
    pieces().forEach((p, i) => p.style.setProperty('--zd', (i % 5) * 0.45 + 's'));
    announce('Your friends dozed off. Tap anywhere to wake them up.');
  }
  function wake() {
    if (dozing) {
      dozing = false; SND.setMusicSoft(false); board.classList.remove('dozing'); void board.offsetWidth; board.classList.add('waking');
      SND.play('wake'); setTimeout(() => board.classList.remove('waking'), 700);
    }
    armDoze();
  }
  function armDoze() { clearTimeout(dozeTimer); if (dozeDelay > 0) dozeTimer = setTimeout(doze, dozeDelay); }
  ['pointerdown', 'keydown', 'wheel'].forEach(t => document.addEventListener(t, wake, { capture: true, passive: true }));
  board.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') wake(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) armDoze(); });
  armDoze();

  // ---------- startup ----------
  function placeStarters() {
    const w = board.clientWidth, h = board.clientHeight;
    const cols = BASE.length, gap = Math.min(120, (w - 80) / cols);
    BASE.forEach((id, i) => makePiece(id, w / 2 + (i - (cols - 1) / 2) * gap, h * .45 + (i % 2 ? 26 : -10)));
    save();
  }
  function restoreBoard() {
    const w = board.clientWidth, h = board.clientHeight;
    (state.board || []).forEach(p => { if (D.byId[p.id]) makePiece(p.id, p.x * w, p.y * h, false, p.s === 1); });
  }
  let lastW = 0, lastH = 0;
  function onResize() {
    const w = board.clientWidth, h = board.clientHeight;
    if (lastW && lastH) pieces().forEach(p => setPos(p, p._x / lastW * w, p._y / lastH * h));
    lastW = w; lastH = h;
  }
  window.addEventListener('resize', onResize);

  load();
  $('#logo').innerHTML = ART.render(D.byId.star, { label: false });
  $('#howArt').innerHTML = `<div class="mini">${ART.render(D.byId.water)}</div>+<div class="mini">${ART.render(D.byId.fire)}</div>=<div class="mini">${ART.render(D.byId.steam)}</div>`;
  $('#confirmArt').innerHTML = `<div class="is-confused" style="width:100%;height:100%">${ART.render(D.byId.cloud)}</div>`;
  buildWalls(); applyMute(); applyTheme(); applyMixCounts(); applyCalm(); applyMusic(); applySort(); applyWall(); applySize(); startThemeWatch(); renderInventory(); updateCounter(); tickHint();
  requestAnimationFrame(() => {
    lastW = board.clientWidth; lastH = board.clientHeight;
    if (state.board === null) { placeStarters(); if (!newFriends) setTimeout(() => toast('Drop Water onto Fire and see what happens! 💧🔥', 4200), 600); }
    else restoreBoard();
    seasonNews();
    if (newFriends) { save(); setTimeout(() => { toast(`🎀 ${newFriends} new friend${newFriends > 1 ? 's' : ''} moved in! Look for a pumpkin, a little witch, a lucky black cat and a tanuki 🎃✨`, 5200); announce(`${newFriends} new friends were added to the game.`); }, 700); }
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // ---------- dance party 🪩 (tap the logo star) ----------
  const PARTY_NOTES = ['♪', '♫', '♬', '💖', '✨'];
  let partyT = 0, partying = false;
  function party() {
    SND.unlock();
    if (dozing) wake();
    const logo = $('#logo');
    logo.classList.remove('partying'); void logo.offsetWidth; logo.classList.add('partying');
    setTimeout(() => logo.classList.remove('partying'), 900);
    const ps = pieces().filter(p => !p.dataset.busy);
    if (!ps.length) {
      SND.play('tap');
      toast('🪩 Put some friends on the playfield, then tap the star for a dance party!');
      announce('No friends on the playfield yet. Add some, then tap the star for a dance party.');
      return 0;
    }
    clearTimeout(partyT); partying = true;
    const calm = still();
    ps.forEach((p, i) => {
      p.classList.remove('dancing'); void p.offsetWidth;
      p.style.setProperty('--d', ((i % 6) * 0.09).toFixed(2) + 's');
      p.classList.add('dancing');
      const n = calm ? (i < 3 ? 1 : 0) : 2;
      for (let k = 0; k < n; k++) {
        const note = document.createElement('span'); note.className = 'party-note'; note.setAttribute('aria-hidden', 'true');
        note.textContent = PARTY_NOTES[(i * 2 + k) % PARTY_NOTES.length];
        note.style.left = (p._x + (k ? 18 : -18)) + 'px'; note.style.top = (p._y - 30) + 'px';
        note.style.setProperty('--dx', ((k ? 1 : -1) * (10 + Math.random() * 20)).toFixed(0) + 'px');
        note.style.animationDelay = ((i % 6) * 0.09 + k * 0.35) + 's';
        board.appendChild(note); setTimeout(() => note.remove(), 2400);
      }
    });
    board.classList.add('party');
    SND.play('party'); buzz(12);
    const msg = ps.length === 1 ? `🪩 ${D.byId[ps[0].dataset.id].name} is dancing!` : `🪩 Dance party! ${ps.length} friends are dancing!`;
    toast(msg); announce(msg.replace('🪩 ', ''));
    partyT = setTimeout(() => { partying = false; board.classList.remove('party'); pieces().forEach(p => p.classList.remove('dancing')); }, 2400);
    document.dispatchEvent(new CustomEvent('ef:party', { detail: { count: ps.length } }));
    return ps.length;
  }
  $('#logo').addEventListener('click', party);

  // ---------- friend chatter 💬: now and then a friend on the playfield says something cute ----------
  const CHAT_SAYS = {
    water: 'Splish splash! 💧', fire: 'Toasty~ 🔥', earth: 'Grow, little sprout! 🌱', air: 'Wheee~ 🍃', steam: 'Bath time? ♨️',
    mud: 'Squish squish!', mist: 'Peekaboo~', lava: 'Hot hot hot!', energy: 'Zoom zoom! ⚡', stone: "I'm a great listener 🪨",
    cloud: 'So floaty~ ☁️', rain: 'Pitter-patter ☔', storm: 'Grr... just kidding!', lightning: 'Zap! ⚡', sun: 'Stay sunny! ☀️',
    moon: '*yawn* 🌙', star: 'Make a wish! ⭐', rainbow: 'All the colors! 🌈', snow: 'Snowball fight? ⛄', ice: 'Brrr~ ❄️',
    bubble: 'Pop! Hehe 🫧', volcano: 'Rumble rumble 🌋', flower: 'Smell me! 🌼', sakura: 'Petal shower 🌸', tree: 'Leaf me alone~ jk 🌳',
    cat: 'Nya~ 🐾', dog: 'Woof woof! 🐶', bunny: 'Hop hop! 🐰', bear: 'Hug? 🧸', panda: 'Bamboo please 🎋', fox: 'Hehe, sneaky 🦊',
    penguin: 'Waddle waddle 🐧', frog: 'Ribbit! 🐸', bee: 'Bzz bzz 🐝', owl: 'Hoo hoo 🦉', duck: 'Quack! 🦆', chick: 'Peep peep 🐣',
    hamster: 'Nom nom 🌻', koala: 'Five more minutes... 💤', otter: 'Hold my paw! 🦦', bat: 'Boo-tiful night! 🦇', sheep: 'Baa~ count me! 🐑', dolphin: 'Eee-eee! 🐬', octopus: 'Eight hugs! 🐙', whale: 'Big splash! 🐳',
    dragon: 'Rawr~ 🐉', unicorn: 'Sparkle time! 🦄', ghost: 'Boo! ...hehe 👻', ninja: '...(hiding)', wizard: 'Abracadabra ✨',
    princess: 'Tea party? 👑', astronaut: 'To the moon! 🚀', robot: 'Beep boop! 🤖', rocket: '3, 2, 1... 🚀', alien: 'Take me to your snacks 👽',
    cake: 'Party time? 🎂', icecream: "Don't let me melt! 🍦", boba: 'Slurp~ 🧋', mochi: 'Squishy~ 🍡', onigiri: 'Itadakimasu! 🍙', pumpkin: 'Happy harvest! 🎃', witch: 'Hocus pocus, sweets for focus! 🧹', blackcat: 'Lucky meow~ 🐈‍⬛', tanuki: 'Pon-poko-pon! 🍃', honey: 'Sweet as can be 🍯',
    cocoa: 'Marshmallows? ☕', love: 'Love you! 💗', happiness: 'Smile! 😊', baby: 'Goo goo! 🍼', magic: 'Ta-da! ✨',
  };
  const CHAT_ANY = ['Hi hi! 👋', "Let's mix! ✨", 'Teehee~', 'La la la ♪', 'So cozy~', 'Yay, friends! 💕', 'Hmm... 💭', 'Pick me! 🙋'];
  let chatDelay = 15000, chatFirst = 8000, chatTimer = null, chatLast = '', chatN = 0;
  const chatName = id => nickOf(id) || D.byId[id].name;
  function chatterLine(p) {
    const id = p.dataset.id, others = pieces().filter(o => o !== p && !o.dataset.busy && o.dataset.id !== id);
    const roll = (chatN++ * 7 + Math.floor(Math.random() * 10)) % 10; // mix of own lines, hellos and little cheers
    if (CHAT_SAYS[id] && roll < 5) return CHAT_SAYS[id];
    if (others.length && roll < 8) {
      const near = others.reduce((b, o) => Math.hypot(o._x - p._x, o._y - p._y) < Math.hypot(b._x - p._x, b._y - p._y) ? o : b);
      return `Hi, ${chatName(near.dataset.id)}! 👋`;
    }
    return CHAT_ANY[(chatN + Math.floor(Math.random() * CHAT_ANY.length)) % CHAT_ANY.length];
  }
  function clearChatter() { board.querySelectorAll('.chat-bubble').forEach(b => b.remove()); pieces().forEach(p => p.classList.remove('chatty')); }
  // makes one friend speak (optionally a given friend or line); returns { id, text } or null when it's not a good moment
  function chatter(id, text) {
    if (dozing || partying || drag || document.hidden || (state && state.calm) || document.querySelector('.modal:not([hidden])')) return null;
    let ps = pieces().filter(p => !p.dataset.busy);
    if (id) ps = ps.filter(p => p.dataset.id === id);
    if (!ps.length) return null;
    const pool = ps.length > 1 && !id ? ps.filter(p => p.dataset.id !== chatLast) : ps;
    const p = pool[Math.floor(Math.random() * pool.length)];
    clearChatter();
    const say = text || chatterLine(p);
    const b = document.createElement('span'); b.className = 'chat-bubble'; b.setAttribute('aria-hidden', 'true'); b.dataset.for = p.dataset.id;
    b.textContent = say;
    const size = p.querySelector('.art') ? p.querySelector('.art').offsetHeight : 96;
    board.appendChild(b);
    const w = b.offsetWidth, bw = board.clientWidth;
    b.style.left = clamp(p._x, w / 2 + 6, Math.max(w / 2 + 6, bw - w / 2 - 6)) + 'px';
    b.style.top = Math.max(b.offsetHeight + 4, p._y - size / 2 - 4) + 'px';
    b.style.setProperty('--tail', clamp(p._x - (parseFloat(b.style.left) - w / 2), 14, Math.max(14, w - 14)) + 'px');
    p.classList.remove('chatty'); void p.offsetWidth; p.classList.add('chatty');
    setTimeout(() => { b.classList.add('bye'); p.classList.remove('chatty'); }, 2600);
    setTimeout(() => b.remove(), 3000);
    chatLast = p.dataset.id;
    document.dispatchEvent(new CustomEvent('ef:chatter', { detail: { id: p.dataset.id, text: say } }));
    return { id: p.dataset.id, text: say };
  }
  function armChatter(first) {
    clearTimeout(chatTimer);
    if (chatDelay > 0) chatTimer = setTimeout(() => { chatter(); armChatter(); }, first ? chatFirst : chatDelay * (0.8 + Math.random() * 0.4));
  }
  // grabbing friends or tidying shoos the bubble away; any touch also restarts the quiet clock
  board.addEventListener('pointerdown', () => { clearChatter(); armChatter(true); }, { passive: true });
  document.addEventListener('ef:party', clearChatter);
  armChatter(true);

  // merge discoveries from elsewhere (e.g. synced from Starknet); returns how many were new
  function importDiscoveries(list) {
    const fresh = list.filter(id => D.byId[id] && !found.has(id)), before = found.size;
    fresh.forEach(id => { found.add(id); state.found.push(id); state.seen[id] = false; state.met[id] = todayKey(); });
    if (fresh.length) { noteWallUnlocks(before); save(); renderInventory(); updateCounter(true); if (wallNews.length && !revealQueue.length) showWallNews(); }
    return fresh.length;
  }


  // ---------- swipe down to close 👇: on touch screens, pull a sheet down by its top to tuck it away ----------
  const SWIPE_SKIP = new Set(['confirm']); // a yes/no question needs a real answer
  const sheetGrab = { on: false, y0: 0, x0: 0, t0: 0, dy: 0, sheet: null, modal: null, scroller: null, grab: false, dead: false };
  function scrollerIn(el, sheet) {
    for (let n = el; n && n !== sheet.parentNode; n = n.parentNode) {
      if (n.nodeType === 1 && n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return n;
    }
    return null;
  }
  function swipeClose(modal) {
    const btn = modal.querySelector('[data-close]');
    if (btn) btn.click(); else closeModal(modal.id);
    document.dispatchEvent(new CustomEvent('ef:swipeclose', { detail: { id: modal.id } }));
  }
  function resetSheet(sheet, modal, animate) {
    if (!sheet) return;
    sheet.style.transition = animate && !still() ? 'transform .25s cubic-bezier(.3, 1.4, .5, 1)' : '';
    sheet.style.transform = ''; modal.style.backgroundColor = ''; sheet.classList.remove('pulling');
    if (animate) setTimeout(() => { sheet.style.transition = ''; }, 260);
  }
  document.querySelectorAll('.modal').forEach(m => {
    const sheet = m.querySelector(':scope > .sheet'); if (!sheet || SWIPE_SKIP.has(m.id)) return;
    m.classList.add('swipeable');
    const grab = document.createElement('div'); grab.className = 'sheet-grab'; grab.setAttribute('aria-hidden', 'true'); grab.innerHTML = '<span></span>';
    sheet.insertBefore(grab, sheet.firstChild);
    sheet.addEventListener('touchstart', ev => {
      if (ev.touches.length !== 1 || ev.target.closest('input, textarea, select, [contenteditable]')) { sheetGrab.dead = true; return; }
      const t = ev.touches[0], top = sheet.getBoundingClientRect().top;
      Object.assign(sheetGrab, { on: false, dead: false, y0: t.clientY, x0: t.clientX, t0: performance.now(), dy: 0, sheet, modal: m,
        grab: t.clientY - top < 56 || !!ev.target.closest('.sheet-grab, .sheet-head'), scroller: scrollerIn(ev.target, sheet) });
    }, { passive: true });
    sheet.addEventListener('touchmove', ev => {
      const g = sheetGrab; if (g.dead || g.sheet !== sheet || ev.touches.length !== 1) return;
      const t = ev.touches[0], dy = t.clientY - g.y0, dx = t.clientX - g.x0;
      if (!g.on) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { g.dead = true; return; } // sideways: leave it for flipping
        if (dy < -6) { g.dead = true; return; }
        if (dy > 8 && (g.grab || !g.scroller || g.scroller.scrollTop <= 0)) { g.on = true; g.y0 = t.clientY - 1; g.t0 = performance.now(); sheet.classList.add('pulling'); sheet.style.transition = 'none'; }
        else return;
      }
      if (ev.cancelable) ev.preventDefault();
      g.dy = Math.max(0, t.clientY - g.y0);
      sheet.style.transform = `translateY(${g.dy}px)`;
      m.style.backgroundColor = `rgba(90, 50, 110, ${Math.max(.08, .35 - g.dy / 900)})`;
    }, { passive: false });
    const end = () => {
      const g = sheetGrab; if (g.sheet !== sheet) return;
      const was = g.on; g.on = false; g.sheet = null; if (!was) return;
      const speed = g.dy / Math.max(1, performance.now() - g.t0);
      if (g.dy > Math.min(110, sheet.offsetHeight * .25) || (g.dy > 40 && speed > .6)) {
        if (still()) { resetSheet(sheet, m, false); swipeClose(m); return; }
        sheet.style.transition = 'transform .18s ease-in'; sheet.style.transform = `translateY(${Math.max(g.dy, sheet.offsetHeight) + 40}px)`;
        setTimeout(() => { swipeClose(m); resetSheet(sheet, m, false); }, 170);
        SND.play('drop');
      } else resetSheet(sheet, m, true);
    };
    sheet.addEventListener('touchend', end); sheet.addEventListener('touchcancel', end);
  });

  // public hooks (used by the optional Starknet layer and by tests)
  window.EF_GAME = {
    found, combine: (a, b) => D.combine(a, b), pieces, hopTo, bringToBoard, bringPair, toggleFave, isFave, setNick, nickOf, saveSticker, groupPhoto, openBook, openDetail, flipDetail, flipList, surpriseFriend, hint, openKeys, importDiscoveries, shinies: () => state.shinies.slice(), reachable: () => [...reachable()], milestones, setShinyChance: c => { shinyChance = c; }, noteShiny, filterBook: m => applyBookFilter(m, true), bookFilter: () => bookFilter, setChainFriends, chainFriends,
    applyTheme, setTheme, setMusic, setWall, setSize, setCalm, isCalm: () => still(), walls: () => WALLS.map(w => ({ ...w, open: wallOpen(w) })), inSeason: (id, d) => !!(wallById[id] && wallById[id].season && inSeason(wallById[id], d)), mixesLeft, setMixCounts, peekInfo, triedPair: (a, b) => tried.has(pairKey(a, b)), pet, twin, tidy, party, isPartying: () => partying, chatter, setChatterDelay: (ms, first) => { chatDelay = ms; if (first != null) chatFirst = first; armChatter(true); }, friendSince, todayKey, madeCount, madeText, setSort, clearBoard, undoClear, canUndo: () => !!undoSnap,
    newFriends: () => newFriends, combo: () => ({ n: combo.n, left: comboLeft(), best: state.bestCombo }), setComboWindow: ms => { comboWindow = ms; }, doze, wake, isDozing: () => dozing, setDozeDelay: ms => { dozeDelay = ms; armDoze(); },
    ui: { openModal, closeModal, toast, confetti, burst, announce, icon }
  };
  Object.defineProperty(window.EF_GAME, 'state', { get: () => state, enumerable: true });
  document.dispatchEvent(new CustomEvent('ef:ready'));
})();
