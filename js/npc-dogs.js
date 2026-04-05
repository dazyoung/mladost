// NPC Dog personality engine
// Generates contextual, personality-driven responses without an external API
// Uses trait-based response templates with randomization for variety

const PERSONALITIES = {
  friendly: {
    name: 'Friendly',
    emoji: '🐕',
    description: 'Always happy to see you',
    greetings: [
      'Oh wow, a friend! *tail wagging intensifies*',
      'Hi hi hi! I was hoping you\'d come by!',
      'Best day ever! You came to say hello!',
      '*jumps around excitedly* Hey there!',
    ],
    farewell: [
      'Come back soon! I\'ll be right here!',
      '*whimpers softly* Okay, see you later friend!',
      'Bye bye! I\'ll save you a spot!',
    ],
    tone: 'enthusiastic',
    quirk: '*wags tail*',
  },
  shy: {
    name: 'Shy',
    emoji: '🐾',
    description: 'Quiet and thoughtful',
    greetings: [
      '*peeks out nervously* ...oh, hi.',
      'Oh... um... hello there.',
      '*shuffles paws* H-hey...',
      'You... you want to talk to me?',
    ],
    farewell: [
      '*quietly* ...bye. That was nice.',
      'Oh, you\'re going? That\'s... okay.',
      '*small wave with paw* See you...',
    ],
    tone: 'hesitant',
    quirk: '*looks at paws*',
  },
  adventurous: {
    name: 'Adventurous',
    emoji: '🗺️',
    description: 'Bold explorer, always on the move',
    greetings: [
      'Ahoy, fellow explorer! What discoveries await?',
      'I just got back from the far meadows! What\'s new?',
      '*covered in mud* Oh hey! You should see what I found!',
      'Adventure calls! Ready for an expedition?',
    ],
    farewell: [
      'The trail awaits! Onward!',
      'Time to explore the unknown! See ya!',
      'May your paws carry you far, friend!',
    ],
    tone: 'bold',
    quirk: '*sniffs the wind*',
  },
  wise: {
    name: 'Wise',
    emoji: '🦉',
    description: 'Old soul with deep knowledge',
    greetings: [
      'Ah, a visitor. The meadows bring us together once more.',
      'Welcome, young pup. What wisdom do you seek?',
      'The wind told me you were coming. Do sit.',
      'Every meeting has a purpose. What is ours today?',
    ],
    farewell: [
      'Walk gently upon the earth, friend.',
      'Until the paths cross again...',
      'Remember: every step is a lesson.',
    ],
    tone: 'contemplative',
    quirk: '*gazes into the distance*',
  },
  playful: {
    name: 'Playful',
    emoji: '🎾',
    description: 'Everything is a game!',
    greetings: [
      'PLAY?! Did someone say PLAY?!',
      '*drops stick at your feet* Wanna play?!',
      'Catch me if you can! Hehe!',
      '*spins in circles* HELLO HELLO HELLO!',
    ],
    farewell: [
      'Aww already? One more game? Please?',
      '*bounces away* Catch ya later!',
      'I\'ll hide a bone for next time! Hehe!',
    ],
    tone: 'hyperactive',
    quirk: '*zooms around*',
  },
  grumpy: {
    name: 'Grumpy',
    emoji: '😤',
    description: 'Bark is worse than bite... usually',
    greetings: [
      '*grumbles* Oh, it\'s you again.',
      'What do you want? I was napping.',
      '*yawns pointedly* This better be important.',
      'Can\'t a dog get some peace around here?',
    ],
    farewell: [
      'Finally, some quiet. *curls up*',
      'Yeah yeah, bye. Don\'t trip on your way out.',
      '*already asleep before you leave*',
    ],
    tone: 'sarcastic',
    quirk: '*huffs*',
  },
};

const SKILLS = {
  guide: {
    name: 'Guide',
    emoji: '🧭',
    description: 'Knows the land and gives directions',
    topics: ['directions', 'locations', 'map', 'areas', 'explore'],
    responses: [
      'The river splits the land in two. A bridge connects them near the main path.',
      'Head north through the trees for a nice clearing. South is more open meadow.',
      'The eastern meadows have the best flowers. And maybe some hidden bones...',
      'There\'s a pond to the northwest - peaceful spot for thinking.',
      'Follow the main path and you can\'t get lost. Mostly.',
      'The village is on the west side. Lots of interesting things to sniff there.',
    ],
  },
  storyteller: {
    name: 'Storyteller',
    emoji: '📖',
    description: 'Tells tales of the land',
    topics: ['story', 'tale', 'legend', 'history', 'tell me'],
    responses: [
      'Long ago, this meadow was home to the Great Pack. They say their bones still shimmer gold...',
      'They say a dog once crossed the river during a great storm. The bridge was built in their honor.',
      'The butterflies? Legend says each one carries a dream from a sleeping pup.',
      'This village was named "Mladost" - it means youth. A place where every dog feels like a puppy again.',
      'There\'s an old tale about a golden bone hidden where the flowers bloom thickest...',
      'The wise dogs of old would gather by the big oak. They say you can still hear their howls at dusk.',
    ],
  },
  forager: {
    name: 'Forager',
    emoji: '🍖',
    description: 'Expert at finding food and treasures',
    topics: ['food', 'bone', 'find', 'treat', 'berries', 'hungry', 'treasure'],
    responses: [
      'The berry bushes are the best snack spots. They grow back if you wait!',
      'I can smell bones from three meadows away. Check near the trees and clearings.',
      'Pro tip: the best bones are off the beaten path. Explore the edges of the map!',
      'Berries are good, but have you tried rolling in them first? ...no? Just me?',
      'There are bones hidden all over. I\'ve counted at least a dozen in these parts.',
      'The pond areas sometimes have interesting things washed up nearby.',
    ],
  },
  guard: {
    name: 'Guard',
    emoji: '🛡️',
    description: 'Protector of the village',
    topics: ['safe', 'danger', 'protect', 'watch', 'patrol', 'guard'],
    responses: [
      'All clear on this patrol. The meadows are safe today.',
      'I keep watch so everyone can play in peace. It\'s important work.',
      'The fences around the village aren\'t just decoration - they keep things orderly.',
      'Stay away from deep water. We dogs are good swimmers but the current is tricky.',
      'I make my rounds every day. North meadow, river bridge, south fields. Routine.',
      'Nothing gets past this nose. *sniff sniff* ...okay, maybe squirrels.',
    ],
  },
  comedian: {
    name: 'Comedian',
    emoji: '🤡',
    description: 'Always has a joke ready',
    topics: ['joke', 'funny', 'laugh', 'humor', 'cheer'],
    responses: [
      'Why did the dog sit in the shade? Because he didn\'t want to be a hot dog! Ba dum tss!',
      'What do you call a dog magician? A Labracadabrador! *howls with laughter*',
      'I tried to write a book once. But I kept burying the pages!',
      'What\'s a dog\'s favorite instrument? A trombone! Get it? Trom-BONE?',
      'Why do dogs run in circles? It\'s hard to run in squares! *snort*',
      'I told the cat a joke yesterday. She wasn\'t feline it.',
      'What did the dog say to the tree? Bark! ...I\'ll see myself out.',
    ],
  },
};

// General response templates for various intents
const GENERAL_RESPONSES = {
  about_self: [
    'I\'m {name}! I\'m a {personality} type and I love {skill_topic}.',
    'The name\'s {name}. I spend my days {skill_activity} around here.',
    'I\'m {name}, your local {skill} dog! {quirk}',
  ],
  about_player: [
    'You seem like a good sort. I can tell by the way you sniff things.',
    'Another explorer! We need more of those around here.',
    'You\'ve got that look... the "I\'m gonna find all the bones" look.',
  ],
  weather: [
    'Beautiful day for a walk, don\'t you think? {quirk}',
    'The wind smells like wildflowers today. Perfect weather.',
    'Not a cloud in the sky. Good exploring weather!',
  ],
  feelings: [
    'I\'m doing great! Life is good when you\'ve got meadows to roam.',
    'Feeling pretty good! Had a nice nap earlier.',
    'Can\'t complain! Well, I could, but what\'s the point? {quirk}',
  ],
  confused: [
    'Hmm, I\'m not sure what you mean. Want to try asking differently? {quirk}',
    '*tilts head* That\'s a curious thing to say.',
    'I may be a dog of many talents, but that one stumps me!',
    'Interesting thought! I\'ll have to chew on that one. Literally.',
  ],
  play: [
    'Play?! Yes! Let\'s run around! {quirk}',
    '*drops into play bow* Ready when you are!',
    'I love games! Though I\'m best at fetch and napping.',
  ],
  love: [
    '*licks your face* You\'re pretty great too!',
    'Aww! {quirk} That\'s the nicest thing anyone\'s said to me today!',
    'Right back at ya, friend! *happy bark*',
  ],
};

// Skill-related activity descriptions
const SKILL_ACTIVITIES = {
  guide: 'showing dogs around the meadows',
  storyteller: 'collecting stories from the old paths',
  forager: 'sniffing out tasty treats and treasures',
  guard: 'patrolling and keeping watch',
  comedian: 'making everyone laugh',
};

const SKILL_TOPICS = {
  guide: 'exploring new places',
  storyteller: 'hearing and telling tales',
  forager: 'finding hidden treasures',
  guard: 'keeping everyone safe',
  comedian: 'making pups smile',
};

// Quick message options for chat UI
export const QUICK_MESSAGES = [
  { text: 'Hey there!', intent: 'greeting' },
  { text: 'Tell me about yourself', intent: 'about_self' },
  { text: 'Any tips?', intent: 'skill' },
  { text: 'Tell me a story', intent: 'story' },
  { text: 'How are you?', intent: 'feelings' },
  { text: 'Bye!', intent: 'farewell' },
];

export class NPCDog {
  constructor(config) {
    this.id = config.id || Date.now().toString(36);
    this.name = config.name || 'Buddy';
    this.personality = config.personality || 'friendly';
    this.skill = config.skill || 'guide';
    this.breed = config.breed || 'golden';

    this.x = config.x || 0;
    this.y = config.y || 0;
    this.originX = this.x;
    this.originY = this.y;

    // Movement
    this.direction = 'down';
    this.isMoving = false;
    this.frame = 0;
    this.frameTimer = 0;
    this.moveAngle = Math.random() * Math.PI * 2;
    this.moveTimer = 0;
    this.wanderRadius = 64;
    this.idleTimer = 0;
    this.state = 'idle'; // idle, walking

    // Chat history
    this.chatHistory = [];
    this.interactionCount = 0;

    // Personality data
    this.personalityData = PERSONALITIES[this.personality] || PERSONALITIES.friendly;
    this.skillData = SKILLS[this.skill] || SKILLS.guide;
  }

  update(dt) {
    this.frameTimer += dt;

    if (this.state === 'idle') {
      this.isMoving = false;
      this.idleTimer += dt;

      // Idle animation
      if (this.frameTimer > 500) {
        this.frame = (this.frame + 1) % 2;
        this.frameTimer = 0;
      }

      // Start walking after idle period
      if (this.idleTimer > 2000 + Math.random() * 3000) {
        this.state = 'walking';
        this.moveAngle = Math.random() * Math.PI * 2;
        this.moveTimer = 1000 + Math.random() * 2000;
        this.idleTimer = 0;
      }
    } else if (this.state === 'walking') {
      this.isMoving = true;
      this.moveTimer -= dt;

      // Walk animation
      if (this.frameTimer > 180) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }

      // Move
      const speed = 0.04;
      this.x += Math.cos(this.moveAngle) * speed * dt;
      this.y += Math.sin(this.moveAngle) * speed * dt;

      // Update facing direction
      const cos = Math.cos(this.moveAngle);
      const sin = Math.sin(this.moveAngle);
      if (Math.abs(cos) > Math.abs(sin)) {
        this.direction = cos > 0 ? 'right' : 'left';
      } else {
        this.direction = sin > 0 ? 'down' : 'up';
      }

      // Stay near origin
      const dx = this.x - this.originX;
      const dy = this.y - this.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.wanderRadius) {
        this.moveAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
      }

      if (this.moveTimer <= 0) {
        this.state = 'idle';
        this.idleTimer = 0;
      }
    }
  }

  respond(message) {
    this.interactionCount++;
    const intent = this.detectIntent(message);
    let response = this.generateResponse(intent, message);

    this.chatHistory.push({ from: 'player', text: message });
    this.chatHistory.push({ from: 'npc', text: response });

    // Keep history manageable
    if (this.chatHistory.length > 20) {
      this.chatHistory = this.chatHistory.slice(-20);
    }

    return response;
  }

  detectIntent(msg) {
    const lower = msg.toLowerCase().trim();

    // Greetings
    if (/^(hi|hey|hello|howdy|yo|sup|woof|bark|hiya)/i.test(lower)) return 'greeting';

    // Farewells
    if (/\b(bye|goodbye|see ya|later|gotta go|leaving|farewell)\b/i.test(lower)) return 'farewell';

    // About self
    if (/\b(who are you|your name|about you|yourself|what are you|introduce)\b/i.test(lower)) return 'about_self';

    // About player
    if (/\b(about me|what do you think of me|how do i look)\b/i.test(lower)) return 'about_player';

    // Feelings
    if (/\b(how are you|how.?s it going|feeling|doing okay|you okay)\b/i.test(lower)) return 'feelings';

    // Weather
    if (/\b(weather|nice day|beautiful|outside|sunny|rain)\b/i.test(lower)) return 'weather';

    // Play
    if (/\b(play|fetch|game|fun|run|chase|catch)\b/i.test(lower)) return 'play';

    // Love/affection
    if (/\b(love|cute|good (dog|boy|girl)|pet you|adorable|sweet)\b/i.test(lower)) return 'love';

    // Skill-specific topics
    for (const topic of this.skillData.topics) {
      if (lower.includes(topic)) return 'skill';
    }

    // Story request
    if (/\b(story|tale|legend|tell me|once upon)\b/i.test(lower)) return 'story';

    // Tips/help
    if (/\b(tip|help|advice|suggest|hint|where|how do i)\b/i.test(lower)) return 'skill';

    return 'confused';
  }

  generateResponse(intent, message) {
    const pd = this.personalityData;
    const sd = this.skillData;

    let response;

    switch (intent) {
      case 'greeting':
        response = this.pickRandom(pd.greetings);
        if (this.interactionCount === 1) {
          response += ` I'm ${this.name}, by the way!`;
        }
        break;

      case 'farewell':
        response = this.pickRandom(pd.farewell);
        break;

      case 'about_self':
        response = this.pickRandom(GENERAL_RESPONSES.about_self);
        break;

      case 'about_player':
        response = this.pickRandom(GENERAL_RESPONSES.about_player);
        break;

      case 'feelings':
        response = this.applyPersonalityTone(this.pickRandom(GENERAL_RESPONSES.feelings));
        break;

      case 'weather':
        response = this.pickRandom(GENERAL_RESPONSES.weather);
        break;

      case 'play':
        response = this.applyPersonalityTone(this.pickRandom(GENERAL_RESPONSES.play));
        break;

      case 'love':
        response = this.applyPersonalityTone(this.pickRandom(GENERAL_RESPONSES.love));
        break;

      case 'skill':
        response = this.pickRandom(sd.responses);
        break;

      case 'story':
        if (this.skill === 'storyteller') {
          response = this.pickRandom(sd.responses);
        } else {
          response = `I'm not much of a storyteller, but... ${this.pickRandom(SKILLS.storyteller.responses)}`;
        }
        break;

      default:
        response = this.pickRandom(GENERAL_RESPONSES.confused);
        break;
    }

    // Apply template variables
    response = response
      .replace('{name}', this.name)
      .replace('{personality}', pd.name.toLowerCase())
      .replace('{skill}', sd.name.toLowerCase())
      .replace('{skill_topic}', SKILL_TOPICS[this.skill] || 'life')
      .replace('{skill_activity}', SKILL_ACTIVITIES[this.skill] || 'hanging out')
      .replace('{quirk}', pd.quirk);

    return response;
  }

  applyPersonalityTone(response) {
    const pd = this.personalityData;
    switch (pd.tone) {
      case 'hesitant':
        return response.replace(/^/, '...').replace(/!$/, '.');
      case 'sarcastic':
        return response.replace(/!$/, '. I guess.');
      case 'hyperactive':
        return response.toUpperCase().replace(/\.$/, '!!!');
      case 'bold':
        return response.replace(/\.$/, '!');
      default:
        return response;
    }
  }

  pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      personality: this.personality,
      skill: this.skill,
      breed: this.breed,
      x: this.originX,
      y: this.originY,
    };
  }
}

export { PERSONALITIES, SKILLS };
