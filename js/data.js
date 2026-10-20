/* Element Friends — elements + recipes. Pure data, no DOM. */
(function (root) {
  // id, name, shape, color, acc[], eyes, mouth, desc, extra
  const E = [];
  function el(id, name, shape, color, acc, eyes, mouth, desc, extra) {
    E.push(Object.assign({ id, name, shape, color, acc: acc || [], eyes: eyes || 'big', mouth: mouth || 'smile', desc }, extra || {}));
  }
  // ---- base four ----
  el('water', 'Water', 'drop', '#8fd3ff', ['bubbles'], 'big', 'smile', 'A splashy little droplet who loves puddle jumping.', { base: true });
  el('fire', 'Fire', 'flame', '#ff9f7a', ['innerFlame'], 'big', 'open', 'A tiny flame with a big warm heart. A little spicy!', { base: true });
  el('earth', 'Earth', 'blob', '#c9a27a', ['sprout', 'speckles:#a8805c'], 'happy', 'smile', 'A cozy clump of soil dreaming of flowers.', { base: true });
  el('air', 'Air', 'round', '#dcf3ff', ['windLines', 'curlTop'], 'happy', 'o', 'A breezy friend who giggles when it tickles your hair.', { base: true });
  // ---- tier 1 ----
  el('steam', 'Steam', 'cloud', '#f1ecff', ['steam'], 'sleepy', 'smile', 'A warm, sleepy puff that loves bath time.');
  el('mud', 'Mud', 'blob', '#9b7356', ['drips:#7d5a42', 'bubbles'], 'happy', 'tongue', 'Squishy, splashy and proud of it!');
  el('mist', 'Mist', 'ghost', '#e2e0f5', ['swirls'], 'sleepy', 'o', 'A shy little fog that hides in the morning.');
  el('lava', 'Lava', 'blob', '#ff7a59', ['lavaGlow', 'bubbles'], 'big', 'fang', 'Hot, gooey and very huggable (please don\'t).');
  el('energy', 'Energy', 'star', '#ffe066', ['sparkles'], 'star', 'open', 'Zoom zoom! It can never sit still.');
  el('smoke', 'Smoke', 'cloud', '#b9b6c9', ['smokePuffs'], 'sleepy', 'o', 'A drowsy grey puff that drifts wherever it wants.');
  el('dust', 'Dust', 'fluff', '#d8ccbc', ['sparkles'], 'dot', 'smile', 'A teeny fuzzball that lives under the sofa.');
  el('stone', 'Stone', 'rock', '#b7b9c6', ['cracks'], 'big', 'smile', 'Solid, steady and a great listener.');
  el('wind', 'Wind', 'round', '#c8f0e4', ['windLines', 'leafFly'], 'happy', 'blow', 'Whoosh! Blows kisses at kites.');
  el('puddle', 'Puddle', 'puddle', '#a6dcff', ['ripples'], 'big', 'open', 'Begs you to jump in with rain boots.');
  // ---- sky & weather ----
  el('cloud', 'Cloud', 'cloud', '#ffffff', [], 'happy', 'smile', 'A fluffy pillow floating across the sky.');
  el('rain', 'Rain', 'cloud', '#c3d6f2', ['drops'], 'big', 'o', 'Pitter-patter! Waters every flower it meets.');
  el('storm', 'Storm', 'cloud', '#8e93b5', ['brows', 'bolt'], 'big', 'pout', 'Grumbly on the outside, a softie inside.');
  el('lightning', 'Lightning', 'round', '#fff07a', ['boltTop', 'sparkles'], 'star', 'open', 'Zap! Faster than you can say "eek!"');
  el('sky', 'Sky', 'round', '#a9dcff', ['miniClouds', 'sparkles'], 'happy', 'smile', 'Big, blue and always smiling down at you.');
  el('sun', 'Sun', 'round', '#ffd166', ['sunrays:#ffb347', 'sunglasses'], 'big', 'smile', 'Too cool for school, too warm to frown.');
  el('moon', 'Moon', 'round', '#fff3c4', ['craters', 'nightcap'], 'sleepy', 'smile', 'Yawns all day, glows all night.');
  el('star', 'Star', 'star', '#ffd84d', [], 'happy', 'open', 'Twinkle twinkle — makes wishes come true!');
  el('rainbow', 'Rainbow', 'cloud', '#ffffff', ['rainbowArc'], 'happy', 'open', 'All seven colors of happy in one hug.');
  el('tornado', 'Tornado', 'tornado', '#c8cfe0', ['twirl'], 'spiral', 'open', 'Spins so much it\'s always a little dizzy.');
  el('snow', 'Snow', 'fluff', '#ffffff', ['snowflake'], 'big', 'cat', 'A soft snowball that melts when you smile at it.', { blush: '#9ecbff' });
  el('ice', 'Ice', 'box', '#c9f1ff', ['iceShine'], 'happy', 'smile', 'Cool as a cube, sweet as a slushie.', { blush: '#9ecbff' });
  el('aurora', 'Aurora', 'cloud', '#d7fff1', ['auroraBands', 'sparkles'], 'sleepy', 'smile', 'Dances in the night sky in silky ribbons.');
  el('wave', 'Wave', 'drop', '#6fc2f0', ['curl', 'foam'], 'wink', 'open', 'Surf\'s up! Waves hello, literally.');
  el('bubble', 'Bubble', 'round', '#e3f4ff', ['bigShine', 'bubbles'], 'big', 'o', 'Pop! Oh, it\'s fine, it makes more friends.', { glassy: true });
  // ---- water bodies & land ----
  el('lake', 'Lake', 'blob', '#7cc6f2', ['ripples', 'lilypad'], 'happy', 'smile', 'Calm and sparkly, a home for frogs.');
  el('ocean', 'Ocean', 'blob', '#4fa9e8', ['waves', 'starfishSide'], 'big', 'open', 'So big it holds a million secrets.');
  el('mountain', 'Mountain', 'tri', '#a9c4b0', ['snowcap'], 'happy', 'smile', 'Tall, chill and great at hide-and-seek.');
  el('volcano', 'Volcano', 'tri', '#b88a72', ['lavaTop', 'smokeTop'], 'big', 'open', 'Sometimes it just needs to let off steam!');
  el('sand', 'Sand', 'blob', '#f3d9a4', ['speckles:#d9b679', 'sparkles'], 'happy', 'smile', 'Billions of tiny friends holding hands.');
  el('glass', 'Glass', 'box', '#e4f8ff', ['glassShine'], 'big', 'smile', 'So clear you can see its good heart.', { glassy: true });
  el('island', 'Island', 'squat', '#f5d99b', ['palm', 'waveBottom'], 'happy', 'open', 'A tiny paradise with one very proud palm tree.');
  el('beach', 'Beach', 'squat', '#ffe0a8', ['umbrella', 'shellPat'], 'wink', 'smile', 'Sunscreen, seashells and sandcastles.');
  el('desert', 'Desert', 'squat', '#f7c98b', ['dunes', 'miniSun'], 'sleepy', 'smile', 'Warm and sleepy, naps in the sunshine.');
  el('crystal', 'Crystal', 'gem', '#d9c2ff', ['facets', 'sparkles'], 'star', 'smile', 'Sparkles brighter whenever you\'re near.');
  el('metal', 'Metal', 'rock', '#c6ccd8', ['metalShine', 'rivets'], 'big', 'smile', 'Shiny, strong and a little bit clanky.');
  el('clay', 'Clay', 'blob', '#e7a58c', ['thumbprint'], 'happy', 'open', 'Squish it into anything — it loves it!');
  el('hotspring', 'Hot Spring', 'bowl', '#d7a77a', ['onsenWater', 'towel', 'steamTop', 'woodPlanks'], 'happy', 'smile', 'Ahh~ the comfiest bath in the mountains.');
  // ---- plants ----
  el('plant', 'Plant', 'cup', '#f0a98a', ['sproutBig', 'potRim'], 'happy', 'smile', 'A brand-new sprout saying "hi!" to the world.');
  el('grass', 'Grass', 'squat', '#9fe08e', ['grassBlades'], 'happy', 'smile', 'Soft and tickly under bare feet.');
  el('tree', 'Tree', 'cloud', '#8fd88a', ['trunk', 'appleDots'], 'happy', 'smile', 'Gives the best shade and the comfiest hugs.');
  el('forest', 'Forest', 'cloud', '#5fbf7b', ['trunk', 'miniTrees'], 'sleepy', 'smile', 'Full of whispers, birdsong and secrets.');
  el('flower', 'Flower', 'round', '#ffe27a', ['petals:#ff9ec7'], 'happy', 'smile', 'Blooms bigger every time you smile.', { scale: 0.86 });
  el('garden', 'Garden', 'squat', '#a7795a', ['gardenFlowers', 'speckles:#8a6146'], 'happy', 'open', 'A happy patch where flowers have sleepovers.');
  el('mushroom', 'Mushroom', 'mushroom', '#ff7d8a', ['capSpots'], 'happy', 'smile', 'Wears a polka-dot hat everywhere it goes.');
  el('cactus', 'Cactus', 'bean', '#8ed6a0', ['cactusArms', 'needles', 'flowerTop:#ff9ec7'], 'happy', 'smile', 'Prickly hugs, but a very soft heart.');
  el('bamboo', 'Bamboo', 'bean', '#a8e07a', ['segments', 'bambooLeaf'], 'big', 'smile', 'Grows so fast it surprises itself.');
  el('wheat', 'Wheat', 'egg', '#f4d27a', ['grains'], 'happy', 'smile', 'Golden, swaying and ready for baking.');
  el('rice', 'Rice', 'bowl', '#9fcbff', ['riceMound', 'bowlPattern'], 'happy', 'open', 'A warm bowl of fluffy rice. Itadakimasu!');
  el('apple', 'Apple', 'round', '#ff8a8a', ['stemLeaf'], 'big', 'smile', 'Crunchy, sweet and keeps the doctor away.');
  el('sakura', 'Sakura', 'round', '#ffd9e6', ['petals:#ffb3cf', 'fallingPetals'], 'happy', 'smile', 'Cherry blossom! Blooms for one magical week.', { scale: 0.86 });
  el('clover', 'Lucky Clover', 'round', '#8fe0a0', ['clover', 'sparkles'], 'wink', 'smile', 'Four leaves of pure good luck.', { scale: 0.86 });
  // ---- life & creatures ----
  el('life', 'Life', 'egg', '#b8f2d0', ['heartTop', 'sparkles'], 'star', 'open', 'The spark that makes everything wiggle!');
  el('egg', 'Egg', 'egg', '#fff4dc', ['speckles:#f0d6a8'], 'sleepy', 'smile', 'Shh… something cute is napping inside.');
  el('animal', 'Animal', 'round', '#f4c98f', ['earsHamster', 'cheeks'], 'big', 'cat', 'A curious critter with a twitchy nose.');
  el('human', 'Human', 'round', '#ffd9c2', ['hair:#8a5a44'], 'big', 'smile', 'Loves snacks, naps and making friends.');
  el('golem', 'Golem', 'rock', '#9fb39a', ['moss', 'cracks'], 'big', 'smile', 'A gentle giant made of pebbles and moss.');
  el('bird', 'Bird', 'round', '#9fd8ff', ['crest:#6bb8f0', 'wingsSmall:#7cc4f5'], 'big', 'beak', 'Tweet tweet! Sings a song every sunrise.');
  el('fish', 'Fish', 'blob', '#ffae5e', ['tailFish', 'fin', 'scales'], 'big', 'o', 'Blub blub! A wiggly swimmer with shiny scales.');
  el('turtle', 'Turtle', 'igloo', '#8fd49a', ['shellHex', 'turtleFeet'], 'happy', 'smile', 'Slow and steady, carries its house everywhere.', { fy: 74 });
  el('frog', 'Frog', 'blob', '#8fdc7a', ['frogBumps'], 'big', 'wide', 'Ribbit! Champion of the lily-pad hop.', { fy: 40 });
  el('lizard', 'Lizard', 'blob', '#c4e86b', ['spots:#9fcc4a', 'tailLizard'], 'big', 'tongue', 'Loves sunbathing on warm rocks.');
  el('dragon', 'Dragon', 'blob', '#8fe0b8', ['horns', 'wingsDragon:#c9a6ff', 'spikesTop', 'belly:#fff2c4'], 'big', 'fang', 'A pocket-sized dragon. Rawr means "I love you"!', { final: true });
  el('cow', 'Cow', 'round', '#ffffff', ['spots:#5a4a5e', 'earsCow', 'muzzle:#ffc2d1'], 'big', 'smile', 'Moo! Gives the best milk and cuddles.');
  el('milk', 'Milk', 'box', '#ffffff', ['roof:#8ec5ff', 'milkLabel'], 'happy', 'smile', 'Makes cookies 100% better.');
  el('cat', 'Cat', 'round', '#ffc98b', ['earsCat', 'tabby:#f0a35e', 'whiskers', 'tailCat'], 'big', 'cat', 'Nyaa~ Purrs, naps, and knocks things off tables.');
  el('dog', 'Dog', 'blob', '#f7e2c4', ['earsDog:#b9835a', 'eyePatch:#e8c79c', 'collar'], 'big', 'tongue', 'Woof! Your loyal best friend forever.');
  el('wolf', 'Wolf', 'round', '#b4c0d8', ['earsFox:#b4c0d8', 'muzzle:#eef1f8', 'moonTiny'], 'big', 'fang', 'Howls at the moon, then asks for belly rubs.');
  el('fox', 'Fox', 'round', '#ffa860', ['earsFox:#ffa860', 'cheekFur', 'tailFox'], 'wink', 'cat', 'Clever, fluffy and a little bit sneaky.');
  el('bunny', 'Bunny', 'round', '#fff0f5', ['earsBunny', 'whiskers'], 'big', 'cat', 'Hop hop! Will trade hugs for carrots.');
  el('bear', 'Bear', 'round', '#c89268', ['earsBear', 'muzzle:#f1d2b3'], 'big', 'smile', 'Big, brown and loves honey naps.');
  el('polarbear', 'Polar Bear', 'round', '#f6fbff', ['earsBear', 'muzzle:#ffffff', 'scarf:#7cb8ff'], 'big', 'smile', 'Snuggly snow-bear in a cozy scarf.');
  el('panda', 'Panda', 'round', '#ffffff', ['earsBearDark', 'pandaPatches', 'bambooLeafSide'], 'big', 'smile', 'Munches bamboo and does little rolls.', { ring: true });
  el('teddy', 'Teddy Bear', 'blob', '#e8b98c', ['earsBear', 'muzzle:#fbe3c8', 'bow:#ff8fb8', 'stitch'], 'happy', 'smile', 'Guards your dreams every single night.');
  el('monkey', 'Monkey', 'round', '#b98563', ['earsMonkey', 'faceMask:#f6d7b8', 'tuft'], 'big', 'open', 'Swings from trees and giggles nonstop.');
  el('horse', 'Horse', 'blob', '#d9a878', ['earsSmall', 'mane:#8a5a44', 'muzzle:#f2d0b0'], 'big', 'smile', 'Neigh! Gallops like the wind.');
  el('pegasus', 'Pegasus', 'blob', '#f3efff', ['wings:#ffffff', 'earsSmall', 'mane:#9fc8ff', 'sparkles'], 'big', 'smile', 'A horse with wings and sky-high dreams.');
  el('unicorn', 'Unicorn', 'blob', '#ffffff', ['maneRainbow', 'earsSmall', 'horn', 'sparkles'], 'wink', 'smile', 'Pure rainbow magic. The rarest friend of all!', { final: true });
  el('chick', 'Chick', 'round', '#ffe36e', ['crest:#ffd23f', 'eggShell', 'wingsSmall:#ffd23f'], 'big', 'beak', 'Peep peep! Just hatched and already adorable.');
  el('duck', 'Duck', 'round', '#ffffff', ['sailorHat', 'wingsSmall:#f0f0f0'], 'big', 'bill', 'Quack! Splish-splashes in every puddle.');
  el('owl', 'Owl', 'round', '#b48a6a', ['tufts', 'belly:#f3dcc0', 'wingsSmall:#9c7356'], 'big', 'beak', 'Hoo-hoo! Stays up late reading books.', { ring: true });
  el('penguin', 'Penguin', 'round', '#6f86b8', ['belly:#ffffff', 'wingsSmall:#5a6f9c', 'scarf:#ff8fa8'], 'big', 'beak', 'Waddles proudly in its tuxedo.');
  el('phoenix', 'Phoenix', 'flame', '#ff8a5c', ['crestFlame', 'wingsFlame', 'innerFlame'], 'star', 'beak', 'Reborn in sparkles — burns bright with love!', { final: true });
  el('bee', 'Bee', 'round', '#ffd84d', ['stripesBee', 'antennae', 'wingsBee'], 'big', 'smile', 'Bzz bzz! Busy, buzzy and very sweet.');
  el('firefly', 'Firefly', 'bean', '#fff07a', ['wingsBug:#e3f4ff', 'antennae', 'glow'], 'happy', 'smile', 'Lights a tiny lantern so nobody gets lost at night.');
  el('butterfly', 'Butterfly', 'round', '#e8d4ff', ['wingsBug:#ffb3de', 'antennae'], 'happy', 'smile', 'Flutters by to say hello to every flower.', { scale: 0.9 });
  el('whale', 'Whale', 'blob', '#7aa8e8', ['spout', 'bellyLines', 'tailFish:#7aa8e8'], 'happy', 'smile', 'The biggest, gentlest singer in the sea.');
  el('crab', 'Crab', 'round', '#ff8f80', ['claws', 'eyeStalks'], 'big', 'open', 'Walks sideways and waves both claws hello.', { scale: 0.9 });
  el('jellyfish', 'Jellyfish', 'dome', '#ffc4ec', ['tentacles:#ff9edb', 'spotsJelly'], 'happy', 'o', 'Floats along like a wobbly little lantern.', { glassy: true });
  el('starfish', 'Starfish', 'star', '#ffab91', ['spots:#ffd7c9'], 'happy', 'smile', 'A beach-loving star who waves with five arms.');
  el('dustbunny', 'Dust Bunny', 'fluff', '#cfc6d6', ['earsBunny', 'sparkles'], 'dot', 'cat', 'Hides under the bed. Hop-hop… achoo!');
  el('hamster', 'Hamster', 'round', '#ffc9a0', ['earsHamster', 'cheeks', 'whiskers', 'tuft'], 'big', 'cat', 'Stuffs its cheeks with seeds and runs on tiny wheels.');
  el('hedgehog', 'Hedgehog', 'round', '#f3d2b0', ['quills:#b98a63', 'cheeks'], 'big', 'cat', 'A prickly little pincushion who curls up for cuddles.', { scale: 0.88 });
  el('koala', 'Koala', 'round', '#c9ccd9', ['earsKoala:#f3f4fa', 'koalaNose', 'cheeks'], 'sleepy', 'smile', 'Hugs its favorite tree and naps twenty hours a day.', { scale: 0.88 });
  el('dolphin', 'Dolphin', 'blob', '#8fc4f2', ['fin', 'tailFish:#8fc4f2', 'belly:#eaf6ff'], 'wink', 'open', 'Squeaks hello and does flips through the waves.');
  el('octopus', 'Octopus', 'dome', '#d6a8ff', ['octoArms:#c08cf2', 'spotsJelly', 'cheeks'], 'happy', 'o', 'Eight wiggly arms means eight hugs at once!');
  el('snail', 'Snail', 'round', '#d6eba0', ['snailShell:#ffb3a7', 'eyeStalks'], 'happy', 'smile', 'Slow and steady, it carries a swirly cozy home.', { scale: 0.84 });
  el('otter', 'Otter', 'round', '#c39a78', ['earsBear', 'muzzle:#f6e6d4', 'whiskers', 'starfishClip'], 'happy', 'smile', 'Floats on its back and holds paws so it never drifts away.', { scale: 0.88 });
  el('bat', 'Bat', 'round', '#a294d0', ['earsCat:#a294d0', 'wingsDragon:#8a7bc0', 'cheeks'], 'big', 'fang', 'Hangs upside down to see the world from a sillier side.', { scale: 0.86 });
  el('blackcat', 'Black Cat', 'round', '#6e6688', ['earsCat:#6e6688', 'muzzle:#b9b2d2', 'whiskers', 'tailCat', 'collar'], 'big', 'cat', 'A midnight kitty with a golden bell. Crossing its path brings good luck!', { ring: true });
  el('tanuki', 'Tanuki', 'round', '#b8916c', ['earsBear', 'tanukiMask', 'muzzle:#f6e6d4', 'tailTanuki', 'leafTop'], 'happy', 'smile', 'A tubby raccoon dog who pops a leaf on its head to turn into a teapot. Pon-poko!');
  el('sheep', 'Sheep', 'cloud', '#fffaf3', ['earsSheep', 'curlTop', 'cheeks'], 'sleepy', 'cat', 'A walking cloud of wool. Counting it makes you sleepy.');
  // ---- people & magic ----
  el('love', 'Love', 'heart', '#ff9ec2', ['heartsFloat'], 'happy', 'open', 'The warm fuzzy feeling in your chest.');
  el('baby', 'Baby', 'round', '#ffe2cf', ['babyCurl', 'bonnet'], 'big', 'paci', 'Goo goo! Tiny hands, giant giggles.', { scale: 0.88 });
  el('ghost', 'Ghost', 'ghost', '#ffffff', ['ghostArms'], 'big', 'o', 'Boo! …sorry, did I scare you? Want a hug?');
  el('ninja', 'Ninja', 'round', '#55597e', ['faceWindow:#ffe0cc', 'headband:#ff6f8a'], 'big', 'smile', 'Silent, sneaky and really good at hugs.');
  el('wizard', 'Wizard', 'round', '#ffe0cc', ['wizardHat', 'beard'], 'happy', 'smile', 'Knows 1,000 spells, mostly for snacks.');
  el('princess', 'Princess', 'round', '#ffe0cc', ['hairLong:#ffd36e', 'tiara'], 'wink', 'smile', 'Rules her castle with kindness and cake.');
  el('witch', 'Witch', 'round', '#ffe0cc', ['hairLong:#9b7ad8', 'witchHat'], 'wink', 'smile', 'Rides a broom made of moonbeams and only brews sweet potions.');
  el('knight', 'Knight', 'round', '#cfd6e6', ['faceWindow:#ffe0cc', 'helmetSlit', 'plume'], 'big', 'smile', 'Brave and shiny, protects the cuddly kingdom.');
  el('mermaid', 'Mermaid', 'round', '#ffe0cc', ['hairLong:#ff8f8f', 'tailMermaid', 'starfishClip'], 'happy', 'smile', 'Sings with dolphins under the waves.');
  el('fairy', 'Fairy', 'round', '#ffe0cc', ['wingsFairy', 'hair:#ffa8d9', 'flowerCrown', 'sparkles'], 'wink', 'smile', 'Sprinkles pixie dust on sleepy flowers.', { scale: 0.88 });
  el('snowman', 'Snowman', 'snowman', '#ffffff', ['topHat', 'scarf2', 'buttons'], 'dot', 'carrot', 'Stays cool, but has the warmest smile.', { blush: '#ffb3c7' });
  el('astronaut', 'Astronaut', 'round', '#ffffff', ['visor', 'antennaHelmet'], 'big', 'open', 'Floats among the stars, waves at aliens.');
  el('magic', 'Magic', 'star', '#e3c4ff', ['starsAround', 'sparkles'], 'star', 'open', 'Bibbidi-bobbidi-boo! Anything can happen.');
  el('happiness', 'Happiness', 'heart', '#ffb3d1', ['rainbowArc', 'halo', 'heartsFloat', 'sparkles'], 'happy', 'open', 'The best element of all — share it with everyone!', { final: true });
  // ---- buildings & things ----
  el('brick', 'Brick', 'box', '#e8977a', ['bricks'], 'big', 'smile', 'A sturdy block that loves being stacked.');
  el('house', 'House', 'box', '#fff1d6', ['roof:#ff8f8f', 'chimney', 'windowSide'], 'happy', 'smile', 'Home sweet home, with cocoa inside.');
  el('castle', 'Castle', 'box', '#e6dcff', ['battlements', 'flag'], 'big', 'smile', 'Where royal tea parties happen every day.');
  el('village', 'Village', 'box', '#ffe7c4', ['roof:#8fd0a0', 'miniHouses'], 'happy', 'open', 'A cozy town where everybody knows your name.');
  el('city', 'City', 'box', '#b9c8f0', ['skyline', 'windows'], 'big', 'smile', 'Bright lights, busy streets, big dreams.');
  el('igloo', 'Igloo', 'igloo', '#f2fbff', ['iglooBricks', 'iglooDoor'], 'happy', 'smile', 'Cold outside, toasty and snuggly inside.', { blush: '#9ecbff' });
  el('pyramid', 'Pyramid', 'tri', '#f3cf8a', ['pyramidLines'], 'sleepy', 'smile', 'An ancient napper with pointy dreams.');
  el('robot', 'Robot', 'box', '#c9d6e8', ['antenna', 'rivetsSide', 'heartPanel'], 'star', 'smile', 'Beep boop! Programmed for friendship.');
  el('lightbulb', 'Lightbulb', 'scoop', '#fff3a1', ['bulbBase', 'glow'], 'star', 'open', 'Ding! Just had a bright idea.');
  el('boat', 'Boat', 'bowl', '#d99a6c', ['sail', 'waveBottom'], 'happy', 'open', 'Ahoy! Sails to sunny islands.');
  el('campfire', 'Campfire', 'flame', '#ffb36b', ['logs', 'innerFlame', 'marshmallow'], 'happy', 'open', 'Crackles stories and toasts marshmallows.', { scale: 0.92 });
  el('hourglass', 'Hourglass', 'box', '#eef9ff', ['hourFrame', 'sandBottom'], 'sleepy', 'o', 'Counts every second… then flips and naps.', { glassy: true });
  el('aquarium', 'Aquarium', 'box', '#dff4ff', ['aquaWater', 'tinyFish', 'bubbles'], 'big', 'smile', 'A whole little ocean on your desk.', { glassy: true });
  el('snowglobe', 'Snow Globe', 'scoop', '#e8f6ff', ['globeBase', 'snowDots'], 'happy', 'o', 'Shake it! A tiny blizzard of happiness.', { glassy: true });
  el('airplane', 'Airplane', 'blob', '#e8f2ff', ['planeWings', 'propeller'], 'big', 'open', 'Vroom! Zooms over clouds to see the world.');
  el('rocket', 'Rocket', 'egg', '#ffffff', ['noseCone', 'fins', 'thrust'], 'star', 'open', '3… 2… 1… blast off to the stars!');
  el('ufo', 'UFO', 'scoop', '#d4f5c8', ['saucer'], 'big', 'o', 'We come in peace… and for snacks.');
  // ---- food ----
  el('friedegg', 'Fried Egg', 'splat', '#ffffff', ['yolk'], 'happy', 'smile', 'Sunny-side up and always cheerful.');
  el('bread', 'Bread', 'squat', '#f2c27f', ['crust', 'breadLines'], 'happy', 'smile', 'Fresh from the oven and smells like a hug.');
  el('cake', 'Cake', 'squat', '#ffd1e3', ['frosting:#ffffff', 'sprinkles', 'cherry'], 'happy', 'open', 'Happy birthday every single day!');
  el('icecream', 'Ice Cream', 'scoop', '#c9f2e2', ['cone', 'sprinkles', 'cherry'], 'happy', 'tongue', 'Melts in your mouth — and your heart.');
  el('sushi', 'Sushi', 'squat', '#ffffff', ['salmon', 'nori'], 'happy', 'smile', 'Rolled with love by a tiny chef.');
  el('tea', 'Tea', 'cup', '#b8e6b0', ['cupHandle', 'steamTop', 'teaTag'], 'sleepy', 'smile', 'A cozy cup for rainy afternoons.');
  el('boba', 'Boba Tea', 'cup', '#e8c9b0', ['straw', 'pearls', 'lid'], 'happy', 'open', 'Chewy pearls of pure joy. Slurp!');
  el('honey', 'Honey', 'box', '#ffc94d', ['jarLid', 'honeyDrip', 'beeTiny'], 'happy', 'smile', 'Sticky-sweet gold made by busy bees.');
  el('candy', 'Candy', 'round', '#ff9ecb', ['wrapper', 'swirl'], 'happy', 'open', 'A swirly sweet treat for good friends.', { scale: 0.86 });
  el('cottoncandy', 'Cotton Candy', 'cloud', '#ffc7e8', ['stick', 'sparkles'], 'happy', 'tongue', 'A sugary cloud that melts on your tongue.');
  el('pie', 'Apple Pie', 'squat', '#f0b874', ['lattice', 'steamTop'], 'happy', 'smile', 'Warm, flaky and fresh from Grandma\'s oven.');
  el('cocoa', 'Hot Cocoa', 'cup', '#b9825f', ['cupHandle', 'steamTop', 'heartTop'], 'happy', 'smile', 'A warm mug of chocolate that gives tummy hugs.');
  el('pancake', 'Pancakes', 'squat', '#f5c784', ['frosting:#ffcf5c', 'breadLines', 'cherry'], 'happy', 'open', 'A fluffy stack dripping with sweet honey.');
  el('pudding', 'Pudding', 'dome', '#ffe08a', ['frosting:#c98a4b', 'cherry'], 'happy', 'cat', 'A wobbly caramel pudding that jiggles when it giggles.');
  el('mochi', 'Mochi', 'blob', '#fff0f5', ['flowerTop:#ffb3cf', 'sparkles'], 'happy', 'cat', 'A sakura mochi: soft, squishy and stretchy. Mochi mochi!', { blush: '#ffb3c7' });
  el('pumpkin', 'Pumpkin', 'blob', '#ffad5c', ['pumpkinRibs', 'pumpkinStem', 'cheeks'], 'happy', 'open', 'A round, cheery harvest pumpkin who loves moonlit patches.');
  el('onigiri', 'Onigiri', 'tri', '#ffffff', ['noriWrap', 'sesame'], 'happy', 'smile', 'A rice ball snuggled in a crunchy seaweed blanket. Itadakimasu!');
  // ---- space ----
  el('planet', 'Planet', 'round', '#c7a8ff', ['ring:#ffd98a'], 'big', 'smile', 'Wears its ring like a hula hoop.', { scale: 0.84 });
  el('galaxy', 'Galaxy', 'round', '#7a6bd6', ['galaxySwirl', 'starDots', 'sparkles'], 'star', 'open', 'Billions of stars giggling together.');
  el('comet', 'Comet', 'round', '#bfe7ff', ['cometTail'], 'big', 'open', 'Whooosh! Grants wishes as it flies by.', { scale: 0.82 });
  el('alien', 'Alien', 'egg', '#a8f0a0', ['antennae'], 'big', 'o', 'Came from far away just to be your friend.', { eyesScale: 1.25 });
  el('eclipse', 'Eclipse', 'round', '#6a6290', ['corona'], 'sleepy', 'smile', 'When the Sun and Moon share a secret hug.', { scale: 0.84 });
  el('universe', 'Universe', 'round', '#4b4a8f', ['galaxySwirl', 'starDots', 'ring:#ffb3e6', 'crown', 'sparkles'], 'star', 'open', 'Everything, everywhere, all cuddled together!', { final: true, scale: 0.86 });

  // ---- recipes: [a, b, result] (order-independent) ----
  const R = [
    ['water', 'fire', 'steam'], ['water', 'earth', 'mud'], ['water', 'air', 'mist'], ['fire', 'earth', 'lava'],
    ['fire', 'fire', 'energy'], ['fire', 'air', 'smoke'], ['earth', 'air', 'dust'], ['earth', 'earth', 'stone'],
    ['air', 'air', 'wind'], ['water', 'water', 'puddle'],
    ['steam', 'air', 'cloud'], ['mist', 'mist', 'cloud'], ['cloud', 'water', 'rain'], ['cloud', 'wind', 'storm'],
    ['cloud', 'energy', 'lightning'], ['storm', 'energy', 'lightning'],
    ['puddle', 'water', 'lake'], ['puddle', 'puddle', 'lake'], ['lake', 'water', 'ocean'], ['lake', 'lake', 'ocean'],
    ['lava', 'water', 'stone'], ['lava', 'earth', 'volcano'], ['stone', 'stone', 'mountain'], ['mountain', 'lava', 'volcano'], ['mountain', 'fire', 'volcano'],
    ['stone', 'air', 'sand'], ['stone', 'wind', 'sand'], ['sand', 'fire', 'glass'],
    ['earth', 'rain', 'plant'], ['plant', 'plant', 'tree'], ['plant', 'earth', 'grass'], ['tree', 'tree', 'forest'],
    ['cloud', 'air', 'sky'], ['sky', 'fire', 'sun'], ['sky', 'stone', 'moon'], ['sky', 'energy', 'star'],
    ['plant', 'sun', 'flower'], ['rain', 'sun', 'rainbow'],
    ['mud', 'energy', 'life'], ['ocean', 'lightning', 'life'], ['life', 'stone', 'egg'],
    ['egg', 'air', 'bird'], ['egg', 'water', 'fish'], ['life', 'ocean', 'fish'], ['egg', 'sand', 'turtle'],
    ['life', 'puddle', 'frog'], ['egg', 'desert', 'lizard'], ['lizard', 'fire', 'dragon'],
    ['mud', 'sand', 'clay'], ['clay', 'life', 'human'], ['mountain', 'life', 'golem'], ['life', 'earth', 'animal'],
    ['animal', 'grass', 'cow'], ['cow', 'human', 'milk'], ['animal', 'milk', 'cat'], ['animal', 'human', 'dog'],
    ['animal', 'moon', 'wolf'], ['wolf', 'human', 'dog'], ['flower', 'flower', 'garden'], ['animal', 'garden', 'bunny'],
    ['animal', 'forest', 'bear'], ['flower', 'life', 'bee'], ['flower', 'wind', 'butterfly'], ['bee', 'flower', 'honey'],
    ['puddle', 'wind', 'ice'], ['cloud', 'ice', 'snow'], ['snow', 'human', 'snowman'], ['bird', 'ice', 'penguin'],
    ['bear', 'snow', 'polarbear'], ['ice', 'house', 'igloo'], ['clay', 'fire', 'brick'], ['brick', 'brick', 'house'],
    ['house', 'stone', 'castle'], ['house', 'house', 'village'], ['village', 'village', 'city'],
    ['stone', 'fire', 'metal'], ['metal', 'life', 'robot'], ['egg', 'fire', 'friedegg'], ['egg', 'sun', 'chick'],
    ['grass', 'rain', 'wheat'], ['wheat', 'fire', 'bread'], ['bread', 'egg', 'cake'], ['milk', 'ice', 'icecream'],
    ['snow', 'milk', 'icecream'], ['grass', 'puddle', 'rice'], ['rice', 'fish', 'sushi'], ['plant', 'steam', 'tea'],
    ['tea', 'milk', 'boba'], ['honey', 'fire', 'candy'], ['cloud', 'candy', 'cottoncandy'], ['plant', 'mud', 'mushroom'],
    ['forest', 'rain', 'mushroom'], ['stone', 'energy', 'crystal'], ['ocean', 'volcano', 'island'], ['sand', 'ocean', 'beach'],
    ['sand', 'sand', 'desert'], ['plant', 'desert', 'cactus'], ['desert', 'stone', 'pyramid'],
    ['ocean', 'wind', 'wave'], ['puddle', 'air', 'bubble'], ['lightning', 'glass', 'lightbulb'], ['tree', 'ocean', 'boat'],
    ['tree', 'fire', 'campfire'], ['sand', 'glass', 'hourglass'], ['glass', 'fish', 'aquarium'], ['glass', 'snow', 'snowglobe'],
    ['storm', 'wind', 'tornado'], ['human', 'mist', 'ghost'], ['human', 'smoke', 'ninja'], ['star', 'rainbow', 'magic'],
    ['human', 'magic', 'wizard'], ['human', 'human', 'love'], ['human', 'love', 'baby'], ['human', 'castle', 'princess'],
    ['human', 'metal', 'knight'], ['fish', 'human', 'mermaid'], ['butterfly', 'human', 'fairy'], ['animal', 'wind', 'horse'],
    ['horse', 'bird', 'pegasus'], ['horse', 'rainbow', 'unicorn'], ['pegasus', 'magic', 'unicorn'], ['bird', 'fire', 'phoenix'],
    ['dust', 'bunny', 'dustbunny'], ['bird', 'puddle', 'duck'], ['bird', 'tree', 'owl'], ['grass', 'tree', 'bamboo'],
    ['bear', 'bamboo', 'panda'], ['dog', 'forest', 'fox'], ['animal', 'tree', 'monkey'], ['fish', 'ocean', 'whale'],
    ['fish', 'sand', 'crab'], ['fish', 'cloud', 'jellyfish'], ['tree', 'sun', 'apple'], ['apple', 'bread', 'pie'],
    ['tree', 'flower', 'sakura'], ['grass', 'rainbow', 'clover'], ['earth', 'sky', 'planet'], ['star', 'star', 'galaxy'],
    ['galaxy', 'galaxy', 'universe'], ['star', 'fire', 'comet'], ['metal', 'bird', 'airplane'], ['metal', 'star', 'rocket'],
    ['life', 'planet', 'alien'], ['alien', 'metal', 'ufo'], ['human', 'rocket', 'astronaut'], ['sun', 'moon', 'eclipse'],
    ['rainbow', 'ice', 'aurora'], ['bear', 'love', 'teddy'], ['love', 'rainbow', 'happiness'], ['puddle', 'lava', 'hotspring'],
    ['steam', 'stone', 'hotspring'], ['mist', 'sky', 'cloud'], ['water', 'sand', 'beach'], ['love', 'cat', 'happiness'],
    ['milk', 'campfire', 'cocoa'], ['bread', 'honey', 'pancake'], ['star', 'ocean', 'starfish'], ['animal', 'wheat', 'hamster'],
    ['milk', 'egg', 'pudding'], ['animal', 'cactus', 'hedgehog'], ['life', 'rain', 'snail'], ['bee', 'lightbulb', 'firefly'],
    ['bear', 'tree', 'koala'], ['fish', 'wave', 'dolphin'], ['jellyfish', 'ocean', 'octopus'], ['rice', 'love', 'mochi'],
    ['animal', 'ocean', 'otter'], ['bird', 'moon', 'bat'], ['animal', 'cloud', 'sheep'], ['rice', 'ocean', 'onigiri'],
    ['garden', 'moon', 'pumpkin'], ['pumpkin', 'magic', 'witch'], ['cat', 'moon', 'blackcat'], ['animal', 'village', 'tanuki']
  ];

  const byId = {};
  E.forEach((e, i) => { e.order = i; byId[e.id] = e; });
  const key = (a, b) => (a < b ? a + '+' + b : b + '+' + a);
  const recipeMap = {};
  R.forEach(([a, b, r]) => { recipeMap[key(a, b)] = r; });
  const api = { elements: E, recipes: R, byId, key, recipeMap, combine: (a, b) => recipeMap[key(a, b)] || null };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EF_DATA = api;
})(typeof window !== 'undefined' ? window : globalThis);
