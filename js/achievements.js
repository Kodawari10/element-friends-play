/* Element Friends — Local Achievements: cute offline milestone badges. No wallet needed. */
(function () {
  'use strict';
  const KEY = 'element-friends-achievements-v1';
  const DAILY_KEY = 'element-friends-daily-v1';
  const JP_KEY = 'element-friends-jp-v1';
  const D = window.EF_DATA, SND = window.EF_AUDIO;
  let G, store, grid, sub;

  const DEFS = [
    { id: 'first_friend', name: 'First Friend', emoji: '🌱', blurb: 'Discover your first friend beyond the base four.', when: s => s.discovered > 4 },
    { id: 'budding', name: 'Budding Alchemist', emoji: '🪴', blurb: 'Discover 10 friends.', when: s => s.discovered >= 10 },
    { id: 'growing', name: 'Growing Collection', emoji: '🌼', blurb: 'Discover 25 friends.', when: s => s.discovered >= 25 },
    { id: 'half', name: 'Half the World', emoji: '🌎', blurb: 'Discover 70 friends.', when: s => s.discovered >= 70 },
    { id: 'collector', name: 'Friend Collector', emoji: '💕', blurb: 'Discover 100 friends.', when: s => s.discovered >= 100 },
    { id: 'complete', name: 'Complete Set', emoji: '👑', blurb: 'Discover every single friend!', when: s => s.discovered >= s.total },
    { id: 'legendary_spark', name: 'Legendary Spark', emoji: '✨', blurb: 'Meet your first legendary friend.', when: s => s.legendCount >= 1 },
    { id: 'legend_keeper', name: 'Legend Keeper', emoji: '🌟', blurb: 'Collect every legendary friend.', when: s => s.legendCount >= s.legendTotal },
    { id: 'mix_master', name: 'Mix Master', emoji: '🧪', blurb: 'Complete 50 successful mixes.', when: s => s.mixes >= 50 },
    { id: 'streak_3', name: 'Daily Streak 3', emoji: '🔥', blurb: 'Keep a 3-day Daily Friend streak.', when: s => s.dailyBest >= 3 },
    { id: 'streak_7', name: 'Daily Streak 7', emoji: '🌈', blurb: 'Keep a 7-day Daily Friend streak.', when: s => s.dailyBest >= 7 },
    { id: 'cuddle_buddy', name: 'Cuddle Buddy', emoji: '💞', blurb: 'Pet your friends 10 times.', when: s => s.pets >= 10 },
    { id: 'night_owl', name: 'Night Owl', emoji: '🦉', blurb: 'Play while Cozy Night Mode is on.', when: s => s.night && s.discovered > 4 },
    { id: 'sparkle_spotter', name: 'Sparkle Spotter', emoji: '🦄', blurb: 'Meet your first shiny friend.', when: s => s.shinies >= 1 },
    { id: 'party_starter', name: 'Party Starter', emoji: '🪩', blurb: 'Throw a dance party on the playfield.', when: s => s.parties >= 1 },
    { id: 'name_giver', name: 'Name Giver', emoji: '🏷️', blurb: 'Give a friend a nickname.', when: s => s.nicks >= 1 },
    { id: 'besties', name: 'Besties', emoji: '💗', blurb: 'Pick 3 best friends.', when: s => s.faves >= 3 },
    { id: 'combo_star', name: 'Combo Star', emoji: '🌠', blurb: 'Find 3 new friends in a row for a combo.', when: s => s.bestCombo >= 3 },
    { id: 'konnichiwa', name: 'Konnichiwa!', emoji: '🗾', blurb: 'Hear a friend’s name in Japanese.', when: s => s.jpHeard >= 1 },
    { id: 'little_listener', name: 'Little Listener', emoji: '🎧', blurb: 'Hear 20 friends’ names in Japanese.', when: s => s.jpHeard >= 20 },
    { id: 'kana_star', name: 'Kana Star', emoji: '💮', blurb: 'Get a perfect 5/5 in the Name quiz.', when: s => s.jpBest >= 5 }
  ];

  function loadStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      return { unlocked: raw.unlocked && typeof raw.unlocked === 'object' && !Array.isArray(raw.unlocked) ? raw.unlocked : {}, mixes: Math.max(0, raw.mixes | 0), parties: Math.max(0, raw.parties | 0) };
    } catch (e) { return { unlocked: {}, mixes: 0, parties: 0 }; }
  }
  function saveStore() {
    try { localStorage.setItem(KEY, JSON.stringify({ unlocked: store.unlocked, mixes: store.mixes | 0, parties: store.parties | 0 })); } catch (e) { /* ignore */ }
  }

  function dailyBest() {
    try {
      const q = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null') || {};
      return Math.max(q.streak | 0, q.best | 0);
    } catch (e) { return 0; }
  }

  // Japanese names store (read-only here): words heard and best Name quiz score
  function jpStats() {
    try {
      const v = JSON.parse(localStorage.getItem(JP_KEY) || 'null') || {};
      const heard = Array.isArray(v.heard) ? new Set(v.heard.filter(x => typeof x === 'string' && D.byId && D.byId[x])).size : 0;
      const best = Number.isFinite(+v.best) ? Math.max(0, Math.min(5, Math.floor(+v.best))) : 0;
      return { heard, best: (v.played | 0) > 0 ? best : 0 };
    } catch (e) { return { heard: 0, best: 0 }; }
  }

  function snap() {
    const jp = jpStats();
    const legends = D.elements.filter(e => e.final);
    const st = G.state || null;
    return {
      discovered: G.found.size,
      total: D.elements.length,
      legendCount: legends.filter(e => G.found.has(e.id)).length,
      legendTotal: legends.length,
      mixes: store.mixes | 0,
      dailyBest: dailyBest(),
      night: document.documentElement.dataset.theme === 'night',
      pets: (G.state && G.state.pets) | 0,
      shinies: st && Array.isArray(st.shinies) ? st.shinies.length : 0,
      parties: store.parties | 0,
      nicks: st && st.nicks && typeof st.nicks === 'object' ? Object.keys(st.nicks).length : 0,
      faves: st && Array.isArray(st.faves) ? st.faves.length : 0,
      bestCombo: st ? (st.bestCombo | 0) : 0,
      jpHeard: jp.heard,
      jpBest: jp.best
    };
  }

  function fmtDate(ts) {
    try {
      return new Date(ts).toLocaleDateString('en-GB', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function celebrate(defs, delay) {
    if (!defs.length || !G) return;
    const wait = delay == null ? 0 : delay;
    setTimeout(() => {
      const a = defs[0];
      const extra = defs.length > 1 ? ` (+${defs.length - 1} more!)` : '';
      const msg = `🏆 Achievement unlocked: ${a.name}!${extra}`;
      try { G.ui.confetti(28); } catch (e) { /* ignore */ }
      try { SND && SND.play('discover'); } catch (e) { /* ignore */ }
      try { G.ui.toast(msg, 3800); G.ui.announce(msg); } catch (e) { /* ignore */ }
      try {
        // Chrome logs an error if vibrate() runs without a recent user gesture (e.g. after a delayed toast).
        if (navigator.vibrate && navigator.userActivation && navigator.userActivation.isActive && !document.documentElement.classList.contains('calm')) {
          navigator.vibrate(12);
        }
      } catch (e) { /* ignore */ }
      if (grid && !document.getElementById('achievements').hidden) render();
    }, wait);
  }

  function check(opts) {
    if (!G || !store) return [];
    const s = snap();
    const newly = [];
    for (const def of DEFS) {
      if (store.unlocked[def.id]) continue;
      let ok = false;
      try { ok = !!def.when(s); } catch (e) { ok = false; }
      if (ok) {
        store.unlocked[def.id] = Date.now();
        newly.push(def);
      }
    }
    if (newly.length) {
      saveStore();
      const delay = opts && opts.delay != null ? opts.delay : 0;
      celebrate(newly, delay);
    }
    return newly.map(d => d.id);
  }

  function render() {
    if (!grid) return;
    const unlockedN = DEFS.filter(d => store.unlocked[d.id]).length;
    if (sub) sub.textContent = `${unlockedN} of ${DEFS.length} badges · cute milestones as you play`;
    grid.innerHTML = '';
    for (const def of DEFS) {
      const ts = store.unlocked[def.id];
      const on = !!ts;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ach-cell' + (on ? ' unlocked' : ' locked');
      b.dataset.id = def.id;
      if (on) {
        b.setAttribute('aria-label', `${def.name}: ${def.blurb}. Unlocked ${fmtDate(ts)}.`);
        b.innerHTML = `<span class="ach-emoji" aria-hidden="true">${def.emoji}</span>` +
          `<span class="ach-name">${def.name}</span>` +
          `<span class="ach-blurb">${def.blurb}</span>` +
          `<span class="ach-date">${fmtDate(ts)}</span>`;
      } else {
        b.setAttribute('aria-label', 'Locked achievement');
        b.innerHTML = `<span class="ach-emoji sil" aria-hidden="true">❓</span>` +
          `<span class="ach-name">???</span>` +
          `<span class="ach-blurb">Keep playing to unlock!</span>`;
      }
      grid.appendChild(b);
    }
  }

  function openPanel() {
    check();
    render();
    G.ui.closeModal('menu');
    G.ui.openModal('achievements');
  }

  function onCombine(ev) {
    store.mixes = (store.mixes | 0) + 1;
    saveStore();
    const delay = ev.detail && ev.detail.isNew ? 1500 : 450;
    check({ delay });
  }

  function list() {
    return DEFS.map(d => ({
      id: d.id, name: d.name, emoji: d.emoji, blurb: d.blurb,
      unlocked: !!store.unlocked[d.id],
      at: store.unlocked[d.id] || null
    }));
  }
  function unlocked() {
    const out = {};
    for (const k of Object.keys(store.unlocked)) out[k] = store.unlocked[k];
    return out;
  }

  function init() {
    G = window.EF_GAME;
    store = loadStore();
    grid = document.getElementById('achGrid');
    sub = document.getElementById('achSub');
    const btn = document.getElementById('btnAchievements');
    if (btn) btn.addEventListener('click', openPanel);
    document.addEventListener('ef:combine', onCombine);
    document.addEventListener('ef:pet', () => check({ delay: 500 }));
    // newer friend moments: shiny friends, dance parties, nicknames, best friends, combos
    document.addEventListener('ef:party', ev => {
      if (!ev.detail || !(ev.detail.count > 0)) return;
      store.parties = (store.parties | 0) + 1; saveStore();
      check({ delay: 1200 });
    });
    document.addEventListener('ef:shiny', () => check({ delay: 2600 }));
    document.addEventListener('ef:nick', () => check({ delay: 500 }));
    document.addEventListener('ef:fave', () => check({ delay: 500 }));
    document.addEventListener('ef:combo', () => check({ delay: 1800 }));
    // Japanese names: hearing a word and finishing a Name quiz round
    document.addEventListener('ef:jp', () => check({ delay: 700 }));
    document.addEventListener('ef:jpquiz', () => check({ delay: 1600 }));
    document.addEventListener('ef:reveal', () => setTimeout(() => check(), 80));
    // Theme flips (Night Owl) — soft hook if Settings theme buttons exist
    document.querySelectorAll('[data-theme-pick]').forEach(b => {
      b.addEventListener('click', () => setTimeout(() => check(), 120));
    });
    window.EF_ACHIEVEMENTS = { list, unlocked, check: () => check(), defs: DEFS.map(d => d.id) };
    // Initial pass (existing saves / night theme / daily streak)
    setTimeout(() => check(), 200);
  }

  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
