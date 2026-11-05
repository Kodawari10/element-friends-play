/* Element Friends — 🔈 Read to me: a friend's card reads its little story aloud in English, lighting up each word as it goes.
   Uses only the device's own on-device voice (never a cloud voice), so it works offline. Never saved. */
(function () {
  'use strict';
  const D = window.EF_DATA;
  let G, btn, desc, curId = '', reading = false, words = [], spoken = '', startAt = 0, voice = null;
  const can = () => !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function pickVoice() {
    try {
      // only on-device voices: a cloud voice would send the story text to a speech server
      const vs = can() ? speechSynthesis.getVoices().filter(v => v.localService === true) : [];
      voice = vs.find(v => /^en[-_](GB|US)/i.test(v.lang) && /female|samantha|karen|serena/i.test(v.name)) || vs.find(v => /^en([-_]|$)/i.test(v.lang)) || null;
    } catch (e) { voice = null; }
    return voice;
  }
  // the words of the story, each in its own span so the one being read can glow
  function wrap(text) {
    words = []; let html = '', re = /\S+/g, m, last = 0;
    while ((m = re.exec(text))) {
      html += esc(text.slice(last, m.index));
      html += `<span class="ra-w" data-i="${words.length}">${esc(m[0])}</span>`;
      words.push({ start: m.index, end: m.index + m[0].length }); last = m.index + m[0].length;
    }
    desc.innerHTML = html + esc(text.slice(last));
  }
  function mark(i) {
    desc.querySelectorAll('.ra-w.on').forEach(w => w.classList.remove('on'));
    const w = desc.querySelector(`.ra-w[data-i="${i}"]`); if (w) w.classList.add('on');
  }
  function setBtn(on) {
    reading = on;
    btn.classList.toggle('reading', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = on ? '<span aria-hidden="true">⏹</span> Stop' : '<span aria-hidden="true">🔈</span> Read to me';
    btn.setAttribute('aria-label', on ? 'Stop reading' : 'Read this friend’s story aloud');
    desc.classList.toggle('reading', on);
  }
  function stop(silent) {
    if (!reading) return;
    if (!silent) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
    setBtn(false);
    if (curId && D.byId[curId]) desc.textContent = D.byId[curId].desc;
    document.dispatchEvent(new CustomEvent('ef:readaloud', { detail: { id: curId, state: 'stop' } }));
  }
  function read(id) {
    id = id || curId; const e = D.byId[id]; if (!e || !btn) return false;
    if (reading) { stop(); return false; }
    if (G.state.muted) { G.ui.toast('🔈 Turn the sound on and I’ll read it to you!', 2600); G.ui.announce('Sound is off. Turn it on to hear the story.'); return false; }
    if (!can()) return false;
    if (!voice && !pickVoice()) { G.ui.toast('🔈 This device has no built-in English voice yet.', 2600); return false; }
    const nick = G.nickOf ? G.nickOf(id) : '';
    const intro = `${nick ? `${nick} the ${e.name}` : e.name}. `;
    spoken = intro + e.desc; startAt = intro.length;
    wrap(e.desc);
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = 'en-GB'; u.rate = 0.88; u.pitch = 1.2;
      u.voice = voice;
      u.onboundary = ev => {
        if (!reading || ev.name === 'sentence') return;
        const c = ev.charIndex - startAt; if (c < 0) return;
        const i = words.findIndex(w => c >= w.start && c < w.end + 1);
        if (i >= 0) mark(i);
      };
      u.onend = () => { if (curId === id) stop(true); };
      u.onerror = () => { if (curId === id) stop(true); };
      setBtn(true);
      speechSynthesis.speak(u);
    } catch (err) { setBtn(false); desc.textContent = e.desc; return false; }
    G.ui.announce(`Reading ${e.name}'s story`);
    document.dispatchEvent(new CustomEvent('ef:readaloud', { detail: { id, state: 'start', text: spoken } }));
    return true;
  }

  function init() {
    G = window.EF_GAME;
    btn = document.getElementById('detailRead'); desc = document.getElementById('detailDesc');
    if (!btn || !desc) return;
    btn.hidden = !can();
    setBtn(false);
    btn.addEventListener('click', () => read(curId));
    // a new card (opening, flipping, surprise) stops the old story
    document.addEventListener('ef:detail', ev => { const id = ev.detail && ev.detail.id; if (reading) stop(); curId = id || ''; });
    // closing the card stops it too
    const sheet = document.getElementById('detail');
    if (sheet && window.MutationObserver) new MutationObserver(() => { if (sheet.hidden && reading) stop(); }).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
    if (can() && 'onvoiceschanged' in speechSynthesis) speechSynthesis.addEventListener('voiceschanged', pickVoice);
    window.EF_READ = { read: id => read(id), stop: () => stop(), isReading: () => reading, text: () => spoken };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
