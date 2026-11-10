/* Element Friends — 🏡 Friend families: every friend belongs to one cozy group (Weather, Animals, Treats…).
   Pure data, no DOM. Used by the Collection so kids can browse 216 friends by kind. */
(function (root) {
  const FAMS = [
    { id: 'nature',  emoji: '🌍', name: 'Nature',  ids: ['water','fire','earth','air','mud','lava','energy','dust','stone','lake','ocean','mountain','volcano','sand','glass','island','beach','desert','metal','clay','hotspring','bubble'] },
    { id: 'weather', emoji: '🌦️', name: 'Weather', ids: ['steam','mist','smoke','wind','puddle','cloud','rain','storm','lightning','sky','sun','moon','rainbow','tornado','snow','ice','aurora','wave','frost','hail','blizzard','fog','sunset','sunrise','moonlight'] },
    { id: 'space',   emoji: '⭐', name: 'Space',   ids: ['star','planet','galaxy','comet','alien','eclipse','universe','meteor','nebula','satellite','telescope','astronaut','rocket','ufo'] },
    { id: 'plants',  emoji: '🌸', name: 'Plants',  ids: ['plant','grass','tree','forest','flower','garden','mushroom','cactus','bamboo','wheat','rice','apple','sakura','clover','life','rose','sunflower','daisy','lily','leaf','pine'] },
    { id: 'animals', emoji: '🐾', name: 'Animals', ids: ['egg','animal','bird','fish','turtle','frog','lizard','dragon','cow','cat','dog','wolf','fox','bunny','bear','polarbear','panda','teddy','monkey','horse','pegasus','unicorn','chick','duck','owl','penguin','phoenix','bee','firefly','butterfly','whale','crab','jellyfish','starfish','dustbunny','hamster','hedgehog','koala','dolphin','octopus','snail','otter','bat','blackcat','tanuki','sheep','deer','squirrel','swan','koi','seahorse','pig','parrot','kappa'] },
    { id: 'treats',  emoji: '🍪', name: 'Treats',  ids: ['milk','friedegg','bread','cake','icecream','sushi','tea','boba','honey','candy','cottoncandy','pie','cocoa','pancake','pudding','mochi','pumpkin','onigiri','cookie','chocolate','jam','cheese','sandwich','soup','dango'] },
    { id: 'home',    emoji: '🏠', name: 'Home',    ids: ['brick','house','castle','village','city','igloo','pyramid','robot','lightbulb','boat','campfire','hourglass','aquarium','snowglobe','airplane','paper','book','candle','pillow','blanket','sweater','present'] },
    { id: 'music',   emoji: '🎵', name: 'Music',   ids: ['music','flute','bell','drum','harp','lullaby','harmony'] },
    { id: 'sparkles',emoji: '💎', name: 'Sparkles',ids: ['crystal','ruby','sapphire','emerald','gold','ring'] },
    { id: 'magic',   emoji: '🪄', name: 'Magic',   ids: ['love','baby','ghost','ninja','wizard','princess','witch','knight','mermaid','fairy','snowman','magic','happiness','human','golem','fireworks','paintedegg','snowangel','dream','wish'] }
  ];
  const byId = {};
  FAMS.forEach(f => { f.set = new Set(f.ids); f.ids.forEach(id => { byId[id] = f.id; }); });
  const api = {
    list: FAMS.map(({ id, emoji, name }) => ({ id, emoji, name })),
    family: id => byId[id] || null,
    ids: id => { const f = FAMS.find(x => x.id === id); return f ? f.ids.slice() : []; },
    has: (fam, id) => { const f = FAMS.find(x => x.id === fam); return !!(f && f.set.has(id)); },
    name: id => { const f = FAMS.find(x => x.id === id); return f ? f.name : ''; },
    emoji: id => { const f = FAMS.find(x => x.id === id); return f ? f.emoji : ''; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EF_FAMILIES = api;
})(typeof window !== 'undefined' ? window : globalThis);
