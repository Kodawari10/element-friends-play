/* Element Friends — Omikuji 🎋: once a day, shake the little shrine box for a kawaii fortune slip (always a happy one),
   with a lucky friend from your collection and a lucky element to try mixing today. Offline, no wallet needed. */
(function () {
  'use strict';
  const KEY = 'element-friends-omikuji-v1';
  // Only blessings here — no bad luck for friends. weight = how often it comes up
  const RANKS = [
    { id: 'daikichi', kanji: '大吉', kana: 'だいきち', romaji: 'daikichi', en: 'Great blessing', weight: 15,
      lines: ['{f} is bursting with sparkles for you today! Big wonderful things are coming ✨', 'Everything you mix today is extra lucky. {f} is doing a happy dance 💃'] },
    { id: 'chukichi', kanji: '中吉', kana: 'ちゅうきち', romaji: 'chūkichi', en: 'Middle blessing', weight: 20,
      lines: ['A cozy, lucky day. {f} saved you the comfiest spot 💕', 'Good news is floating your way, like {f} on a sunny breeze ☁️'] },
    { id: 'shokichi', kanji: '小吉', kana: 'しょうきち', romaji: 'shōkichi', en: 'Small blessing', weight: 25,
      lines: ['Little joys all day long. {f} found a tiny treasure for you 🍀', 'Small steps, big smiles! {f} believes in you 🌱'] },
    { id: 'kichi', kanji: '吉', kana: 'きち', romaji: 'kichi', en: 'Blessing', weight: 25,
      lines: ['A gentle, happy day. {f} wants to share a snack with you 🍡', 'Keep mixing, keep smiling. {f} is cheering quietly 📣'] },
    { id: 'suekichi', kanji: '末吉', kana: 'すえきち', romaji: 'suekichi', en: 'Future blessing', weight: 15,
      lines: ['Luck is on its way, slowly and surely. {f} is saving it for you 🎁', 'Plant a little seed today. {f} says tomorrow will bloom 🌸'] }
  ];
  const byRank = Object.fromEntries(RANKS.map(r => [r.id, r]));
  const D = window.EF_DATA;
  let G, cfg, shaking = false;
  const $id = i => document.getElementById(i);
  const SND = () => window.EF_AUDIO;
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => G.todayKey();

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      const n = x => (Number.isFinite(x) && x >= 0 ? Math.min(Math.floor(x), 1e6) : 0);
      const slip = v.slip && byRank[v.slip.rank] && D.byId[v.slip.friend] && /^\d{4}-\d{2}-\d{2}$/.test(v.slip.day)
        ? { day: v.slip.day, rank: v.slip.rank, friend: v.slip.friend, line: Math.min(Math.max(v.slip.line | 0, 0), 1), lucky: D.byId[v.slip.lucky] ? v.slip.lucky : '' } : null;
      const tally = {}; RANKS.forEach(r => { tally[r.id] = n(v.tally && v.tally[r.id]); });
      return { slip, draws: n(v.draws), tally };
    } catch (e) { return { slip: null, draws: 0, tally: Object.fromEntries(RANKS.map(r => [r.id, 0])) }; }
  }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } }
  const drawnToday = () => !!(cfg.slip && cfg.slip.day === today());

  function pickRank() {
    let t = Math.random() * RANKS.reduce((s, r) => s + r.weight, 0);
    for (const r of RANKS) { t -= r.weight; if (t < 0) return r.id; }
    return 'kichi';
  }
  function pickFriend() {
    const all = D.elements.filter(e => G.found.has(e.id)).map(e => e.id);
    const fancy = all.filter(id => !D.byId[id].base);
    const list = fancy.length ? fancy : all;
    return list[Math.floor(Math.random() * list.length)] || 'water';
  }
  // a found element that still has an undiscovered mix waiting (a gentle nudge, never the whole recipe)
  function pickLucky() {
    const opts = new Set();
    D.recipes.forEach(([a, b, r]) => { if (G.found.has(a) && G.found.has(b) && !G.found.has(r)) { opts.add(a); opts.add(b); } });
    const list = [...opts];
    return list.length ? list[Math.floor(Math.random() * list.length)] : '';
  }

  function applyBtn() {
    const b = $id('btnOmikuji'), s = $id('omikujiState'); if (!b || !s) return;
    const done = drawnToday();
    s.textContent = done ? `Today: ${byRank[cfg.slip.rank].kanji}` : 'New!';
    s.classList.toggle('fresh', !done);
    b.setAttribute('aria-label', done ? `Omikuji fortune. Today's fortune is ${byRank[cfg.slip.rank].en}. Come back tomorrow for a new one.` : 'Omikuji fortune. A new fortune is waiting today.');
  }

  function showSlip(animate) {
    const s = cfg.slip, r = byRank[s.rank], e = D.byId[s.friend];
    const name = (G.nickOf && G.nickOf(s.friend)) || e.name;
    const jp = window.EF_JP && window.EF_JP.isOn() ? window.EF_JP.word(s.friend) : null;
    $id('omkBoxWrap').hidden = true;
    const slip = $id('omkSlip'); slip.hidden = false;
    slip.classList.remove('unroll'); if (animate && !G.isCalm()) { void slip.offsetWidth; slip.classList.add('unroll'); }
    $id('omkRank').innerHTML = `<span class="omk-kanji" lang="ja">${r.kanji}</span><span class="omk-kana" lang="ja">${r.kana}</span><span class="omk-ro">${r.romaji}</span>`;
    $id('omkEn').textContent = `${r.en}!`;
    $id('omkArt').innerHTML = window.EF_ART.render(e, { label: false });
    $id('omkFriend').innerHTML = `Lucky friend: <b>${esc(name)}</b>` + (jp ? ` <button type="button" class="omk-jp" id="omkJp" aria-label="${esc(e.name)} in Japanese is ${esc(jp.romaji)}. Tap to hear it."><span lang="ja">${esc(jp.kana)}</span> 🔊</button>` : '');
    $id('omkLine').textContent = r.lines[s.line].replace('{f}', name);
    const lk = s.lucky && D.byId[s.lucky];
    $id('omkLucky').innerHTML = lk ? `🍀 Lucky element: <span class="omk-mini" aria-hidden="true">${window.EF_ART.render(lk, { label: false })}</span><b>${esc(lk.name)}</b>. It still has a secret mix waiting. Try it today!`
      : '🍀 Every friend has found a home. Enjoy a cozy day!';
    $id('omkNext').textContent = 'Come back tomorrow for a new fortune 🌙';
    const jb = $id('omkJp'); if (jb) jb.addEventListener('click', () => window.EF_JP.say(s.friend, jb));
  }
  function showBox() {
    $id('omkBoxWrap').hidden = false; $id('omkSlip').hidden = true;
    $id('omkBox').classList.remove('shake');
  }

  function open() {
    if ($id('menu') && !$id('menu').hidden) G.ui.closeModal('menu');
    if (drawnToday()) showSlip(false); else showBox();
    if ($id('omikuji').hidden) G.ui.openModal('omikuji');
    setTimeout(() => { const f = drawnToday() ? $id('omkDone') : $id('omkShake'); if (f && !$id('omikuji').hidden) f.focus({ preventScroll: true }); }, 40);
  }

  function draw(force) {
    if (drawnToday() || shaking) return null;
    const rank = force && byRank[force] ? force : pickRank();
    cfg.slip = { day: today(), rank, friend: pickFriend(), line: Math.random() < .5 ? 0 : 1, lucky: pickLucky() };
    cfg.draws++; cfg.tally[rank]++; store(); applyBtn();
    const finish = () => {
      shaking = false;
      showSlip(true);
      const r = byRank[rank], calm = G.isCalm();
      if (SND()) SND().play(rank === 'daikichi' ? 'shiny' : 'discover');
      if (rank === 'daikichi' && !calm) G.ui.confetti(50);
      else if (!calm) { const a = $id('omkArt').getBoundingClientRect(); G.ui.burst(a.left + a.width / 2, a.top + a.height / 2, 12); }
      G.ui.announce(`Your fortune: ${r.en}, ${r.romaji}. ${$id('omkLine').textContent} ${$id('omkLucky').textContent}`);
      document.dispatchEvent(new CustomEvent('ef:omikuji', { detail: { ...cfg.slip, draws: cfg.draws } }));
      setTimeout(() => { const d = $id('omkDone'); if (d && !$id('omikuji').hidden) d.focus({ preventScroll: true }); }, 40);
    };
    if (G.isCalm()) { finish(); return cfg.slip; }
    shaking = true;
    const box = $id('omkBox'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    if (SND()) SND().play('tidy');
    setTimeout(finish, 850);
    return cfg.slip;
  }

  function init() {
    G = window.EF_GAME; if (!G || !D || !$id('omikuji')) return;
    cfg = load();
    $id('btnOmikuji').addEventListener('click', open);
    $id('omkShake').addEventListener('click', () => { SND() && SND().unlock && SND().unlock(); draw(); });
    $id('omkBox').addEventListener('click', () => draw());
    $id('omkDone').addEventListener('click', () => G.ui.closeModal('omikuji'));
    // a new day can start while the game is open
    document.addEventListener('visibilitychange', () => { if (!document.hidden) applyBtn(); });
    applyBtn();
    window.EF_OMIKUJI = { open, draw, drawnToday, slip: () => cfg.slip && { ...cfg.slip }, draws: () => cfg.draws, tally: () => ({ ...cfg.tally }), ranks: () => RANKS.map(r => r.id), refresh: applyBtn };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
