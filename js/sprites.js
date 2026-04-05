// Procedural pixel art sprite generator
// All sprites are drawn programmatically - no external assets needed

// Dog breed color palettes
export const DOG_BREEDS = {
  golden: {
    name: 'Golden',
    bodyColor: '#c4883a',
    darkFur: '#a06b28',
    belly: '#e8c88a',
    nose: '#3d2817',
  },
  husky: {
    name: 'Husky',
    bodyColor: '#b0b8c8',
    darkFur: '#6a7080',
    belly: '#e8e8f0',
    nose: '#2a2a35',
  },
  chocolate: {
    name: 'Chocolate',
    bodyColor: '#6b3a1f',
    darkFur: '#4a2510',
    belly: '#a06840',
    nose: '#2a1008',
  },
  dalmatian: {
    name: 'Dalmatian',
    bodyColor: '#f0f0f0',
    darkFur: '#2a2a2a',
    belly: '#e0e0e0',
    nose: '#1a1a1a',
  },
  shiba: {
    name: 'Shiba',
    bodyColor: '#e0a050',
    darkFur: '#c08030',
    belly: '#f8f0e0',
    nose: '#2a1a0a',
  },
  blacklab: {
    name: 'Black Lab',
    bodyColor: '#2a2a30',
    darkFur: '#1a1a20',
    belly: '#3a3a44',
    nose: '#0a0a0a',
  },
};

export class SpriteSheet {
  constructor(breedId = 'golden') {
    this.cache = {};
    this.setBreed(breedId);
  }

  setBreed(breedId) {
    this.breed = DOG_BREEDS[breedId] || DOG_BREEDS.golden;
    this.breedId = breedId;
    // Clear cached dog sprites when breed changes
    for (const key of Object.keys(this.cache)) {
      if (key.startsWith('dog_')) delete this.cache[key];
    }
  }

  // Render a preview of a specific breed (for selection screen)
  static renderBreedPreview(breedId, size = 64) {
    const breed = DOG_BREEDS[breedId];
    if (!breed) return null;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const scale = Math.floor(size / 16);
    const p = (x, y, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    };

    const { bodyColor, darkFur, belly, nose } = breed;
    const eye = '#1a1a1a';
    const tongue = '#e85555';

    // Body
    for (let x = 4; x <= 11; x++) for (let y = 4; y <= 11; y++) p(x, y, bodyColor);
    // Head
    for (let x = 3; x <= 12; x++) for (let y = 1; y <= 5; y++) p(x, y, bodyColor);
    // Ears
    p(3, 0, darkFur); p(3, 1, darkFur); p(12, 0, darkFur); p(12, 1, darkFur);
    p(2, 1, darkFur); p(13, 1, darkFur);
    // Eyes
    p(5, 3, eye); p(10, 3, eye);
    // Nose
    p(7, 4, nose); p(8, 4, nose);
    // Tongue
    p(7, 5, tongue); p(8, 5, tongue);
    // Belly
    for (let x = 6; x <= 9; x++) for (let y = 8; y <= 10; y++) p(x, y, belly);
    // Legs
    p(5, 12, bodyColor); p(6, 12, bodyColor); p(5, 13, bodyColor); p(6, 13, bodyColor);
    p(9, 12, bodyColor); p(10, 12, bodyColor); p(9, 13, bodyColor); p(10, 13, bodyColor);
    // Tail
    p(7, 11, darkFur); p(7, 12, darkFur);

    return canvas;
  }

  // Create an offscreen canvas with pixel art
  createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  setPixel(ctx, x, y, color, scale = 1) {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  // Dog sprite facing different directions with animation frames
  getDogSprite(direction, frame, isMoving) {
    const key = `dog_${direction}_${frame}_${isMoving}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(16 * scale, 16 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const bodyColor = this.breed.bodyColor;
    const darkFur = this.breed.darkFur;
    const belly = this.breed.belly;
    const nose = this.breed.nose;
    const eye = '#1a1a1a';
    const tongue = '#e85555';

    // Leg animation offset
    const legOffset = isMoving ? (frame % 2 === 0 ? 1 : 0) : 0;
    const tailWag = frame % 2 === 0 ? 0 : 1;

    if (direction === 'down' || direction === 'idle') {
      // Body
      for (let x = 4; x <= 11; x++) for (let y = 4; y <= 11; y++) p(x, y, bodyColor);
      // Head
      for (let x = 3; x <= 12; x++) for (let y = 1; y <= 5; y++) p(x, y, bodyColor);
      // Ears
      p(3, 0, darkFur); p(3, 1, darkFur); p(12, 0, darkFur); p(12, 1, darkFur);
      p(2, 1, darkFur); p(13, 1, darkFur);
      // Eyes
      p(5, 3, eye); p(10, 3, eye);
      // Nose
      p(7, 4, nose); p(8, 4, nose);
      // Tongue (when idle, wag)
      if (tailWag) { p(7, 5, tongue); p(8, 5, tongue); }
      // Belly
      for (let x = 6; x <= 9; x++) for (let y = 8; y <= 10; y++) p(x, y, belly);
      // Legs
      p(5, 12 + legOffset, bodyColor); p(6, 12 + legOffset, bodyColor);
      p(5, 13 + legOffset, bodyColor); p(6, 13 + legOffset, bodyColor);
      p(9, 12 - legOffset, bodyColor); p(10, 12 - legOffset, bodyColor);
      p(9, 13 - legOffset, bodyColor); p(10, 13 - legOffset, bodyColor);
      // Tail
      p(7 + tailWag, 11, darkFur); p(7 + tailWag, 12, darkFur);
    } else if (direction === 'up') {
      // Body from behind
      for (let x = 4; x <= 11; x++) for (let y = 4; y <= 11; y++) p(x, y, bodyColor);
      // Head
      for (let x = 3; x <= 12; x++) for (let y = 1; y <= 5; y++) p(x, y, darkFur);
      // Ears
      p(3, 0, darkFur); p(12, 0, darkFur); p(2, 1, darkFur); p(13, 1, darkFur);
      // Inner head
      for (let x = 4; x <= 11; x++) for (let y = 2; y <= 4; y++) p(x, y, bodyColor);
      // Legs
      p(5, 12 + legOffset, bodyColor); p(6, 12 + legOffset, bodyColor);
      p(5, 13 + legOffset, bodyColor); p(6, 13 + legOffset, bodyColor);
      p(9, 12 - legOffset, bodyColor); p(10, 12 - legOffset, bodyColor);
      p(9, 13 - legOffset, bodyColor); p(10, 13 - legOffset, bodyColor);
      // Tail up
      p(7 + tailWag, 3, darkFur); p(7 + tailWag, 2, darkFur); p(7 + tailWag, 1, darkFur);
    } else if (direction === 'left') {
      // Side view facing left
      for (let x = 3; x <= 12; x++) for (let y = 4; y <= 10; y++) p(x, y, bodyColor);
      // Head
      for (let x = 1; x <= 7; x++) for (let y = 1; y <= 6; y++) p(x, y, bodyColor);
      // Ear
      p(5, 0, darkFur); p(6, 0, darkFur); p(6, 1, darkFur);
      // Eye
      p(3, 3, eye);
      // Nose
      p(1, 4, nose); p(1, 5, nose);
      // Belly
      for (let x = 5; x <= 10; x++) p(x, 10, belly);
      // Legs
      p(4, 11 + legOffset, bodyColor); p(4, 12 + legOffset, bodyColor);
      p(5, 11 + legOffset, bodyColor); p(5, 12 + legOffset, bodyColor);
      p(10, 11 - legOffset, bodyColor); p(10, 12 - legOffset, bodyColor);
      p(11, 11 - legOffset, bodyColor); p(11, 12 - legOffset, bodyColor);
      // Tail
      p(12 + tailWag, 4, darkFur); p(13 + tailWag, 3, darkFur);
    } else if (direction === 'right') {
      // Side view facing right
      for (let x = 3; x <= 12; x++) for (let y = 4; y <= 10; y++) p(x, y, bodyColor);
      // Head
      for (let x = 8; x <= 14; x++) for (let y = 1; y <= 6; y++) p(x, y, bodyColor);
      // Ear
      p(9, 0, darkFur); p(10, 0, darkFur); p(9, 1, darkFur);
      // Eye
      p(12, 3, eye);
      // Nose
      p(14, 4, nose); p(14, 5, nose);
      // Belly
      for (let x = 5; x <= 10; x++) p(x, 10, belly);
      // Legs
      p(4, 11 - legOffset, bodyColor); p(4, 12 - legOffset, bodyColor);
      p(5, 11 - legOffset, bodyColor); p(5, 12 - legOffset, bodyColor);
      p(10, 11 + legOffset, bodyColor); p(10, 12 + legOffset, bodyColor);
      p(11, 11 + legOffset, bodyColor); p(11, 12 + legOffset, bodyColor);
      // Tail
      p(3 - tailWag, 4, darkFur); p(2 - tailWag, 3, darkFur);
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Tree sprite
  getTree(variant = 0) {
    const key = `tree_${variant}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(32 * scale, 40 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const trunkColor = '#6b4423';
    const trunkDark = '#4a2f15';
    const leafColors = variant === 0
      ? ['#2d7a2d', '#3a9a3a', '#4ab84a', '#2d6b2d']
      : ['#7a9a2d', '#8ab43a', '#6b8a25', '#5a7a1d'];

    // Trunk
    for (let y = 24; y <= 38; y++) {
      for (let x = 13; x <= 18; x++) {
        p(x, y, x <= 14 ? trunkDark : trunkColor);
      }
    }

    // Canopy - layered circles for organic look
    const drawLeafCluster = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist <= r) {
            const colorIdx = Math.floor((x * 7 + y * 13) % leafColors.length);
            p(x, y, leafColors[colorIdx]);
          }
        }
      }
    };

    drawLeafCluster(16, 14, 10);
    drawLeafCluster(10, 10, 7);
    drawLeafCluster(22, 10, 7);
    drawLeafCluster(16, 6, 8);
    drawLeafCluster(12, 16, 6);
    drawLeafCluster(20, 16, 6);

    this.cache[key] = canvas;
    return canvas;
  }

  // Flower sprite
  getFlower(variant = 0) {
    const key = `flower_${variant}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(8 * scale, 10 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const petalColors = [
      ['#ff6b8a', '#ff4570'], // pink
      ['#ffdd57', '#ffc733'], // yellow
      ['#7bc8ff', '#5baaee'], // blue
      ['#d68aff', '#c060ee'], // purple
      ['#ff9e5e', '#ff7830'], // orange
    ];

    const [petal, petalDark] = petalColors[variant % petalColors.length];

    // Stem
    p(3, 6, '#4a8a3a'); p(3, 7, '#4a8a3a'); p(3, 8, '#4a8a3a'); p(3, 9, '#3a7a2a');
    // Leaf
    p(4, 7, '#5a9a4a'); p(5, 7, '#5a9a4a');

    // Petals
    p(3, 2, petal); p(2, 3, petal); p(4, 3, petal); p(3, 4, petal);
    p(1, 3, petalDark); p(5, 3, petalDark); p(3, 1, petalDark);
    // Center
    p(3, 3, '#ffe066');

    this.cache[key] = canvas;
    return canvas;
  }

  // Rock sprite
  getRock(variant = 0) {
    const key = `rock_${variant}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const size = variant === 0 ? 12 : 8;
    const canvas = this.createCanvas(size * scale, size * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const colors = ['#8a8a8a', '#9a9a9a', '#7a7a7a', '#aaaaaa'];

    if (variant === 0) {
      // Large rock
      for (let y = 3; y <= 10; y++) {
        const w = y < 5 ? y - 1 : y > 8 ? 11 - y : 5;
        for (let x = 6 - w; x <= 6 + w; x++) {
          const ci = (x * 3 + y * 5) % colors.length;
          p(x, y, colors[ci]);
        }
      }
    } else {
      // Small rock
      for (let y = 2; y <= 6; y++) {
        const w = y < 4 ? y - 1 : 7 - y;
        for (let x = 4 - w; x <= 4 + w; x++) {
          const ci = (x * 3 + y * 5) % colors.length;
          p(x, y, colors[ci]);
        }
      }
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Bush sprite
  getBush(hasBerries = false) {
    const key = `bush_${hasBerries}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(20 * scale, 16 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const greens = ['#3a7a2a', '#4a8a3a', '#2d6b1d', '#5a9a4a'];

    // Bush body
    for (let y = 4; y <= 14; y++) {
      const w = y < 7 ? y : y > 12 ? 15 - y : 8;
      for (let x = 10 - w; x <= 10 + w; x++) {
        if (x >= 0 && x < 20) {
          const ci = (x * 7 + y * 3) % greens.length;
          p(x, y, greens[ci]);
        }
      }
    }

    // Berries
    if (hasBerries) {
      const berrySpots = [[6, 7], [12, 8], [9, 10], [14, 6], [5, 11], [11, 12]];
      for (const [bx, by] of berrySpots) {
        p(bx, by, '#e83050');
        p(bx + 1, by, '#ff4060');
      }
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Water tile (animated)
  getWaterTile(frame = 0) {
    const key = `water_${frame}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(16 * scale, 16 * scale);
    const ctx = canvas.getContext('2d');

    // Base water color
    ctx.fillStyle = '#4a90c4';
    ctx.fillRect(0, 0, 16 * scale, 16 * scale);

    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    // Wave highlights
    const offset = frame % 4;
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 3) {
        const wx = (x + offset + y) % 16;
        p(wx, y, '#5aa0d4');
        p((wx + 1) % 16, y, '#6ab0e4');
      }
    }

    // Sparkles
    if (frame % 3 === 0) {
      p(4, 3, '#aaddff');
      p(11, 9, '#aaddff');
    }
    if (frame % 3 === 1) {
      p(7, 6, '#aaddff');
      p(13, 2, '#aaddff');
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Fence post
  getFence(type = 'vertical') {
    const key = `fence_${type}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(16 * scale, 16 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const wood = '#8b6b3a';
    const woodDark = '#6b4f2a';

    if (type === 'vertical') {
      // Post
      for (let y = 0; y < 16; y++) {
        p(6, y, woodDark); p(7, y, wood); p(8, y, wood); p(9, y, woodDark);
      }
      // Cap
      for (let x = 5; x <= 10; x++) p(x, 0, wood);
    } else {
      // Horizontal rail
      for (let x = 0; x < 16; x++) {
        p(x, 5, woodDark); p(x, 6, wood); p(x, 7, wood);
        p(x, 10, woodDark); p(x, 11, wood); p(x, 12, wood);
      }
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Sign post (interactable)
  getSign() {
    const key = 'sign';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(16 * scale, 20 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const wood = '#8b6b3a';
    const board = '#c4a060';
    const boardDark = '#a0803a';

    // Post
    for (let y = 10; y < 20; y++) {
      p(7, y, wood); p(8, y, wood);
    }

    // Sign board
    for (let y = 1; y <= 10; y++) {
      for (let x = 2; x <= 13; x++) {
        p(x, y, y === 1 || y === 10 || x === 2 || x === 13 ? boardDark : board);
      }
    }

    // Text lines (decorative)
    for (let x = 4; x <= 11; x++) {
      p(x, 4, '#6b4f2a');
      if (x <= 9) p(x, 6, '#6b4f2a');
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Bone (collectible)
  getBone() {
    const key = 'bone';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(12 * scale, 8 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const bone = '#f0e8d8';
    const shadow = '#d8d0c0';

    // Shaft
    for (let x = 3; x <= 8; x++) {
      p(x, 3, bone); p(x, 4, shadow);
    }
    // Ends
    p(1, 2, bone); p(2, 2, bone); p(1, 3, bone); p(2, 3, bone);
    p(1, 4, shadow); p(2, 4, shadow); p(1, 5, shadow); p(2, 5, shadow);
    p(9, 2, bone); p(10, 2, bone); p(9, 3, bone); p(10, 3, bone);
    p(9, 4, shadow); p(10, 4, shadow); p(9, 5, shadow); p(10, 5, shadow);

    this.cache[key] = canvas;
    return canvas;
  }

  // Golden bone (special collectible)
  getGoldenBone() {
    const key = 'golden_bone';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(14 * scale, 10 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const gold = '#ffd700';
    const goldDark = '#daa520';
    const shine = '#fff8dc';

    // Shaft
    for (let x = 4; x <= 9; x++) {
      p(x, 4, gold); p(x, 5, goldDark);
    }
    // Ends
    p(2, 3, gold); p(3, 3, gold); p(2, 4, gold); p(3, 4, gold);
    p(2, 5, goldDark); p(3, 5, goldDark); p(2, 6, goldDark); p(3, 6, goldDark);
    p(10, 3, gold); p(11, 3, gold); p(10, 4, gold); p(11, 4, gold);
    p(10, 5, goldDark); p(11, 5, goldDark); p(10, 6, goldDark); p(11, 6, goldDark);
    // Shine highlights
    p(3, 3, shine); p(5, 4, shine); p(10, 3, shine);
    // Star sparkle
    p(7, 1, shine); p(6, 2, shine); p(8, 2, shine); p(7, 2, gold);

    this.cache[key] = canvas;
    return canvas;
  }

  // Bridge
  getBridge() {
    const key = 'bridge';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(48 * scale, 16 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const plank = '#a08050';
    const plankDark = '#806030';
    const rail = '#6b4f2a';

    // Planks
    for (let x = 0; x < 48; x++) {
      for (let y = 4; y <= 12; y++) {
        p(x, y, x % 6 === 0 ? plankDark : plank);
      }
    }
    // Rails
    for (let x = 0; x < 48; x++) {
      p(x, 3, rail); p(x, 13, rail);
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Butterfly (animated NPC)
  getButterfly(frame = 0, variant = 0) {
    const key = `butterfly_${frame}_${variant}`;
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(12 * scale, 10 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const wingColors = [
      ['#ff8ab4', '#ff6090'],
      ['#8ab4ff', '#6090ff'],
      ['#ffc84a', '#ffa020'],
    ];
    const [wing, wingDark] = wingColors[variant % wingColors.length];

    const wingSpread = frame % 3;

    // Body
    p(5, 4, '#333'); p(5, 5, '#333'); p(5, 6, '#333');

    if (wingSpread === 0) {
      // Wings spread
      p(3, 3, wing); p(4, 3, wing); p(3, 4, wingDark); p(4, 4, wing);
      p(6, 3, wing); p(7, 3, wing); p(6, 4, wing); p(7, 4, wingDark);
      p(3, 5, wingDark); p(4, 5, wing);
      p(6, 5, wing); p(7, 5, wingDark);
    } else if (wingSpread === 1) {
      // Wings mid
      p(4, 3, wing); p(4, 4, wing);
      p(6, 3, wing); p(6, 4, wing);
      p(4, 5, wingDark); p(6, 5, wingDark);
    } else {
      // Wings up
      p(4, 2, wing); p(4, 3, wingDark);
      p(6, 2, wing); p(6, 3, wingDark);
    }

    // Antennae
    p(4, 2, '#333'); p(6, 2, '#333');

    this.cache[key] = canvas;
    return canvas;
  }

  // House/cottage
  getHouse() {
    const key = 'house';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(48 * scale, 48 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const wall = '#e8d0a0';
    const wallDark = '#c8b080';
    const roof = '#a04040';
    const roofDark = '#803030';
    const wood = '#6b4423';
    const window = '#8ac8e8';
    const windowFrame = '#5a4020';

    // Roof
    for (let y = 4; y <= 20; y++) {
      const w = Math.floor((y - 4) * 1.5) + 2;
      for (let x = 24 - w; x <= 24 + w; x++) {
        if (x >= 0 && x < 48) {
          p(x, y, y % 3 === 0 ? roofDark : roof);
        }
      }
    }

    // Walls
    for (let y = 20; y <= 44; y++) {
      for (let x = 6; x <= 42; x++) {
        p(x, y, (x === 6 || x === 42 || y === 44) ? wallDark : wall);
      }
    }

    // Door
    for (let y = 32; y <= 44; y++) {
      for (let x = 20; x <= 28; x++) {
        p(x, y, wood);
      }
    }
    p(26, 38, '#e8c020'); // doorknob

    // Windows
    for (let wy of [26, 36]) {
      for (let wx of [11, 35]) {
        for (let y = wy; y <= wy + 5; y++) {
          for (let x = wx; x <= wx + 5; x++) {
            p(x, y, (x === wx || x === wx + 5 || y === wy || y === wy + 5) ? windowFrame : window);
          }
        }
        // Window cross
        p(wx + 2, wy + 1, windowFrame); p(wx + 2, wy + 2, windowFrame);
        p(wx + 2, wy + 3, windowFrame); p(wx + 2, wy + 4, windowFrame);
        p(wx + 1, wy + 3, windowFrame); p(wx + 3, wy + 3, windowFrame);
        p(wx + 4, wy + 3, windowFrame);
      }
    }

    // Chimney
    for (let y = 2; y <= 12; y++) {
      for (let x = 32; x <= 36; x++) {
        p(x, y, '#884433');
      }
    }

    this.cache[key] = canvas;
    return canvas;
  }

  // Dog house
  getDogHouse() {
    const key = 'doghouse';
    if (this.cache[key]) return this.cache[key];

    const scale = 2;
    const canvas = this.createCanvas(24 * scale, 24 * scale);
    const ctx = canvas.getContext('2d');
    const p = (x, y, c) => this.setPixel(ctx, x, y, c, scale);

    const wood = '#a07040';
    const woodDark = '#805530';
    const roofColor = '#c04040';

    // Roof
    for (let y = 2; y <= 10; y++) {
      const w = Math.floor((y - 2) * 1.2) + 2;
      for (let x = 12 - w; x <= 12 + w; x++) {
        if (x >= 0 && x < 24) p(x, y, roofColor);
      }
    }

    // Body
    for (let y = 10; y <= 22; y++) {
      for (let x = 3; x <= 21; x++) {
        p(x, y, x === 3 || x === 21 || y === 22 ? woodDark : wood);
      }
    }

    // Opening
    for (let y = 13; y <= 22; y++) {
      const w = y < 15 ? y - 13 : 3;
      for (let x = 12 - w; x <= 12 + w; x++) {
        p(x, y, '#2a1a0a');
      }
    }

    // Name plate
    for (let x = 6; x <= 18; x++) p(x, 8, '#e8c060');

    this.cache[key] = canvas;
    return canvas;
  }
}
