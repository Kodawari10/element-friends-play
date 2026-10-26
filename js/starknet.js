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
  function saveCs() { cs.minted = [...minted]; try { localStorage.setItem(KEY, JSON.stringify(cs)); } catch (e) { /* ignore */ } pushChain(); }
  // tell the Collection which friends this wallet has minted (feeds its ✦ On Starknet chip)
  function pushChain() { try { if (G && G.setChainFriends) G.setChainFriends(address ? [...minted] : []); } catch (e) { /* ignore */ } }
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

  // ---------- errors (starkzap-sdk skill: classify, then recover) ----------
  // Every failure is mapped to a stable code + a cute message + the next action, so the UI never shows raw stack text.
  const ERR = {
    USER_CANCELLED: { msg: 'Cancelled, no worries ♡', recovery: 'none', retry: false },
    VALIDATION_ERROR: { msg: 'Something in the mint request looks off. Please refresh the game and try again.', recovery: 'fix_input', retry: false },
    UNDEPLOYED_ACCOUNT: { msg: 'Your Starknet account isn’t set up yet. Setting it up first…', recovery: 'ensure_ready', retry: true },
    RPC_OR_NETWORK: { msg: 'Starknet is hard to reach right now. Please try again in a moment.', recovery: 'retry_backoff', retry: true },
    RATE_LIMIT_OR_TIMEOUT: { msg: 'Starknet is busy right now. Please try again in a minute.', recovery: 'retry_backoff', retry: true },
    TX_REVERTED: { msg: 'Starknet said no to this mint', recovery: 'check_preflight', retry: false },
    AUTH_OR_PERMISSION: { msg: 'Your wallet didn’t allow this. Please reconnect and try again.', recovery: 'reconnect', retry: false },
    SPONSORSHIP_UNAVAILABLE: { msg: 'Free minting isn’t available right now.', recovery: 'user_pays', retry: false },
    CHAIN_MISMATCH: { msg: `Wrong network. This game uses ${C.networkName || C.network}.`, recovery: 'switch_network', retry: false },
    POPUP_BLOCKED: { msg: 'Cartridge needs a popup. Please allow popups for this site ♡', recovery: 'allow_popup', retry: false },
    INSUFFICIENT_FUNDS: { msg: `Your wallet needs a little ${C.faucetUrl ? 'test ' : ''}STRK to pay the mint fee.`, recovery: 'top_up', retry: false },
    UNKNOWN: { msg: 'Something went wrong', recovery: 'none', retry: false },
  };
  function classifyError(err) {
    if (err && err.code && ERR[err.code]) return Object.assign({ code: err.code, detail: err.message || '' }, ERR[err.code]);
    const m = err && err.message ? err.message : String(err || '');
    let code = 'UNKNOWN';
    if (/reject|cancel|abort(ed)? by user|denied by user|user (closed|dismissed)|closed the (popup|window)/i.test(m)) code = 'USER_CANCELLED';
    else if (/popup.*block|blocked.*popup/i.test(m)) code = 'POPUP_BLOCKED';
    else if (/insufficient (max.?fee|balance|funds|account balance|fee token)|balance is (smaller|lower|less) than|exceeds? (the )?(account |fee token )?balance|u256_sub overflow|not enough (funds|balance|STRK|ETH)/i.test(m)) code = 'INSUFFICIENT_FUNDS';
    else if (/not deployed|undeployed|contract not found.*account/i.test(m)) code = 'UNDEPLOYED_ACCOUNT';
    else if (/SNIP-9|not compatible with SNIP|paymaster|sponsor|gasless|outside.?execution/i.test(m)) code = 'SPONSORSHIP_UNAVAILABLE';
    else if (/chain.?id|chain mismatch|wrong network|network mismatch/i.test(m)) code = 'CHAIN_MISMATCH';
    else if (/\b429\b|rate.?limit|too many requests|timed? ?out|timeout/i.test(m)) code = 'RATE_LIMIT_OR_TIMEOUT';
    else if (/revert|preflight|execution failed|EF: /i.test(m)) code = 'TX_REVERTED';
    else if (/\b40[13]\b|unauthori[sz]ed|forbidden|signature|permission|policy|not allowed/i.test(m)) code = 'AUTH_OR_PERMISSION';
    else if (/failed to fetch|network ?error|fetch|ECONN|\b5\d\d\b|RPC/i.test(m)) code = 'RPC_OR_NETWORK';
    else if (/invalid|malformed|amount|decimals/i.test(m)) code = 'VALIDATION_ERROR';
    return Object.assign({ code, detail: m }, ERR[code]);
  }
  // Out of test STRK? A cute link to the free Sepolia faucet (only when faucetUrl is configured)
  function faucetLink(label) {
    if (!C.faucetUrl || !/^https:\/\//.test(C.faucetUrl)) return '';
    return `<a class="faucet-link" href="${esc(C.faucetUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Get free test STRK from the Starknet faucet (opens in a new tab)">${label || '🚰 Get free test STRK ↗'}</a>`;
  }
  function codedError(code, detail) { const e = new Error(detail || ERR[code].msg); e.code = code; return e; }
  function friendly(err) {
    const k = classifyError(err);
    if (k.code === 'TX_REVERTED' || k.code === 'UNKNOWN') {
      const why = String(k.detail || '').replace(/^.*?(EF: [^"\\\n]+).*$/s, '$1').slice(0, 120);
      return `${k.msg}${why ? ': ' + esc(why) : ''}`;
    }
    return esc(k.msg);
  }

  // ---------- RPC (read-only views) ----------
  // Timeout per request (8s), retry only transient failures (timeout / 429 / 5xx / network) with
  // exponential backoff + jitter, max 3 attempts. JSON-RPC errors (deterministic) are never retried.
  const sleepMs = ms => new Promise(r => setTimeout(r, ms));
  async function rpcOnce(method, params, timeoutMs) {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
    let r;
    try {
      r = await fetch(C.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }), signal: ctl ? ctl.signal : undefined });
    } catch (e) {
      throw codedError(e && e.name === 'AbortError' ? 'RATE_LIMIT_OR_TIMEOUT' : 'RPC_OR_NETWORK', e && e.name === 'AbortError' ? 'RPC timed out' : 'RPC network error');
    } finally { if (timer) clearTimeout(timer); }
    if (r.status === 429) throw codedError('RATE_LIMIT_OR_TIMEOUT', 'RPC rate limited (429)');
    if (r.status >= 500) throw codedError('RPC_OR_NETWORK', 'RPC error ' + r.status);
    const j = await r.json(); if (j.error) { const e = new Error(j.error.message || 'RPC error'); e.rpc = true; throw e; } return j.result;
  }
  async function rpc(method, params, opt) {
    const tries = (opt && opt.tries) || 3, timeoutMs = (opt && opt.timeoutMs) || 8000;
    for (let i = 0; ; i++) {
      try { return await rpcOnce(method, params, timeoutMs); } catch (e) {
        const transient = !e.rpc && (e.code === 'RPC_OR_NETWORK' || e.code === 'RATE_LIMIT_OR_TIMEOUT');
        if (!transient || i >= tries - 1) throw e;
        await sleepMs(500 * Math.pow(2, i) + Math.floor(Math.random() * 250));
      }
    }
  }
  // Network guard: the RPC must serve the chain this game is configured for (checked once per session).
  let rpcChainP = null;
  function checkRpcChain() {
    if (!rpcChainP) rpcChainP = rpc('starknet_chainId', [], { tries: 2 })
      .then(id => !id || !C.chainId || BigInt(id) === BigInt(C.chainId))
      .catch(e => { rpcChainP = null; return e && e.rpc ? true : null; }); // unsupported method → don't block
    return rpcChainP;
  }
  const call = (fn, calldata) => rpc('starknet_call', { request: { contract_address: C.contractAddress, entry_point_selector: SEL[fn], calldata: calldata || [] }, block_id: 'latest' });
  async function waitTx(hash) {
    for (let i = 0; i < 90; i++) {
      try {
        const r = await rpc('starknet_getTransactionReceipt', { transaction_hash: hash }, { tries: 1 });
        if (r && r.execution_status === 'REVERTED') throw new Error('Transaction reverted: ' + (r.revert_reason || '').slice(0, 140));
        if (r && r.execution_status === 'SUCCEEDED') return r;
      } catch (e) { if (/reverted/.test(e.message)) throw e; }
      await new Promise(r => setTimeout(r, i < 5 ? 1500 : 3000));
    }
    throw codedError('RATE_LIMIT_OR_TIMEOUT', 'Timed out waiting for the transaction (it may still land: check the explorer link)');
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
      </button>
      <p class="cart-scope muted" id="cartScope">🔒 Game session can only <b>mint Element Friends</b>${configured ? '' : ' (once the contract is live)'}. It can’t move tokens.</p>
      <ol class="cart-steps" id="cartSteps" hidden aria-live="polite">
        <li data-step="CONNECTED">Sign in</li><li data-step="CHECK_DEPLOYED">Check account</li><li data-step="DEPLOYING">Set up</li><li data-step="READY">Ready ✦</li>
      </ol>`);
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
        onProgress: showStep,
      });
      showStep('READY');
      feeMode = cart.feeMode || { type: 'paymaster' };
      feeFallbackUsed = false;
      wallet = connected; walletKind = 'cartridge';
      address = normalize(connected.address);
      chainOk = (await checkRpcChain()) !== false;
      if (cs.address !== address) minted.clear();
      cs.walletId = 'cartridge'; cs.address = address; saveCs();
      G.ui.closeModal('wallets'); refreshButton();
      let who = short(address);
      try { const u = await connected.username(); if (u) who = u; } catch (e) { /* optional */ }
      G.ui.toast(`Connected with Cartridge ✦ ${who}`); G.ui.announce('Cartridge connected');
      await sync(true);
      return true;
    } catch (e) {
      const k = classifyError(e);
      showStep('FAILED');
      G.ui.toast(k.code === 'USER_CANCELLED' ? 'Cartridge sign-in cancelled, no worries ♡'
        : k.code === 'POPUP_BLOCKED' || /popup/i.test(k.detail) ? ERR.POPUP_BLOCKED.msg
        : 'Cartridge connection failed: ' + k.msg);
      return false;
    } finally { setBusyPicker(false); }
  }
  // StarkZap onboarding progress (onProgress: CONNECTED → CHECK_DEPLOYED → DEPLOYING → READY | FAILED)
  const STEP_ORDER = ['CONNECTED', 'CHECK_DEPLOYED', 'DEPLOYING', 'READY'];
  function showStep(step) {
    const ol = $('#cartSteps'); if (!ol || !step) return;
    ol.hidden = false; ol.classList.toggle('failed', step === 'FAILED');
    const at = STEP_ORDER.indexOf(step);
    ol.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('done', at >= 0 && i < at || step === 'READY');
      li.classList.toggle('now', i === at && step !== 'READY');
    });
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
      if (!silent) { const k = classifyError(e); G.ui.toast(k.code === 'USER_CANCELLED' ? 'Wallet connection cancelled, no worries ♡' : 'Wallet connection failed: ' + k.msg); }
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
  // The published Sepolia contract still holds the original table. Newer friends stay
  // "minting coming soon" until that contract's fingerprint matches this build (owner append,
  // or a fresh deploy). A fingerprint match means every current friend can be minted.
  const LIVE = C.live || {};
  const LIVE_COUNT = LIVE.elementCount | 0;
  const LIVE_FP = LIVE.fingerprint || '';
  let fpMismatch = false, chainCount = 0, chainFp = null;
  const localFp = () => { try { return BigInt(window.EF_CHAIN_IDS.fingerprint); } catch (e) { return null; } };
  function canMint(id) {
    const n = IDS[id] || 0;
    if (!n || !D.byId[id]) return false;
    if (chainFp != null && !fpMismatch) return true;
    const cap = chainCount > 0 ? chainCount : LIVE_COUNT;
    if (!cap) return true;
    try { if (chainFp == null && LIVE_FP && localFp() === BigInt(LIVE_FP)) return true; } catch (e) { /* ignore */ }
    const safe = (LIVE_COUNT && (chainFp == null || fpMismatch)) ? Math.min(cap, LIVE_COUNT) : cap;
    return n <= safe;
  }
  async function sync(loud) {
    if (!configured || !address) return;
    try {
      if ((await checkRpcChain()) === false) { chainOk = false; refreshButton(); if (loud) G.ui.toast(ERR.CHAIN_MISMATCH.msg); return; }
      const r = await call('discoveries_of', [address]);
      const n = parseInt(r[0], 16); const list = r.slice(1, 1 + n).map(x => NUM[parseInt(x, 16)]).filter(Boolean);
      minted.clear(); list.forEach(id => minted.add(id)); saveCs();
      const added = G.importDiscoveries(list);
      if (added) G.ui.toast(`✦ Synced ${added} friend${added > 1 ? 's' : ''} from Starknet!`);
      else if (loud && list.length) G.ui.toast(`✦ ${list.length} friends are on Starknet`);
      try { chainFp = BigInt((await call('table_fingerprint'))[0]); fpMismatch = chainFp !== localFp(); } catch (e) { /* older deploy */ }
      try { const c = parseInt((await call('element_count'))[0], 16); if (c > 0) chainCount = c; } catch (e) { /* older deploy */ }
      decorate();
    } catch (e) { if (loud) G.ui.toast('Could not reach Starknet right now. Try again later.'); }
  }

  // ---------- planning ----------
  function plan(targets) {
    const local = G.found, have = new Set(minted), steps = [];
    D.elements.filter(e => e.base && local.has(e.id) && !have.has(e.id) && canMint(e.id)).forEach(e => { have.add(e.id); steps.push({ id: e.id, a: null, b: null }); });
    const parent = {}; let grew = true;
    while (grew) {
      grew = false;
      for (const [a, b, r] of D.recipes) if (have.has(a) && have.has(b) && !have.has(r) && local.has(r) && canMint(r)) { have.add(r); parent[r] = [a, b]; steps.push({ id: r, a, b }); grew = true; }
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
    return classifyError(err).code === 'SPONSORSHIP_UNAVAILABLE' || /policy/i.test(msg);
  }
  const fallbackMode = () => (C.cartridge && C.cartridge.fallbackFeeMode) || 'user_pays';
  const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(codedError('RATE_LIMIT_OR_TIMEOUT', what + ' timed out')), ms))]);

  // validate: the calldata must be exactly what the contract expects (n, then n × [id, a, b] of known ids)
  function validateCalldata(cd) {
    const n = Number(BigInt(cd[0]));
    if (!n || cd.length !== 1 + n * 3) throw codedError('VALIDATION_ERROR', 'mint batch is malformed');
    const known = new Set(Object.values(IDS).map(Number));
    for (let i = 0; i < n; i++) {
      const [e, a, b] = cd.slice(1 + i * 3, 4 + i * 3).map(x => Number(BigInt(x)));
      if (!known.has(e) || (a && !known.has(a)) || (b && !known.has(b))) throw codedError('VALIDATION_ERROR', 'mint batch has an unknown friend');
    }
  }
  // preflight (StarkZap wallet.preflight → simulateTransaction). Best-effort, 10s budget; a deterministic
  // revert stops the mint before the player is asked to approve anything.
  async function preflightCartridge(calls, mode) {
    if (typeof wallet.preflight !== 'function') return { ok: true, skipped: true };
    let res;
    try { res = await withTimeout(wallet.preflight({ calls, feeMode: mode }), 10000, 'preflight'); } catch (e) { return { ok: true, skipped: true }; }
    if (res && res.ok === false) {
      if (/not deployed/i.test(res.reason || '')) return { ok: false, undeployed: true, reason: res.reason };
      return { ok: false, reason: res.reason || 'simulation failed' };
    }
    return { ok: true };
  }
  // UNDEPLOYED_ACCOUNT recovery: wallet.ensureReady({ deploy: "if_needed" }) before a user_pays write
  async function ensureReadyFor(mode) {
    if (typeof wallet.ensureReady !== 'function') return;
    await wallet.ensureReady({ deploy: (C.cartridge && C.cartridge.deploy) || 'if_needed', feeMode: mode });
  }
  async function executeCartridge(call, mode) {
    let pf = await preflightCartridge([call], mode);
    if (!pf.ok && pf.undeployed) { await ensureReadyFor(mode); pf = await preflightCartridge([call], mode); }
    if (!pf.ok) throw codedError(pf.undeployed ? 'UNDEPLOYED_ACCOUNT' : 'TX_REVERTED', 'Preflight failed: ' + pf.reason);
    try { return await wallet.execute([call], { feeMode: mode }); } catch (err) {
      // Not retried blindly (a tx may already be in flight): only the undeployed case, after ensureReady.
      if (classifyError(err).code === 'UNDEPLOYED_ACCOUNT' && !isSponsoredMode(mode)) { await ensureReadyFor(mode); return await wallet.execute([call], { feeMode: mode }); }
      throw err;
    }
  }

  async function invokeDiscoverBatch(chunk) {
    const cd = calldataFor(chunk);
    validateCalldata(cd);
    if (walletKind === 'cartridge') {
      const call = { contractAddress: C.contractAddress, entrypoint: 'discover_batch', calldata: cd };
      const tryMode = feeFallbackUsed ? fallbackMode() : feeMode;
      try {
        return await executeCartridge(call, tryMode);
      } catch (err) {
        if (!feeFallbackUsed && isSponsoredMode(feeMode) && shouldFallbackFees(err)) {
          feeFallbackUsed = true;
          G.ui.toast('Free minting isn’t available right now. Your wallet will pay the tiny fee ♡');
          return await executeCartridge(call, fallbackMode());
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
    const ready = targets.filter(t => canMint(t));
    const soon = targets.filter(t => !minted.has(t) && !canMint(t));
    const steps = plan(ready);
    const stuck = ready.filter(t => !minted.has(t) && !steps.some(s => s.id === t));
    if (!steps.length) {
      if (soon.length && !stuck.length) G.ui.toast(`${D.byId[soon[0]].name} is safe in your collection ♡ Minting coming soon`);
      else if (stuck.length) G.ui.toast(`${D.byId[stuck[0]].name} needs friends you haven't found in this game yet ♡`);
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
        if (!h) throw codedError('UNKNOWN', 'The wallet returned no transaction hash');
        const prog = steps.length > size ? ` (${Math.min(i + size, steps.length)}/${steps.length})` : '';
        const link = `<a href="${C.explorerTx}${h}" target="_blank" rel="noopener noreferrer">view tx</a>`;
        setStatus(statusEl, `Minting${prog}… ${link}`);
        // StarkZap tx.watch: live finality updates while we verify the receipt ourselves
        let stop = null;
        if (res && typeof res.watch === 'function') {
          try { stop = res.watch(({ finality }) => { if (busy && finality) setStatus(statusEl, `Minting${prog}… ${esc(FINALITY[finality] || String(finality).toLowerCase().replace(/_/g, ' '))} ${link}`); }, { pollIntervalMs: 3000, timeoutMs: 180000, onError: () => {} }); } catch (e) { stop = null; }
        }
        let rcpt; try { rcpt = await waitTx(h); } finally { if (typeof stop === 'function') stop(); }
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
      const k = classifyError(e);
      lastError = { code: k.code, recovery: k.recovery, detail: String(k.detail || '').slice(0, 200) };
      const topUp = k.code === 'INSUFFICIENT_FUNDS' && faucetLink() ? ' ' + faucetLink() + ' then try again ♡' : '';
      setStatus(statusEl, k.code === 'USER_CANCELLED' ? 'Mint cancelled, no worries ♡' : 'Mint failed: ' + friendly(e) + topUp);
      if (topUp) G.ui.announce('Mint failed. Your wallet needs a little test STRK. A faucet link is next to the mint button.');
    } finally { busy = false; }
  }
  const FINALITY = { RECEIVED: 'sent ✦', PRE_CONFIRMED: 'almost there ✦', CANDIDATE: 'almost there ✦', ACCEPTED_ON_L2: 'accepted ✦', ACCEPTED_ON_L1: 'final ✦' };
  let lastError = null;
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
    const soonN = [...G.found].filter(id => !minted.has(id) && !canMint(id)).length;
    const via = walletKind === 'cartridge' ? ' · via Cartridge' : '';
    const feeNote = walletKind === 'cartridge'
      ? (feeFallbackUsed ? '<div class="chain-note">Fees: your wallet pays (sponsorship unavailable).</div>'
        : '<div class="chain-note">Fees: sponsored when Cartridge paymaster is available ✦</div>') +
        '<div class="chain-note">🔒 Session limited to minting Element Friends · every mint is checked first (preflight)</div>'
      : '';
    // wallet pays the fee (extension wallets, or Cartridge after sponsorship fell back): point at the free test faucet
    const paysFee = walletKind !== 'cartridge' || feeFallbackUsed;
    const fuelNote = configured && paysFee && faucetLink()
      ? `<div class="chain-note fuel-note" id="fuelNote">⛽ Minting uses a tiny bit of test STRK for the fee. Running low? ${faucetLink()}</div>` : '';
    body.innerHTML = `
      <div class="net-pill ${chainOk ? '' : 'bad'}">${chainOk ? '●' : '▲'} ${esc(C.networkName)}${via}${chainOk ? '' : ': please switch network in your wallet'}</div>
      <p class="addr" title="${esc(address || '')}">${esc(short(address))} <button class="btn mini" id="copyAddr" aria-label="Copy address">copy</button></p>
      ${configured ? '' : `<div class="chain-note">The Element Friends contract isn't deployed yet, so minting is off. Your friends are safe on this device. (Deploy steps are in <code>contracts/README.md</code>.)</div>`}
      ${fpMismatch ? `<div class="chain-note">Heads up: this game version has newer recipes than the deployed contract. Friends already on the contract can still be minted.</div>` : ''}
      ${soonN ? `<div class="chain-note" id="mintSoon">✦ Minting coming soon for ${soonN} newer friend${soonN > 1 ? 's' : ''}. You can still collect them here.</div>` : ''}
      ${feeNote}
      ${fuelNote}
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
  function paintRevealMint() {
    const b = $('#revealMint'); if (!b || !revealId) return;
    if (minted.has(revealId)) { b.hidden = true; return; }
    b.hidden = false;
    if (!canMint(revealId)) { b.disabled = true; b.classList.add('soon'); b.textContent = '✦ Minting coming soon'; }
    else { b.disabled = false; b.classList.remove('soon'); b.textContent = address ? '✦ Mint on Starknet' : '✦ Mint on Starknet (connect)'; }
  }
  document.addEventListener('ef:reveal', ev => { revealId = ev.detail.id; const st = $('#revealMintStatus'); if (st) st.textContent = ''; paintRevealMint(); });
  $('#revealMint').addEventListener('click', async () => {
    if (revealId && !canMint(revealId)) { G.ui.toast(`${D.byId[revealId].name} is safe in your collection ♡ Minting coming soon`); return; }
    if (!address) { openPicker(); return; }
    await mint([revealId], $('#revealMintStatus'));
    if (minted.has(revealId)) $('#revealMint').hidden = true;
  });

  function decorate() {
    pushChain();
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
    if (!$('#reveal').hidden && revealId) paintRevealMint();
  }
  document.addEventListener('ef:book', () => { decorate(); if (address && configured) sync(); });
  let detailId = null;
  function renderDetail(id) {
    const box = $('#detailChain'); detailId = id;
    const wf = configured && address && !D.byId[id].base ? '<p class="world-first" id="detailFirst"></p>' : '';
    if (!minted.has(id) && !canMint(id)) {
      box.innerHTML = `<div class="chain-chip soon" id="mintSoonChip">✦ Minting coming soon</div><p class="mint-status">This friend is not on the Starknet contract yet. You can still keep them here ♡</p>`;
      return;
    }
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
    plan: t => plan(t), canMint, calldataFor,
    get address() { return address; },
    get walletKind() { return walletKind; },
    minted, sync, config: C, configured, firstOf, tokenOf, get worldFirsts() { return worldFirsts; },
    classifyError, get lastError() { return lastError; }, validateCalldata,
  };
})();
