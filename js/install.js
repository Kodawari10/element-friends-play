/* Element Friends — Home Screen: lets players keep the game as a little app on their phone or laptop (works offline).
   Chrome/Edge/Android: uses the browser's own install prompt. iPhone/iPad Safari: shows cute "Share → Add to Home Screen" steps.
   Hidden when already running as an app, or when the browser can't install. Nothing is sent anywhere. */
(function () {
  'use strict';
  let G, deferred = null, ready = false, cheered = false;
  const $ = s => document.querySelector(s);
  const isApp = () => { try { return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; } };
  const ua = () => navigator.userAgent || '';
  // iPhone/iPod/iPad (incl. iPadOS that pretends to be a Mac) in Safari, which has no install prompt
  const isIOS = () => /iP(hone|od|ad)/.test(ua()) || (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1);
  const isIOSSafari = () => isIOS() && /Safari/.test(ua()) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua());
  const mode = () => (isApp() ? 'app' : deferred ? 'prompt' : isIOSSafari() ? 'ios' : 'none');
  const sfx = n => { try { window.EF_AUDIO && window.EF_AUDIO.play(n); } catch (e) { /* ignore */ } };

  function refresh() {
    if (!ready) return;
    const m = mode(), btn = $('#btnInstall'), note = $('#installNote');
    document.documentElement.classList.toggle('is-app', m === 'app');
    btn.hidden = note.hidden = (m === 'app' || m === 'none');
  }
  function cheer() {
    if (cheered) return; cheered = true;
    const msg = '🏠 Element Friends moved onto your home screen! Your friends are one tap away 💕';
    G.ui.toast(msg, 3600); G.ui.announce('Element Friends added to your home screen');
    try { G.ui.confetti && G.ui.confetti(40); } catch (e) { /* ignore */ }
    sfx('discover');
  }
  async function install() {
    const m = mode();
    if (m === 'ios') { G.ui.closeModal('menu'); G.ui.openModal('installHelp'); return; }
    if (m !== 'prompt') { refresh(); return; }
    const ev = deferred; deferred = null; G.ui.closeModal('menu');
    let outcome = 'dismissed';
    try { ev.prompt(); const c = await ev.userChoice; outcome = (c && c.outcome) || 'dismissed'; } catch (e) { outcome = 'dismissed'; }
    if (outcome === 'accepted') cheer();
    else { G.ui.toast('Maybe later! 💕 Your friends are happy right here too.', 3000); G.ui.announce('Not added to home screen'); }
    refresh();
    document.dispatchEvent(new CustomEvent('ef:install', { detail: { outcome } }));
  }

  // the browser can fire this before the game is ready, so listen straight away
  window.addEventListener('beforeinstallprompt', ev => { ev.preventDefault(); deferred = ev; refresh(); });
  window.addEventListener('appinstalled', () => { deferred = null; refresh(); if (ready) cheer(); }); // cheer() only runs once

  function init() {
    G = window.EF_GAME;
    const btn = $('#btnInstall'); if (!btn) return;
    ready = true;
    btn.addEventListener('click', install);
    $('#installDone').addEventListener('click', () => G.ui.closeModal('installHelp'));
    try { window.matchMedia('(display-mode: standalone)').addEventListener('change', refresh); } catch (e) { /* old browsers */ }
    const art = $('#installArt'); if (art && window.EF_ART && window.EF_DATA) art.innerHTML = `<div class="is-hug" style="width:100%;height:100%">${window.EF_ART.render(window.EF_DATA.byId.house, { label: false })}</div>`;
    refresh();
    window.EF_INSTALL = { mode, isApp, install, refresh };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
