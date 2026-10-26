/* Element Friends — parametric kawaii SVG character generator. */
(function (root) {
  'use strict';
  let UID = 0;
  // ---------- color helpers ----------
  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  const PLUM = '#4a2f55';
  const dk = c => mix(c, PLUM, 0.5);
  const lt = c => mix(c, '#ffffff', 0.55);
  const INK = '#3b2b4f';
  // ---------- primitives ----------
  const st = (f, w) => `fill="${f}" stroke="${f === 'none' ? INK : dk(f)}" stroke-width="${w || 2.2}" stroke-linejoin="round" stroke-linecap="round"`;
  const P = (d, f, w) => `<path d="${d}" ${st(f, w)}/>`;
  const PN = (d, f, extra) => `<path d="${d}" fill="${f}" ${extra || ''}/>`;
  const C = (x, y, r, f, w) => `<circle cx="${x}" cy="${y}" r="${r}" ${st(f, w)}/>`;
  const CN = (x, y, r, f, extra) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${extra || ''}/>`;
  const E = (x, y, rx, ry, f, rot, w) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${st(f, w)}${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
  const EN = (x, y, rx, ry, f, rot, extra) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''} ${extra || ''}/>`;
  const S = (d, c, w, extra) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w || 2.4}" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}/>`;
  const R = (x, y, w, h, rx, f, sw) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${st(f, sw)}/>`;
  const RN = (x, y, w, h, rx, f, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${extra || ''}/>`;
  function starPath(cx, cy, ro, ri, n, rot) {
    n = n || 5; rot = rot || -90; let d = '';
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = (rot + i * 180 / n) * Math.PI / 180; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); }
    return d + 'Z';
  }
  function softStar(cx, cy, ro, rc, n) {
    n = n || 5; const pts = [];
    for (let i = 0; i < n; i++) { const a = (-90 + i * 360 / n) * Math.PI / 180; pts.push([cx + ro * Math.cos(a), cy + ro * Math.sin(a)]); }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) { const a = (-90 + (i + 0.5) * 360 / n) * Math.PI / 180, p = pts[(i + 1) % n]; d += `Q${(cx + rc * Math.cos(a)).toFixed(1)} ${(cy + rc * Math.sin(a)).toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; }
    return d + 'Z';
  }
  function fluffPath(cx, cy, r, n) {
    let d = ''; const pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    const br = r * Math.sin(Math.PI / n) * 1.25;
    d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i <= n; i++) d += `A${br.toFixed(1)} ${br.toFixed(1)} 0 0 1 ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    return d + 'Z';
  }
  const sparkle = (x, y, r, f) => PN(`M${x} ${y - r}Q${x + r * .18} ${y - r * .18} ${x + r} ${y}Q${x + r * .18} ${y + r * .18} ${x} ${y + r}Q${x - r * .18} ${y + r * .18} ${x - r} ${y}Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z`, f || '#fff', `stroke="${f && f !== '#fff' ? dk(f) : '#ffd36e'}" stroke-width="1" stroke-linejoin="round"`);
  const heart = (x, y, s, f) => P(`M${x} ${y + 5 * s}C${x - 7 * s} ${y} ${x - 6 * s} ${y - 6 * s} ${x - 2.6 * s} ${y - 5 * s}C${x - 1 * s} ${y - 4.6 * s} ${x} ${y - 3.4 * s} ${x} ${y - 2.6 * s}C${x} ${y - 3.4 * s} ${x + 1 * s} ${y - 4.6 * s} ${x + 2.6 * s} ${y - 5 * s}C${x + 6 * s} ${y - 6 * s} ${x + 7 * s} ${y} ${x} ${y + 5 * s}Z`, f || '#ff8fb8', 1.6);
  const drop = (x, y, s, f) => P(`M${x} ${y - 6 * s}C${x + 2 * s} ${y - 2 * s} ${x + 4 * s} ${y} ${x + 4 * s} ${y + 2.4 * s}A${4 * s} ${4 * s} 0 0 1 ${x - 4 * s} ${y + 2.4 * s}C${x - 4 * s} ${y} ${x - 2 * s} ${y - 2 * s} ${x} ${y - 6 * s}Z`, f || '#8fd3ff', 1.4);
  const flameP = (x, y, s) => `M${x} ${y - 14 * s}C${x + 4 * s} ${y - 6 * s} ${x + 10 * s} ${y - 4 * s} ${x + 10 * s} ${y + 4 * s}C${x + 10 * s} ${y + 10 * s} ${x + 5 * s} ${y + 14 * s} ${x} ${y + 14 * s}C${x - 5 * s} ${y + 14 * s} ${x - 10 * s} ${y + 10 * s} ${x - 10 * s} ${y + 4 * s}C${x - 10 * s} ${y - 2 * s} ${x - 4 * s} ${y - 4 * s} ${x} ${y - 14 * s}Z`;
  const cloudP = (x, y, s) => `M${x - 10 * s} ${y + 5 * s}A${5 * s} ${5 * s} 0 0 1 ${x - 8 * s} ${y - 4 * s}A${6 * s} ${6 * s} 0 0 1 ${x + 4 * s} ${y - 6 * s}A${5 * s} ${5 * s} 0 0 1 ${x + 10 * s} ${y + 5 * s}Z`;
  const tri = (x, y, s, f) => P(`M${x} ${y - 10 * s}L${x + 10 * s} ${y + 7 * s}L${x - 10 * s} ${y + 7 * s}Z`, f, 1.6);

  // ---------- shapes ----------
  const SH = {
    drop: { d: 'M50 12C60 30 84 44 84 64C84 82 69 92 50 92C31 92 16 82 16 64C16 44 40 30 50 12Z', t: 12, fy: 64 },
    flame: { d: 'M50 8C58 22 66 24 68 14C80 30 86 46 85 64C84 82 69 92 50 92C31 92 16 82 15 64C14 48 22 38 31 28C33 38 39 40 42 33C44 25 46 16 50 8Z', t: 8, fy: 66 },
    blob: { d: 'M50 26C74 26 86 44 86 62C86 80 70 90 50 90C30 90 14 80 14 62C14 44 26 26 50 26Z', t: 26, fy: 60 },
    round: { d: 'M50 24A34 34 0 1 1 49.9 24Z', t: 24, fy: 58 },
    cloud: { d: 'M28 86C14 86 8 74 13 64C8 52 19 41 31 45C33 32 49 25 60 33C71 27 85 36 83 50C93 54 95 70 85 80C81 85 76 86 70 86Z', t: 28, fy: 66, s: .95 },
    ghost: { d: 'M18 58C18 37 32 22 50 22C68 22 82 37 82 58L82 86C77 82 72 92 66 87C61 83 56 92 50 87C44 92 39 83 34 87C28 92 23 82 18 86Z', t: 22, fy: 52 },
    star: { d: softStar(50, 57, 42, 14), t: 15, fy: 61, s: .78 },
    fluff: { d: fluffPath(50, 58, 31, 16), t: 23, fy: 58 },
    rock: { d: 'M30 34C40 26 62 24 74 32C84 40 88 58 84 74C80 88 64 92 48 92C32 92 18 86 16 70C14 56 20 42 30 34Z', t: 27, fy: 62 },
    puddle: { d: 'M8 76C8 62 28 56 50 57C72 56 92 62 92 76C92 88 72 92 50 92C28 92 8 88 8 76Z', t: 57, fy: 73, s: .86 },
    tornado: { d: 'M12 26C12 14 88 14 88 26C88 40 72 50 64 60C57 70 60 80 50 94C46 82 40 72 36 62C28 50 12 40 12 26Z', t: 17, fy: 34, s: .78 },
    box: { d: 'M34 28H66Q82 28 82 44V76Q82 92 66 92H34Q18 92 18 76V44Q18 28 34 28Z', t: 28, fy: 62 },
    tri: { d: 'M50 16C56 16 60 22 64 30L87 76C91 86 85 92 75 92H25C15 92 9 86 13 76L36 30C40 22 44 16 50 16Z', t: 16, fy: 68, s: .85 },
    squat: { d: 'M30 44H70Q88 44 88 62V74Q88 92 70 92H30Q12 92 12 74V62Q12 44 30 44Z', t: 44, fy: 69, s: .9 },
    gem: { d: 'M50 12L80 32L80 72L50 92L20 72L20 32Z', t: 12, fy: 56, s: .9 },
    bowl: { d: 'M10 52H90C90 76 74 92 50 92C26 92 10 76 10 52Z', t: 52, fy: 68, s: .85 },
    cup: { d: 'M18 36H82C82 36 80 70 75 82C73 88 67 92 59 92H41C33 92 27 88 25 82C20 70 18 36 18 36Z', t: 36, fy: 62, s: .9 },
    mushroom: { d: ['M30 58C28 80 32 92 50 92C68 92 72 80 70 58Z', 'M8 58C8 30 28 12 50 12C72 12 92 30 92 58C92 64 84 66 50 66C16 66 8 64 8 58Z'], t: 12, fy: 78, s: .8, cap: true },
    bean: { d: 'M50 12C66 12 71 24 71 38V76C71 88 62 92 50 92C38 92 29 88 29 76V38C29 24 34 12 50 12Z', t: 12, fy: 52, s: .8 },
    egg: { d: 'M50 16C72 16 84 44 84 64C84 82 70 92 50 92C30 92 16 82 16 64C16 44 28 16 50 16Z', t: 16, fy: 62 },
    dome: { d: 'M14 62C14 36 30 20 50 20C70 20 86 36 86 62C86 69 80 71 74 69C66 66 58 73 50 70C42 73 34 66 26 69C20 71 14 69 14 62Z', t: 20, fy: 48, s: .9 },
    heart: { d: 'M50 92C22 74 8 58 12 40C16 24 36 20 50 34C64 20 84 24 88 40C92 58 78 74 50 92Z', t: 26, fy: 54, s: .9 },
    snowman: { d: ['M50 46A26 24 0 1 1 49.9 46Z', 'M50 16A22 21 0 1 1 49.9 16Z'], t: 16, fy: 38, s: .78 },
    igloo: { d: 'M10 90C10 52 28 28 50 28C72 28 90 52 90 90Z', t: 28, fy: 60 },
    scoop: { d: 'M50 14A31 31 0 1 1 49.9 14Z', t: 14, fy: 46, s: .86 },
    splat: { d: 'M20 50C10 36 28 22 42 30C54 16 80 22 80 38C94 46 93 70 80 80C72 94 46 93 34 85C16 85 8 64 20 50Z', t: 24, fy: 58 }
  };

  // ---------- accessories: return {back, pat, mid, front} ----------
  const A = {};
  const def = (name, fn) => { A[name] = fn; };
  // generic bits
  def('bubbles', o => ({ front: C(80, 26, 4, '#e8f7ff', 1.4) + C(88, 16, 2.6, '#e8f7ff', 1.2) + CN(79, 25, 1.2, '#fff') }));
  def('sparkles', o => ({ front: sparkle(14, 30, 6, '#fff7b0') + sparkle(87, 22, 4.5, '#fff') + sparkle(88, 80, 4, '#fff7b0') }));
  def('innerFlame', o => ({ pat: PN(flameP(50, 76, 1.5), '#ffd66b', 'opacity=".9"') }));
  def('sprout', o => ({ back: S(`M50 ${o.t + 6}V${o.t - 6}`, '#5fae6a', 3) + P(`M50 ${o.t - 5}C46 ${o.t - 15} 35 ${o.t - 15} 33 ${o.t - 9}C37 ${o.t - 3} 46 ${o.t - 2} 50 ${o.t - 5}Z`, '#8ee08f') + P(`M50 ${o.t - 6}C54 ${o.t - 18} 67 ${o.t - 19} 70 ${o.t - 12}C66 ${o.t - 4} 55 ${o.t - 3} 50 ${o.t - 6}Z`, '#8ee08f') }));
  def('speckles', (o, c) => ({ pat: [[30, 38, 2.4], [70, 40, 2], [26, 76, 2.2], [74, 78, 2.6], [60, 32, 1.6], [38, 86, 1.6], [80, 60, 1.8], [20, 58, 1.6]].map(p => CN(p[0], p[1], p[2], c || dk(o.c))).join('') }));
  def('windLines', o => ({ front: S('M2 50H14Q20 50 20 44Q20 39 15 40', '#9bd7e8', 2.6) + S('M0 64H12', '#9bd7e8', 2.6) + S('M84 72H96Q100 72 100 77', '#9bd7e8', 2.6) }));
  def('curlTop', o => ({ front: S(`M50 ${o.t + 2}C50 ${o.t - 8} 62 ${o.t - 10} 62 ${o.t - 3}C62 ${o.t + 1} 56 ${o.t + 1} 56 ${o.t - 3}`, dk(o.c), 2.6) }));
  def('steam', o => ({ back: S('M36 28C30 20 42 16 36 6', '#d9d2f5', 3.4) + S('M54 24C48 16 60 12 54 2', '#d9d2f5', 3.4) + S('M70 30C66 24 74 20 70 12', '#d9d2f5', 3) }));
  def('drips', (o, c) => ({ pat: PN(`M14 ${o.t + 22}C30 ${o.t + 16} 40 ${o.t + 30} 50 ${o.t + 20}C60 ${o.t + 30} 70 ${o.t + 14} 88 ${o.t + 22}V${o.t - 2}H14Z`, c) + CN(30, o.t + 26, 3, c) + CN(64, o.t + 25, 2.4, c) }));
  def('swirls', o => ({ front: S('M6 40C2 34 10 30 12 36', '#c9c4ec', 2.4) + S('M88 34C92 28 98 34 94 38', '#c9c4ec', 2.4) + S('M90 70C96 68 96 76 92 76', '#c9c4ec', 2.4) }));
  def('lavaGlow', o => ({ pat: PN(`M10 ${o.t + 14}C26 ${o.t + 8} 34 ${o.t + 22} 46 ${o.t + 14}C58 ${o.t + 24} 70 ${o.t + 6} 90 ${o.t + 14}V0H10Z`, '#ffcf5c') + CN(28, 82, 4, '#ffb04d') + CN(74, 80, 3, '#ffb04d') }));
  def('smokePuffs', o => ({ back: C(34, 26, 6, '#d7d4e3', 1.6) + C(60, 20, 8, '#d7d4e3', 1.6) + C(78, 30, 5, '#d7d4e3', 1.6) }));
  def('cracks', o => ({ pat: S('M70 36L64 44L70 50', dk(o.c), 2) + S('M26 74L32 78L30 84', dk(o.c), 2) + CN(36, 40, 2, lt(o.c)) + CN(76, 72, 2.4, dk(o.c), 'opacity=".4"') }));
  def('leafFly', o => ({ front: P('M84 28C88 20 96 20 98 26C94 32 88 32 84 28Z', '#9ee09a', 1.4) }));
  def('ripples', o => ({ pat: S(`M22 ${o.fy + 14}Q30 ${o.fy + 11} 38 ${o.fy + 14}`, '#fff', 2, 'opacity=".8"') + S(`M62 ${o.fy + 15}Q70 ${o.fy + 12} 78 ${o.fy + 15}`, '#fff', 2, 'opacity=".8"') }));
  def('drops', o => ({ back: drop(32, 94, 1, '#8fd3ff') + drop(52, 97, 1, '#8fd3ff') + drop(70, 93, 1, '#8fd3ff') }));
  def('brows', o => ({ front: S(`M${50 - 18 * o.s} ${o.fy - 11 * o.s}L${50 - 7 * o.s} ${o.fy - 8 * o.s}`, INK, 2.4) + S(`M${50 + 18 * o.s} ${o.fy - 11 * o.s}L${50 + 7 * o.s} ${o.fy - 8 * o.s}`, INK, 2.4) }));
  const boltD = (x, y, s) => `M${x + 3 * s} ${y - 12 * s}L${x - 7 * s} ${y + 2 * s}H${x}L${x - 4 * s} ${y + 14 * s}L${x + 8 * s} ${y - 3 * s}H${x + 1 * s}L${x + 6 * s} ${y - 12 * s}Z`;
  def('bolt', o => ({ front: P(boltD(84, 82, 1.2), '#ffe066', 1.8) }));
  def('boltTop', o => ({ back: P(boltD(50, o.t - 4, 1.2), '#ffd23f', 2) }));
  def('miniClouds', o => ({ pat: P(cloudP(28, 40, 1.1), '#ffffff', 1.4) + P(cloudP(74, 84, 1), '#ffffff', 1.4) }));
  def('sunrays', (o, c) => { let s = ''; for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180, b = 0.2, p = (r, t) => (50 + r * Math.cos(t)).toFixed(1) + ' ' + (58 + r * Math.sin(t)).toFixed(1); s += P(`M${p(32, a - b)}L${p(47, a)}L${p(32, a + b)}Z`, c || '#ffb347', 2); } return { back: s }; });
  def('sunglasses', o => ({ front: `<g transform="translate(50 ${o.fy}) scale(${o.s})">` + R(-21, -8, 17, 12, 5, '#4a3a6a', 1.6) + R(4, -8, 17, 12, 5, '#4a3a6a', 1.6) + S('M-4 -3H4', '#4a3a6a', 2.4) + S('M-18 -5L-12 -5', '#fff', 1.6, 'opacity=".8"') + S('M7 -5L13 -5', '#fff', 1.6, 'opacity=".8"') + '</g>', hideEyes: true }));
  def('craters', o => ({ pat: C(30, 40, 4, mix(o.c, '#e0c98a', .5), 1) + C(72, 76, 5, mix(o.c, '#e0c98a', .5), 1) + C(76, 44, 2.6, mix(o.c, '#e0c98a', .5), 1) }));
  def('nightcap', o => ({ front: P(`M20 ${o.t + 22}C20 ${o.t - 4} 48 ${o.t - 12} 70 ${o.t - 8}C82 ${o.t - 6} 90 ${o.t + 2} 92 ${o.t + 14}C86 ${o.t + 8} 82 ${o.t + 8} 80 ${o.t + 22}Z`, '#8fa8ff') + C(93, o.t + 16, 5, '#fff3b0', 1.6) + R(18, o.t + 18, 64, 8, 4, '#fff', 1.8) + sparkle(42, o.t + 4, 3.4, '#fff3b0') + sparkle(62, o.t + 2, 2.6, '#fff3b0') }));
  def('rainbowArc', o => { const cols = ['#ff9aa8', '#ffc58a', '#ffe78a', '#a8e6a3', '#9fd0ff', '#c4a8ff']; let s = ''; cols.forEach((c, i) => { const r = 44 - i * 5.2; s += S(`M${50 - r} 66A${r} ${r} 0 0 1 ${50 + r} 66`, c, 5.4); }); return { back: s }; });
  def('twirl', o => ({ pat: S('M18 30Q50 40 84 30', '#fff', 2.4, 'opacity=".75"') + S('M30 56Q50 64 70 54', '#fff', 2.4, 'opacity=".75"') + S('M40 74Q50 78 60 72', '#fff', 2, 'opacity=".75"') }));
  const flake = (x, y, r, c) => { let s = ''; for (let i = 0; i < 3; i++) { const a = i * 60 * Math.PI / 180; s += S(`M${(x - r * Math.cos(a)).toFixed(1)} ${(y - r * Math.sin(a)).toFixed(1)}L${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`, c, 2.2); } return s + CN(x, y, 1.6, c); };
  def('snowflake', o => ({ front: flake(72, o.t + 8, 7, '#8ec5ff') }));
  def('iceShine', o => ({ pat: S('M26 40L36 32', '#fff', 3.4) + S('M26 50L30 47', '#fff', 3) + S('M70 84L78 78', '#fff', 2.6, 'opacity=".8"') }));
  def('auroraBands', o => ({ pat: PN('M0 44C20 34 40 52 60 40C76 32 90 40 100 36V50C86 54 74 46 60 54C40 64 22 48 0 58Z', '#b8f0ff', 'opacity=".8"') + PN('M0 74C20 66 40 80 60 70C76 62 90 72 100 66V90H0Z', '#e2c8ff', 'opacity=".8"') }));
  def('curl', o => ({ front: P(`M30 ${o.t + 26}C26 ${o.t + 8} 40 ${o.t - 6} 56 ${o.t}C66 ${o.t + 4} 66 ${o.t + 16} 56 ${o.t + 16}C50 ${o.t + 16} 50 ${o.t + 8} 56 ${o.t + 9}C48 ${o.t + 4} 36 ${o.t + 12} 36 ${o.t + 26}Z`, '#ffffff', 1.8) }));
  def('foam', o => ({ front: C(20, 84, 4, '#fff', 1.4) + C(82, 82, 5, '#fff', 1.4) + C(88, 74, 3, '#fff', 1.2) }));
  def('bigShine', o => ({ pat: S('M28 46A24 24 0 0 1 44 30', '#fff', 4) + CN(70, 74, 3, '#fff', 'opacity=".8"') + `<circle cx="50" cy="58" r="30" fill="none" stroke="#ffc6ec" stroke-width="2" opacity=".5"/>` }));
  def('lilypad', o => ({ front: P('M74 84A10 7 0 1 1 90 80L82 81Z', '#8fdc7a', 1.6) + C(80, 78, 3, '#ffb3cf', 1.2) }));
  def('waves', o => ({ pat: PN(`M0 ${o.t + 16}Q12 ${o.t + 8} 24 ${o.t + 16}T48 ${o.t + 16}T72 ${o.t + 16}T96 ${o.t + 16}T120 ${o.t + 16}V0H0Z`, '#bfe6ff') + S(`M18 84Q26 80 34 84`, '#fff', 2, 'opacity=".7"') + S(`M60 86Q68 82 76 86`, '#fff', 2, 'opacity=".7"') }));
  def('starfishSide', o => ({ front: `<path d="${starPath(82, 82, 9, 4.5, 5, -70)}" ${st('#ffb38a', 1.6)}/>` + CN(82, 82, 1.2, '#fff') }));
  def('snowcap', o => ({ pat: PN('M30 44L40 50L48 42L56 50L64 42L72 48L50 0Z', '#fff') + S('M30 44L40 50L48 42L56 50L64 42L72 48', dk('#ffffff'), 1.6) }));
  def('lavaTop', o => ({ pat: PN('M30 40C36 46 40 42 42 50C44 56 48 56 48 48C50 44 54 44 54 52C56 58 60 58 60 50C62 44 66 46 70 40L50 0Z', '#ff7a59') + CN(46, 62, 2.4, '#ff7a59') }));
  def('smokeTop', o => ({ back: C(42, 10, 6, '#d7d4e3', 1.6) + C(56, 6, 7, '#d7d4e3', 1.6) + C(66, 14, 4.5, '#d7d4e3', 1.6) }));
  def('glassShine', o => ({ pat: S('M28 40L40 32', '#fff', 4) + S('M28 52L32 49', '#fff', 3.4) + S('M64 86L76 78', '#fff', 3, 'opacity=".9"') }));
  def('palm', o => ({ back: P('M64 50C66 36 70 24 76 16L80 18C75 26 71 38 70 50Z', '#c99a6e', 1.6) + P('M78 16C70 8 58 10 54 18C62 14 70 16 78 18Z', '#7fd38a', 1.6) + P('M78 16C86 6 98 10 98 18C92 14 84 14 78 18Z', '#7fd38a', 1.6) + P('M78 17C76 26 66 30 62 32C68 24 72 20 78 17Z', '#7fd38a', 1.6) + P('M78 17C88 20 94 30 92 36C88 28 84 22 78 17Z', '#7fd38a', 1.6) + C(76, 20, 2.6, '#a8805c', 1.2) }));
  def('waveBottom', o => ({ front: P('M2 90Q10 82 18 90T34 90T50 90T66 90T82 90T98 90V98H2Z', '#8fd3ff', 1.8) }));
  def('umbrella', o => ({ back: S('M24 46L34 14', '#a8805c', 2.6) + P('M10 22C14 4 44 0 58 14C48 12 40 18 34 14C28 18 18 16 10 22Z', '#ff9aa8', 1.8) + PN('M34 14C38 10 46 8 52 10C46 12 40 16 34 14Z', '#fff') }));
  def('shellPat', o => ({ front: P('M74 86C74 80 86 80 86 86Z', '#ffc4d6', 1.4) + S('M80 86L80 82', '#e79ab4', 1) }));
  def('dunes', o => ({ pat: S('M12 82Q30 74 50 82T88 80', dk(o.c), 2, 'opacity=".45"') }));
  def('miniSun', o => ({ back: C(80, 30, 9, '#ffd166', 1.6) + S('M80 16V12M92 22L95 19M94 32H98', '#ffb347', 2.2) }));
  def('facets', o => ({ pat: S('M20 32L50 46L80 32M50 46V92', '#fff', 1.8, 'opacity=".6"') + PN('M24 34L44 44L28 50Z', '#fff', 'opacity=".55"') }));
  def('metalShine', o => ({ pat: S('M30 40L44 32', '#fff', 4) + S('M70 82L78 76', '#fff', 2.6, 'opacity=".8"') }));
  def('rivets', o => ({ pat: CN(26, 66, 2.2, dk(o.c)) + CN(74, 66, 2.2, dk(o.c)) + CN(50, 84, 2.2, dk(o.c)) }));
  def('thumbprint', o => ({ pat: S('M60 36A8 6 0 0 1 76 40', dk(o.c), 1.6, 'opacity=".4"') + S('M62 40A5 4 0 0 1 72 42', dk(o.c), 1.6, 'opacity=".4"') }));
  def('onsenWater', o => ({ back: E(50, 52, 40, 7, '#9fdcff', 0, 2) + S('M34 52Q40 49 46 52', '#fff', 1.6) }));
  def('towel', o => ({ front: `<g transform="rotate(-8 50 46)">` + R(36, 40, 26, 9, 3, '#ffffff', 1.6) + RN(36, 43, 26, 2.4, 0, '#8fc8ff') + '</g>' }));
  def('steamTop', o => ({ back: S(`M38 ${o.t - 2}C34 ${o.t - 8} 42 ${o.t - 12} 38 ${o.t - 20}`, '#e1dbf7', 3) + S(`M52 ${o.t - 4}C48 ${o.t - 10} 56 ${o.t - 14} 52 ${o.t - 24}`, '#e1dbf7', 3) + S(`M66 ${o.t - 2}C62 ${o.t - 8} 70 ${o.t - 12} 66 ${o.t - 18}`, '#e1dbf7', 3) }));
  def('woodPlanks', o => ({ pat: S('M30 52V96M70 52V96', dk(o.c), 1.6, 'opacity=".35"') }));
  def('sproutBig', o => ({ back: S('M50 40V20', '#5fae6a', 3.4) + P('M50 24C44 8 26 6 22 16C28 26 42 28 50 24Z', '#8ee08f') + P('M50 20C56 2 76 0 80 12C74 22 58 24 50 20Z', '#8ee08f') + S('M28 14Q38 16 46 22', '#5fae6a', 1.4, 'opacity=".6"') }));
  def('potRim', o => ({ front: R(13, 31, 74, 11, 5, mix(o.c, '#ffffff', .25), 2.2) }));
  def('grassBlades', o => ({ back: P('M14 52L18 30L24 48L30 26L36 48L42 30L48 48L54 28L60 48L66 30L72 48L78 28L84 52Z', '#7fd06f', 1.8) }));
  def('trunk', o => ({ back: P('M42 76H58L60 98H40Z', '#c99a6e', 2) }));
  def('appleDots', o => ({ pat: C(28, 52, 3.6, '#ff8a8a', 1.2) + C(76, 48, 3.6, '#ff8a8a', 1.2) + C(70, 80, 3.2, '#ff8a8a', 1.2) }));
  def('miniTrees', o => ({ back: P('M10 72L18 50L26 72Z', '#4aa86a', 1.8) + P('M74 72L84 46L94 72Z', '#4aa86a', 1.8) + S('M18 72V80M84 72V80', '#a8805c', 3) }));
  def('petals', (o, c) => { let s = ''; for (let i = 0; i < 8; i++) { const a = (i * 45 - 90) * Math.PI / 180; s += E(50 + 38 * Math.cos(a), 58 + 38 * Math.sin(a), 15, 11, c, i * 45 - 90 + 90 + 90); } return { back: s }; });
  def('gardenFlowers', o => { const fl = (x, y, c) => [0, 72, 144, 216, 288].map(a => C(x + 5 * Math.cos(a * Math.PI / 180), y + 5 * Math.sin(a * Math.PI / 180), 4, c, 1.2)).join('') + C(x, y, 3, '#ffe27a', 1.2); return { back: S('M26 46V34M50 46V26M74 46V34', '#5fae6a', 2.6) + fl(26, 30, '#ff9ec7') + fl(50, 22, '#c4a8ff') + fl(74, 30, '#9fd0ff') }; });
  def('capSpots', o => ({ front: E(30, 38, 6, 5, '#fff', -10, 1.4) + E(54, 26, 7, 5, '#fff', 0, 1.4) + E(76, 42, 5, 4, '#fff', 15, 1.4) + E(48, 52, 4, 3, '#fff', 0, 1.2) }));
  def('cactusArms', o => ({ back: P('M30 58H22C16 58 14 54 14 48V40C14 36 20 36 20 40V48C20 50 22 52 24 52H30Z', o.c) + P('M70 50H78C82 50 84 46 84 42V32C84 28 78 28 78 32V42C78 44 76 44 74 44H70Z', o.c) }));
  def('needles', o => ({ pat: [[40, 26], [60, 26], [36, 76], [64, 80], [50, 86], [62, 70]].map(p => S(`M${p[0] - 1.6} ${p[1]}H${p[0] + 1.6}`, dk(o.c), 1.4)).join('') }));
  def('flowerTop', (o, c) => ({ front: [0, 72, 144, 216, 288].map(a => C(50 + 5 * Math.cos(a * Math.PI / 180), o.t - 2 + 5 * Math.sin(a * Math.PI / 180), 4.4, c, 1.3)).join('') + C(50, o.t - 2, 3, '#ffe27a', 1.2) }));
  def('segments', o => ({ pat: S('M28 30Q50 34 72 30', dk(o.c), 2) + S('M28 80Q50 84 72 80', dk(o.c), 2) }));
  def('bambooLeaf', o => ({ back: P('M66 30C76 20 88 18 96 22C88 30 76 32 66 30Z', '#7fcf6a', 1.6) + P('M34 26C26 14 16 12 8 14C14 24 24 28 34 26Z', '#7fcf6a', 1.6) }));
  def('grains', o => { let s = S('M50 18V2', '#c99a3e', 2); [[44, 4], [56, 4], [43, 12], [57, 12], [50, -2]].forEach(p => s += E(p[0], p[1], 3.6, 5.6, '#f7c84a', p[0] < 50 ? -30 : p[0] > 50 ? 30 : 0, 1.4)); return { back: s }; });
  def('riceMound', o => ({ back: P('M14 54C14 40 24 32 34 36C38 26 62 26 66 36C76 32 86 40 86 54Z', '#ffffff', 2) + E(36, 42, 2, 1.2, '#eee', 20, .8) + E(56, 36, 2, 1.2, '#eee', -20, .8) + S('M70 30L92 8M76 32L96 14', '#c98a5a', 2.6) }));
  def('bowlPattern', o => ({ pat: S('M10 86Q50 80 90 86', '#fff', 2, 'opacity=".7"') + C(22, 62, 2.4, '#fff', 1) + C(78, 62, 2.4, '#fff', 1) }));
  def('stemLeaf', o => ({ back: S(`M50 ${o.t + 6}Q50 ${o.t - 4} 54 ${o.t - 8}`, '#8a5a44', 3.2) + P(`M54 ${o.t - 4}C58 ${o.t - 14} 70 ${o.t - 14} 74 ${o.t - 8}C68 ${o.t} 58 ${o.t} 54 ${o.t - 4}Z`, '#8ee08f') }));
  def('fallingPetals', o => ({ front: E(12, 20, 4, 2.6, '#ffb3cf', 30, 1) + E(90, 86, 4, 2.6, '#ffb3cf', -20, 1) + E(88, 16, 3, 2, '#ffb3cf', 40, 1) }));
  def('clover', o => { let s = ''; [0, 90, 180, 270].forEach(a => { const r = a * Math.PI / 180, x = 50 + 30 * Math.cos(r - Math.PI / 4), y = 58 + 30 * Math.sin(r - Math.PI / 4); s += `<path d="M${x} ${y + 12}C${x - 20} ${y} ${x - 14} ${y - 16} ${x} ${y - 6}C${x + 14} ${y - 16} ${x + 20} ${y} ${x} ${y + 12}Z" ${st('#6fcf86')} transform="rotate(${a + 45} ${x} ${y})"/>`; }); return { back: s }; });
  def('heartTop', o => ({ front: heart(50, o.t - 4, 1.4, '#ff8fb8') }));
  def('earsHamster', o => ({ back: C(26, 32, 9, o.c) + C(74, 32, 9, o.c) + CN(26, 32, 5, '#ffb3c7') + CN(74, 32, 5, '#ffb3c7') }));
  def('cheeks', o => ({ mid: EN(26, 70, 9, 7, lt(o.c)) + EN(74, 70, 9, 7, lt(o.c)) }));
  def('hair', (o, c) => ({ front: P(`M17 ${o.fy - 2}C14 ${o.t - 10} 86 ${o.t - 10} 83 ${o.fy - 2}C80 ${o.fy - 12} 72 ${o.fy - 16} 62 ${o.fy - 13}C56 ${o.fy - 18} 44 ${o.fy - 19} 36 ${o.fy - 11}C30 ${o.fy - 15} 21 ${o.fy - 11} 17 ${o.fy - 2}Z`, c) + S(`M38 ${o.t + 4}Q44 ${o.t} 50 ${o.t + 2}`, '#fff', 2, 'opacity=".5"') }));
  def('hairLong', (o, c) => ({ back: P(`M18 ${o.fy - 10}C10 ${o.fy + 16} 12 ${o.fy + 36} 22 ${o.fy + 38}L78 ${o.fy + 38}C88 ${o.fy + 36} 90 ${o.fy + 16} 82 ${o.fy - 10}Z`, c), front: A.hair(o, c).front }));
  def('moss', o => ({ pat: PN('M24 36C30 26 46 22 56 28C64 22 76 30 78 36C66 34 60 40 50 36C40 42 32 34 24 36Z', '#8fd88a') + CN(36, 30, 1.6, '#ffb3cf') }));
  def('crest', (o, c) => ({ back: E(46, o.t - 2, 4, 9, c, -20) + E(54, o.t - 4, 4, 10, c, 15) }));
  def('wingsSmall', (o, c) => ({ front: E(16, o.fy + 14, 6, 11, c, 25) + E(84, o.fy + 14, 6, 11, c, -25) }));
  def('tailFish', (o, c) => ({ back: P('M80 58L98 42C100 54 100 66 98 78Z', c || mix(o.c, '#ff7a59', .3)) }));
  def('fin', o => ({ back: P(`M38 ${o.t + 6}Q50 ${o.t - 14} 66 ${o.t - 2}Q60 ${o.t + 4} 62 ${o.t + 8}Z`, mix(o.c, '#ff7a59', .3)) }));
  def('scales', o => ({ pat: S('M64 76Q68 72 72 76M72 80Q76 76 80 80M60 84Q64 80 68 84', dk(o.c), 1.6, 'opacity=".5"') }));
  def('shell', o => ({ back: P('M14 64C14 20 86 20 86 64Z', '#7cc48a', 2.4) + `<path d="M40 30L60 30L66 44L50 52L34 44Z M22 54L34 44 M78 54L66 44" fill="none" stroke="#5a9e6a" stroke-width="2" stroke-linejoin="round"/>` }));
  def('shellHex', o => ({ pat: `<path d="M38 32L62 32L70 46L62 58L38 58L30 46Z" fill="${lt(o.c)}" stroke="${dk(o.c)}" stroke-width="2" stroke-linejoin="round"/><path d="M30 46H8M70 46H92M38 32L30 18M62 32L70 18M38 58L32 70M62 58L68 70" fill="none" stroke="${dk(o.c)}" stroke-width="2"/>` }));
  def('turtleFeet', o => ({ back: E(22, 88, 9, 6, '#b8eaa8') + E(78, 88, 9, 6, '#b8eaa8') + P('M88 80L98 84L88 86Z', '#b8eaa8', 1.6) }));
  def('frogBumps', o => ({ back: C(36, 30, 13, o.c) + C(64, 30, 13, o.c) }));
  def('spots', (o, c) => ({ pat: EN(24, 40, 9, 7, c, 20) + EN(78, 76, 10, 8, c, -10) + EN(76, 34, 6, 5, c) + EN(28, 82, 6, 5, c) }));
  def('tailLizard', o => ({ back: P('M80 78C92 80 98 70 94 60C92 66 88 70 80 70Z', o.c) }));
  def('horns', o => ({ back: P(`M34 ${o.t + 8}Q26 ${o.t - 6} 32 ${o.t - 14}Q38 ${o.t - 4} 44 ${o.t + 4}Z`, '#fff2c4') + P(`M66 ${o.t + 8}Q74 ${o.t - 6} 68 ${o.t - 14}Q62 ${o.t - 4} 56 ${o.t + 4}Z`, '#fff2c4') }));
  def('wingsDragon', (o, c) => ({ back: P('M20 52L2 34L6 50L0 58L10 60L8 70L22 64Z', c) + P('M80 52L98 34L94 50L100 58L90 60L92 70L78 64Z', c) }));
  def('quills', (o, c) => ({ back: Array.from({ length: 11 }, (_, i) => { const a = (-175 + i * 17) * Math.PI / 180, r1 = 31, r2 = 46, w = 0.17; const x = a2 => (50 + Math.cos(a2) * r1).toFixed(1), y = a2 => (58 + Math.sin(a2) * r1).toFixed(1); return P(`M${x(a - w)} ${y(a - w)}L${(50 + Math.cos(a) * r2).toFixed(1)} ${(58 + Math.sin(a) * r2).toFixed(1)}L${x(a + w)} ${y(a + w)}Z`, c, 1.8); }).join('') }));
  def('snailShell', (o, c) => ({ back: C(71, 36, 22, c, 2.4) + S('M73 36m-3 0a3 3 0 1 1 6 0a7.5 7.5 0 1 1-14 1a12 12 0 1 1 23-2', dk(c), 2.4) + CN(62, 22, 2.6, '#fff', 'opacity=".75"') }));
  def('spikesTop', o => ({ back: tri(50, o.t - 2, .7, '#ffd07a') + tri(38, o.t + 2, .55, '#ffd07a') + tri(62, o.t + 2, .55, '#ffd07a') }));
  def('belly', (o, c) => ({ mid: EN(50, o.fy + 10, 25, 22, c) }));
  def('earsCow', o => ({ back: E(14, o.t + 18, 10, 5, o.c, -20) + E(86, o.t + 18, 10, 5, o.c, 20) + P(`M30 ${o.t + 6}Q26 ${o.t - 6} 32 ${o.t - 8}Q34 ${o.t} 38 ${o.t + 4}Z`, '#fff2c4') + P(`M70 ${o.t + 6}Q74 ${o.t - 6} 68 ${o.t - 8}Q66 ${o.t} 62 ${o.t + 4}Z`, '#fff2c4') }));
  def('muzzle', (o, c) => ({ mid: EN(50, o.fy + 9 * o.s, 13, 9.5, c) + EN(50, o.fy + 4.4 * o.s, 3.6, 2.6, INK) }));
  def('roof', (o, c) => ({ front: P(`M10 ${o.t + 10}L50 ${o.t - 18}L90 ${o.t + 10}Q92 ${o.t + 16} 86 ${o.t + 16}H14Q8 ${o.t + 16} 10 ${o.t + 10}Z`, c) }));
  def('milkLabel', o => ({ pat: RN(0, 80, 100, 20, 0, '#8ec5ff') + drop(30, 88, .8, '#fff') }));
  def('earsCat', (o, c) => ({ back: P(`M20 ${o.t + 22}L22 ${o.t - 10}L46 ${o.t + 4}Z`, c || o.c) + P(`M80 ${o.t + 22}L78 ${o.t - 10}L54 ${o.t + 4}Z`, c || o.c) + PN(`M25 ${o.t + 12}L26 ${o.t - 2}L38 ${o.t + 5}Z`, '#ffb3c7') + PN(`M75 ${o.t + 12}L74 ${o.t - 2}L62 ${o.t + 5}Z`, '#ffb3c7') }));
  def('tabby', (o, c) => ({ pat: S(`M44 ${o.t + 2}V${o.t + 9}M50 ${o.t}V${o.t + 11}M56 ${o.t + 2}V${o.t + 9}`, c, 3) + S('M16 62H24M16 70H22M84 62H76M84 70H78', c, 3) }));
  def('whiskers', o => ({ front: S(`M8 ${o.fy + 6}L22 ${o.fy + 8}M8 ${o.fy + 13}L22 ${o.fy + 11}M92 ${o.fy + 6}L78 ${o.fy + 8}M92 ${o.fy + 13}L78 ${o.fy + 11}`, dk(o.c), 1.6) }));
  def('tailCat', o => ({ back: S('M78 82C94 82 96 64 88 58', dk(o.c), 9) + S('M78 82C94 82 96 64 88 58', o.c, 5.6) }));
  def('earsDog', (o, c) => ({ front: P(`M28 ${o.t + 4}C14 ${o.t + 2} 8 ${o.fy + 6} 14 ${o.fy + 16}C20 ${o.fy + 20} 26 ${o.fy} 30 ${o.t + 14}Z`, c) + P(`M72 ${o.t + 4}C86 ${o.t + 2} 92 ${o.fy + 6} 86 ${o.fy + 16}C80 ${o.fy + 20} 74 ${o.fy} 70 ${o.t + 14}Z`, c) }));
  def('eyePatch', (o, c) => ({ mid: EN(62, o.fy - 1, 10, 9, c, -10) }));
  def('collar', o => ({ pat: RN(0, 82, 100, 6, 0, '#ff8fa8') , front: C(50, 89, 3.6, '#ffd36e', 1.4) }));
  def('earsFox', (o, c) => ({ back: P(`M18 ${o.t + 22}L20 ${o.t - 14}L46 ${o.t + 4}Z`, c) + P(`M82 ${o.t + 22}L80 ${o.t - 14}L54 ${o.t + 4}Z`, c) + PN(`M24 ${o.t + 12}L24 ${o.t - 4}L36 ${o.t + 4}Z`, '#fff4e6') + PN(`M76 ${o.t + 12}L76 ${o.t - 4}L64 ${o.t + 4}Z`, '#fff4e6') }));
  def('moonTiny', o => ({ front: P('M86 14A8 8 0 1 0 94 26A6 6 0 1 1 86 14Z', '#fff3b0', 1.4) }));
  def('cheekFur', o => ({ mid: PN(`M17 ${o.fy + 2}C24 ${o.fy + 6} 34 ${o.fy + 4} 50 ${o.fy + 4}C66 ${o.fy + 4} 76 ${o.fy + 6} 83 ${o.fy + 2}C84 ${o.fy + 26} 66 92 50 92C34 92 16 ${o.fy + 26} 17 ${o.fy + 2}Z`, '#fff4e6') }));
  def('tailFox', o => ({ back: P('M72 84C94 88 100 66 92 50C88 60 82 66 72 70Z', o.c) + PN('M92 50C96 58 96 66 94 70C90 64 89 58 92 50Z', '#fff4e6') }));
  def('earsBunny', o => ({ back: E(36, o.t - 12, 8, 20, o.c, -12) + E(64, o.t - 12, 8, 20, o.c, 12) + EN(36, o.t - 10, 4, 13, '#ffb3c7', -12) + EN(64, o.t - 10, 4, 13, '#ffb3c7', 12) }));
  def('earsKoala', (o, c) => ({ back: C(18, o.t + 12, 15, o.c) + C(82, o.t + 12, 15, o.c) + CN(18, o.t + 13, 9, c || '#f3f4fa') + CN(82, o.t + 13, 9, c || '#f3f4fa') + CN(14, o.t + 9, 2.6, '#fff', 'opacity=".8"') + CN(78, o.t + 9, 2.6, '#fff', 'opacity=".8"') }));
  def('octoArms', (o, c) => ({ back: [[22, -1], [36, -1], [50, 1], [64, 1], [78, 1]].map(([x, d], i) => S(`M${x} 70C${x - d * 2} 80 ${x + d * 8} 86 ${x + d * 4} 92C${x + d * 1} 96 ${x - d * 4} 93 ${x - d * 2} 89`, c, 5.4)).join('') + [[24, 88], [52, 94], [80, 88]].map(([x, y]) => CN(x, y, 1.5, lt(c))).join('') }));
  def('koalaNose', o => ({ front: E(50, o.fy + 8 * o.s, 7.5, 9.5, '#5d5470', 0, 1.6) + EN(47.6, o.fy + 4.6 * o.s, 2.2, 3, '#ffffff', 0, 'opacity=".6"') }));
  def('earsBear', o => ({ back: C(24, o.t + 8, 10, o.c) + C(76, o.t + 8, 10, o.c) + CN(24, o.t + 8, 5, lt('#c89268')) + CN(76, o.t + 8, 5, lt('#c89268')) }));
  def('scarf', (o, c) => ({ pat: RN(0, o.fy + 22, 100, 8, 0, c), front: R(64, o.fy + 24, 9, 16, 3, c, 1.6) }));
  def('earsBearDark', o => ({ back: C(24, o.t + 8, 10, '#4a4560') + C(76, o.t + 8, 10, '#4a4560') }));
  def('pandaPatches', o => ({ mid: EN(50 - 12 * o.s, o.fy + 1, 9, 11, '#4a4560', 25) + EN(50 + 12 * o.s, o.fy + 1, 9, 11, '#4a4560', -25) + EN(50, o.fy + 5, 3.4, 2.4, INK) }));
  def('bambooLeafSide', o => ({ front: S('M80 92L88 66', '#7fcf6a', 4) + P('M88 70C94 64 98 66 98 70C94 74 90 72 88 70Z', '#8ee08f', 1.2) }));
  def('bow', (o, c) => ({ front: P(`M70 ${o.t + 8}L60 ${o.t}L60 ${o.t + 16}Z`, c) + P(`M70 ${o.t + 8}L80 ${o.t}L80 ${o.t + 16}Z`, c) + C(70, o.t + 8, 3, c, 1.4) }));
  def('stitch', o => ({ pat: S('M70 76L76 80M73 74L72 82', dk(o.c), 1.6) }));
  def('earsMonkey', o => ({ back: C(14, o.fy, 10, o.c) + C(86, o.fy, 10, o.c) + CN(14, o.fy, 5.5, '#f6d7b8') + CN(86, o.fy, 5.5, '#f6d7b8') }));
  def('faceMask', (o, c) => ({ mid: PN(`M50 ${o.fy - 6}C56 ${o.fy - 14} 76 ${o.fy - 14} 78 ${o.fy}C80 ${o.fy + 22} 62 ${o.fy + 26} 50 ${o.fy + 26}C38 ${o.fy + 26} 20 ${o.fy + 22} 22 ${o.fy}C24 ${o.fy - 14} 44 ${o.fy - 14} 50 ${o.fy - 6}Z`, c) }));
  def('tuft', o => ({ front: P(`M44 ${o.t + 3}C44 ${o.t - 8} 52 ${o.t - 10} 56 ${o.t - 4}C52 ${o.t - 4} 50 ${o.t} 52 ${o.t + 3}Z`, o.c, 1.6) }));
  def('earsSmall', o => ({ back: P(`M28 ${o.t + 10}L30 ${o.t - 8}L42 ${o.t + 2}Z`, o.c) + P(`M72 ${o.t + 10}L70 ${o.t - 8}L58 ${o.t + 2}Z`, o.c) }));
  const maneD = t => `M28 ${t + 10}C26 ${t - 6} 50 ${t - 12} 66 ${t - 6}C78 ${t - 2} 86 ${t + 10} 88 ${t + 26}C82 ${t + 22} 78 ${t + 16} 76 ${t + 12}C70 ${t + 16} 64 ${t + 15} 60 ${t + 10}C54 ${t + 15} 44 ${t + 15} 40 ${t + 11}C36 ${t + 14} 30 ${t + 13} 28 ${t + 10}Z`;
  def('mane', (o, c) => ({ front: P(maneD(o.t), c) }));
  def('maneRainbow', o => ({ front: `<g transform="translate(7 -1)">${P(maneD(o.t), '#9fd0ff')}</g><g transform="translate(4.6 -.6)">${P(maneD(o.t), '#a8e6a3')}</g><g transform="translate(2.3 -.3)">${P(maneD(o.t), '#ffe78a')}</g>${P(maneD(o.t), '#ff9ec7')}` }));
  def('wings', (o, c) => ({ back: P('M24 50C8 34 0 44 2 54C0 60 4 66 10 66C8 72 14 76 22 70Z', c || '#fff') + P('M76 50C92 34 100 44 98 54C100 60 96 66 90 66C92 72 86 76 78 70Z', c || '#fff') }));
  def('horn', o => ({ front: P(`M44 ${o.t + 3}L50 ${o.t - 22}L56 ${o.t + 3}Z`, '#ffe08a', 2) + S(`M45 ${o.t - 2}L54 ${o.t - 5}M46.5 ${o.t - 9}L53 ${o.t - 11}`, '#e8b84a', 1.6) }));
  def('eggShell', o => ({ front: P('M14 66L24 74L32 64L42 74L50 64L58 74L68 64L76 74L86 66C88 84 72 94 50 94C28 94 12 84 14 66Z', '#fff7e6', 2) + CN(30, 84, 1.6, '#f0d6a8') + CN(70, 82, 1.6, '#f0d6a8') }));
  def('sailorHat', o => ({ front: P(`M30 ${o.t + 6}C30 ${o.t - 6} 70 ${o.t - 6} 70 ${o.t + 6}Z`, '#8ec5ff') + R(26, o.t + 2, 48, 6, 3, '#fff', 1.6) }));
  def('tufts', o => ({ back: P(`M22 ${o.t + 16}L20 ${o.t - 6}L38 ${o.t + 6}Z`, o.c) + P(`M78 ${o.t + 16}L80 ${o.t - 6}L62 ${o.t + 6}Z`, o.c) }));
  def('crestFlame', o => ({ back: PN(flameP(40, o.t + 4, .55), '#ffd23f', `stroke="${dk('#ffd23f')}" stroke-width="1.8"`) + PN(flameP(60, o.t + 4, .55), '#ffd23f', `stroke="${dk('#ffd23f')}" stroke-width="1.8"`) }));
  def('wingsFlame', o => ({ back: P('M22 56C6 46 0 32 4 24C10 34 16 38 20 36C12 46 16 52 24 54Z', '#ffc14d') + P('M78 56C94 46 100 32 96 24C90 34 84 38 80 36C88 46 84 52 76 54Z', '#ffc14d') }));
  def('stripesBee', o => ({ pat: RN(0, o.fy + 15, 100, 7, 0, '#4a4560') + RN(0, o.fy + 28, 100, 7, 0, '#4a4560') + RN(0, o.t - 4, 100, 10, 0, '#4a4560') }));
  def('antennae', o => ({ back: S(`M42 ${o.t + 4}Q36 ${o.t - 8} 30 ${o.t - 12}`, INK, 2.2) + S(`M58 ${o.t + 4}Q64 ${o.t - 8} 70 ${o.t - 12}`, INK, 2.2) + C(30, o.t - 13, 3.6, '#ff9ec7', 1.4) + C(70, o.t - 13, 3.6, '#ff9ec7', 1.4) }));
  def('wingsBee', o => ({ back: `<g opacity=".9">${E(28, o.t + 2, 9, 13, '#f3fbff', -35)}${E(72, o.t + 2, 9, 13, '#f3fbff', 35)}</g>` }));
  def('wingsBug', (o, c) => ({ back: E(22, 42, 18, 16, c, -20) + E(78, 42, 18, 16, c, 20) + E(24, 76, 12, 11, mix(c, '#c4a8ff', .4), 20) + E(76, 76, 12, 11, mix(c, '#c4a8ff', .4), -20) + CN(18, 40, 4, '#fff', 'opacity=".8"') + CN(82, 40, 4, '#fff', 'opacity=".8"') }));
  def('spout', o => ({ back: S(`M50 ${o.t + 2}V${o.t - 8}`, '#8fd3ff', 3) + S(`M50 ${o.t - 8}C44 ${o.t - 16} 36 ${o.t - 12} 34 ${o.t - 6}M50 ${o.t - 8}C56 ${o.t - 16} 64 ${o.t - 12} 66 ${o.t - 6}`, '#8fd3ff', 3) + drop(32, o.t - 2, .6, '#bfe6ff') + drop(68, o.t - 2, .6, '#bfe6ff') }));
  def('bellyLines', o => ({ pat: PN('M14 76C30 88 70 88 86 76V100H14Z', '#dbe8ff') + S('M36 82V90M50 84V92M64 82V90', '#b9cbef', 1.6) }));
  def('claws', o => ({ back: S('M24 66L12 54M76 66L88 54', dk(o.c), 4) + P('M4 46A9 9 0 1 1 18 54L12 48Z', o.c) + P('M96 46A9 9 0 1 0 82 54L88 48Z', o.c) }));
  def('eyeStalks', o => ({ back: S(`M40 ${o.t + 6}V${o.t - 4}M60 ${o.t + 6}V${o.t - 4}`, dk(o.c), 3) + C(40, o.t - 6, 4, o.c, 1.6) + C(60, o.t - 6, 4, o.c, 1.6) }));
  def('tentacles', (o, c) => ({ back: S('M28 66C24 76 34 82 28 94', c, 4) + S('M42 68C38 78 48 84 42 96', c, 4) + S('M58 68C62 78 52 84 58 96', c, 4) + S('M72 66C76 76 66 82 72 94', c, 4) }));
  def('spotsJelly', o => ({ pat: CN(30, 34, 3, '#fff', 'opacity=".8"') + CN(40, 28, 1.8, '#fff', 'opacity=".8"') + CN(72, 36, 2.4, '#fff', 'opacity=".6"') }));
  def('heartsFloat', o => ({ front: heart(14, 22, 1, '#ff8fb8') + heart(88, 18, .8, '#ffb3d1') + heart(90, 78, .7, '#ff8fb8') }));
  def('babyCurl', o => ({ front: S(`M50 ${o.t + 6}C46 ${o.t - 2} 54 ${o.t - 8} 58 ${o.t - 2}C60 ${o.t + 2} 54 ${o.t + 4} 54 ${o.t}`, '#c98a5a', 2.6) }));
  def('bonnet', o => ({ back: P(`M16 ${o.fy + 8}C10 ${o.t - 6} 90 ${o.t - 6} 84 ${o.fy + 8}Z`, '#ffd1e3', 2.2) + PN(`M22 ${o.fy + 4}C20 ${o.t + 2} 80 ${o.t + 2} 78 ${o.fy + 4}`, 'none', 'stroke="#fff" stroke-width="2" stroke-dasharray="2 3"'), front: P('M30 88L22 98L36 94Z', '#ffd1e3', 1.6) + P('M70 88L78 98L64 94Z', '#ffd1e3', 1.6) }));
  def('ghostArms', o => ({ front: E(18, o.fy + 14, 5, 8, o.c, 30) + E(82, o.fy + 14, 5, 8, o.c, -30) }));
  def('faceWindow', (o, c) => ({ mid: EN(50, o.fy + 3, 27, 16, c) }));
  def('headband', (o, c) => ({ pat: RN(0, o.fy - 20, 100, 7, 0, c), front: P(`M82 ${o.fy - 17}L96 ${o.fy - 24}L92 ${o.fy - 14}Z`, c, 1.6) + P(`M82 ${o.fy - 16}L98 ${o.fy - 10}L88 ${o.fy - 6}Z`, c, 1.6) }));
  def('wizardHat', o => ({ front: P(`M24 ${o.t + 12}C34 ${o.t - 4} 44 ${o.t - 30} 66 ${o.t - 36}C60 ${o.t - 22} 68 ${o.t - 4} 78 ${o.t + 12}Z`, '#9b8cff') + E(50, o.t + 13, 34, 6, '#9b8cff') + sparkle(48, o.t - 2, 4.4, '#ffe066') + sparkle(60, o.t - 18, 3, '#ffe066') }));
  def('beard', o => ({ front: P(`M30 ${o.fy + 13}C30 ${o.fy + 30} 40 ${o.fy + 40} 50 ${o.fy + 42}C60 ${o.fy + 40} 70 ${o.fy + 30} 70 ${o.fy + 13}C64 ${o.fy + 17} 56 ${o.fy + 15} 50 ${o.fy + 18}C44 ${o.fy + 15} 36 ${o.fy + 17} 30 ${o.fy + 13}Z`, '#ffffff', 2) }));
  def('tiara', o => ({ front: P(`M38 ${o.t - 4}L42 ${o.t - 14}L46 ${o.t - 6}L50 ${o.t - 16}L54 ${o.t - 6}L58 ${o.t - 14}L62 ${o.t - 4}Z`, '#ffd36e', 1.6) + heart(50, o.t - 8, .5, '#ff8fb8') }));
  def('helmetSlit', o => ({ pat: S(`M30 ${o.fy - 18}H70`, dk(o.c), 2, 'opacity=".5"') + CN(28, o.fy + 22, 2, dk(o.c)) + CN(72, o.fy + 22, 2, dk(o.c)) }));
  def('plume', o => ({ back: P(`M50 ${o.t + 4}C46 ${o.t - 14} 60 ${o.t - 22} 74 ${o.t - 16}C64 ${o.t - 12} 60 ${o.t - 4} 58 ${o.t + 4}Z`, '#ff8fa8') }));
  def('tailMermaid', o => ({ back: P('M70 80C86 84 92 76 96 66C90 68 86 70 82 72C88 64 90 58 88 50C84 60 80 66 72 70Z', '#7fd7c4') }));
  def('starfishClip', o => ({ front: `<path d="${starPath(76, o.t + 8, 7, 3.4, 5, -80)}" ${st('#ffb38a', 1.4)}/>` }));
  def('wingsFairy', o => ({ back: `<g opacity=".85">${E(20, 44, 16, 12, '#d9f4ff', -30)}${E(80, 44, 16, 12, '#d9f4ff', 30)}${E(22, 70, 10, 8, '#ffe0f4', 20)}${E(78, 70, 10, 8, '#ffe0f4', -20)}</g>` }));
  def('flowerCrown', o => ({ front: [24, 37, 50, 63, 76].map((x, i) => C(x, o.t + 6 - (i === 2 ? 4 : i % 2 ? 2 : 0), 4.2, ['#ff9ec7', '#ffe27a', '#c4a8ff', '#ffe27a', '#9fd0ff'][i], 1.3)).join('') }));
  def('topHat', o => ({ front: R(36, o.t - 18, 28, 20, 3, '#55597e', 2) + RN(36, o.t - 6, 28, 4, 0, '#ff8fa8') + R(28, o.t, 44, 5, 2.5, '#55597e', 2) }));
  def('scarf2', o => ({ front: P('M30 54Q50 62 70 54L72 60Q50 68 28 60Z', '#ff8fa8', 1.8) + R(60, 58, 8, 16, 3, '#ff8fa8', 1.6) }));
  def('buttons', o => ({ front: CN(50, 72, 2.6, '#55597e') + CN(50, 82, 2.6, '#55597e') }));
  def('visor', o => ({ mid: `<ellipse cx="50" cy="${o.fy + 2}" rx="27" ry="20" fill="#e0efff" stroke="#9fb7e0" stroke-width="2.4"/>` + S(`M30 ${o.fy - 6}A22 16 0 0 1 40 ${o.fy - 14}`, '#fff', 3) }));
  def('antennaHelmet', o => ({ back: S(`M68 ${o.t + 6}L74 ${o.t - 6}`, '#9fb7e0', 2.4) + C(75, o.t - 8, 3.4, '#ff8fa8', 1.4) }));
  def('starsAround', o => ({ front: `<path d="${starPath(12, 80, 6, 2.6)}" ${st('#ffe066', 1.2)}/><path d="${starPath(90, 40, 5, 2.2)}" ${st('#9fd0ff', 1.2)}/>` }));
  def('halo', o => ({ back: `<ellipse cx="50" cy="${o.t - 2}" rx="15" ry="4.4" fill="none" stroke="#ffd36e" stroke-width="3.4"/>` }));
  def('bricks', o => ({ pat: S('M18 44H82M18 76H82M36 28V44M64 28V44M30 76V92M70 76V92', dk(o.c), 1.8, 'opacity=".45"') }));
  def('chimney', o => ({ back: R(66, o.t - 16, 9, 16, 1.5, '#c99a6e', 1.8) + C(72, o.t - 22, 3, '#eeeaf6', 1.2) + C(78, o.t - 28, 4, '#eeeaf6', 1.2) }));
  def('windowSide', o => ({ front: R(66, 76, 10, 10, 2, '#bfe6ff', 1.6) + S('M71 76V86M66 81H76', dk('#bfe6ff'), 1.2) }));
  def('battlements', o => ({ front: P(`M18 ${o.t + 6}V${o.t - 8}H28V${o.t - 2}H38V${o.t - 8}H48V${o.t - 2}H58V${o.t - 8}H68V${o.t - 2}H72V${o.t - 8}H82V${o.t + 6}Z`, mix(o.c, '#9b8cff', .25)) }));
  def('flag', o => ({ back: S(`M50 ${o.t - 6}V${o.t - 26}`, INK, 2) + P(`M50 ${o.t - 26}L64 ${o.t - 21}L50 ${o.t - 16}Z`, '#ff8fa8', 1.6) }));
  def('miniHouses', o => ({ back: R(0, 50, 18, 18, 2, '#ffd9c2', 1.6) + P('M-2 52L9 40L20 52Z', '#ff9aa8', 1.6) + R(82, 54, 18, 16, 2, '#d9ecff', 1.6) + P('M80 56L91 44L102 56Z', '#9fc8ff', 1.6) }));
  def('skyline', o => ({ back: R(6, 40, 16, 50, 2, '#9fb0e0', 1.6) + R(78, 30, 16, 60, 2, '#a8b8e8', 1.6) + R(60, 14, 14, 30, 2, '#c4a8ff', 1.6) + S('M67 14V6', INK, 1.6) }));
  def('windows', o => ({ pat: [[26, 36], [36, 36], [64, 36], [74, 36], [26, 84], [74, 84]].map(p => RN(p[0] - 3, p[1] - 3, 6, 6, 1.4, '#fff3a1')).join('') }));
  def('iglooBricks', o => ({ pat: S('M10 50Q50 40 90 50M8 70Q50 62 92 70M36 34V48M64 34V48M26 52V68M74 52V68', '#c9e6f5', 1.8) }));
  def('iglooDoor', o => ({ front: P('M66 90V80A8 8 0 0 1 82 80V90Z', '#8fb4d9', 1.6) }));
  def('pyramidLines', o => ({ pat: S('M24 54H76M16 76H84', dk(o.c), 1.6, 'opacity=".45"') }));
  def('antenna', o => ({ back: S(`M50 ${o.t + 2}V${o.t - 12}`, '#9fb0c8', 2.6) + C(50, o.t - 14, 4.4, '#ff8fa8', 1.6) }));
  def('rivetsSide', o => ({ back: R(8, o.fy - 6, 12, 12, 3, '#b0bed4', 1.6) + R(80, o.fy - 6, 12, 12, 3, '#b0bed4', 1.6) }));
  def('heartPanel', o => ({ front: R(40, 80, 20, 9, 3, '#eef3fb', 1.4) + heart(50, 84.5, .55, '#ff8fb8') }));
  def('bulbBase', o => ({ back: R(36, 70, 28, 22, 4, '#c6ccd8', 2) + S('M36 78H64M36 85H64', dk('#c6ccd8'), 1.6) }));
  def('glow', o => ({ back: S('M50 2V8M14 14L20 20M86 14L80 20M4 44H10M90 44H96', '#ffd23f', 3) }));
  def('sail', o => ({ back: S('M50 52V6', '#a8805c', 2.6) + P('M52 8C70 18 78 34 80 48H52Z', '#ffffff', 2) + P('M48 14C36 24 30 36 28 48H48Z', '#ffd1e3', 2) + P('M50 6L60 9L50 12Z', '#ff8fa8', 1.2) }));
  def('logs', o => ({ front: `<g>${R(16, 82, 68, 9, 4.5, '#b07a52', 1.8)}</g>` + `<g transform="rotate(-12 50 86)">${R(22, 82, 56, 8, 4, '#c9935f', 1.8)}</g>` }));
  def('marshmallow', o => ({ front: S('M90 10L76 30', '#a8805c', 2) + R(84, 6, 9, 7, 2.5, '#fff', 1.4) }));
  def('hourFrame', o => ({ front: R(12, 20, 76, 10, 4, '#c99a6e', 2) + R(12, 88, 76, 10, 4, '#c99a6e', 2) }));
  def('sandBottom', o => ({ pat: PN('M0 80Q50 70 100 80V100H0Z', '#f3d9a4') + PN('M46 30L54 30L51 80L49 80Z', '#f3d9a4') }));
  def('aquaWater', o => ({ pat: PN('M0 42Q12 38 24 42T48 42T72 42T96 42T120 42V100H0Z', '#9fdcff', 'opacity=".8"') + PN('M18 92C22 82 26 82 28 92Z', '#8fdc7a') }));
  def('tinyFish', o => ({ front: E(74, 82, 6, 4, '#ffae5e', 0, 1.2) + P('M80 82L85 78V86Z', '#ffae5e', 1.2) + CN(72, 81, .9, INK) }));
  def('globeBase', o => ({ back: P('M24 74H76L82 94H18Z', '#c99a6e', 2) + RN(30, 82, 40, 4, 2, '#ffd36e') }));
  def('snowDots', o => ({ pat: [[30, 30], [62, 24], [74, 42], [26, 56], [70, 62], [42, 22]].map(p => CN(p[0], p[1], 1.8, '#fff')).join('') + PN('M18 66Q50 56 82 66V80H18Z', '#fff') }));
  def('planeWings', o => ({ back: P('M14 64L0 58L2 70L20 72Z', '#9fc8ff') + P('M86 64L100 58L98 70L80 72Z', '#9fc8ff') + P('M50 28L56 8H64L60 30Z', '#9fc8ff') }));
  def('propeller', o => ({ front: E(50, 90, 3, 3, '#c6ccd8', 0, 1.2) + E(42, 92, 8, 2.4, '#ffd36e', 0, 1.2) + E(58, 92, 8, 2.4, '#ffd36e', 0, 1.2) }));
  def('noseCone', o => ({ pat: PN('M0 0H100V34Q50 26 0 34Z', '#ff8fa8') + C(50, 46, 5, '#bfe6ff', 1.6) }));
  def('fins', o => ({ back: P('M20 66L6 88L22 86Z', '#ff8fa8') + P('M80 66L94 88L78 86Z', '#ff8fa8') }));
  def('thrust', o => ({ back: PN(flameP(50, 94, .5), '#ffd36e', `stroke="#ffaa5e" stroke-width="1.6"`) }));
  def('saucer', o => ({ front: E(50, 74, 46, 11, '#c6ccd8', 0, 2.2) + CN(24, 74, 2.4, '#ffe066') + CN(50, 78, 2.4, '#ff9ec7') + CN(76, 74, 2.4, '#9fd0ff'), back: S('M34 82L28 94M66 82L72 94', '#c6ccd8', 3) }));
  def('yolk', o => ({ mid: C(50, o.fy + 2, 22, '#ffd23f', 2) + S(`M36 ${o.fy - 8}A16 16 0 0 1 44 ${o.fy - 15}`, '#fff6b0', 3) }));
  def('crust', o => ({ pat: PN('M0 0H100V52Q90 58 80 52T60 52T40 52T20 52T0 52Z', dk(o.c), 'opacity=".55"') }));
  def('breadLines', o => ({ front: S('M30 48L36 44M48 47L54 43M66 48L72 44', '#fff4dc', 2.2) }));
  def('frosting', (o, c) => ({ pat: PN(`M0 0H100V${o.t + 10}C92 ${o.t + 10} 92 ${o.t + 18} 86 ${o.t + 18}C80 ${o.t + 18} 82 ${o.t + 10} 72 ${o.t + 10}C64 ${o.t + 10} 66 ${o.t + 22} 58 ${o.t + 22}C50 ${o.t + 22} 54 ${o.t + 10} 44 ${o.t + 10}C36 ${o.t + 10} 38 ${o.t + 16} 30 ${o.t + 16}C22 ${o.t + 16} 24 ${o.t + 10} 0 ${o.t + 10}Z`, c) }));
  def('sprinkles', o => ({ pat: [[24, o.t + 4, '#ff8fa8', 30], [40, o.t + 2, '#9fd0ff', -20], [62, o.t + 4, '#ffe066', 45], [76, o.t + 3, '#a8e6a3', -40], [32, o.t + 9, '#c4a8ff', 70]].map(p => `<rect x="${p[0] - 3}" y="${p[1] - 1}" width="6" height="2.2" rx="1.1" fill="${p[2]}" transform="rotate(${p[3]} ${p[0]} ${p[1]})"/>`).join('') }));
  def('cherry', o => ({ front: S(`M50 ${o.t - 2}Q52 ${o.t - 12} 58 ${o.t - 14}`, '#6aa85a', 2) + C(50, o.t - 2, 5.6, '#ff6f8a', 1.8) + CN(48, o.t - 4, 1.4, '#fff') }));
  def('cone', o => ({ back: P('M26 66L50 99L74 66Z', '#f2c27f', 2.2) + S('M34 70L58 92M50 68L64 82M42 82L62 68', dk('#f2c27f'), 1.4, 'opacity=".6"') }));
  def('salmon', o => ({ front: P(`M12 ${o.t + 2}C12 ${o.t - 10} 88 ${o.t - 10} 88 ${o.t + 2}C88 ${o.t + 8} 12 ${o.t + 8} 12 ${o.t + 2}Z`, '#ffa38a', 2) + S(`M28 ${o.t - 4}L34 ${o.t + 4}M46 ${o.t - 6}L52 ${o.t + 4}M64 ${o.t - 5}L70 ${o.t + 4}`, '#ffe0d6', 2.2) }));
  def('nori', o => ({ pat: RN(0, 82, 100, 12, 0, '#4f6a5a') }));
  def('earsSheep', () => ({ back: E(13, 60, 11, 6, '#f2d6c4', 28) + E(87, 60, 11, 6, '#f2d6c4', -28) + EN(12, 60, 6, 2.8, '#ffb3c7', 28) + EN(88, 60, 6, 2.8, '#ffb3c7', -28) }));
  def('noriWrap', () => ({ pat: RN(31, 80, 38, 20, 3, '#3f5a4c') + RN(35, 83, 6, 10, 2, '#5d7c6b', 'opacity=".7"') }));
  def('sesame', () => ({ pat: [[44, 30, -20], [55, 34, 25], [49, 40, 0], [60, 44, -30], [38, 44, 30]].map(q => E(q[0], q[1], 1.1, 2, '#e9dcc0', q[2], .6)).join('') }));
  // spooky-season friends 🎃
  def('pumpkinRibs', o => ({ pat: S('M36 28Q22 58 36 92', dk(o.c), 2.2, 'opacity=".45"') + S('M64 28Q78 58 64 92', dk(o.c), 2.2, 'opacity=".45"') + S('M50 26V34', dk(o.c), 2, 'opacity=".35"') }));
  def('pumpkinStem', o => ({ back: P(`M45 ${o.t + 6}L46 ${o.t - 8}Q50 ${o.t - 12} 55 ${o.t - 8}L55 ${o.t + 6}Z`, '#8bc06a', 2) + S(`M46 ${o.t - 4}C38 ${o.t - 12} 32 ${o.t - 2} 38 ${o.t}`, '#6aa85a', 2) + P(`M55 ${o.t - 2}Q64 ${o.t - 16} 76 ${o.t - 8}Q66 ${o.t + 2} 55 ${o.t - 2}Z`, '#9ee09a', 1.8) }));
  def('witchHat', o => ({ front: P(`M29 ${o.t + 8}Q37 ${o.t - 6} 46 ${o.t - 18}Q53 ${o.t - 27} 68 ${o.t - 25}Q59 ${o.t - 19} 60 ${o.t - 9}Q63 ${o.t} 71 ${o.t + 8}Z`, '#8f6ad8') +
    PN(`M32 ${o.t + 1}Q50 ${o.t + 6} 68 ${o.t + 1}L70.5 ${o.t + 6.5}Q50 ${o.t + 11.5} 29.5 ${o.t + 6.5}Z`, '#ffb347') + E(50, o.t + 9, 37, 6, '#8f6ad8') +
    sparkle(50, o.t - 7, 4.6, '#ffe066') + C(68, o.t - 25, 2.8, '#ffe066', 1.2) }));
  def('tanukiMask', o => ({ mid: EN(50 - 13.5 * o.s, o.fy - 1, 11, 8.4, '#7a5a44', -14) + EN(50 + 13.5 * o.s, o.fy - 1, 11, 8.4, '#7a5a44', 14) + EN(50, o.fy - 14, 4, 6, lt(o.c), 0, 'opacity=".9"') }));
  def('tailTanuki', o => ({ back: P('M72 86C94 92 100 70 92 56C86 66 80 72 72 74Z', o.c) + S('M84 82L90 72M90 66L94 60', '#7a5a44', 3.4) }));
  def('leafTop', o => ({ front: P(`M48 ${o.t + 3}C38 ${o.t - 4} 42 ${o.t - 18} 58 ${o.t - 20}C62 ${o.t - 10} 58 ${o.t - 1} 48 ${o.t + 3}Z`, '#8fd17a', 1.8) + S(`M49 ${o.t + 1}Q53 ${o.t - 8} 57 ${o.t - 17}`, '#5c9a4a', 1.4) }));
  def('cupHandle', o => ({ back: S('M78 46C96 44 96 70 76 70', dk(o.c), 8) + S('M78 46C96 44 96 70 76 70', o.c, 4.6) }));
  def('teaTag', o => ({ front: S('M26 36L22 60', '#fff', 1.4) + R(16, 58, 10, 10, 2, '#ffd36e', 1.4) }));
  def('straw', o => ({ back: S('M58 40L70 4', dk('#ff9ec7'), 8) + S('M58 40L70 4', '#ff9ec7', 5) }));
  def('pearls', o => ({ pat: [[30, 86], [40, 88], [52, 87], [62, 88], [72, 85], [36, 80], [58, 81], [48, 82]].map(p => CN(p[0], p[1], 3.4, '#6b4a5e')).join('') }));
  def('lid', o => ({ front: P('M14 36C14 26 86 26 86 36Z', '#f3fbff', 2) }));
  def('jarLid', o => ({ front: R(22, 20, 56, 12, 4, '#d9a46a', 2) + S('M28 26H72', '#fff4dc', 1.6, 'stroke-dasharray="3 3"') }));
  def('honeyDrip', o => ({ pat: PN('M18 32H82V38C78 38 78 46 74 46C70 46 70 38 66 38C62 38 62 50 56 50C50 50 52 38 46 38C40 38 42 44 36 44C30 44 32 38 26 38C22 38 22 34 18 34Z', '#ffe08a') }));
  def('beeTiny', o => ({ front: E(84, 84, 6, 5, '#ffd84d', 0, 1.2) + S('M82 80V88M86 80V88', '#4a4560', 1.6) + E(84, 78, 3, 2.4, '#fff', -20, 1) }));
  def('wrapper', o => ({ back: P('M18 58L2 46L6 58L2 70Z', '#ffe27a') + P('M82 58L98 46L94 58L98 70Z', '#ffe27a') }));
  def('swirl', o => ({ pat: S('M50 58m-26 0a26 26 0 0 1 52 0a22 22 0 0 1-44 0a18 18 0 0 1 36 0', '#fff', 3, 'opacity=".55"') }));
  def('stick', o => ({ back: S('M50 80V100', '#f3e6d0', 4) }));
  def('lattice', o => ({ pat: S('M20 44L38 58M40 44L58 58M60 44L78 58M80 44L98 58M30 58L48 44M50 58L68 44M70 58L88 44M10 58L28 44', mix(o.c, '#fff', .45), 2.6) }));
  def('ring', (o, c) => ({ back: `<ellipse cx="50" cy="58" rx="48" ry="12" fill="none" stroke="${dk(c)}" stroke-width="7.4" transform="rotate(-14 50 58)"/><ellipse cx="50" cy="58" rx="48" ry="12" fill="none" stroke="${c}" stroke-width="4.6" transform="rotate(-14 50 58)"/>`, front: `<g transform="rotate(-14 50 58)"><path d="M2 58A48 12 0 0 0 98 58" fill="none" stroke="${dk(c)}" stroke-width="7.4" stroke-linecap="round"/><path d="M2 58A48 12 0 0 0 98 58" fill="none" stroke="${c}" stroke-width="4.6" stroke-linecap="round"/></g>` }));
  def('galaxySwirl', o => ({ pat: S('M50 58m-24 0a24 24 0 0 1 48 0a19 19 0 0 1-38 0', '#c4a8ff', 4, 'opacity=".6"') }));
  def('starDots', o => ({ pat: [[30, 34], [70, 32], [24, 72], [76, 74], [58, 84], [40, 86]].map(p => CN(p[0], p[1], 1.6, '#fff')).join('') }));
  def('cometTail', o => ({ back: PN('M28 40C14 28 0 26 -8 30C6 34 12 40 16 48C4 46 -6 50 -10 56C4 58 14 62 22 70Z', '#fff3a1', `stroke="#ffd36e" stroke-width="2" stroke-linejoin="round"`) }));
  def('corona', o => ({ back: `<circle cx="50" cy="58" r="40" fill="#ffe8a3" stroke="#ffd36e" stroke-width="2"/>` + A.sunrays(o, '#ffd36e').back }));
  def('crown', o => ({ front: P(`M36 ${o.t + 2}L36 ${o.t - 12}L43 ${o.t - 5}L50 ${o.t - 16}L57 ${o.t - 5}L64 ${o.t - 12}L64 ${o.t + 2}Z`, '#ffd36e', 2) + CN(50, o.t - 3, 2.2, '#ff8fb8') + CN(41, o.t - 1, 1.6, '#9fd0ff') + CN(59, o.t - 1, 1.6, '#9fd0ff') }));
  def('musicNotes', o => ({ front: S('M76 18V36', '#b48cff', 2.4) + C(72, 38, 4.2, '#d7c6ff', 1.4) + S('M76 18C86 16 90 24 84 28', '#b48cff', 2.2) + S('M18 28V42', '#b48cff', 2.2) + C(14, 44, 3.6, '#ffd6ee', 1.3) }));
  def('antlers', o => ({ back: S(`M34 ${o.t + 10}C28 ${o.t - 4} 20 ${o.t - 6} 18 ${o.t - 16}`, '#c9956a', 2.8) + S(`M30 ${o.t}C22 ${o.t - 8} 16 ${o.t - 4} 14 ${o.t - 12}`, '#c9956a', 2.2) + S(`M66 ${o.t + 10}C72 ${o.t - 4} 80 ${o.t - 6} 82 ${o.t - 16}`, '#c9956a', 2.8) + S(`M70 ${o.t}C78 ${o.t - 8} 84 ${o.t - 4} 86 ${o.t - 12}`, '#c9956a', 2.2) }));
  def('kappaDish', o => ({ front: E(50, o.t + 4, 18, 5.2, '#9fdcff', 0, 1.6) + S(`M36 ${o.t + 4}Q50 ${o.t} 64 ${o.t + 4}`, '#fff', 1.8, 'opacity=".9"') }));
  def('leafVein', o => ({ pat: S('M50 24V88', '#3f8f4a', 2.2) + S('M50 46L32 36M50 60L68 50M50 74L34 68', '#3f8f4a', 1.8) }));

  // ---------- faces ----------
  function eyesSVG(type, ring, es) {
    const eye = (x, kind) => {
      let s = `<g transform="translate(${x} 0) scale(${es})">`;
      if (ring) s += CN(0, 0, 9, '#fff', `stroke="${INK}" stroke-width="1.4"`);
      switch (kind) {
        case 'happy': s += S('M-5.5 1.5Q0 -5.5 5.5 1.5', INK, 2.8); break;
        case 'sleepy': s += S('M-5.5 -1Q0 4 5.5 -1', INK, 2.6) + S('M-5 1.5L-7 4M5 1.5L7 4', INK, 1.6); break;
        case 'dot': s += `<g class="eye">${CN(0, 0, 3.6, INK)}${CN(-1.1, -1.2, 1.2, '#fff')}</g>`; break;
        case 'spiral': s += S('M0 0m-5 0a5 5 0 1 1 10 0a3.6 3.6 0 1 1 -7.2 0a2 2 0 1 1 4 0', INK, 1.8); break;
        case 'star': s += `<g class="eye"><ellipse rx="6" ry="7" fill="${INK}"/><path d="${starPath(-1.4, -1.6, 4, 1.7)}" fill="#fff"/>${CN(2.6, 3, 1.1, '#fff')}</g>`; break;
        case 'heart': s += heart(0, 0, 1.1, '#ff5f8f'); break;
        default: s += `<g class="eye"><ellipse rx="6" ry="7" fill="${INK}"/>${CN(-2, -2.8, 2.6, '#fff')}${CN(2.4, 2.6, 1.2, '#fff')}</g>`;
      }
      return s + '</g>';
    };
    if (type === 'wink') return eye(-12, 'big') + eye(12, 'happy');
    return eye(-12, type) + eye(12, type);
  }
  function mouthSVG(m) {
    const y = 9.5;
    switch (m) {
      case 'open': return `<path d="M-4.6 ${y - 1.2}Q0 ${y + 7} 4.6 ${y - 1.2}Z" fill="#8a3a55" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M-2.4 ${y + 2.6}Q0 ${y + 1} 2.4 ${y + 2.6}Q0 ${y + 4.6} -2.4 ${y + 2.6}Z" fill="#ff8fa8"/>`;
      case 'o': return `<ellipse cy="${y + 1}" rx="2.6" ry="3.2" fill="#8a3a55" stroke="${INK}" stroke-width="1.4"/>`;
      case 'cat': return S(`M-5 ${y - 1}Q-2.5 ${y + 2.6} 0 ${y - .4}Q2.5 ${y + 2.6} 5 ${y - 1}`, INK, 2);
      case 'tongue': return S(`M-4.6 ${y - 1}Q0 ${y + 3.6} 4.6 ${y - 1}`, INK, 2) + `<path d="M-2.4 ${y + 1.4}Q-2.6 ${y + 6.4} 0 ${y + 6.4}Q2.6 ${y + 6.4} 2.4 ${y + 1.4}Z" fill="#ff7f9f" stroke="${INK}" stroke-width="1.2"/>`;
      case 'fang': return S(`M-4.6 ${y - 1}Q0 ${y + 3.6} 4.6 ${y - 1}`, INK, 2) + `<path d="M1.4 ${y + 1.2}L2.6 ${y + 4}L3.6 ${y + .4}Z" fill="#fff" stroke="${INK}" stroke-width=".9"/>`;
      case 'blow': return `<ellipse cx="3" cy="${y + .5}" rx="2.4" ry="2.2" fill="#8a3a55" stroke="${INK}" stroke-width="1.4"/>`;
      case 'pout': return S(`M-3.4 ${y + 1.4}Q0 ${y - 1.6} 3.4 ${y + 1.4}`, INK, 2);
      case 'beak': return `<path d="M-4.6 ${y - 3}H4.6L0 ${y + 3.6}Z" fill="#ffb347" stroke="${dk('#ffb347')}" stroke-width="1.6" stroke-linejoin="round"/>`;
      case 'bill': return `<ellipse cy="${y - .4}" rx="7.4" ry="3.6" fill="#ffb347" stroke="${dk('#ffb347')}" stroke-width="1.6"/>` + S(`M-4 ${y - .2}H4`, dk('#ffb347'), 1.1);
      case 'wide': return S(`M-9 ${y - 2}Q0 ${y + 6} 9 ${y - 2}`, INK, 2.2);
      case 'paci': return `<circle cy="${y + .6}" r="4.6" fill="#9fd0ff" stroke="${dk('#9fd0ff')}" stroke-width="1.4"/><circle cy="${y + .6}" r="2" fill="#fff"/>`;
      case 'carrot': return `<path d="M-1 ${y - 5.6}L13 ${y - 3}L-1 ${y - .6}Z" fill="#ffa35e" stroke="${dk('#ffa35e')}" stroke-width="1.4" stroke-linejoin="round"/>` + S(`M-4 ${y + 2.6}Q0 ${y + 5.6} 4 ${y + 2.6}`, INK, 1.8);
      default: return S(`M-4.4 ${y - 1}Q0 ${y + 3.6} 4.4 ${y - 1}`, INK, 2.2);
    }
  }
  function faceSVG(e, o, hideEyes) {
    const blush = e.blush || '#ff8fb1';
    const es = e.eyesScale || 1;
    const bl = `<ellipse cx="-19" cy="6.5" rx="5.6" ry="3.4" fill="${blush}" opacity=".6"/><ellipse cx="19" cy="6.5" rx="5.6" ry="3.4" fill="${blush}" opacity=".6"/>`;
    const blH = `<ellipse cx="-19" cy="6.5" rx="6.6" ry="4" fill="${blush}" opacity=".85"/><ellipse cx="19" cy="6.5" rx="6.6" ry="4" fill="${blush}" opacity=".85"/>`;
    const tr = `transform="translate(50 ${o.fy}) scale(${o.s})"`;
    const normal = `<g class="face-n" ${tr}>${bl}${hideEyes ? '' : eyesSVG(e.eyes, e.ring, es)}${mouthSVG(e.mouth)}</g>`;
    const conf = `<g class="face-c" ${tr}>${bl}${eyesSVG('spiral', e.ring, es)}${S('M-5.5 10q1.8-2.4 3.6 0t3.6 0t3.6 0', INK, 2)}${drop(24, -12, .9, '#bfe6ff')}</g>`;
    const hug = `<g class="face-h" ${tr}>${blH}${eyesSVG('happy', e.ring, es)}${mouthSVG('open')}</g>`;
    return normal + conf + hug;
  }

  // ---------- main ----------
  function render(e, opts) {
    opts = opts || {};
    const sh = SH[e.shape] || SH.round;
    const id = 'ef' + (++UID);
    const o = { c: e.color, t: sh.t, fy: e.fy || sh.fy, s: (sh.s || 1) * 1.13 };
    const L = { back: '', pat: '', mid: '', front: '' }; let hideEyes = false;
    (e.acc || []).forEach(a => {
      const [n, arg] = a.split(':'); const fn = A[n];
      if (!fn) { if (root.console) console.warn('missing accessory', n); return; }
      const r = fn(o, arg) || {};
      for (const k in L) if (r[k]) L[k] += r[k];
      if (r.hideEyes) hideEyes = true;
    });
    const paths = Array.isArray(sh.d) ? sh.d : [sh.d];
    const out = dk(e.color);
    const glassy = e.glassy ? ' fill-opacity=".85"' : '';
    let body = '';
    if (sh.cap) { // mushroom: stem cream, cap colored
      body = `<path d="${paths[0]}" fill="#fff4e6" stroke="${dk('#fff4e6')}" stroke-width="2.6" stroke-linejoin="round"/>` +
        `<path d="${paths[1]}" fill="${e.color}" stroke="${out}" stroke-width="2.6" stroke-linejoin="round"/>`;
    } else body = paths.map(d => `<path d="${d}" fill="${e.color}"${glassy} stroke="${out}" stroke-width="2.6" stroke-linejoin="round"/>`).join('');
    const clipPaths = sh.cap ? [paths[0]] : paths;
    const clip = `<clipPath id="${id}c">${clipPaths.map(d => `<path d="${d}"/>`).join('')}</clipPath>`;
    const shade = `<ellipse cx="50" cy="104" rx="52" ry="26" fill="${PLUM}" opacity=".08"/>`;
    const shine = `<ellipse cx="${sh.cap ? 30 : 34}" cy="${o.t + 14}" rx="9" ry="5.5" fill="#fff" opacity=".6" transform="rotate(-28 ${sh.cap ? 30 : 34} ${o.t + 14})"/>`;
    const sc = e.scale || 1;
    const inner = `${L.back}${body}<g clip-path="url(#${id}c)">${shade}${L.pat}</g>${sh.cap ? '' : `<g clip-path="url(#${id}c)">${shine}</g>`}${sh.cap ? shine.replace(`cy="${o.t + 14}"`, 'cy="28"') : ''}${L.mid}${faceSVG(e, o, hideEyes)}${L.front}`;
    const delay = (-(hash(e.id) % 400) / 100).toFixed(2);
    const label = opts.label === false ? '' : `role="img" aria-label="${e.name}"`;
    return `<svg class="ef-svg" viewBox="-6 -6 112 112" ${label} style="--d:${delay}s" xmlns="http://www.w3.org/2000/svg"><defs>${clip}</defs>` +
      `<ellipse class="ef-shadow" cx="50" cy="98" rx="${26 * sc}" ry="4" fill="${PLUM}" opacity=".12"/>` +
      `<g class="ef-bob"><g transform="translate(${50 - 50 * sc} ${60 - 60 * sc}) scale(${sc})">${inner}</g></g></svg>`;
  }
  function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  const api = { render, accessories: A, shapes: SH, mix };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EF_ART = api;
})(typeof window !== 'undefined' ? window : globalThis);
