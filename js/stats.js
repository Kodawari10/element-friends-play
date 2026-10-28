/* Element Friends — 📊 My stats: a cozy read-only page of your play so far. Offline, no wallet needed, never changes your save. */
(function () {
  'use strict';
  const D = window.EF_DATA, ART = window.EF_ART;
  const ACH_KEY = 'element-friends-achievements-v1', DAILY_KEY = 'element-friends-daily-v1', JP_KEY = 'element-friends-jp-v1';
  let G;
  const read = k => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => Math.max(0, Math.floor(+v) || 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  function fmtDay(key) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || ''); if (!m) return '';
    try { return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return key; }
  }
  function daysBetween(a, b) {
    const p = k => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN; };
    const d = Math.round((p(b) - p(a)) / 86400000); return Number.isFinite(d) ? Math.max(0, d) : 0;
  }

  // everything here is read from what the game already keeps; nothing is written
  function snapshot() {
    const st = G.state || {}, found = G.found;
    const legends = D.elements.filter(e => e.final);
    const ach = read(ACH_KEY), daily = read(DAILY_KEY), jp = read(JP_KEY);
    const achDefs = window.EF_ACHIEVEMENTS ? window.EF_ACHIEVEMENTS.list() : [];
    const met = st.met && typeof st.met === 'object' ? Object.values(st.met).filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort() : [];
    const made = st.made && typeof st.made === 'object' ? st.made : {};
    let top = null;
    Object.keys(made).forEach(id => { if (D.byId[id] && found.has(id) && (!top || made[id] > made[top] || (made[id] === made[top] && D.byId[id].name < D.byId[top].name))) top = id; });
    const chain = typeof G.chainFriends === 'function' ? G.chainFriends().length : 0;
    return {
      found: found.size, total: D.elements.length,
      legends: legends.filter(e => found.has(e.id)).length, legendTotal: legends.length,
      mixes: num(ach.mixes), pets: num(st.pets), shinies: Array.isArray(st.shinies) ? st.shinies.length : 0,
      faves: Array.isArray(st.faves) ? st.faves.length : 0, nicks: st.nicks && typeof st.nicks === 'object' ? Object.keys(st.nicks).length : 0,
      bestCombo: num(st.bestCombo), streak: num(daily.streak), bestStreak: Math.max(num(daily.streak), num(daily.best)),
      ach: achDefs.filter(a => a.unlocked).length, achTotal: achDefs.length,
      jpBest: num(jp.played) > 0 ? Math.min(5, num(jp.best)) : 0, jpPlayed: num(jp.played),
      since: met[0] || '', top, topCount: top ? num(made[top]) : 0, chain
    };
  }

  // 🎖️ Mixer rank: a cute title that grows with how many friends you've found
  const RANKS = [
    { at: 0, emoji: '🌱', name: 'Sprout Mixer' },
    { at: 0.1, emoji: '🫧', name: 'Bubbly Mixer' },
    { at: 0.25, emoji: '🌈', name: 'Rainbow Alchemist' },
    { at: 0.5, emoji: '⭐', name: 'Star Alchemist' },
    { at: 0.75, emoji: '🌙', name: 'Moon Sage' },
    { at: 1, emoji: '👑', name: 'Element Master' }
  ];
  function rankOf(found, total) {
    const need = r => Math.ceil(r.at * total);
    let i = 0; RANKS.forEach((r, k) => { if (total && found >= need(r)) i = k; });
    const next = RANKS[i + 1];
    return { index: i, emoji: RANKS[i].emoji, name: RANKS[i].name, next: next ? { emoji: next.emoji, name: next.name, left: Math.max(1, need(next) - found) } : null };
  }
  function rankHtml(s) {
    const r = rankOf(s.found, s.total), pct = s.total ? Math.min(100, Math.round((s.found / s.total) * 100)) : 0;
    const C = 2 * Math.PI * 26, off = C * (1 - pct / 100);
    const nextTxt = r.next ? `${plural(r.next.left, 'more friend', 'more friends')} to become ${r.next.emoji} ${r.next.name}` : 'The highest rank there is! 🎉';
    return `<div class="rank-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="rank-track" cx="32" cy="32" r="26"/>` +
      `<circle class="rank-fill" cx="32" cy="32" r="26" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}" data-off="${off.toFixed(2)}"/></svg>` +
      `<span class="rank-emoji">${r.emoji}</span></div>` +
      `<div class="rank-txt"><span class="rank-k">🎖️ Mixer rank · ${pct}%</span><span class="rank-n" id="statsRankName">${esc(r.name)}</span><span class="rank-next">${esc(nextTxt)}</span></div>` +
      `<span class="sr-only">Mixer rank: ${esc(r.name)}, ${pct} percent of friends found. ${esc(nextTxt)}.</span>`;
  }

  function tile(emoji, value, label, extra) {
    return `<li class="stat-tile${extra ? ' ' + extra : ''}"><span class="stat-emoji" aria-hidden="true">${emoji}</span><span class="stat-val">${esc(value)}</span><span class="stat-lbl">${esc(label)}</span></li>`;
  }

  function render() {
    const s = snapshot(), today = G.todayKey ? G.todayKey() : '';
    const pct = s.total ? Math.round((s.found / s.total) * 100) : 0;
    const tiles = [
      tile('🧸', `${s.found} / ${s.total}`, 'friends found', 'big'),
      tile('★', `${s.legends} / ${s.legendTotal}`, 'legendary friends'),
      tile('🧪', s.mixes, s.mixes === 1 ? 'mix' : 'mixes'),
      tile('💕', s.pets, s.pets === 1 ? 'pet' : 'pets'),
      tile('✨', s.shinies, s.shinies === 1 ? 'shiny friend' : 'shiny friends'),
      tile('💗', s.faves, s.faves === 1 ? 'best friend' : 'best friends'),
      tile('🌟', s.bestCombo ? `×${s.bestCombo}` : '—', 'best combo'),
      tile('🔥', s.bestStreak, s.bestStreak === 1 ? 'day best streak' : 'days best streak'),
      tile('🏆', s.achTotal ? `${s.ach} / ${s.achTotal}` : s.ach, 'achievements'),
      tile('🎌', s.jpPlayed ? `${s.jpBest} / 5` : '—', 'best Name quiz')
    ];
    if (s.nicks) tiles.push(tile('🏷️', s.nicks, s.nicks === 1 ? 'nickname given' : 'nicknames given'));
    if (s.chain) tiles.push(tile('✦', s.chain, 'minted on Starknet', 'chain'));
    document.getElementById('statsGrid').innerHTML = tiles.join('');
    const rk = document.getElementById('statsRank');
    if (rk) {
      rk.innerHTML = rankHtml(s); rk.dataset.rank = String(rankOf(s.found, s.total).index);
      const fill = rk.querySelector('.rank-fill');
      // fill the ring on the next frame so it gently sweeps round (CSS skips the sweep in Gentle mode / reduced motion)
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.strokeDashoffset = fill.dataset.off; }));
    }

    const fav = document.getElementById('statsTop');
    if (s.top) {
      const e = D.byId[s.top], nick = G.nickOf ? G.nickOf(s.top) : '';
      const who = nick ? `${nick} the ${e.name}` : e.name;
      fav.hidden = false;
      fav.innerHTML = `<button type="button" class="stats-top-btn" data-open="${esc(s.top)}" aria-label="Most made friend: ${esc(who)}, made ${plural(s.topCount, 'time', 'times')}. Open their card">` +
        `<span class="stats-top-art" aria-hidden="true">${ART.render(e)}</span>` +
        `<span class="stats-top-txt"><span class="stats-top-k">🥇 Most made friend</span><span class="stats-top-n">${esc(who)}</span><span class="stats-top-c">made ${plural(s.topCount, 'time', 'times')}</span></span></button>`;
    } else { fav.hidden = true; fav.innerHTML = ''; }

    renderRecent(today);
    const since = document.getElementById('statsSince');
    if (s.since) {
      const d = today ? daysBetween(s.since, today) : 0;
      since.textContent = `📅 Mixing friends since ${fmtDay(s.since)}${d ? ` (${plural(d, 'day', 'days')} ago)` : ' (that\'s today!)'}`;
    } else since.textContent = '📅 Your adventure starts with your very first mix!';
    document.getElementById('statsSub').textContent = s.found >= s.total ? 'Everyone is here! You found every single friend 🎉' : `You've found ${pct}% of all friends. Keep mixing! 💕`;
    return s;
  }

  // 🗓️ Met today: the friends you met on your latest play day (today, or the last day you found someone)
  const RECENT_MAX = 12;
  function recentDay(today) {
    const st = G.state || {}, met = st.met && typeof st.met === 'object' ? st.met : {};
    const ids = Object.keys(met).filter(id => D.byId[id] && !D.byId[id].base && G.found.has(id) && /^\d{4}-\d{2}-\d{2}$/.test(met[id]));
    if (!ids.length) return { day: '', ids: [] };
    const day = ids.map(id => met[id]).sort().pop();
    // newest first: the save's found list is in discovery order
    const order = Array.isArray(st.found) ? st.found : [];
    const list = ids.filter(id => met[id] === day).sort((a, b) => order.lastIndexOf(b) - order.lastIndexOf(a));
    return { day, ids: list, today: day === today };
  }
  function renderRecent(today) {
    const box = document.getElementById('statsRecent'); if (!box) return null;
    const r = recentDay(today);
    if (!r.ids.length) { box.hidden = true; box.innerHTML = ''; return r; }
    const shown = r.ids.slice(0, RECENT_MAX), more = r.ids.length - shown.length;
    const head = r.today ? `🗓️ Met today · ${plural(r.ids.length, 'friend', 'friends')}` : `🗓️ Last time (${fmtDay(r.day)}) you met ${plural(r.ids.length, 'friend', 'friends')}`;
    box.hidden = false;
    box.innerHTML = `<p class="stats-recent-k" id="statsRecentHead">${esc(head)}</p><ul class="stats-recent-list" aria-labelledby="statsRecentHead">` +
      shown.map(id => { const e = D.byId[id], nick = G.nickOf ? G.nickOf(id) : '', who = nick ? `${nick} the ${e.name}` : e.name;
        return `<li><button type="button" class="stats-recent-btn" data-open="${esc(id)}" aria-label="${esc(who)}. Open their card"><span class="stats-recent-art" aria-hidden="true">${ART.render(e)}</span><span class="stats-recent-n">${esc(nick || e.name)}</span></button></li>`; }).join('') +
      (more > 0 ? `<li class="stats-recent-more" aria-label="and ${more} more">+${more}</li>` : '') + '</ul>';
    return r;
  }

  function openStats() {
    render();
    G.ui.closeModal('menu');
    G.ui.openModal('stats');
    G.ui.announce(`My stats. ${G.found.size} of ${D.elements.length} friends found. Mixer rank: ${rankOf(G.found.size, D.elements.length).name}.`);
    document.dispatchEvent(new CustomEvent('ef:stats'));
  }

  function init() {
    G = window.EF_GAME;
    const btn = document.getElementById('btnStats'); if (btn) btn.addEventListener('click', openStats);
    const rec = document.getElementById('statsRecent');
    if (rec) rec.addEventListener('click', ev => {
      const b = ev.target.closest('[data-open]'); if (!b || !G.found.has(b.dataset.open)) return;
      G.openDetail(b.dataset.open);
    });
    document.getElementById('statsTop').addEventListener('click', ev => {
      const b = ev.target.closest('[data-open]'); if (!b || !G.found.has(b.dataset.open)) return;
      G.openDetail(b.dataset.open);
    });
    // 🎖️ Rank up: when a discovery lifts you to a new Mixer rank, the reveal card says so
    document.addEventListener('ef:reveal', ev => {
      const el = document.getElementById('revealRank'); if (!el) return;
      const id = ev.detail && ev.detail.id, list = (G.state && Array.isArray(G.state.found)) ? G.state.found : [];
      const n = list.indexOf(id) + 1, total = D.elements.length;
      const before = n > 0 ? rankOf(n - 1, total) : null, now = n > 0 ? rankOf(n, total) : null;
      if (!now || now.index <= before.index) { el.hidden = true; el.textContent = ''; return; }
      el.hidden = false; el.dataset.rank = String(now.index);
      el.textContent = `🎖️ Rank up! You're now a ${now.emoji} ${now.name}!`;
      setTimeout(() => G.ui.announce(`Rank up! You're now a ${now.name}.`), 900);
      document.dispatchEvent(new CustomEvent('ef:rankup', { detail: { index: now.index, name: now.name, found: n } }));
    });
    window.EF_STATS = { open: openStats, snapshot: () => snapshot(), render, rank: (f, t) => rankOf(f, t), recent: () => recentDay(G.todayKey ? G.todayKey() : '') };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
