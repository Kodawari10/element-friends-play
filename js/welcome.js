/* Element Friends — Welcome back 👋: when you come back after a while, a friend waves hello. Offline, no wallet needed. */
(function () {
  'use strict';
  const KEY = 'element-friends-welcome-v1';
  const D = window.EF_DATA, ART = window.EF_ART, SND = window.EF_AUDIO;
  let G, w, card, hideT, awayMs = 3 * 3600e3, showMs = 5600;

  function loadW() { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
  function saveW() { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch (e) { /* ignore */ } }
  const validLast = () => typeof w.last === 'number' && isFinite(w.last) && w.last > 0 && w.last <= Date.now() + 6e4;
  function stamp() { w.last = Date.now(); saveW(); }

  function hello(h) {
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Hi again';
    if (h >= 18 && h < 22) return 'Good evening';
    return 'Hello, night owl';
  }
  const midnight = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  function awayText(since, now) {
    const days = Math.round((midnight(now) - midnight(since)) / 864e5);
    if (days >= 2) return `It's been ${days} days!`;
    if (days === 1) return 'Welcome back from yesterday!';
    return '';
  }
  // who waves: a best friend first, then the newest friend you met, then any friend you found
  function pickFriend() {
    const st = G.state, found = [...G.found].filter(id => D.byId[id]);
    const faves = (st.faves || []).filter(id => G.found.has(id));
    const seed = Math.floor(Date.now() / 864e5);
    if (faves.length) return faves[seed % faves.length];
    const met = Object.keys(st.met || {}).filter(id => G.found.has(id)).sort((a, b) => (st.met[b] > st.met[a]) - (st.met[b] < st.met[a]) || (a < b ? -1 : 1));
    if (met.length) return met[0];
    const extra = found.filter(id => !D.byId[id].base);
    const pool = extra.length ? extra : found;
    return pool.sort()[seed % pool.length];
  }
  function busy() { return !![...document.querySelectorAll('.modal')].find(m => !m.hidden); }

  function hide() {
    clearTimeout(hideT);
    if (!card || card.hidden || card.classList.contains('bye')) return;
    card.classList.add('bye');
    setTimeout(() => { card.hidden = true; card.classList.remove('bye'); }, G.isCalm() ? 10 : 380);
  }
  function greet(since) {
    const now = Date.now(), id = pickFriend();
    if (!id) return false;
    const e = D.byId[id], name = G.nickOf(id) || e.name;
    const total = D.elements.length, n = G.found.size;
    const away = awayText(since || now, now);
    const daily = window.EF_DAILY && window.EF_DAILY.get();
    const extra = n >= total ? `All ${total} friends found. You're a legend! 🏆`
      : daily && daily.target && !daily.done ? `Today's friend is waiting for you ☀️`
        : `${n} of ${total} friends found. Let's find more!`;
    const head = `${hello(new Date(now).getHours())}! ${name} missed you 💕`;
    card.innerHTML = `<span class="wb-art" aria-hidden="true">${ART.render(e, { label: false })}<i class="wb-hand">👋</i></span>` +
      `<span class="wb-txt"><b>${head}</b><small>${away ? away + ' ' : ''}${extra}</small></span>`;
    card.setAttribute('aria-label', `${head.replace(/ 💕$/, '')}. ${away ? away + ' ' : ''}${extra.replace(/ [☀️🏆]+$/u, '')} Press to close.`);
    card.dataset.id = id;
    card.hidden = false; card.classList.remove('bye');
    void card.offsetWidth;
    SND.play('wake');
    G.ui.announce(`${head.replace(/ 💕$/, '')}. ${away ? away + ' ' : ''}${extra.replace(/ [☀️🏆]+$/u, '')}`);
    w.greets = (w.greets || 0) + 1; saveW();
    clearTimeout(hideT); hideT = setTimeout(hide, showMs);
    document.dispatchEvent(new CustomEvent('ef:welcome', { detail: { id, away: now - (since || now), greets: w.greets } }));
    return true;
  }
  function check() {
    const since = validLast() ? w.last : 0;
    stamp();
    if (since && Date.now() - since >= awayMs && !busy()) greet(since);
  }

  function init() {
    G = window.EF_GAME; w = loadW();
    card = document.createElement('button');
    card.type = 'button'; card.className = 'welcome'; card.id = 'welcome'; card.hidden = true;
    document.getElementById('board').appendChild(card);
    card.addEventListener('pointerdown', ev => ev.stopPropagation());
    card.addEventListener('click', () => { SND.unlock && SND.unlock(); hide(); });
    document.addEventListener('ef:combine', hide);
    document.getElementById('board').addEventListener('pointerdown', hide);
    // remember when you were last here; greet again if the tab comes back after a long nap
    document.addEventListener('visibilitychange', () => { if (document.hidden) stamp(); else check(); });
    addEventListener('pagehide', stamp);
    setInterval(() => { if (!document.hidden) stamp(); }, 60000);
    setTimeout(check, 900);
    window.EF_WELCOME = { get: () => Object.assign({}, w), greet: () => greet(validLast() ? w.last : 0), hide, check, setAway: ms => { awayMs = ms; }, setShowMs: ms => { showMs = ms; }, pickFriend };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
