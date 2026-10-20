/* Element Friends — Friend Code: a short, offline code to move your found friends to another phone or laptop.
   Format: EF1-<base64url bitset over the stable chain ids>-<2-char checksum>. Restoring only ever ADDS friends. */
(function () {
  'use strict';
  const PREFIX = 'EF1';
  let G;
  const $ = s => document.querySelector(s);
  function ids() { return (window.EF_CHAIN_IDS && window.EF_CHAIN_IDS.ids) || {}; }
  function byNum() { const m = {}; Object.entries(ids()).forEach(([k, n]) => { m[n] = k; }); return m; }
  const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  function sum(str) { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1296; return h.toString(36).padStart(2, '0'); }

  function encode(list) {
    const map = ids(); const nums = list.map(id => map[id]).filter(n => n > 0);
    const max = Math.max(0, ...nums); const bytes = new Uint8Array(Math.ceil(max / 8) || 1);
    nums.forEach(n => { bytes[(n - 1) >> 3] |= 1 << ((n - 1) & 7); });
    const body = b64(bytes); return `${PREFIX}-${body}-${sum(body)}`;
  }
  // returns a list of friend ids, or null if the code isn't a valid Friend Code
  function decode(code) {
    const m = String(code || '').trim().replace(/\s+/g, '').match(/^EF1-([A-Za-z0-9_-]+)-([0-9a-z]{2})$/i);
    if (!m || sum(m[1]) !== m[2].toLowerCase()) return null;
    let bytes; try { bytes = unb64(m[1]); } catch (e) { return null; }
    const names = byNum(), out = [];
    bytes.forEach((b, i) => { for (let k = 0; k < 8; k++) if (b & (1 << k)) { const id = names[i * 8 + k + 1]; if (id) out.push(id); } });
    return out;
  }

  function status(t, cls) { const s = $('#backupStatus'); s.textContent = t; s.className = 'backup-status' + (cls ? ' ' + cls : ''); }
  function refresh() {
    const list = [...G.found]; $('#backupCode').value = encode(list);
    $('#backupCount').textContent = `This code holds ${list.length} friend${list.length === 1 ? '' : 's'} 💖`;
    $('#backupPaste').value = ''; status('');
  }
  function open() { G.ui.closeModal('menu'); refresh(); G.ui.openModal('backup'); }
  async function copy() {
    const v = $('#backupCode').value; let done = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(v); done = true; } } catch (e) { /* fall back */ }
    if (!done) { const f = $('#backupCode'); f.focus(); f.select(); try { done = document.execCommand('copy'); } catch (e) { done = false; } }
    const btn = $('#backupCopy'); btn.classList.remove('popped'); void btn.offsetWidth; btn.classList.add('popped');
    if (done) { status('Copied! Paste it on your other device ✨', 'ok'); G.ui.announce('Friend Code copied'); try { window.EF_AUDIO && window.EF_AUDIO.play('select'); } catch (e) { /* ignore */ } }
    else { $('#backupCode').select(); status('Selected! Copy it with your keyboard or long-press 📋', 'ok'); }
  }
  function restore() {
    const list = decode($('#backupPaste').value);
    if (!list) { status("Hmm, that doesn't look like a Friend Code. It starts with EF1- 🤔", 'bad'); G.ui.announce("That isn't a valid Friend Code"); return; }
    const added = G.importDiscoveries(list);
    $('#backupCode').value = encode([...G.found]);
    $('#backupCount').textContent = `This code holds ${G.found.size} friends 💖`;
    if (added) {
      const msg = `${added} friend${added > 1 ? 's' : ''} moved in! 🎉`;
      status(msg, 'ok'); G.ui.announce(msg); G.ui.toast(msg);
      try { G.ui.confetti && G.ui.confetti(60); } catch (e) { /* ignore */ }
      try { window.EF_AUDIO && window.EF_AUDIO.play('discover'); } catch (e) { /* ignore */ }
      document.dispatchEvent(new CustomEvent('ef:backup-restore', { detail: { added } }));
    } else { status('You already have every friend in that code 🥰', 'ok'); G.ui.announce('No new friends in that code'); }
  }

  function init() {
    G = window.EF_GAME;
    const btn = $('#btnBackup'); if (!btn) return;
    btn.addEventListener('click', open);
    $('#backupCopy').addEventListener('click', copy);
    $('#backupRestore').addEventListener('click', restore);
    $('#backupPaste').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); restore(); } });
    $('#backupCode').addEventListener('focus', ev => ev.target.select());
    window.EF_BACKUP = { encode, decode, open };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
