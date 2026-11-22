/* Element Friends — 🌱 Family tree: see how a friend was made, all the way back to the first four.
   Offline, read-only: builds a cozy nested tree from the recipe data and never changes the save.
   Spoiler-safe: a recipe step only opens up when BOTH its ingredients are already found — the same
   rule the friend card uses to decide whether to show a recipe or a "???". */
(function () {
  'use strict';
  const D = window.EF_DATA, ART = window.EF_ART;
  if (!D || !ART) return;
  const MAX_DEPTH = 14, MAX_NODES = 220;
  let G, root = null, current = '', history = [];

  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const recipesFor = id => D.recipes.filter(r => r[2] === id);

  // The recipe we're allowed to reveal for `id`: the first (in data order) whose BOTH ingredients
  // are found. Returns [a, b] or null (keep it a secret). Mirrors game.js: known = found(a) && found(b).
  function shownRecipe(id, found) {
    for (const r of recipesFor(id)) if (found.has(r[0]) && found.has(r[1])) return [r[0], r[1]];
    return null;
  }

  // Pure, testable tree builder. `found` is a Set of ids. Returns:
  //   { root: node, friends, generations, bases }
  //   node = { id, name, base, parents:[node,node]|null, reason, tappable }
  //   reason: 'root' | 'grown' | 'base' | 'secret' | 'more' | 'loop'
  function build(id, found, ctx, depth, path) {
    ctx.count++;
    if (id !== ctx.rootId) ctx.ids.add(id);
    const e = D.byId[id], base = !!(e && e.base);
    if (depth > ctx.maxDepth) ctx.maxDepth = depth;
    const node = { id, name: e ? e.name : id, base, parents: null, reason: 'grown', tappable: false };
    if (base) { node.reason = 'base'; ctx.bases.add(id); return node; }
    if (path.has(id)) { node.reason = 'loop'; return node; }
    if (depth >= MAX_DEPTH || ctx.count >= MAX_NODES) { node.reason = 'more'; node.tappable = depth > 0; return node; }
    const rec = shownRecipe(id, found);
    if (!rec) { node.reason = 'secret'; return node; }
    node.tappable = depth > 0;
    const np = new Set(path); np.add(id);
    node.parents = [build(rec[0], found, ctx, depth + 1, np), build(rec[1], found, ctx, depth + 1, np)];
    return node;
  }

  function tree(rootId, foundSet) {
    const found = foundSet || (G ? G.found : new Set());
    const ctx = { count: 0, maxDepth: 0, ids: new Set(), bases: new Set(), rootId };
    const r = build(rootId, found, ctx, 0, new Set());
    r.reason = r.base ? 'base' : (r.parents ? 'root' : 'secret');
    r.tappable = false;
    return { root: r, friends: ctx.ids.size, generations: ctx.maxDepth, bases: ctx.bases.size };
  }

  // ---------- rendering ----------
  const TAG = { base: '💛 one of the first four', secret: '🔒 secret mix', more: '… keep looking', loop: '🔁' };
  function nodeEl(node) {
    const wrap = document.createElement('div');
    wrap.className = 'lin-node reason-' + node.reason + (node.parents ? ' has-kids' : '');
    const e = D.byId[node.id];
    const chip = document.createElement(node.tappable ? 'button' : 'div');
    chip.className = 'lin-chip';
    if (node.tappable) {
      chip.type = 'button';
      chip.dataset.reroot = node.id;
      chip.setAttribute('aria-label', `${e ? e.name : node.id}. Show this friend's family tree`);
    } else {
      const why = node.reason === 'base' ? ', one of the first four friends'
        : node.reason === 'secret' ? '. Its recipe is still a secret — keep mixing!'
          : node.reason === 'loop' ? '' : '';
      chip.setAttribute('aria-label', (e ? e.name : node.id) + why);
    }
    const tag = TAG[node.reason] ? `<span class="lin-tag">${TAG[node.reason]}</span>` : '';
    chip.innerHTML = `<span class="lin-art" aria-hidden="true">${e ? ART.render(e, { label: false }) : '❓'}</span>` +
      `<span class="lin-name">${esc(e ? e.name : node.id)}</span>${tag}`;
    wrap.appendChild(chip);
    if (node.parents) {
      const kids = document.createElement('div');
      kids.className = 'lin-kids';
      kids.appendChild(nodeEl(node.parents[0]));
      kids.appendChild(nodeEl(node.parents[1]));
      wrap.appendChild(kids);
    }
    return wrap;
  }

  function render() {
    const info = tree(current), e = D.byId[current];
    const name = (G.nickOf && G.nickOf(current)) || (e ? e.name : current);
    document.getElementById('linTitle').innerHTML = `🌱 ${esc(name)}<span class="lin-title-sub"> family tree</span>`;
    const sub = document.getElementById('linSub');
    if (info.root.base) {
      sub.textContent = `💛 ${name} is one of the four friends every mix starts from. Everyone else grows from these!`;
    } else if (!info.root.parents) {
      sub.textContent = `Mix ${name} from friends you've already found, and its family tree will grow right here 🌱`;
    } else {
      const f = info.friends, g = info.generations;
      const tail = info.bases ? ' back to the first four 💧🔥🌱🍃' : '';
      sub.textContent = `🌱 ${name} is made from ${f} friend${f === 1 ? '' : 's'}, ${g} generation${g === 1 ? '' : 's'}${tail}!`;
    }
    const treeBox = document.getElementById('linTree');
    treeBox.innerHTML = '';
    treeBox.appendChild(nodeEl(info.root));
    treeBox.scrollTop = 0;
    const back = document.getElementById('linBack');
    if (back) back.hidden = history.length === 0;
    G.ui.announce(`${name}'s family tree. ${sub.textContent.replace(/^[^A-Za-z]+/, '')}`);
  }

  function reroot(id) {
    if (!id || !D.byId[id] || id === current) return;
    history.push(current); current = id;
    if (window.EF_AUDIO) try { window.EF_AUDIO.play('flip'); } catch (e) { /* ignore */ }
    render();
    document.dispatchEvent(new CustomEvent('ef:lineage', { detail: { id, depth: history.length } }));
  }
  function back() {
    if (!history.length) return;
    current = history.pop();
    if (window.EF_AUDIO) try { window.EF_AUDIO.play('flip'); } catch (e) { /* ignore */ }
    render();
  }
  function open(id) {
    if (!id) { const da = document.getElementById('detailArt'); id = da && da.dataset ? da.dataset.id : ''; }
    if (!id || !D.byId[id]) return false;
    if (window.EF_AUDIO) try { window.EF_AUDIO.unlock && window.EF_AUDIO.unlock(); } catch (e) { /* ignore */ }
    current = id; history = [];
    render();
    G.ui.openModal('lineage');
    document.dispatchEvent(new CustomEvent('ef:lineage', { detail: { id, depth: 0 } }));
    return true;
  }

  function init() {
    G = window.EF_GAME;
    if (!G || !document.getElementById('lineage')) return;
    const btn = document.getElementById('detailTree');
    if (btn) btn.addEventListener('click', () => open());
    const back1 = document.getElementById('linBack');
    if (back1) back1.addEventListener('click', back);
    const treeBox = document.getElementById('linTree');
    if (treeBox) treeBox.addEventListener('click', ev => {
      const b = ev.target.closest('[data-reroot]'); if (b) reroot(b.dataset.reroot);
    });
    // expose the pure builder for tests and for other modules
    window.EF_LINEAGE = { open, tree, back, reroot: id => reroot(id), current: () => current };
  }

  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
