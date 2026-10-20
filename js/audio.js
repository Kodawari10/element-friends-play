/* Tiny WebAudio synth for cute sound effects. */
(function (root) {
  'use strict';
  let ctx = null, master = null, muted = false;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination); return ctx;
  }
  function tone(freq, start, dur, type, vol, slideTo) {
    if (muted || !ensure()) return;
    const t0 = ctx.currentTime + (start || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.5, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const SFX = {
    pick() { tone(N(84), 0, 0.09, 'sine', 0.35, N(91)); },
    drop() { tone(N(72), 0, 0.12, 'triangle', 0.35, N(67)); },
    tap() { tone(N(88), 0, 0.06, 'sine', 0.25); },
    select() { tone(N(79), 0, 0.08, 'sine', 0.3); tone(N(86), 0.06, 0.1, 'sine', 0.3); },
    pop() { tone(N(76), 0, 0.12, 'sine', 0.5, N(96)); tone(N(100), 0.05, 0.08, 'sine', 0.2); },
    merge() { [76, 81, 84, 88].forEach((n, i) => tone(N(n), i * 0.05, 0.16, 'triangle', 0.3)); },
    discover() { [72, 76, 79, 84].forEach((n, i) => tone(N(n), 0.05 + i * 0.09, 0.28, 'triangle', 0.4)); tone(N(91), 0.45, 0.5, 'sine', 0.25); tone(N(96), 0.5, 0.6, 'sine', 0.15); },
    legendary() { [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => tone(N(n), i * 0.08, 0.35, 'triangle', 0.35)); [96, 100, 103, 108].forEach((n, i) => tone(N(n), 0.7 + i * 0.06, 0.4, 'sine', 0.15)); },
    fail() { tone(N(67), 0, 0.14, 'square', 0.12, N(62)); tone(N(64), 0.14, 0.22, 'square', 0.12, N(55)); },
    hint() { [88, 91, 95].forEach((n, i) => tone(N(n), i * 0.07, 0.18, 'sine', 0.25)); },
    poof() { tone(N(70), 0, 0.15, 'triangle', 0.25, N(55)); },
    open() { tone(N(79), 0, 0.08, 'sine', 0.25, N(84)); },
    wake() { tone(N(72), 0, 0.22, 'sine', 0.22, N(84)); tone(N(88), 0.2, 0.1, 'triangle', 0.16); },
    twin() { tone(N(81), 0, 0.08, 'sine', 0.32, N(88)); tone(N(88), 0.08, 0.1, 'sine', 0.3, N(93)); tone(N(100), 0.16, 0.08, 'triangle', 0.14); },
    fave() { tone(N(84), 0, 0.07, 'sine', 0.22, N(91)); tone(N(91), 0.07, 0.12, 'sine', 0.2, N(96)); tone(N(103), 0.15, 0.1, 'triangle', 0.1); },
    unfave() { tone(N(84), 0, 0.09, 'sine', 0.14, N(79)); },
    snap() { tone(N(96), 0, 0.03, 'square', 0.08); tone(N(76), 0.04, 0.06, 'triangle', 0.18, N(88)); [91, 95, 100].forEach((n, i) => tone(N(n), 0.14 + i * 0.06, 0.1, 'sine', 0.16)); },
    flip() { tone(N(81), 0, 0.06, 'sine', 0.16, N(86)); tone(N(88), 0.05, 0.08, 'triangle', 0.12); },
    party() { [72, 76, 79, 76, 81, 79, 84].forEach((n, i) => tone(N(n), i * 0.11, 0.12, 'triangle', 0.28)); [60, 67, 60, 67].forEach((n, i) => tone(N(n), i * 0.22, 0.1, 'sine', 0.22)); tone(N(96), 0.8, 0.3, 'sine', 0.14, N(100)); },
    shiny() { [96, 100, 103, 108].forEach((n, i) => tone(N(n), i * 0.06, 0.16, 'sine', 0.18)); tone(N(103), 0.3, 0.35, 'triangle', 0.1, N(108)); },
    tidy() { [84, 79, 76, 72].forEach((n, i) => tone(N(n), i * 0.045, 0.07, 'sine', 0.2)); [76, 81, 88].forEach((n, i) => tone(N(n), 0.32 + i * 0.07, 0.12, 'triangle', 0.22)); }
  };
  // Each friend has its own little voice: the timbre follows its shape, the pitch is picked from its id.
  const VOICE = {
    bubbly: ['drop', 'puddle', 'splat', 'bowl', 'cup'],
    spark: ['flame', 'star', 'gem'],
    deep: ['rock', 'box', 'squat', 'igloo', 'dome', 'snowman'],
    airy: ['cloud', 'ghost', 'round', 'fluff', 'tornado']
  };
  const PENTA = [0, 2, 4, 7, 9, 12, 14];
  function voiceOf(e) {
    const shape = (e && e.shape) || 'round';
    for (const k in VOICE) if (VOICE[k].indexOf(shape) >= 0) return k;
    return 'sweet';
  }
  function hashId(id) { let h = 7; for (let i = 0; i < String(id).length; i++) h = (h * 31 + String(id).charCodeAt(i)) >>> 0; return h; }
  function voice(e) {
    const kind = voiceOf(e), h = hashId(e && e.id), step = PENTA[h % PENTA.length];
    const big = e && e.final;
    if (kind === 'bubbly') { const b = 79 + step; tone(N(b), 0, 0.09, 'sine', 0.4, N(b + 7)); tone(N(b + 4), 0.1, 0.11, 'sine', 0.35, N(b + 12)); }
    else if (kind === 'spark') { const b = 83 + step; [0, 4, 7, 12].forEach((d, i) => tone(N(b + d), i * 0.04, 0.07, 'triangle', 0.28)); }
    else if (kind === 'deep') { const b = 60 + step; tone(N(b), 0, 0.14, 'triangle', 0.45, N(b + 5)); tone(N(b + 5), 0.13, 0.16, 'triangle', 0.35, N(b)); }
    else if (kind === 'airy') { const b = 74 + step; tone(N(b), 0, 0.32, 'sine', 0.32, N(b + 9)); }
    else { const b = 76 + step; tone(N(b), 0, 0.12, 'triangle', 0.35, N(b + 7)); tone(N(b + 7), 0.11, 0.16, 'triangle', 0.3, N(b + 2)); }
    if (big) [96, 100, 103].forEach((n, i) => tone(N(n), 0.2 + i * 0.06, 0.25, 'sine', 0.12));
  }

  // ---------- cozy music box: a soft looping lullaby, off by default ----------
  // Pentatonic phrases (semitones above the root) with a gentle bass every bar. Night plays slower and lower.
  const PHRASES = [
    [0, 4, 7, 9, 7, 4, 2, null, 4, 7, 9, 12, 9, null, 7, null],
    [9, 7, 4, 7, 2, 4, 0, null, 2, 4, 7, 4, 2, 0, null, null],
    [7, 9, 12, 9, 7, 4, 7, null, 9, 7, 4, 2, 4, null, 0, null],
    [4, 2, 0, 2, 4, 7, 4, null, 2, 4, 2, 0, -3, null, 0, null]
  ];
  const BASS = [0, -5, -3, -7];
  const M = { want: false, timer: null, gain: null, step: 0, phrase: 0, next: 0, night: false, soft: false, notes: 0 };
  function mnote(freq, t0, dur, vol, type) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(M.gain); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function musicTick() {
    if (!ctx || !M.want) return;
    const hidden = root.document && root.document.hidden;
    const target = (muted || hidden) ? 0.0001 : (M.soft ? 0.05 : 0.13);
    M.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.4);
    if (muted || hidden || ctx.state !== 'running') { M.next = 0; return; }
    const beat = M.night ? 0.62 : 0.44, root0 = M.night ? 67 : 72;
    if (!M.next || M.next < ctx.currentTime) M.next = ctx.currentTime + 0.08;
    while (M.next < ctx.currentTime + 0.6) {
      const ph = PHRASES[M.phrase % PHRASES.length], d = ph[M.step];
      if (d !== null) {
        mnote(N(root0 + d), M.next, beat * 2.2, 0.32, 'sine');
        mnote(N(root0 + d + 12), M.next, beat * 0.9, 0.06, 'triangle'); // little music-box twinkle
        M.notes++;
      }
      if (M.step % 4 === 0) mnote(N(root0 - 24 + BASS[(M.step / 4) | 0]), M.next, beat * 3.4, 0.16, 'sine');
      M.next += beat; M.step++;
      if (M.step >= ph.length) { M.step = 0; M.phrase++; }
    }
  }
  function musicStart() {
    if (!M.want || M.timer || !ensure()) return;
    if (!M.gain) { M.gain = ctx.createGain(); M.gain.gain.value = 0.0001; M.gain.connect(master); }
    M.next = 0; musicTick(); M.timer = setInterval(musicTick, 150);
  }
  function musicStop() {
    clearInterval(M.timer); M.timer = null; M.next = 0;
    if (M.gain && ctx) { M.gain.gain.cancelScheduledValues(ctx.currentTime); M.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15); }
    // fresh gain next time, so notes already queued fade out instead of popping back in
    if (M.gain) { const old = M.gain; M.gain = null; setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 1500); }
  }

  // ---------- weather sounds: soft little ambience for Friend weather (rain, storm, snow, petals, glow, sun, rainbow) ----------
  // Rain and Storm are a quiet filtered-noise patter with tiny plinks (Storm adds a far-away rumble, never in Gentle mode).
  // Snow, petals and fireflies are sparse pentatonic chimes; Sun and Rainbow say hello with one warm arpeggio, then stay quiet.
  const A = { kind: '', want: true, gain: null, noise: null, timer: null, next: 0, rumbleAt: 0, soft: false, events: 0, rumbles: 0, greeted: '' };
  const WX_NOTES = { snow: [96, 98, 100, 103, 105, 108], petals: [76, 79, 81, 84, 86, 88], glow: [91, 93, 96, 98, 100] };
  const WX_GAP = { rain: 0.55, storm: 0.45, snow: 1.5, petals: 1.9, glow: 2.3 };
  function anote(freq, t0, dur, vol, type, slideTo) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(A.gain); o.start(t0); o.stop(t0 + dur + 0.05); A.events++;
  }
  function noiseOn(storm) {
    if (A.noise) return;
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = storm ? 900 : 1600; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = storm ? 0.22 : 0.16;
    src.connect(f); f.connect(g); g.connect(A.gain); src.start();
    A.noise = { src, f, g, storm: !!storm };
  }
  function noiseOff() { if (!A.noise) return; const n = A.noise; A.noise = null; try { n.src.stop(ctx.currentTime + 1.2); } catch (e) { /* ignore */ } setTimeout(() => { try { n.g.disconnect(); } catch (e) { /* ignore */ } }, 1600); }
  function ambTick() {
    if (!ctx || !A.gain) return;
    const hidden = root.document && root.document.hidden, k = A.kind;
    const target = (muted || hidden || !A.want || !k) ? 0.0001 : (A.soft ? 0.18 : 0.42);
    A.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.5);
    if (k === 'rain' || k === 'storm') { if (A.noise && A.noise.storm !== (k === 'storm')) noiseOff(); noiseOn(k === 'storm'); } else noiseOff();
    if (muted || hidden || !A.want || !k || ctx.state !== 'running') { A.next = 0; return; }
    const now = ctx.currentTime;
    if ((k === 'sun' || k === 'rainbow') && A.greeted !== k) {
      A.greeted = k;
      (k === 'sun' ? [72, 76, 79, 84] : [72, 74, 76, 79, 81, 84]).forEach((n, i) => anote(N(n), now + 0.05 + i * 0.12, 0.6, 0.12, 'sine'));
    }
    const gap = WX_GAP[k]; if (!gap) return;
    if (!A.next || A.next < now) A.next = now + 0.1;
    while (A.next < now + 0.6) {
      const t = A.next;
      if (k === 'rain' || k === 'storm') { const b = 88 + Math.floor(Math.random() * 10); anote(N(b), t, 0.07, 0.07, 'sine', N(b - 7)); }
      else { const ns = WX_NOTES[k], n = ns[Math.floor(Math.random() * ns.length)]; anote(N(n), t, k === 'petals' ? 0.9 : 0.6, k === 'petals' ? 0.07 : 0.05, k === 'petals' ? 'triangle' : 'sine'); if (k === 'glow') anote(N(n + 12), t + 0.09, 0.4, 0.03, 'sine'); }
      A.next += gap * (0.6 + Math.random() * 0.8);
    }
    if (k === 'storm' && !A.soft && now > A.rumbleAt) {
      if (A.rumbleAt) { anote(55, now + 0.05, 2.2, 0.2, 'sine', 38); anote(41, now + 0.3, 2.4, 0.14, 'triangle', 33); A.rumbles++; }
      A.rumbleAt = now + 7 + Math.random() * 5;
    }
  }
  function ambStart() {
    if (A.timer || !A.kind || !A.want || !ensure()) return;
    if (!A.gain) { A.gain = ctx.createGain(); A.gain.gain.value = 0.0001; A.gain.connect(master); }
    A.next = 0; A.rumbleAt = 0; ambTick(); A.timer = setInterval(ambTick, 200);
  }
  function ambStop() {
    clearInterval(A.timer); A.timer = null; A.next = 0;
    if (!ctx) return;
    noiseOff();
    if (A.gain) { const old = A.gain; A.gain = null; old.gain.cancelScheduledValues(ctx.currentTime); old.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 1800); }
  }
  function ambApply() { if (A.kind && A.want) { if (ctx) { if (A.timer) ambTick(); else ambStart(); } } else ambStop(); }
  root.EF_AUDIO = {
    combo(n) { const k = Math.min(Math.max(n, 2), 8) - 2; [79, 83, 86, 91].forEach((m, i) => tone(N(m + k * 2), i * 0.06, 0.12, 'triangle', 0.26)); tone(N(98 + k * 2), 0.26, 0.3, 'sine', 0.16); },
    play(name) { try { SFX[name] && SFX[name](); } catch (e) { /* ignore */ } },
    voice(e) { try { voice(e); } catch (err) { /* ignore */ } },
    voiceOf,
    unlock() { ensure(); if (M.want) musicStart(); if (A.kind && A.want) ambStart(); },
    // music(true) only starts once the browser allows sound (after the first tap); until then it waits quietly
    music(on) { M.want = !!on; if (!M.want) musicStop(); else if (ctx) musicStart(); },
    musicInfo() { return { want: M.want, playing: !!M.timer, notes: M.notes, night: M.night, soft: M.soft, phrase: M.phrase }; },
    setMusicNight(n) { M.night = !!n; },
    setMusicSoft(s) { M.soft = !!s; if (M.timer) musicTick(); },
    // weather sounds: kind is '' (clear skies) or rain/storm/snow/petals/glow/sun/rainbow; waits for the first tap like music
    ambience(kind) { kind = kind || ''; if (kind !== A.kind) { A.kind = kind; A.greeted = ''; A.next = 0; } try { ambApply(); } catch (e) { /* ignore */ } },
    ambienceOn(on) { A.want = !!on; try { ambApply(); } catch (e) { /* ignore */ } },
    setAmbienceSoft(s) { A.soft = !!s; if (A.timer) ambTick(); },
    ambienceInfo() { return { kind: A.kind, want: A.want, playing: !!A.timer, noise: !!A.noise, events: A.events, rumbles: A.rumbles, soft: A.soft, level: A.gain ? A.gain.gain.value : 0 }; },
    setMuted(m) { muted = !!m; if (M.timer) musicTick(); if (A.timer) ambTick(); },
    isMuted() { return muted; }
  };
})(window);
