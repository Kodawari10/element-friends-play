/* Element Friends: Spooky costumes 🎃 (decorative, offline, no changes to the main save).
 * During Pumpkin patch season (Oct 15 to Nov 5, same dates as the seasonal wallpaper), friends on the playfield
 * dress up in a tiny costume: a witch hat, a pumpkin cap or a bat-wing headband (always the same one per friend).
 * Friends who already wear something on their head (crowns, hats, halos, roofs…) keep their own look.
 * Settings shows a 🎃 Costumes On/Off switch only in season (On by default). Gentle mode and reduced motion keep
 * the costumes still. Stored separately under `element-friends-costume-v1` ({ on, tip }).
 */
(function () {
  const G = window.EF_GAME, ART = window.EF_ART;
  const board = document.getElementById('board');
  if (!G || !ART || !board) return;
  const KEY = 'element-friends-costume-v1';
  const KINDS = ['witch', 'pumpkin', 'bat'];
  const NAMES = { witch: 'a witch hat', pumpkin: 'a pumpkin cap', bat: 'bat wings' };
  // head-top accessories: these friends are already dressed up
  const HEADWEAR = new Set(['witchHat', 'pumpkinStem', 'leafTop', 'nightcap', 'sailorHat', 'bonnet', 'wizardHat', 'tiara', 'helmetSlit', 'plume', 'flowerCrown', 'topHat', 'visor', 'antennaHelmet', 'halo', 'crown', 'headband', 'roof', 'chimney', 'battlements', 'lid', 'jarLid', 'cherry', 'snowcap', 'propeller', 'noseCone', 'flag', 'umbrella', 'flowerTop', 'heartTop', 'sproutBig', 'lavaTop', 'smokeTop', 'steamTop', 'antenna', 'boltTop', 'palm', 'straw', 'spout', 'curlTop', 'crestFlame', 'mane', 'maneRainbow', 'horn', 'horns', 'eggShell', 'antlers', 'kappaDish']);
  let on = true, tip = '';
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s && s.on === false) on = false; if (s && typeof s.tip === 'string') tip = s.tip; } catch (e) { on = true; tip = ''; }
  const remember = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, tip })); } catch (e) { /* ignore */ } };
  const byId = id => (window.EF_DATA && window.EF_DATA.byId[id]) || null;
  const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const inSeason = d => G.inSeason('pumpkin', d || new Date());
  const active = () => on && inSeason();
  function kindOf(id) {
    const e = byId(id); if (!e) return '';
    if ((e.acc || []).some(a => HEADWEAR.has(a.split(':')[0]))) return '';
    return KINDS[hash(id) % KINDS.length];
  }
  // tiny costume drawn in the friend's own SVG space, sitting on top of its head (x 50, y = shape top)
  function costumeSVG(kind, e) {
    const sh = (ART.shapes[e.shape] || ART.shapes.round), t = sh.t;
    const ink = '#3b2b4f';
    let g = '';
    if (kind === 'witch') {
      g = `<path d="M37 ${t + 1}Q42 ${t - 12} 50 ${t - 22}Q53 ${t - 27} 60 ${t - 25}Q55 ${t - 22} 56 ${t - 16}Q59 ${t - 6} 63 ${t + 1}Z" fill="#8f6ad8" stroke="#55408a" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M39.5 ${t - 4}Q50 ${t - 1} 61 ${t - 4}L62 ${t - .5}Q50 ${t + 2.5} 38.5 ${t - .5}Z" fill="#ffb347" stroke="#c97a1f" stroke-width="1.2" stroke-linejoin="round"/>` +
        `<ellipse cx="50" cy="${t + 1.5}" rx="21" ry="4.6" fill="#8f6ad8" stroke="#55408a" stroke-width="2"/>` +
        `<path d="M50 ${t - 14.5}l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="#fff07a" stroke="#d9b84a" stroke-width=".8" stroke-linejoin="round"/>`;
    } else if (kind === 'pumpkin') {
      const y = t - 6;
      g = `<path d="M50 ${y - 8}Q49 ${y - 13} 52 ${y - 15}" fill="none" stroke="#5c9a4a" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M52 ${y - 12}Q59 ${y - 17} 62 ${y - 11}Q56 ${y - 9} 52 ${y - 12}Z" fill="#8fd17a" stroke="#5c9a4a" stroke-width="1.3" stroke-linejoin="round"/>` +
        `<ellipse cx="42" cy="${y}" rx="8" ry="8.6" fill="#ff9f43" stroke="#d36f1c" stroke-width="2"/>` +
        `<ellipse cx="58" cy="${y}" rx="8" ry="8.6" fill="#ff9f43" stroke="#d36f1c" stroke-width="2"/>` +
        `<ellipse cx="50" cy="${y}" rx="8.4" ry="9.4" fill="#ffad5c" stroke="#d36f1c" stroke-width="2"/>` +
        `<path d="M45.5 ${y - 1.5}l2-3 2 3z M50.5 ${y - 1.5}l2-3 2 3z" fill="${ink}"/>` +
        `<path d="M46.5 ${y + 2.6}Q50 ${y + 5.4} 53.5 ${y + 2.6}" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>` +
        `<ellipse cx="44.5" cy="${y + 2.4}" rx="1.6" ry="1" fill="#ff7f9f" opacity=".7"/><ellipse cx="55.5" cy="${y + 2.4}" rx="1.6" ry="1" fill="#ff7f9f" opacity=".7"/>`;
    } else if (kind === 'bat') {
      const y = t - 3;
      const wing = s => `<path d="M${50 + s * 4} ${y}Q${50 + s * 12} ${y - 14} ${50 + s * 23} ${y - 9}Q${50 + s * 20} ${y - 4} ${50 + s * 21} ${y}Q${50 + s * 17} ${y - 2.5} ${50 + s * 14} ${y + 1}Q${50 + s * 11} ${y - 2} ${50 + s * 8} ${y + 1.5}Z" fill="#7a5aa6" stroke="#4a3570" stroke-width="1.8" stroke-linejoin="round"/>`;
      g = `<path d="M30 ${t + 6}Q50 ${t - 6} 70 ${t + 6}" fill="none" stroke="#4a3570" stroke-width="2.6" stroke-linecap="round"/>` +
        wing(-1) + wing(1) +
        `<ellipse cx="50" cy="${y - .5}" rx="5.4" ry="4.8" fill="#7a5aa6" stroke="#4a3570" stroke-width="1.8"/>` +
        `<path d="M46.4 ${y - 4.4}l.8-3.4 2 2.6z M53.6 ${y - 4.4}l-.8-3.4-2 2.6z" fill="#7a5aa6" stroke="#4a3570" stroke-width="1" stroke-linejoin="round"/>` +
        `<circle cx="48.2" cy="${y - 1}" r=".9" fill="#fff"/><circle cx="51.8" cy="${y - 1}" r=".9" fill="#fff"/>`;
    }
    return `<g class="costume costume-${kind}" data-costume="${kind}" aria-hidden="true" style="--cd:${(-(hash(e.id) % 300) / 100).toFixed(2)}s">${g}</g>`;
  }
  function dress(p) {
    const id = p.dataset.id, inner = p.querySelector('svg.ef-svg .ef-bob > g');
    const has = inner && inner.querySelector(':scope > .costume');
    const want = active() ? kindOf(id) : '';
    if (!inner) return '';
    if (has && (!want || has.dataset.costume !== want)) has.remove();
    if (want && !(has && has.dataset.costume === want)) inner.insertAdjacentHTML('beforeend', costumeSVG(want, byId(id)));
    return want;
  }
  let queued = false, greeted = false;
  function refresh() {
    queued = false;
    const ps = [...board.querySelectorAll('.piece')];
    let dressed = 0;
    ps.forEach(p => { if (dress(p)) dressed++; });
    board.classList.toggle('costumes-still', !!G.isCalm());
    if (dressed && !greeted) hello(0);
    return dressed;
  }
  // a one-time hello each season, waiting politely for other toasts, pop-ups and the season wallpaper news
  function hello(tries) {
    const key = String(new Date().getFullYear());
    if (tip === key) { greeted = true; return; }
    if (!active()) return;
    const busy = document.getElementById('toast').classList.contains('show') || document.querySelector('.modal:not([hidden])');
    if (busy && tries < 60) { setTimeout(() => hello(tries + 1), 600); return; }
    if (tries === 0) { setTimeout(() => hello(1), 2600); return; }
    greeted = true; tip = key; remember();
    G.ui.toast('🎃 Your friends dressed up for spooky season! Turn costumes off in Settings anytime.', 3600);
    G.ui.announce('Your friends dressed up in spooky-cute costumes for the season.');
  }
  const soon = () => { if (!queued) { queued = true; requestAnimationFrame(refresh); } };
  new MutationObserver(muts => { if (muts.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && !(n.classList && n.classList.contains('costume'))))) soon(); }).observe(board, { childList: true, subtree: true });
  document.addEventListener('ef:calm', soon);

  // Settings switch (only shown in season)
  const btn = document.getElementById('btnCostumes'), note = document.getElementById('costumesNote');
  function applyBtn() {
    const show = inSeason();
    if (btn) { btn.hidden = !show; btn.setAttribute('aria-checked', String(on)); btn.classList.toggle('active', on); btn.querySelector('.state').textContent = on ? 'On' : 'Off'; }
    if (note) note.hidden = !show;
  }
  function setOn(v) {
    on = !!v; remember(); applyBtn(); refresh();
    if (G.ui && G.ui.toast) G.ui.toast(on ? '🎃 Costumes on: trick or treat!' : '👕 Costumes off: everyone changed back', 2000);
    if (G.ui && G.ui.announce) G.ui.announce(on ? 'Costumes on' : 'Costumes off');
    document.dispatchEvent(new CustomEvent('ef:costumes', { detail: { on } }));
  }
  if (btn) btn.addEventListener('click', () => { if (window.EF_AUDIO) window.EF_AUDIO.play(on ? 'unfave' : 'fave'); setOn(!on); });
  applyBtn(); refresh();
  // keep the switch and costumes right if the game stays open across the season boundary
  setInterval(() => { applyBtn(); refresh(); }, 60 * 1000);

  window.EF_COSTUMES = { on: () => on, setOn, active, kindOf, refresh, inSeason: d => inSeason(d), kinds: () => KINDS.slice(), names: () => Object.assign({}, NAMES) };
})();
