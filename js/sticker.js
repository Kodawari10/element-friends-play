/* Element Friends — "Save sticker": draws a cute PNG card of a friend, fully offline (no network, no wallet). */
(function (root) {
  const W = 640, H = 760;
  const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Quicksand", "Comic Sans MS", system-ui, sans-serif';
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function star(ctx, x, y, r, c) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.38 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); ctx.restore(); }
  function wrap(ctx, text, maxW) { const words = String(text).split(' '), lines = []; let line = ''; words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }); if (line) lines.push(line); return lines.slice(0, 3); }
  // standalone SVG has no page CSS: show only the happy "hug" face so the sticker friend beams at you
  function stickerSVG(svg) { return svg.replace('<defs>', '<defs><style>.face-n,.face-c{display:none}.face-h{display:inline}</style>'); }
  function loadSVG(svg) {
    svg = stickerSVG(svg);
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = () => rej(new Error('sticker art failed'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  // e: element, opts: { art: svg string, night, since, fave, nick }
  async function make(e, opts) {
    opts = opts || {};
    const night = !!opts.night, legend = !!e.final;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    // backdrop
    const g = ctx.createLinearGradient(0, 0, W, H);
    if (night) { g.addColorStop(0, '#2a2150'); g.addColorStop(1, '#4a2f6b'); } else if (legend) { g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#ffd6ec'); } else { g.addColorStop(0, '#ffe3f1'); g.addColorStop(1, '#dff1ff'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // polka dots
    ctx.fillStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.55)';
    for (let y = 18; y < H; y += 44) for (let x = (y / 44) % 2 ? 40 : 18; x < W; x += 44) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
    // card
    ctx.save(); ctx.shadowColor = night ? 'rgba(0,0,0,.35)' : 'rgba(155,95,140,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    rr(ctx, 40, 40, W - 80, H - 80, 44); ctx.fillStyle = night ? '#352a5e' : '#fffafd'; ctx.fill(); ctx.restore();
    ctx.setLineDash([14, 10]); ctx.lineWidth = 5; ctx.strokeStyle = legend ? '#ffc94d' : (night ? '#6b5aa6' : '#ffc2dd'); rr(ctx, 58, 58, W - 116, H - 116, 34); ctx.stroke(); ctx.setLineDash([]);
    // halo behind the friend
    const halo = ctx.createRadialGradient(W / 2, 290, 20, W / 2, 290, 190);
    halo.addColorStop(0, (e.color || '#ffd6ec') + 'aa'); halo.addColorStop(1, (e.color || '#ffd6ec') + '00');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(W / 2, 290, 190, 0, Math.PI * 2); ctx.fill();
    // sparkles
    const spark = legend ? '#ffc94d' : (night ? '#ffe9a8' : '#ff9fcf');
    [[118, 140, 16], [520, 128, 20], [500, 420, 12], [132, 400, 13], [560, 260, 9], [90, 270, 9]].forEach(s => star(ctx, s[0], s[1], s[2], spark));
    // the friend
    if (opts.art) { try { const img = await loadSVG(opts.art); ctx.drawImage(img, W / 2 - 170, 120, 340, 340); } catch (err) { /* keep the card even if the art fails */ } }
    // text
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (legend) { rr(ctx, W / 2 - 110, 92, 220, 38, 19); ctx.fillStyle = '#ffd95e'; ctx.fill(); ctx.fillStyle = '#8a5a00'; ctx.font = `800 20px ${FONT}`; ctx.fillText('★ Legendary ★', W / 2, 118); }
    ctx.fillStyle = night ? '#fff4fb' : '#6b3f63'; ctx.font = `900 54px ${FONT}`;
    ctx.fillText(e.name + (opts.fave ? ' 💗' : ''), W / 2, 518);
    ctx.fillStyle = night ? '#d9c9ff' : '#9a6a8e'; ctx.font = `600 22px ${FONT}`;
    let dy = 558, lines = 3;
    if (opts.nick) { ctx.font = `800 24px ${FONT}`; ctx.fillStyle = night ? '#ffc2e6' : '#e0679f'; ctx.fillText(`aka “${opts.nick}” 🏷️`, W / 2, 556); ctx.fillStyle = night ? '#d9c9ff' : '#9a6a8e'; ctx.font = `600 22px ${FONT}`; dy = 592; lines = 2; }
    wrap(ctx, e.desc || '', W - 170).slice(0, lines).forEach((l, i) => ctx.fillText(l, W / 2, dy + i * 30));
    if (opts.since) { ctx.font = `800 19px ${FONT}`; ctx.fillStyle = night ? '#ffc2e6' : '#c0628f'; ctx.fillText(opts.since, W / 2, 650); }
    ctx.font = `900 20px ${FONT}`; ctx.fillStyle = night ? '#a99ad6' : '#d38bb3'; ctx.fillText('✿ Element Friends ✿', W / 2, 690);
    return c;
  }

  // Group photo 📸: a class-photo PNG of the friends on the playfield.
  // rows: [[{ e, art, label }...], ...] back row first. opts: { night, date, total }
  const GW = 960, GH = 760;
  async function makeGroup(rows, opts) {
    opts = opts || {};
    const night = !!opts.night, n = rows.reduce((m, r) => m + r.length, 0);
    const c = document.createElement('canvas'); c.width = GW; c.height = GH;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, GW, GH);
    if (night) { g.addColorStop(0, '#2a2150'); g.addColorStop(1, '#4a2f6b'); } else { g.addColorStop(0, '#ffe3f1'); g.addColorStop(1, '#dff1ff'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, GW, GH);
    ctx.fillStyle = night ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.55)';
    for (let y = 18; y < GH; y += 44) for (let x = (y / 44) % 2 ? 40 : 18; x < GW; x += 44) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
    // polaroid card, slightly tilted
    ctx.save(); ctx.translate(GW / 2, GH / 2); ctx.rotate(-0.012); ctx.translate(-GW / 2, -GH / 2);
    ctx.save(); ctx.shadowColor = night ? 'rgba(0,0,0,.4)' : 'rgba(155,95,140,.25)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
    rr(ctx, 40, 34, GW - 80, GH - 68, 28); ctx.fillStyle = night ? '#352a5e' : '#fffafd'; ctx.fill(); ctx.restore();
    // the photo itself
    const px = 70, py = 64, pw = GW - 140, ph = 500;
    ctx.save(); rr(ctx, px, py, pw, ph, 18); ctx.clip();
    const sky = ctx.createLinearGradient(0, py, 0, py + ph);
    if (night) { sky.addColorStop(0, '#2f2b6b'); sky.addColorStop(1, '#5a3f86'); } else { sky.addColorStop(0, '#d9f0ff'); sky.addColorStop(1, '#fff1f8'); }
    ctx.fillStyle = sky; ctx.fillRect(px, py, pw, ph);
    // soft grassy hill the friends stand on
    ctx.fillStyle = night ? '#3f5a7a' : '#c9f2c7'; ctx.beginPath(); ctx.ellipse(GW / 2, py + ph + 120, pw * 0.75, 260, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = night ? '#4a6b8c' : '#b3ebb5'; ctx.beginPath(); ctx.ellipse(GW / 2 - 200, py + ph + 150, pw * 0.5, 230, 0, 0, Math.PI * 2); ctx.fill();
    const spark = night ? '#ffe9a8' : '#ff9fcf';
    [[120, 110, 14], [840, 104, 18], [780, 200, 9], [190, 210, 9], [480, 92, 11]].forEach(s => star(ctx, s[0], s[1], s[2], spark));
    if (night) { ctx.fillStyle = '#fff6c9'; ctx.beginPath(); ctx.arc(820, 130, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2f2b6b'; ctx.beginPath(); ctx.arc(808, 122, 24, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = 'rgba(255,255,255,.9)'; [[200, 120, 26], [228, 110, 32], [258, 122, 24], [700, 150, 22], [724, 140, 28], [750, 152, 20]].forEach(b => { ctx.beginPath(); ctx.arc(b[0], b[1], b[2], 0, Math.PI * 2); ctx.fill(); }); }
    // friends: back rows smaller and higher, front row biggest
    const R = rows.length, maxCols = Math.max(...rows.map(r => r.length));
    const base = Math.min(190, (pw - 40) / Math.max(1, maxCols + (R > 1 ? 0.5 : 0)) * 1.02, (ph - 70) / (1.1 + (R - 1) * 0.74));
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const front = rows[R - 1].length, tags = [];
    for (let ri = 0; ri < R; ri++) {
      const row = rows[ri], depth = R - 1 - ri, size = base * (1 - depth * 0.1);
      const cy = py + ph - 46 - size / 2 - depth * base * 0.74;
      const stagger = depth % 2 === 1 && row.length === front; // peek between the friends in front
      const gap = Math.min(size * 1.0, (pw - 40) / Math.max(1, row.length + (stagger ? 0.5 : 0)));
      for (let i = 0; i < row.length; i++) {
        const f = row[i], cx = GW / 2 + (i - (row.length - 1) / 2) * gap + (stagger ? gap / 2 : 0);
        ctx.fillStyle = 'rgba(80,40,90,.12)'; ctx.beginPath(); ctx.ellipse(cx, cy + size * 0.44, size * 0.3, size * 0.07, 0, 0, Math.PI * 2); ctx.fill();
        if (f.art) { try { const img = await loadSVG(f.art); ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size); } catch (err) { /* keep the photo */ } }
        if (f.label) tags.push({ t: f.label, cx, y: cy + size * 0.4, fs: Math.max(13, Math.min(21, size * 0.12)) });
      }
    }
    // name tags last so nobody's head covers them
    tags.forEach(g => {
      ctx.font = `800 ${g.fs}px ${FONT}`;
      const t = g.t.length > 14 ? g.t.slice(0, 13) + '…' : g.t, tw = ctx.measureText(t).width + 16;
      rr(ctx, g.cx - tw / 2, g.y, tw, g.fs + 10, (g.fs + 10) / 2); ctx.fillStyle = night ? 'rgba(53,42,94,.88)' : 'rgba(255,255,255,.9)'; ctx.fill();
      ctx.fillStyle = night ? '#fff4fb' : '#6b3f63'; ctx.fillText(t, g.cx, g.y + g.fs + 2);
    });
    ctx.restore();
    // caption strip (handwritten polaroid style)
    ctx.textAlign = 'center';
    ctx.fillStyle = night ? '#fff4fb' : '#6b3f63'; ctx.font = `900 40px ${FONT}`;
    const title = n === 1 ? 'Just me! ✿' : `${n} friends say cheese!`;
    ctx.fillText(title, GW / 2, 622);
    ctx.fillStyle = night ? '#d9c9ff' : '#9a6a8e'; ctx.font = `700 22px ${FONT}`;
    const sub = [opts.date || '', opts.total && opts.total > n ? `${opts.total - n} more friends were just out of frame` : ''].filter(Boolean).join(' · ');
    if (sub) ctx.fillText(sub, GW / 2, 658);
    ctx.font = `900 20px ${FONT}`; ctx.fillStyle = night ? '#a99ad6' : '#d38bb3'; ctx.fillText('✿ Element Friends ✿', GW / 2, 694);
    ctx.restore();
    return c;
  }
  function groupFileName(date) { return 'element-friends-photo-' + String(date || '').replace(/[^0-9-]/g, '') + '.png'; }
  function toBlob(canvas) { return new Promise(res => canvas.toBlob(b => res(b), 'image/png')); }
  function fileName(e) { return 'element-friends-' + String(e.id).replace(/[^a-z0-9-]/gi, '') + '.png'; }
  const api = { make, makeGroup, groupFileName, toBlob, fileName, stickerSVG, W, H, GW, GH };
  root.EF_STICKER = api;
})(window);
