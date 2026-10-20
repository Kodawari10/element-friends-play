/* Element Friends: optional Starknet layer.
 * Connect via Cartridge (StarkZap: social/passkey, sponsored fees) or a browser extension
 * (Ready, Braavos… via get-starknet-core). Both vendor bundles are local and lazy-loaded.
 * Without a wallet (or offline) nothing here runs any network request and the game is unaffected. */
(function () {
  'use strict';
  const C = Object.assign({}, window.EF_STARKNET_CONFIG || {}, window.EF_STARKNET_CONFIG_OVERRIDE || {});
  if (!C.enabled || !window.EF_CHAIN_IDS || !window.EF_SELECTORS) return;
  const D = window.EF_DATA, ART = window.EF_ART, SEL = window.EF_SELECTORS;
  const IDS = window.EF_CHAIN_IDS.ids; const NUM = {}; Object.keys(IDS).forEach(k => { NUM[IDS[k]] = k; });
  const KEY = 'element-friends-chain-v1';
  const $ = s => document.querySelector(s);
  let G = null;
  let wallet = null, address = null, chainOk = true, busy = false;
  let walletKind = null; // 'cartridge' | 'extension'
  let feeMode = (C.cartridge && C.cartridge.feeMode) || { type: 'paymaster' };
  let feeFallbackUsed = false;
  let cs = loadCs();
  const minted = new Set(cs.address ? cs.minted || [] : []);
  // World firsts: who minted each friend first, anywhere on Starknet (cached once known; it never changes)
  const firstBy = new Map(); let worldFirsts = null;
  const EV = window.EF_EVENTS || {};
  const ZERO = '0x' + '0'.repeat(64);
  const configured = /^0x[0-9a-fA-F]{1,64}$/.test(C.contractAddress || '');
  const cartridgeOn = !!(C.cartridge && C.cartridge.enabled !== false);

  function loadCs() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function saveCs() { cs.minted = [...minted]; try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) { /* ignore */ } }
  const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
  const hex = n => '0x' + BigInt(n).toString(16);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Display name: always call Argent X "Ready" in the UI (detection still uses the injected id/name).
  function displayWalletName(w) {
    const id = String((w && w.id) || '').toLowerCase();
    const name = String((w && w.name) || '');
    if (/argent|ready/i.test(id) || /argent/i.test(name)) return 'Ready';
    return name || (w && w.id) || 'Wallet';
  }

  // ---------- vendor loaders (lazy) ----------
  let gsnP = null, szP = null;
  function loadGsn() {
    if (gsnP) return gsnP;
    gsnP = new Promise((res, rej) => {
      if (window.EF_GSN) return res(window.EF_GSN);
      const s = document.createElement('script'); s.src = 'js/vendor/get-starknet-core.js';
      s.onload = () => window.EF_GSN ? res(window.EF_GSN) : rej(new Error('wallet library failed to load'));
      s.onerror = () => { gsnP = null; rej(new Error('wallet library failed to load')); };
      document.head.appendChild(s);
    });
    return gsnP;
  }
  function loadStarkzap() {
    if (szP) return szP;
    szP = new Promise((res, rej) => {
      if (window.EF_STARKZAP && window.EF_STARKZAP.connect) return res(window.EF_STARKZAP);
      const s = document.createElement('script'); s.src = 'js/vendor/starkzap.js';
      s.onload = () => (window.EF_STARKZAP && window.EF_STARKZAP.connect) ? res(window.EF_STARKZAP) : rej(new Error('StarkZap failed to load'));
      s.onerror = () => { szP = null; rej(new Error('StarkZap failed to load')); };
      document.head.appendChild(s);
    });
    return szP;
  }
  function walletWindow() { const o = {}; Object.getOwnPropertyNames(window).forEach(k => { if (k.startsWith('starknet')) o[k] = window[k]; }); return o; }
  async function gsn() { const lib = await loadGsn(); return lib.getStarknet({ windowObject: walletWindow() }); }
  function iconSrc(w) { const i = w && w.icon; if (!i) return ''; if (typeof i === 'string') return i; return i.light || i.dark || ''; }

  function cartridgePolicies() {
    if (!configured) return [];
    const methods = (C.cartridge && C.cartridge.methods) || ['discover', 'discover_batch'];
    return methods.map(method => ({ target: C.contractAddress, method }));
  }

  // ---------- RPC (read-only views) ----------
  async function rpc(method, params) {
    const r = await fetch(C.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
    const j = await r.json(); if (j.error) throw new Error(j.error.message || 'RPC error'); return j.result;
  }
  const call = (fn, calldata) => rpc('starknet_call', { request: { contract_address: C.contractAddress, entry_point_selector: SEL[fn], calldata: calldata || [] }, block_id: 'latest' });
  async function waitTx(hash) {
    for (let i = 0; i < 90; i++) {
      try {
        const r = await rpc('starknet_getTransactionReceipt', { transaction_hash: hash });
        if (r && r.execution_status === 'REVERTED') throw new Error('Transaction reverted: ' + (r.revert_reason || '').slice(0, 140));
        if (r && r.execution_status === 'SUCCEEDED') return r;
      } catch (e) { if (/reverted/.test(e.message)) throw e; }
      await new Promise(r => setTimeout(r, i < 5 ? 1500 : 3000));
    }
    throw new Error('Timed out waiting for the transaction');
  }

  // ---------- connect ----------
  function openPicker() { G.ui.openModal('wallets'); renderPicker(); }
  async function renderPicker() {
    const box = $('#walletList'); $('#walletsNet').textContent = C.networkName || C.network;
    box.innerHTML = '<p class="muted">Looking for wallets…</p>';

    let list = [];
    try { list = await (await gsn()).getAvailableWallets(); } catch (e) { /* extensions optional */ }

    const parts = [];
    if (cartridgeOn) {
      parts.push(`<button type="button" class="btn wide wallet-opt cartridge-opt" id="optCartridge" aria-label="Play with Cartridge">
        <span class="wallet-ph cart-ico" aria-hidden="true">✦</span>
        <span class="wallet-meta"><b>Play with Cartridge</b><small>Social / passkey · no seed phrase · free mints when sponsored</small></span>
      </button>`);
      if (list.length) parts.push('<p class="wallet-or muted">— or a browser wallet —</p>');
    }

    if (list.length) {
      list.forEach((w, i) => {
        const label = displayWalletName(w);
        parts.push(`<button type="button" class="btn wide wallet-opt" data-ext="${i}" aria-label="Connect ${esc(label)}">
          ${iconSrc(w) ? `<img src="${esc(iconSrc(w))}" alt="" width="30" height="30">` : '<span class="wallet-ph">✦</span>'}
          <span>${esc(label)}</span>
        </button>`);
      });
    } else if (!cartridgeOn) {
      parts.push(`<div class="nowallet"><div class="nowallet-art is-confused">${ART.render(D.byId.cloud, { label: false })}</div>
        <p><b>No Starknet wallet found</b></p>
        <p class="muted">Install one of these browser wallets, then come back. No worries, the game works perfectly without a wallet!</p>
        ${(C.installLinks || []).map(l => `<a class="btn wide" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)} ↗</a>`).join('')}
        <button class="btn wide primary" data-close>Keep playing ♡</button></div>`);
    } else {
      parts.push(`<div class="nowallet-lite muted">No browser wallet detected. You can still use Cartridge above, or install
        ${(C.installLinks || []).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)}</a>`).join(' · ')}.</div>
        <button class="btn wide primary" data-close>Keep playing ♡</button>`);
    }

    box.innerHTML = parts.join('');
    const cartBtn = $('#optCartridge');
    if (cartBtn) cartBtn.onclick = () => connectCartridge();
    box.querySelectorAll('[data-ext]').forEach(b => {
      b.onclick = () => connectExtension(list[Number(b.getAttribute('data-ext'))]);
    });
  }

  async function connectCartridge() {
    try {
      setBusyPicker(true);
      const sz = await loadStarkzap();
      const cart = C.cartridge || {};
      const connected = await sz.connect({
        network: C.network || 'sepolia',
        rpcUrl: C.rpcUrl,
        allowInsecureHttp: !!C.allowInsecureHttp,
        paymaster: cart.paymaster,
        policies: cartridgePolicies(),
        preset: cart.preset,
        url: cart.url,
        feeMode: cart.feeMode || { type: 'paymaster' },
        deploy: cart.deploy || 'if_needed',
      });
      feeMode = cart.feeMode || { type: 'paymaster' };
      feeFallbackUsed = false;
      wallet = connected; walletKind = 'cartridge';
      address = normalize(connected.address);
      chainOk = true;
      if (cs.address !== address) minted.clear();
      cs.walletId = 'cartridge'; cs.address = address; saveCs();
      G.ui.closeModal('wallets'); refreshButton();
      let who = short(address);
      try { const u = await connected.username(); if (u) who = u; } catch (e) { /* optional */ }
      G.ui.toast(`Connected with Cartridge ✦ ${who}`); G.ui.announce('Cartridge connected');
      await sync(true);
      return true;
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      G.ui.toast(/popup|block/i.test(msg)
        ? 'Cartridge needs a popup — please allow popups for this site ♡'
        : 'Cartridge connection cancelled' + (msg ? ': ' + msg.slice(0, 80) : ''));
      return false;
    } finally { setBusyPicker(false); }
  }

  async function connectExtension(w, silent) {
    try {
      const g = await gsn();
      const sw = await g.enable(w, silent ? { silent_mode: true } : undefined);
      const accts = await sw.request({ type: 'wallet_requestAccounts', params: silent ? { silent_mode: true } : {} });
      if (!accts || !accts.length) throw new Error('No account was shared');
      wallet = sw; walletKind = 'extension'; address = normalize(accts[0]);
      let chainId = null; try { chainId = await sw.request({ type: 'wallet_requestChainId' }); } catch (e) { /* older wallets */ }
      chainOk = !chainId || BigInt(chainId) === BigInt(C.chainId);
      if (!chainOk && !silent) {
        try { await sw.request({ type: 'wallet_switchStarknetChain', params: { chainId: C.chainId } }); chainOk = true; } catch (e) { /* user said no */ }
      }
      if (cs.address !== address) minted.clear();
      cs.walletId = w.id; cs.address = address; saveCs();
      try {
        sw.on && sw.on('accountsChanged', a => { if (a && a[0]) { address = normalize(a[0]); cs.address = address; minted.clear(); saveCs(); refreshButton(); sync(); } else disconnect(); });
        sw.on && sw.on('networkChanged', c => { chainOk = !c || BigInt(c) === BigInt(C.chainId); refreshButton(); });
      } catch (e) { /* optional */ }
      G.ui.closeModal('wallets'); refreshButton();
      if (!silent) { G.ui.toast(chainOk ? `Connected ✦ ${short(address)}` : `Connected, but please switch your wallet to ${C.networkName}`); G.ui.announce('Wallet connected'); }
      await sync(!silent);
      return true;
    } catch (e) {
      if (!silent) G.ui.toast('Wallet connection cancelled' + (e && e.message ? ': ' + e.message.slice(0, 80) : ''));
      return false;
    }
  }

  function setBusyPicker(on) {
    const b = $('#optCartridge'); if (b) { b.disabled = on; b.classList.toggle('busy', on); }
  }
  function normalize(a) { return '0x' + BigInt(a).toString(16).padStart(64, '0'); }
  // Reads WorldFirst events for this player from a receipt (keys: [selector, player, element]).
  function worldFirstsIn(rcpt) {
    const out = []; if (!rcpt || !Array.isArray(rcpt.events) || !EV.WorldFirst || !address) return out;
    rcpt.events.forEach(ev => {
      try {
        const k = ev.keys || [];
        if (k.length < 3 || BigInt(k[0]) !== BigInt(EV.WorldFirst)) return;
        if (C.contractAddress && ev.from_address && BigInt(ev.from_address) !== BigInt(C.contractAddress)) return;
        if (normalize(k[1]) !== normalize(address)) return;
        const id = NUM[Number(BigInt(k[2]))]; if (id && !out.includes(id)) { out.push(id); firstBy.set(id, normalize(address)); }
      } catch (e) { /* ignore odd events */ }
    });
    return out;
  }
  async function firstOf(id) {
    if (firstBy.has(id)) return firstBy.get(id);
    const r = await call('first_discoverer', [hex(IDS[id])]);
    const who = normalize(r[0]); if (who !== ZERO) firstBy.set(id, who);
    return who;
  }

  async function disconnect() {
    try {
      if (walletKind === 'cartridge' && wallet && typeof wallet.disconnect === 'function') await wallet.disconnect();
      else if (walletKind === 'extension') { try { (await gsn()).disconnect({ clearLastWallet: true }); } catch (e) { /* ignore */ } }
    } catch (e) { /* ignore */ }
    wallet = null; walletKind = null; address = null; cs = {}; minted.clear(); saveCs(); worldFirsts = null;
    feeFallbackUsed = false;
    refreshButton(); G.ui.closeModal('chainPanel'); G.ui.toast('Wallet disconnected. Your friends stay right here ♡');
  }
  async function ensureConnected() { if (wallet && address) return true; openPicker(); return false; }

  // ---------- sync ----------
  let fpMismatch = false;
  async function sync(loud) {
    if (!configured || !address) return;
    try {
      const r = await call('discoveries_of', [address]);
      const n = parseInt(r[0], 16); const list = r.slice(1, 1 + n).map(x => NUM[parseInt(x, 16)]).filter(Boolean);
      minted.clear(); list.forEach(id => minted.add(id)); saveCs();
      const added = G.importDiscoveries(list);
      if (added) G.ui.toast(`✦ Synced ${added} friend${added > 1 ? 's' : ''} from Starknet!`);
      else if (loud && list.length) G.ui.toast(`✦ ${list.length} friends are on Starknet`);
      try { fpMismatch = BigInt((await call('table_fingerprint'))[0]) !== BigInt(window.EF_CHAIN_IDS.fingerprint); } catch (e) { /* older deploy */ }
      decorate();
    } catch (e) { if (loud) G.ui.toast('Could not reach Starknet right now. Try again later.'); }
  }

  // ---------- planning ----------
  function plan(targets) {
    const local = G.found, have = new Set(minted), steps = [];
    D.elements.filter(e => e.base && local.has(e.id) && !have.has(e.id)).forEach(e => { have.add(e.id); steps.push({ id: e.id, a: null, b: null }); });
    const parent = {}; let grew = true;
    while (grew) {
      grew = false;
      for (const [a, b, r] of D.recipes) if (have.has(a) && have.has(b) && !have.has(r) && local.has(r)) { have.add(r); parent[r] = [a, b]; steps.push({ id: r, a, b }); grew = true; }
    }
    const need = new Set();
    const want = id => { if (need.has(id) || minted.has(id)) return; need.add(id); if (parent[id]) { want(parent[id][0]); want(parent[id][1]); } };
    targets.forEach(id => { if (have.has(id)) want(id); });
    return steps.filter(s => need.has(s.id));
  }
  function calldataFor(steps) {
    const cd = [hex(steps.length)];
    steps.forEach(s => { cd.push(hex(IDS[s.id]), hex(s.a ? IDS[s.a] : 0), hex(s.b ? IDS[s.b] : 0)); });
    return cd;
  }

  function isSponsoredMode(m) {
    return m === 'sponsored' || (m && typeof m === 'object' && m.type === 'paymaster');
  }
  function shouldFallbackFees(err) {
    const msg = err && err.message ? err.message : String(err || '');
    return /SNIP-9|not compatible with SNIP|paymaster|sponsor|gasless|outside.?execution|policy/i.test(msg);
  }

  async function invokeDiscoverBatch(chunk) {
    const cd = calldataFor(chunk);
    if (walletKind === 'cartridge') {
      const call = { contractAddress: C.contractAddress, entrypoint: 'discover_batch', calldata: cd };
      const tryMode = feeFallbackUsed ? ((C.cartridge && C.cartridge.fallbackFeeMode) || 'user_pays') : feeMode;
      try {
        return await wallet.execute([call], { feeMode: tryMode });
      } catch (err) {
        if (!feeFallbackUsed && isSponsoredMode(feeMode) && shouldFallbackFees(err)) {
          feeFallbackUsed = true;
          G.ui.toast('Free minting isn’t available right now — your wallet will pay the (tiny) fee ♡');
          return await wallet.execute([call], { feeMode: (C.cartridge && C.cartridge.fallbackFeeMode) || 'user_pays' });
        }
        throw err;
      }
    }
    // Browser extension (Ready / Braavos / …)
    return await wallet.request({
      type: 'wallet_addInvokeTransaction',
      params: { calls: [{ contract_address: C.contractAddress, entry_point: 'discover_batch', calldata: cd }] },
    });
  }

  // ---------- minting ----------
  async function mint(targets, statusEl) {
    if (!configured) { G.ui.toast('The Element Friends contract is not deployed yet (see contracts/README.md).'); return; }
    if (busy) return;
    if (!(await ensureConnected())) return;
    if (!chainOk) { G.ui.toast(`Please switch your wallet to ${C.networkName} first`); return; }
    const steps = plan(targets);
    const stuck = targets.filter(t => !minted.has(t) && !steps.some(s => s.id === t));
    if (!steps.length) {
      if (stuck.length) G.ui.toast(`${D.byId[stuck[0]].name} needs friends you haven't found in this game yet ♡`);
      else G.ui.toast('Already on Starknet ✦');
      decorate(); return;
    }
    busy = true; const firsts = [];
    const freeHint = walletKind === 'cartridge' && isSponsoredMode(feeMode) && !feeFallbackUsed;
    setStatus(statusEl, freeHint ? 'Minting for free with Cartridge… ✦' : 'Check your wallet to approve ✦');
    try {
      const size = Math.max(1, C.batchSize || 30);
      for (let i = 0; i < steps.length; i += size) {
        const chunk = steps.slice(i, i + size);
        const res = await invokeDiscoverBatch(chunk);
        const h = res && (res.transaction_hash || res.transactionHash || res.hash);
        setStatus(statusEl, `Minting${steps.length > size ? ` (${Math.min(i + size, steps.length)}/${steps.length})` : ''}… <a href="${C.explorerTx}${h}" target="_blank" rel="noopener noreferrer">view tx</a>`);
        const rcpt = await waitTx(h);
        chunk.forEach(s => minted.add(s.id)); saveCs();
        firsts.push(...worldFirstsIn(rcpt));
      }
      const legend = steps.some(s => D.byId[s.id].final);
      setStatus(statusEl, `Minted on Starknet! ✦ ${steps.length} friend${steps.length > 1 ? 's' : ''}${firsts.length ? ` · 🌍 ${firsts.length} world first${firsts.length > 1 ? 's' : ''}!` : ''}`);
      if (firsts.length) {
        const nm = firsts.length === 1 ? ((G.nickOf && G.nickOf(firsts[0])) || D.byId[firsts[0]].name) : null;
        const msg = nm ? `🌍 World first! You're the very first on Starknet to find ${nm}!` : `🌍 ${firsts.length} world firsts! Nobody on Starknet found these friends before you!`;
        G.ui.toast(msg); G.ui.announce(msg); G.ui.confetti(legend ? 120 : 70);
        if (worldFirsts != null) worldFirsts += firsts.length;
        document.dispatchEvent(new CustomEvent('ef:worldfirst', { detail: { ids: firsts.slice() } }));
      } else {
        G.ui.toast(`✦ ${steps.length} friend${steps.length > 1 ? 's' : ''} minted on Starknet!`); G.ui.confetti(legend ? 90 : 30);
        G.ui.announce('Minted on Starknet');
      }
      decorate();
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      setStatus(statusEl, /reject|cancel|abort|denied/i.test(msg) ? 'Mint cancelled, no worries ♡' : 'Mint failed: ' + esc(msg.slice(0, 120)));
    } finally { busy = false; }
  }
  let panelMsg = '';
  function setStatus(el, html) { if (!el) return; el.innerHTML = html; if (el.id === 'panelStatus') { panelMsg = html; const b = $('#mintAll'); if (b) b.disabled = busy || b.disabled; } }

  // ---------- UI ----------
  const btn = $('#btnWallet');
  function refreshButton() {
    btn.hidden = false;
    btn.classList.toggle('connected', !!address); btn.classList.toggle('wrongnet', !!address && !chainOk);
    $('#btnWalletLbl').textContent = address ? short(address) : 'Connect';
    btn.setAttribute('aria-label', address ? `Starknet wallet ${short(address)} connected. Open Starknet panel` : 'Connect a Starknet wallet (optional)');
  }
  btn.addEventListener('click', () => { if (address) openPanel(); else openPicker(); });

  async function openPanel() {
    panelMsg = ''; G.ui.openModal('chainPanel'); renderPanel();
    if (configured && address) { await sync(); renderPanel(); loadBoard(); }
  }
  function renderPanel(board) {
    const body = $('#chainBody');
    const localN = G.found.size, onN = minted.size, legend = [...minted].filter(id => D.byId[id].final).length;
    const toMint = plan([...G.found]).length;
    const via = walletKind === 'cartridge' ? ' · via Cartridge' : '';
    const feeNote = walletKind === 'cartridge'
      ? (feeFallbackUsed ? '<div class="chain-note">Fees: your wallet pays (sponsorship unavailable).</div>'
        : '<div class="chain-note">Fees: sponsored when Cartridge paymaster is available ✦</div>')
      : '';
    body.innerHTML = `
      <div class="net-pill ${chainOk ? '' : 'bad'}">${chainOk ? '●' : '▲'} ${esc(C.networkName)}${via}${chainOk ? '' : ': please switch network in your wallet'}</div>
      <p class="addr" title="${esc(address || '')}">${esc(short(address))} <button class="btn mini" id="copyAddr" aria-label="Copy address">copy</button></p>
      ${configured ? '' : `<div class="chain-note">The Element Friends contract isn't deployed yet, so minting is off. Your friends are safe on this device. (Deploy steps are in <code>contracts/README.md</code>.)</div>`}
      ${fpMismatch ? `<div class="chain-note">Heads up: this game version has newer recipes than the deployed contract.</div>` : ''}
      ${feeNote}
      <div class="chain-stats">
        <div><b>${onN}</b><span>on Starknet</span></div>
        <div><b>${localN}</b><span>on this device</span></div>
        <div><b>${legend}</b><span>legendary badges</span></div>
      </div>
      ${configured ? `<p class="world-sum" id="worldSum">🌍 ${worldFirsts == null ? 'Counting your world firsts…' : worldFirsts ? `You're the world's first finder of <b>${worldFirsts}</b> friend${worldFirsts > 1 ? 's' : ''} on Starknet!` : 'No world firsts yet. Mint a friend nobody has found to be the first!'}</p>` : ''}
      <button class="btn wide chain" id="mintAll" ${configured && toMint && !busy ? '' : 'disabled'}>✦ Mint all my friends${toMint ? ` (${toMint} new)` : ''}</button>
      <p class="mint-status" id="panelStatus" role="status" aria-live="polite">${panelMsg}</p>
      <button class="btn wide" id="syncNow" ${configured ? '' : 'disabled'}>↻ Sync from Starknet</button>
      <h3 class="lb-title">Leaderboard</h3>
      <ol class="leaderboard" id="leaderboard">${board || `<li class="muted">${configured ? 'Loading…' : 'Available once the contract is deployed.'}</li>`}</ol>
      ${configured ? `<p class="muted small"><a href="${C.explorerContract}${C.contractAddress}" target="_blank" rel="noopener noreferrer">View contract ↗</a></p>` : ''}
      <button class="btn wide danger" id="disc">Disconnect</button>`;
    $('#copyAddr').onclick = () => { try { navigator.clipboard.writeText(address); G.ui.toast('Address copied'); } catch (e) { /* ignore */ } };
    $('#mintAll').onclick = async () => { await mint([...G.found], $('#panelStatus')); renderPanel(lastBoard); loadBoard(); };
    $('#syncNow').onclick = async () => { await sync(true); renderPanel(lastBoard); loadBoard(); };
    $('#disc').onclick = disconnect;
  }
  let lastBoard = '';
  async function loadBoard() {
    try {
      try { worldFirsts = parseInt((await call('world_firsts_of', [address]))[0], 16) || 0; } catch (e) { /* older deploy without world firsts */ }
      const n = parseInt((await call('player_count'))[0], 16);
      const r = await call('leaderboard', ['0x0', hex(Math.min(n, 200))]);
      const len = parseInt(r[0], 16), rows = [];
      for (let i = 0; i < len; i++) rows.push({ p: normalize(r[1 + i * 3]), d: parseInt(r[2 + i * 3], 16), l: parseInt(r[3 + i * 3], 16) });
      rows.sort((a, b) => b.d - a.d || b.l - a.l);
      lastBoard = rows.slice(0, 10).map((x, i) => `<li class="${x.p === address ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who">${x.p === address ? 'You' : esc(short(x.p))}</span><span class="sc">${x.d} ✦${x.l ? ` · ${x.l}★` : ''}</span></li>`).join('') || '<li class="muted">No players yet. Be the first! ✦</li>';
      if (!$('#chainPanel').hidden) renderPanel(lastBoard);
    } catch (e) { lastBoard = '<li class="muted">Leaderboard unavailable right now.</li>'; if (!$('#chainPanel').hidden) renderPanel(lastBoard); }
  }

  let revealId = null;
  document.addEventListener('ef:reveal', ev => {
    revealId = ev.detail.id; const b = $('#revealMint'); $('#revealMintStatus').textContent = '';
    b.hidden = minted.has(revealId);
    b.disabled = false; b.textContent = address ? '✦ Mint on Starknet' : '✦ Mint on Starknet (connect)';
  });
  $('#revealMint').addEventListener('click', async () => { if (!address) { openPicker(); return; } await mint([revealId], $('#revealMintStatus')); if (minted.has(revealId)) $('#revealMint').hidden = true; });

  function decorate() {
    document.querySelectorAll('.book-cell').forEach((c, i) => {
      const e = D.elements[i]; const on = e && minted.has(e.id);
      c.classList.toggle('onchain', !!on);
      let badge = c.querySelector('.chain-badge');
      if (on && !badge) { badge = document.createElement('span'); badge.className = 'chain-badge'; badge.title = 'Minted on Starknet'; badge.textContent = '✦'; c.appendChild(badge); }
      if (!on && badge) badge.remove();
    });
    const sub = $('#bookSub');
    if (sub && address) { let s = sub.querySelector('.chain-sub'); if (!s) { s = document.createElement('span'); s.className = 'chain-sub'; sub.appendChild(s); } s.textContent = ` · ✦ ${minted.size} on Starknet`; }
    if (!$('#detail').hidden && detailId) renderDetail(detailId);
    if (!$('#reveal').hidden && revealId && minted.has(revealId)) $('#revealMint').hidden = true;
  }
  document.addEventListener('ef:book', () => { decorate(); if (address && configured) sync(); });
  let detailId = null;
  function renderDetail(id) {
    const box = $('#detailChain'); detailId = id;
    const wf = configured && address && !D.byId[id].base ? '<p class="world-first" id="detailFirst"></p>' : '';
    if (minted.has(id)) box.innerHTML = `<div class="chain-chip">✦ Minted on Starknet${D.byId[id].final ? ' · Legendary badge ★' : ''}</div>${wf}`;
    else {
      box.innerHTML = `<button class="btn chain" id="detailMint">✦ Mint on Starknet</button><p class="mint-status" id="detailStatus" role="status" aria-live="polite"></p>${wf}`;
      $('#detailMint').onclick = () => mint([id], $('#detailStatus'));
    }
    if (wf) renderFirst(id);
    if (minted.has(id) && configured && address) renderToken(id);
  }
  // Collectible card 🎴: the friend's soulbound token number, with a link to its page on the explorer
  const tokenBy = new Map(); // `${address}|${id}` -> token number (string); never changes once minted
  async function tokenOf(id) {
    const k = address + '|' + id;
    if (tokenBy.has(k)) return tokenBy.get(k);
    const r = await call('token_of', [address, hex(IDS[id])]);
    const n = BigInt(r[0] || 0) + (BigInt(r[1] || 0) << 128n);
    if (n > 0n) tokenBy.set(k, n.toString());
    return n > 0n ? n.toString() : null;
  }
  async function renderToken(id) {
    const box = $('#detailChain'); if (!box || $('#detailToken')) return;
    const el = document.createElement('p'); el.className = 'token-line'; el.id = 'detailToken'; el.hidden = !tokenBy.has(address + '|' + id);
    box.appendChild(el);
    let n = null; try { n = await tokenOf(id); } catch (e) { n = null; }
    const cur = $('#detailToken'); if (detailId !== id || !cur) return;
    if (!n) { cur.hidden = true; return; }
    const name = esc((G.nickOf && G.nickOf(id)) || D.byId[id].name);
    const url = (C.explorerNft || 'https://sepolia.voyager.online/nft/') + C.contractAddress + '/' + n;
    cur.hidden = false;
    cur.innerHTML = `<span class="token-no" aria-hidden="true">🎴 Collectible #${esc(n)}</span><span class="sr-only">${name} is your Starknet collectible number ${esc(n)}.</span> <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${name}'s collectible on Voyager (opens in a new tab)">View on Voyager ↗</a>`;
  }
  async function renderFirst(id) {
    const el = $('#detailFirst'); if (!el) return;
    const name = esc((G.nickOf && G.nickOf(id)) || D.byId[id].name);
    if (!firstBy.has(id)) el.textContent = '🌍 Checking who found this friend first…';
    let who;
    try { who = await firstOf(id); } catch (e) { if (detailId === id && $('#detailFirst')) $('#detailFirst').hidden = true; return; }
    const cur = $('#detailFirst'); if (detailId !== id || !cur) return;
    cur.hidden = false; cur.classList.toggle('mine', who === normalize(address)); cur.classList.toggle('open', who === ZERO);
    cur.innerHTML = who === ZERO ? `🌍 Nobody on Starknet has found ${name} yet. Mint it to be the world's first!`
      : who === normalize(address) ? `🏆 <b>World first!</b> You were the very first on Starknet to find ${name}.`
      : `🌍 First found on Starknet by <span class="who" title="${esc(who)}">${esc(short(who))}</span>`;
  }
  document.addEventListener('ef:detail', ev => renderDetail(ev.detail.id));

  function init() {
    G = window.EF_GAME; refreshButton();
    // silently restore a previous *extension* connection (Cartridge needs a fresh login)
    if (cs.walletId && cs.walletId !== 'cartridge') {
      gsn().then(g => g.getAuthorizedWallets()).then(ws => { const w = ws.find(x => x.id === cs.walletId); if (w) connectExtension(w, true); }).catch(() => {});
    }
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
  window.EF_STARKNET = {
    plan: t => plan(t), calldataFor,
    get address() { return address; },
    get walletKind() { return walletKind; },
    minted, sync, config: C, configured, firstOf, tokenOf, get worldFirsts() { return worldFirsts; },
  };
})();
