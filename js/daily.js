/* Element Friends — Daily Friend quest: one friend to make each day, with a cozy streak. Offline, no wallet needed. */
(function () {
  'use strict';
  const KEY = 'element-friends-daily-v1';
  const D = window.EF_DATA, ART = window.EF_ART, SND = window.EF_AUDIO;
  let G, q, pill;

  const pad = n => String(n).padStart(2, '0');
  const dayStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dayStr(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
  function seeded(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }

  function loadQ() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function saveQ() { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* ignore */ } }

  // pick a friend that is makeable right now from what you own (prefer a brand-new one)
  function pickTarget(date) {
    const f = G.found;
    const ready = D.recipes.filter(([a, b]) => f.has(a) && f.has(b));
    const fresh = [...new Set(ready.filter(([, , r]) => !f.has(r)).map(r => r[2]))];
    const pool = fresh.length ? fresh : [...new Set(ready.map(r => r[2]))];
    return pool.sort()[Math.floor(seeded(date) * pool.length)];
  }
  function ensureToday() {
    const t = today();
    if (q.date !== t || !D.byId[q.target]) {
      q.date = t; q.target = pickTarget(t); q.done = false; q.clue = 0;
      if (q.lastDone !== t && q.lastDone !== yesterday()) q.streak = 0;
      saveQ();
    }
  }
  function recipeFor(id) {
    const f = G.found;
    return D.recipes.find(([a, b, r]) => r === id && f.has(a) && f.has(b)) || D.recipes.find(r => r[2] === id);
  }

  function render() {
    const e = D.byId[q.target], known = G.found.has(q.target);
    const streak = q.streak || 0;
    pill.classList.toggle('done', !!q.done);
    pill.classList.toggle('mystery', !known);
    const flame = streak ? `<span class="dq-streak" title="Daily streak">🔥${streak}</span>` : '';
    pill.innerHTML = `<span class="dq-art">${ART.render(e, { label: false })}</span>` +
      `<span class="dq-txt"><small>${q.done ? 'Daily friend done!' : "Today's friend"}</small><b>${known || q.done ? e.name : '???'}</b></span>` +
      (q.done ? '<span class="dq-check" aria-hidden="true">✓</span>' : '') + flame;
    pill.setAttribute('aria-label', q.done
      ? `Daily quest complete: you made ${e.name}. ${streak}-day streak.`
      : `Daily quest: make ${known ? e.name : 'a mystery friend'} today. ${streak ? streak + '-day streak. ' : ''}Press for a clue.`);
  }
  function clue() {
    SND.unlock();
    const e = D.byId[q.target];
    if (q.done) { G.ui.toast(`You made ${e.name} today! Come back tomorrow for a new friend ☀️`); return; }
    const [a, b] = recipeFor(q.target);
    q.clue = Math.min(2, (q.clue || 0) + 1); saveQ();
    const msg = q.clue === 1 ? `Clue: today's friend starts with ${D.byId[a].name} ✨` : `Clue: mix ${D.byId[a].name} + ${D.byId[b].name}! 💡`;
    G.ui.toast(msg, 3600); G.ui.announce(msg); SND.play('hint');
    pill.classList.remove('wiggle'); void pill.offsetWidth; pill.classList.add('wiggle');
  }
  function onCombine(ev) {
    ensureToday();
    if (q.done || ev.detail.id !== q.target) return;
    const t = today();
    q.streak = q.lastDone === yesterday() ? (q.streak || 0) + 1 : (q.lastDone === t ? q.streak || 1 : 1);
    q.best = Math.max(q.best || 0, q.streak);
    q.done = true; q.lastDone = t; saveQ(); render();
    pill.classList.remove('cheer'); void pill.offsetWidth; pill.classList.add('cheer');
    const name = D.byId[q.target].name;
    // let the discovery reveal go first, then cheer
    setTimeout(() => {
      G.ui.confetti(40); SND.play('discover');
      G.ui.toast(`☀️ Daily friend found: ${name}! ${q.streak > 1 ? '🔥 ' + q.streak + '-day streak!' : 'Streak started! 🔥'}`, 4200);
      G.ui.announce(`Daily quest complete! You made ${name}. ${q.streak}-day streak.`);
    }, ev.detail.isNew ? 1400 : 500);
  }

  function init() {
    G = window.EF_GAME; q = loadQ();
    pill = document.createElement('button');
    pill.type = 'button'; pill.className = 'daily'; pill.id = 'daily';
    document.getElementById('board').appendChild(pill);
    pill.addEventListener('pointerdown', ev => ev.stopPropagation());
    pill.addEventListener('click', clue);
    ensureToday(); render();
    document.addEventListener('ef:combine', onCombine);
    document.addEventListener('ef:reveal', () => setTimeout(render, 50));
    // roll over at midnight if the game stays open
    setInterval(() => { if (q.date !== today()) { ensureToday(); render(); } }, 60000);
    window.EF_DAILY = { get: () => Object.assign({}, q), render };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
