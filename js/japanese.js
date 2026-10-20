/* Element Friends — Japanese names 🗾: every friend's card shows its name in Japanese (kana, kanji when it has one, and
   romaji), and tapping it says the word out loud with the device's Japanese voice. Offline, no wallet needed. */
(function () {
  'use strict';
  const KEY = 'element-friends-jp-v1';
  const ROUNDS = 5; // questions in one Name quiz
  // id: 'kana|romaji|kanji'  (kanji is left empty for words usually written in kana)
  const JP = {
    water: 'みず|mizu|水', fire: 'ひ|hi|火', earth: 'つち|tsuchi|土', air: 'くうき|kūki|空気', steam: 'ゆげ|yuge|湯気', mud: 'どろ|doro|泥',
    mist: 'きり|kiri|霧', lava: 'ようがん|yōgan|溶岩', energy: 'エネルギー|enerugī|', smoke: 'けむり|kemuri|煙', dust: 'ほこり|hokori|埃',
    stone: 'いし|ishi|石', wind: 'かぜ|kaze|風', puddle: 'みずたまり|mizutamari|水たまり', cloud: 'くも|kumo|雲', rain: 'あめ|ame|雨',
    storm: 'あらし|arashi|嵐', lightning: 'かみなり|kaminari|雷', sky: 'そら|sora|空', sun: 'たいよう|taiyō|太陽', moon: 'つき|tsuki|月',
    star: 'ほし|hoshi|星', rainbow: 'にじ|niji|虹', tornado: 'たつまき|tatsumaki|竜巻', snow: 'ゆき|yuki|雪', ice: 'こおり|kōri|氷',
    aurora: 'オーロラ|ōrora|', wave: 'なみ|nami|波', bubble: 'あわ|awa|泡', lake: 'みずうみ|mizuumi|湖', ocean: 'うみ|umi|海',
    mountain: 'やま|yama|山', volcano: 'かざん|kazan|火山', sand: 'すな|suna|砂', glass: 'ガラス|garasu|', island: 'しま|shima|島',
    beach: 'すなはま|sunahama|砂浜', desert: 'さばく|sabaku|砂漠', crystal: 'すいしょう|suishō|水晶', metal: 'きんぞく|kinzoku|金属',
    clay: 'ねんど|nendo|粘土', hotspring: 'おんせん|onsen|温泉', plant: 'しょくぶつ|shokubutsu|植物', grass: 'くさ|kusa|草', tree: 'き|ki|木',
    forest: 'もり|mori|森', flower: 'はな|hana|花', garden: 'にわ|niwa|庭', mushroom: 'きのこ|kinoko|', cactus: 'サボテン|saboten|',
    bamboo: 'たけ|take|竹', wheat: 'こむぎ|komugi|小麦', rice: 'おこめ|okome|お米', apple: 'りんご|ringo|', sakura: 'さくら|sakura|桜',
    clover: 'よつば|yotsuba|四つ葉', life: 'いのち|inochi|命', egg: 'たまご|tamago|卵', animal: 'どうぶつ|dōbutsu|動物', human: 'ひと|hito|人',
    golem: 'ゴーレム|gōremu|', bird: 'とり|tori|鳥', fish: 'さかな|sakana|魚', turtle: 'かめ|kame|亀', frog: 'かえる|kaeru|', lizard: 'とかげ|tokage|',
    dragon: 'りゅう|ryū|竜', cow: 'うし|ushi|牛', milk: 'ぎゅうにゅう|gyūnyū|牛乳', cat: 'ねこ|neko|猫', dog: 'いぬ|inu|犬',
    wolf: 'おおかみ|ōkami|狼', fox: 'きつね|kitsune|狐', bunny: 'うさぎ|usagi|', bear: 'くま|kuma|熊', polarbear: 'しろくま|shirokuma|白くま',
    panda: 'パンダ|panda|', teddy: 'テディベア|tedibea|', monkey: 'さる|saru|猿', horse: 'うま|uma|馬', pegasus: 'ペガサス|pegasasu|',
    unicorn: 'ユニコーン|yunikōn|', chick: 'ひよこ|hiyoko|', duck: 'あひる|ahiru|', owl: 'ふくろう|fukurō|', penguin: 'ペンギン|pengin|',
    phoenix: 'ふしちょう|fushichō|不死鳥', bee: 'はち|hachi|蜂', firefly: 'ほたる|hotaru|蛍', butterfly: 'ちょうちょ|chōcho|', whale: 'くじら|kujira|',
    crab: 'かに|kani|', jellyfish: 'くらげ|kurage|', starfish: 'ひとで|hitode|', dustbunny: 'わたぼこり|watabokori|', hamster: 'ハムスター|hamusutā|',
    hedgehog: 'はりねずみ|harinezumi|', koala: 'コアラ|koara|', dolphin: 'いるか|iruka|', octopus: 'たこ|tako|', snail: 'かたつむり|katatsumuri|', otter: 'ラッコ|rakko|', bat: 'こうもり|kōmori|蝙蝠', sheep: 'ひつじ|hitsuji|羊',
    love: 'あい|ai|愛', baby: 'あかちゃん|akachan|赤ちゃん', ghost: 'おばけ|obake|', ninja: 'にんじゃ|ninja|忍者', wizard: 'まほうつかい|mahōtsukai|魔法使い',
    princess: 'おひめさま|ohimesama|お姫様', knight: 'きし|kishi|騎士', mermaid: 'にんぎょ|ningyo|人魚', fairy: 'ようせい|yōsei|妖精',
    snowman: 'ゆきだるま|yukidaruma|雪だるま', astronaut: 'うちゅうひこうし|uchūhikōshi|宇宙飛行士', magic: 'まほう|mahō|魔法',
    happiness: 'しあわせ|shiawase|幸せ', brick: 'レンガ|renga|', house: 'いえ|ie|家', castle: 'おしろ|oshiro|お城', village: 'むら|mura|村',
    city: 'まち|machi|町', igloo: 'イグルー|igurū|', pyramid: 'ピラミッド|piramiddo|', robot: 'ロボット|robotto|', lightbulb: 'でんきゅう|denkyū|電球',
    boat: 'ふね|fune|船', campfire: 'たきび|takibi|焚き火', hourglass: 'すなどけい|sunadokei|砂時計', aquarium: 'すいそう|suisō|水槽',
    snowglobe: 'スノードーム|sunōdōmu|', airplane: 'ひこうき|hikōki|飛行機', rocket: 'ロケット|roketto|', ufo: 'ユーフォー|yūfō|UFO',
    friedegg: 'めだまやき|medamayaki|目玉焼き', bread: 'パン|pan|', cake: 'ケーキ|kēki|', icecream: 'アイス|aisu|', sushi: 'すし|sushi|寿司',
    tea: 'おちゃ|ocha|お茶', boba: 'タピオカ|tapioka|', honey: 'はちみつ|hachimitsu|蜂蜜', candy: 'あめ|ame|飴', cottoncandy: 'わたあめ|wataame|綿あめ',
    pie: 'アップルパイ|appurupai|', cocoa: 'ココア|kokoa|', pancake: 'パンケーキ|pankēki|', pudding: 'プリン|purin|', mochi: 'もち|mochi|餅', onigiri: 'おにぎり|onigiri|',
    planet: 'わくせい|wakusei|惑星', galaxy: 'ぎんが|ginga|銀河', comet: 'すいせい|suisei|彗星', alien: 'うちゅうじん|uchūjin|宇宙人',
    eclipse: 'にっしょく|nisshoku|日食', universe: 'うちゅう|uchū|宇宙'
  };
  const D = window.EF_DATA;
  let G, cfg, voice = null, curId = null, revealId = null;

  function word(id) { const s = JP[id]; if (!s) return null; const [kana, romaji, kanji] = s.split('|'); return { kana, romaji, kanji: kanji || '' }; }
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      const n = (x, max) => (Number.isFinite(x) && x >= 0 ? Math.min(Math.floor(x), max) : 0);
      return { on: !(v && v.on === false), kana: !!(v && v.kana === true), heard: v && Array.isArray(v.heard) ? v.heard.filter(id => JP[id]) : [], best: n(v && v.best, ROUNDS), played: n(v && v.played, 1e6) };
    } catch (e) { return { on: true, kana: false, heard: [], best: 0, played: 0 }; }
  }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } }
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function pickVoice() {
    try {
      const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      voice = vs.find(v => /^ja([-_]|$)/i.test(v.lang)) || null;
    } catch (e) { voice = null; }
    return voice;
  }

  function fill(pill, id) {
    if (!pill) return;
    const e = D.byId[id], w = word(id);
    if (!cfg.on || !w || !e) { pill.hidden = true; pill.innerHTML = ''; pill.dataset.id = ''; return; }
    pill.hidden = false; pill.dataset.id = id;
    pill.classList.remove('say');
    pill.innerHTML = `<span class="jp-flag" aria-hidden="true">🗾</span><span class="jp-kana" lang="ja">${esc(w.kana)}</span>` +
      (w.kanji && w.kanji !== w.kana ? `<span class="jp-kanji" lang="ja">${esc(w.kanji)}</span>` : '') +
      `<span class="jp-romaji">${esc(w.romaji)}</span><span class="jp-say" aria-hidden="true">🔊</span>`;
    pill.setAttribute('aria-label', `${e.name} in Japanese is ${w.romaji}. Tap to hear it.`);
  }
  function render(id) { curId = id; fill(document.getElementById('detailJp'), id); }
  // the "You discovered" pop-up shows the new friend's Japanese name too
  function renderReveal(id) { revealId = id; fill(document.getElementById('revealJp'), id); }

  function speak(w) {
    if (G.state.muted || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(w.kana);
      u.lang = 'ja-JP'; u.rate = 0.8; u.pitch = 1.25;
      if (voice || pickVoice()) u.voice = voice;
      speechSynthesis.speak(u); return true;
    } catch (err) { return false; }
  }
  function hear(id) { if (!cfg.heard.includes(id)) { cfg.heard.push(id); store(); } }

  function say(id, pill) {
    id = id || curId; const w = word(id), e = D.byId[id]; if (!w || !e) return false;
    pill = pill || document.getElementById('detailJp');
    if (pill) { pill.classList.remove('say'); if (!G.isCalm()) { void pill.offsetWidth; pill.classList.add('say'); } }
    hear(id);
    let spoke = false;
    if (G.state.muted) {
      G.ui.toast(`🔈 Unmute to hear it! ${e.name} is “${w.romaji}” (${w.kana}).`, 2800);
    } else if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      spoke = speak(w);
      if (!voice && !pickVoice()) G.ui.toast(`🗾 This device has no Japanese voice yet. ${e.name} sounds like “${w.romaji}”.`, 3000);
    } else {
      G.ui.toast(`🗾 ${e.name} sounds like “${w.romaji}”.`, 2600);
    }
    G.ui.announce(`${e.name} in Japanese: ${w.romaji}`);
    document.dispatchEvent(new CustomEvent('ef:jp', { detail: { id, romaji: w.romaji, spoke } }));
    return spoke;
  }

  function applyBtn() {
    const b = document.getElementById('btnJp'); if (!b) return;
    b.setAttribute('aria-checked', String(cfg.on)); b.classList.toggle('active', cfg.on);
    b.querySelector('.state').textContent = cfg.on ? 'On' : 'Off';
  }
  function setOn(on) {
    cfg.on = !!on; store(); applyBtn(); bestLabel(); applyLabels();
    if (curId && !document.getElementById('detail').hidden) render(curId);
    if (revealId && !document.getElementById('reveal').hidden) renderReveal(revealId);
    G.ui.announce(cfg.on ? 'Japanese names on' : 'Japanese names off');
  }


  // ---------- あ Kana labels: friends on the playfield, in your collection and in the Friend Collection wear their kana name ----------
  const labelsOn = () => !!(cfg && cfg.on && cfg.kana);
  function tag(el) {
    const id = el.dataset.id, w = word(id), en = el.querySelector('.lbl:not(.lbl-jp)');
    if (!w || !en || en.textContent === '???') return; // never spoil undiscovered friends
    let jp = el.querySelector('.lbl-jp');
    if (!jp) { jp = document.createElement('span'); jp.className = 'lbl lbl-jp'; jp.lang = 'ja'; jp.setAttribute('aria-hidden', 'true'); en.after(jp); }
    el.classList.add('has-jp');
    if (jp.textContent !== w.kana) jp.textContent = w.kana;
    jp.title = `${D.byId[id] ? D.byId[id].name : ''} · ${w.romaji}`;
  }
  const SEL = '.piece[data-id], .inv-item[data-id], .book-cell[data-id]';
  function tagAll(root) { if (!labelsOn()) return; (root || document).querySelectorAll(SEL).forEach(tag); }
  function applyLabels() {
    const on = labelsOn();
    document.documentElement.classList.toggle('jp-labels', on);
    if (on) tagAll();
    const b = $id('btnJpLabels');
    if (b) { b.hidden = !cfg.on; b.setAttribute('aria-checked', String(!!cfg.kana)); b.classList.toggle('active', !!cfg.kana); b.querySelector('.state').textContent = cfg.kana ? 'On' : 'Off'; }
    const n = $id('jpLabelsNote'); if (n) n.hidden = !cfg.on;
  }
  function setLabels(on) {
    cfg.kana = !!on; store(); applyLabels();
    G.ui.announce(cfg.kana ? 'Kana labels on. Friends show their Japanese names.' : 'Kana labels off');
    if (cfg.kana && cfg.on) G.ui.toast('あ Your friends now wear their kana names! Tap a friend’s card to hear it 🔊', 3000);
    document.dispatchEvent(new CustomEvent('ef:jplabels', { detail: { on: labelsOn() } }));
  }
  function initLabels() {
    let queued = false;
    const mo = new MutationObserver(() => { if (!labelsOn() || queued) return; queued = true; requestAnimationFrame(() => { queued = false; tagAll(); }); });
    ['board', 'inv', 'bookGrid'].forEach(i => { const el = $id(i); if (el) mo.observe(el, { childList: true, subtree: true }); });
    const b = $id('btnJpLabels'); if (b) b.addEventListener('click', () => setLabels(!cfg.kana));
    applyLabels();
  }

  // ---------- 🎌 Name quiz: pick the right Japanese name for five of your friends ----------
  const SND = () => window.EF_AUDIO;
  let quiz = null;
  const $id = i => document.getElementById(i);
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pool = () => D.elements.filter(e => G.found.has(e.id) && JP[e.id]).map(e => e.id);
  const artOf = id => window.EF_ART.render(D.byId[id], { label: false });
  function choicesFor(id) {
    const kana = word(id).kana, ok = k => k !== id && word(k).kana !== kana;
    const known = shuffle(pool().filter(ok)), rest = shuffle(Object.keys(JP).filter(k => ok(k) && !G.found.has(k)));
    const picks = [];
    for (const k of known.concat(rest)) { if (picks.length >= 2) break; if (!picks.some(p => word(p).kana === word(k).kana)) picks.push(k); }
    return shuffle([id].concat(picks));
  }
  function bestLabel() {
    const b = $id('jpQuizBest'); if (b) b.textContent = cfg.played ? `Best ${cfg.best}/${ROUNDS}` : 'New!';
    const btn = $id('btnJpQuiz'); if (btn) { btn.hidden = !cfg.on; btn.setAttribute('aria-label', `Name quiz. ${cfg.played ? `Best score ${cfg.best} of ${ROUNDS}` : 'Not played yet'}`); }
  }
  function startQuiz(qs) {
    const p = shuffle(pool());
    if (!p.length) return null;
    quiz = { qs: (qs && qs.length ? qs.filter(id => JP[id]) : p).slice(0, ROUNDS), i: 0, score: 0, answered: false, choices: [] };
    while (quiz.qs.length < ROUNDS && p.length) quiz.qs.push(p[quiz.qs.length % p.length]); // tiny collections repeat a friend
    $id('jpqStage').hidden = false; $id('jpqDone').hidden = true;
    const m = $id('jpQuiz');
    if (m.hidden) G.ui.openModal('jpQuiz');
    ask();
    return quiz;
  }
  function ask() {
    const id = quiz.qs[quiz.i], e = D.byId[id];
    quiz.answered = false; quiz.choices = choicesFor(id);
    $id('jpqProgress').textContent = `Question ${quiz.i + 1} of ${quiz.qs.length} · ${quiz.score} right`;
    const a = $id('jpqArt'); a.innerHTML = artOf(id); a.classList.remove('happy', 'oops');
    $id('jpqAsk').innerHTML = `Which one is <b>${esc(e.name)}</b> in Japanese?`;
    $id('jpqSay').textContent = '';
    const box = $id('jpqChoices'); box.classList.remove('answered'); box.innerHTML = '';
    quiz.choices.forEach((k, i) => {
      const w = word(k), b = document.createElement('button');
      b.type = 'button'; b.className = 'btn jpq-choice'; b.dataset.id = k;
      b.innerHTML = `<span class="jpq-num" aria-hidden="true">${i + 1}</span><span class="jpq-kana" lang="ja">${esc(w.kana)}</span><span class="jpq-ro">${esc(w.romaji)}</span>`;
      b.setAttribute('aria-label', `Choice ${i + 1}: ${w.romaji}`);
      b.addEventListener('click', () => answer(i));
      box.appendChild(b);
    });
    $id('jpqNext').hidden = true;
    setTimeout(() => { const f = box.querySelector('button'); if (f && !$id('jpQuiz').hidden) f.focus({ preventScroll: true }); }, 40);
  }
  function answer(i) {
    if (!quiz || quiz.answered) return null;
    const id = quiz.qs[quiz.i], pick = quiz.choices[i]; if (!pick) return null;
    const right = pick === id, w = word(id), e = D.byId[id], calm = G.isCalm();
    quiz.answered = true; if (right) quiz.score++;
    hear(id);
    const box = $id('jpqChoices'); box.classList.add('answered');
    box.querySelectorAll('.jpq-choice').forEach(b => { b.disabled = true; if (b.dataset.id === id) b.classList.add('right'); else if (b.dataset.id === pick) b.classList.add('wrong'); });
    const art = $id('jpqArt'); if (!calm) { void art.offsetWidth; art.classList.add(right ? 'happy' : 'oops'); }
    const kanji = w.kanji && w.kanji !== w.kana ? ` ${w.kanji}` : '';
    const line = right ? `Sugoi! ✨ ${e.name} is ${w.kana}${kanji} (${w.romaji}).` : `Almost! ${e.name} is ${w.kana}${kanji} (${w.romaji}).`;
    $id('jpqSay').textContent = line;
    G.ui.announce(line);
    if (SND()) SND().play(right ? 'fave' : 'unfave');
    if (right && !calm) { const r = box.querySelector('.right').getBoundingClientRect(); G.ui.burst(r.left + r.width / 2, r.top + r.height / 2, 10); }
    speak(w);
    $id('jpqProgress').textContent = `Question ${quiz.i + 1} of ${quiz.qs.length} · ${quiz.score} right`;
    const nx = $id('jpqNext'); nx.hidden = false; nx.textContent = quiz.i + 1 < quiz.qs.length ? 'Next ➜' : 'See my score 🎉';
    setTimeout(() => { if (!nx.hidden && !$id('jpQuiz').hidden) nx.focus({ preventScroll: true }); }, 40);
    return right;
  }
  function next() {
    if (!quiz || !quiz.answered) return;
    quiz.i++;
    if (quiz.i < quiz.qs.length) ask(); else finish();
  }
  function finish() {
    const n = quiz.qs.length, s = quiz.score, newBest = s > cfg.best || !cfg.played;
    cfg.best = Math.max(cfg.best, s); cfg.played++; store(); bestLabel();
    $id('jpqStage').hidden = true; $id('jpqNext').hidden = true; $id('jpqDone').hidden = false;
    $id('jpqProgress').textContent = 'All done!';
    const star = quiz.qs.slice().reverse().find(id => G.found.has(id)) || 'water';
    $id('jpqDoneArt').innerHTML = artOf(star);
    const msg = s === n ? `Perfect ${s}/${n}! You're a kana star 🌟` : s >= Math.ceil(n / 2) ? `${s}/${n}! すごい! Sugoi! ✨` : `${s}/${n}. がんばって! Ganbatte, every try helps 💕`;
    $id('jpqScore').textContent = msg;
    $id('jpqBestNote').textContent = newBest && cfg.played > 1 ? `New best score! 🏅` : `Best score: ${cfg.best}/${ROUNDS}`;
    G.ui.announce(`${msg} ${$id('jpqBestNote').textContent}`);
    if (SND()) SND().play(s === n ? 'discover' : 'select');
    if (s === n) G.ui.confetti(40);
    document.dispatchEvent(new CustomEvent('ef:jpquiz', { detail: { score: s, of: n, best: cfg.best, played: cfg.played } }));
    setTimeout(() => { const b = $id('jpqAgain'); if (b && !$id('jpQuiz').hidden) b.focus({ preventScroll: true }); }, 40);
  }
  function initQuiz() {
    const btn = $id('btnJpQuiz'), m = $id('jpQuiz'); if (!btn || !m) return;
    btn.addEventListener('click', () => { G.ui.closeModal('menu'); startQuiz(); });
    $id('jpqNext').addEventListener('click', next);
    $id('jpqAgain').addEventListener('click', () => startQuiz());
    m.addEventListener('keydown', ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || !quiz) return;
      if (/^[1-3]$/.test(ev.key) && !quiz.answered && !$id('jpqStage').hidden) { ev.preventDefault(); answer(+ev.key - 1); }
    });
    bestLabel();
  }

  function init() {
    G = window.EF_GAME; if (!G || !D) return;
    cfg = load();
    pickVoice();
    if (window.speechSynthesis && 'onvoiceschanged' in speechSynthesis) speechSynthesis.addEventListener('voiceschanged', pickVoice);
    document.addEventListener('ef:detail', ev => render(ev.detail.id));
    document.addEventListener('ef:reveal', ev => renderReveal(ev.detail.id));
    const rp = document.getElementById('revealJp');
    if (rp) rp.addEventListener('click', ev => { ev.stopPropagation(); if (revealId) say(revealId, rp); });
    const pill = document.getElementById('detailJp');
    if (pill) pill.addEventListener('click', ev => { ev.stopPropagation(); say(); });
    const b = document.getElementById('btnJp');
    if (b) b.addEventListener('click', () => setOn(!cfg.on));
    applyBtn(); initQuiz(); initLabels();
    window.EF_JP = { word, say, setOn, isOn: () => cfg.on, setLabels, labelsOn, heard: () => cfg.heard.slice(), ids: () => Object.keys(JP), hasVoice: () => !!(voice || pickVoice()),
      quiz: { start: startQuiz, answer, next, state: () => quiz && { ...quiz, qs: quiz.qs.slice(), choices: quiz.choices.slice() }, best: () => cfg.best, played: () => cfg.played, rounds: ROUNDS } };
  }
  if (window.EF_GAME) init(); else document.addEventListener('ef:ready', init, { once: true });
})();
