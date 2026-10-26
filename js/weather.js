/* Element Friends: Friend weather 🌦️ (decorative, offline, no save changes to the main game).
 * Some friends bring their own little weather to the playfield while they're on it:
 * Rain and Storm make a soft shower, Snow / Snowman / Snow Globe bring snowflakes, Sakura drops petals,
 * Rainbow paints an arc, Sun warms the corner and Firefly lights up tiny glows.
 * The newest weather friend on the playfield wins. Gentle mode and reduced motion keep it still.
 * First-time hellos are remembered under `element-friends-weather-v1` (the main save is untouched).
 * Weather sounds 🔉: each weather also has a soft little sound (EF_AUDIO.ambience), with an On/Off switch in Settings
 * stored in the same weather store (`sound`, On by default). Mute silences it, Gentle mode makes it softer with no thunder.
 */
(function () {
  const G = window.EF_GAME; const board = document.getElementById('board');
  if (!G || !board) return;
  const KEY = 'element-friends-weather-v1';
  const BY_FRIEND = { rain: 'rain', storm: 'storm', snow: 'snow', snowman: 'snow', snowglobe: 'snow', sakura: 'petals', rainbow: 'rainbow', sun: 'sun', firefly: 'glow', hail: 'rain', blizzard: 'snow', frost: 'snow', snowangel: 'snow', sunset: 'sun', sunrise: 'sun', fireworks: 'glow' };
  const HELLO = {
    rain: '🌧️ Rain brought a little shower to the playfield!',
    storm: '⛈️ Storm is feeling grumbly… pitter-patter!',
    snow: '❄️ Snowflakes are falling on the playfield!',
    petals: '🌸 Sakura is sharing a petal shower!',
    rainbow: '🌈 Rainbow painted the sky for everyone!',
    sun: '☀️ Sun is making the playfield nice and toasty!',
    glow: '✨ Firefly lit up some tiny glows!'
  };
  const COUNT = { rain: 24, storm: 26, snow: 14, petals: 11, glow: 9, rainbow: 0, sun: 0 };
  let seen = {}, sound = true;
  try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (s && typeof s.seen === 'object' && s.seen) seen = s.seen; if (s && s.sound === false) sound = false; } catch (e) { seen = {}; sound = true; }
  const remember = () => { try { localStorage.setItem(KEY, JSON.stringify({ seen, sound })); } catch (e) { /* ignore */ } };
  const SND = window.EF_AUDIO;
  function applySound() {
    const b = document.getElementById('btnWxSound');
    if (b) { b.setAttribute('aria-checked', String(sound)); b.classList.toggle('active', sound); b.querySelector('.state').textContent = sound ? 'On' : 'Off'; }
    if (!SND || !SND.ambience) return;
    SND.setAmbienceSoft(!!G.isCalm()); SND.ambienceOn(sound); SND.ambience(current);
  }
  function setSound(on) {
    sound = !!on; remember(); if (SND) SND.unlock(); applySound();
    if (G.ui && G.ui.toast) G.ui.toast(sound ? (current ? '🔉 Weather sounds on: listen to the sky!' : '🔉 Weather sounds on. Bring Rain, Snow or Sakura to hear them!') : '🔇 Weather sounds off', 2000);
    document.dispatchEvent(new CustomEvent('ef:wxsound', { detail: { on: sound } }));
  }
  const wxBtn = document.getElementById('btnWxSound');
  if (wxBtn) wxBtn.addEventListener('click', () => setSound(!sound));
  // the browser only allows sound after a tap: start a waiting weather sound on the next one
  ['pointerup', 'keydown'].forEach(t => document.addEventListener(t, () => { if (sound && current && SND && !SND.isMuted()) SND.unlock(); }, { capture: true, passive: true }));

  const layer = document.createElement('div');
  layer.className = 'board-weather'; layer.id = 'boardWeather'; layer.setAttribute('aria-hidden', 'true'); layer.dataset.weather = '';
  const stars = board.querySelector('.board-stars');
  if (stars && stars.nextSibling) board.insertBefore(layer, stars.nextSibling); else board.insertBefore(layer, board.firstChild);

  // tiny seeded random so particles look scattered but stay stable
  const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  function build(kind) {
    layer.innerHTML = '';
    if (kind === 'rainbow') { layer.innerHTML = '<span class="wx-rainbow"></span><span class="wx-cloud l"></span><span class="wx-cloud r"></span>'; return; }
    if (kind === 'sun') { layer.innerHTML = '<span class="wx-sun"><span class="wx-rays"></span></span>'; return; }
    const n = COUNT[kind] || 0, cls = kind === 'storm' ? 'drop' : kind === 'rain' ? 'drop' : kind === 'snow' ? 'flake' : kind === 'petals' ? 'petal' : 'glow';
    let html = '';
    for (let i = 0; i < n; i++) {
      const left = (i + rnd(i, 1)) / n * 100, top = rnd(i, 2) * 100, dur = { drop: 0.9, flake: 7, petal: 8, glow: 3.5 }[cls] * (0.75 + rnd(i, 3) * 0.6);
      const delay = -rnd(i, 4) * dur, size = 0.7 + rnd(i, 5) * 0.6;
      html += `<span class="wx-${cls}" style="left:${left.toFixed(1)}%;--t:${top.toFixed(1)}%;--d:${dur.toFixed(2)}s;--dl:${delay.toFixed(2)}s;--s:${size.toFixed(2)}">${cls === 'flake' ? '❄' : ''}</span>`;
    }
    layer.innerHTML = html;
  }

  let current = '', queued = false, holdUntil = 0;
  // a brand-new discovery opens its "You discovered" pop-up a moment later: let that go first
  document.addEventListener('ef:combine', ev => { if (ev.detail && ev.detail.isNew) holdUntil = Date.now() + 1600; });
  function pick() {
    const ps = [...board.querySelectorAll('.piece')].filter(p => !p.classList.contains('poof') && !p.dataset.busy);
    for (let i = ps.length - 1; i >= 0; i--) { const k = BY_FRIEND[ps[i].dataset.id]; if (k) return { kind: k, id: ps[i].dataset.id }; }
    return { kind: '', id: '' };
  }
  function refresh() {
    queued = false;
    const { kind, id } = pick();
    layer.classList.toggle('still', !!G.isCalm());
    if (SND && SND.setAmbienceSoft) SND.setAmbienceSoft(!!G.isCalm());
    if (kind === current) return current;
    current = kind; layer.dataset.weather = kind;
    if (kind) { build(kind); void layer.offsetWidth; layer.classList.add('on'); }
    else { layer.classList.remove('on'); setTimeout(() => { if (!current) layer.innerHTML = ''; }, 900); }
    board.classList.toggle('has-weather', !!kind);
    if (SND && SND.ambience) SND.ambience(kind);
    if (kind && !seen[kind]) hello(kind, 0);
    document.dispatchEvent(new CustomEvent('ef:weather', { detail: { weather: kind, id } }));
    return current;
  }
  // first time a weather shows up, say hello (waits politely until pop-ups like "You discovered" are closed)
  function hello(kind, tries) {
    if (seen[kind] || current !== kind) return;
    if ((Date.now() < holdUntil || document.querySelector('.modal:not([hidden])')) && tries < 120) { setTimeout(() => hello(kind, tries + 1), 500); return; }
    seen[kind] = new Date().toISOString().slice(0, 10); remember();
    G.ui.toast(HELLO[kind], 2600); G.ui.announce(HELLO[kind].replace(/^\S+\s/, ''));
  }
  const soon = () => { if (!queued) { queued = true; requestAnimationFrame(refresh); } };
  new MutationObserver(soon).observe(board, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-busy'] });
  document.addEventListener('ef:calm', soon);
  refresh(); applySound();

  window.EF_WEATHER = { current: () => current, refresh, seen: () => Object.assign({}, seen), kinds: () => Object.assign({}, BY_FRIEND), soundOn: () => sound, setSound };
})();
