// World map and tile system
// Defines the game world layout with different terrain types and objects

export const TILE_SIZE = 32; // Display size of each tile

// Tile types
export const TILES = {
  GRASS: 0,
  GRASS_DARK: 1,
  WATER: 2,
  PATH: 3,
  SAND: 4,
  BRIDGE: 5,
  GRASS_FLOWERS: 6,
};

// Object types for the world
export const OBJECTS = {
  TREE: 'tree',
  TREE_ALT: 'tree_alt',
  FLOWER: 'flower',
  ROCK: 'rock',
  ROCK_SMALL: 'rock_small',
  BUSH: 'bush',
  BUSH_BERRIES: 'bush_berries',
  SIGN: 'sign',
  BONE: 'bone',
  HOUSE: 'house',
  DOG_HOUSE: 'dog_house',
  FENCE_V: 'fence_v',
  FENCE_H: 'fence_h',
  BUTTERFLY: 'butterfly',
};

export class World {
  constructor() {
    this.width = 60;   // tiles
    this.height = 50;  // tiles
    this.tiles = [];
    this.objects = [];
    this.interactables = [];
    this.collectibles = [];
    this.npcs = [];
    this.generate();
  }

  generate() {
    // Initialize all grass
    this.tiles = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => TILES.GRASS)
    );

    // Create terrain features
    this.createPond(38, 12, 6, 5);
    this.createPond(10, 35, 5, 4);
    this.createRiver(25, 0, 25, this.height);
    this.createPath(0, 20, this.width, 20);
    this.createPath(15, 0, 15, this.height);
    this.createPath(40, 10, 40, 40);

    // Sandy area near water
    this.createSandArea(36, 8, 4);
    this.createSandArea(8, 32, 3);

    // Flower patches
    this.createFlowerPatch(8, 8, 6, 5);
    this.createFlowerPatch(42, 30, 5, 4);
    this.createFlowerPatch(18, 38, 4, 4);

    // Dark grass patches
    this.createDarkGrass(5, 15, 4, 3);
    this.createDarkGrass(45, 20, 5, 4);
    this.createDarkGrass(30, 40, 4, 3);

    // Add bridge over river - must cover full river width across the path rows
    // River wobbles, so we need to bridge all water tiles at y=19,20,21
    for (let by = 18; by <= 22; by++) {
      const wobble = Math.floor(Math.sin(by * 0.3) * 2);
      for (let dx = -2; dx <= 2; dx++) {
        const bx = 25 + wobble + dx;
        if (bx >= 0 && bx < this.width) {
          this.tiles[by][bx] = TILES.BRIDGE;
        }
      }
    }

    // Place objects
    this.placeObjects();
    this.placeInteractables();
    this.placeCollectibles();
    this.placeNPCs();
  }

  createPond(cx, cy, rx, ry) {
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          if (dx * dx + dy * dy <= 1) {
            this.tiles[y][x] = TILES.WATER;
          }
        }
      }
    }
  }

  createRiver(x1, y1, x2, y2) {
    for (let y = Math.min(y1, y2); y < Math.max(y1, y2); y++) {
      const wobble = Math.floor(Math.sin(y * 0.3) * 2);
      for (let dx = -1; dx <= 1; dx++) {
        const x = x1 + wobble + dx;
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          this.tiles[y][x] = TILES.WATER;
        }
      }
    }
  }

  createPath(x1, y1, x2, y2) {
    if (y1 === y2) {
      // Horizontal path
      for (let x = Math.min(x1, x2); x < Math.max(x1, x2); x++) {
        if (x >= 0 && x < this.width) {
          if (this.tiles[y1][x] !== TILES.WATER) this.tiles[y1][x] = TILES.PATH;
          if (y1 + 1 < this.height && this.tiles[y1 + 1][x] !== TILES.WATER) {
            this.tiles[y1 + 1][x] = TILES.PATH;
          }
        }
      }
    } else {
      // Vertical path
      for (let y = Math.min(y1, y2); y < Math.max(y1, y2); y++) {
        if (y >= 0 && y < this.height) {
          if (this.tiles[y][x1] !== TILES.WATER) this.tiles[y][x1] = TILES.PATH;
          if (x1 + 1 < this.width && this.tiles[y][x1 + 1] !== TILES.WATER) {
            this.tiles[y][x1 + 1] = TILES.PATH;
          }
        }
      }
    }
  }

  createSandArea(cx, cy, r) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const dist = Math.abs(x - cx) + Math.abs(y - cy);
          if (dist <= r + 1 && this.tiles[y][x] === TILES.GRASS) {
            this.tiles[y][x] = TILES.SAND;
          }
        }
      }
    }
  }

  createFlowerPatch(sx, sy, w, h) {
    for (let y = sy; y < sy + h && y < this.height; y++) {
      for (let x = sx; x < sx + w && x < this.width; x++) {
        if (this.tiles[y][x] === TILES.GRASS) {
          this.tiles[y][x] = TILES.GRASS_FLOWERS;
        }
      }
    }
  }

  createDarkGrass(sx, sy, w, h) {
    for (let y = sy; y < sy + h && y < this.height; y++) {
      for (let x = sx; x < sx + w && x < this.width; x++) {
        if (this.tiles[y][x] === TILES.GRASS) {
          this.tiles[y][x] = TILES.GRASS_DARK;
        }
      }
    }
  }

  placeObjects() {
    // Trees scattered around
    const treePositions = [
      [3, 3], [7, 2], [12, 5], [2, 10], [8, 14], [4, 22],
      [18, 3], [20, 8], [18, 14], [12, 28], [10, 42],
      [30, 5], [35, 3], [42, 5], [48, 8], [52, 4],
      [33, 15], [45, 12], [50, 18], [38, 25],
      [30, 30], [35, 35], [42, 38], [48, 32], [52, 28],
      [30, 42], [38, 45], [45, 42], [50, 38], [55, 14],
      [6, 46], [2, 38], [56, 42], [56, 30],
    ];

    for (const [x, y] of treePositions) {
      if (this.isValidObjectPlacement(x, y)) {
        const variant = (x + y) % 2;
        this.objects.push({
          type: variant === 0 ? OBJECTS.TREE : OBJECTS.TREE_ALT,
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          width: 64,
          height: 80,
          collision: { x: 12, y: 60, width: 40, height: 20 },
        });
      }
    }

    // Rocks
    const rockPositions = [
      [5, 18, 0], [22, 12, 0], [40, 28, 1], [48, 15, 0],
      [15, 33, 1], [35, 40, 0], [52, 10, 1], [8, 44, 0],
    ];
    for (const [x, y, v] of rockPositions) {
      if (this.isValidObjectPlacement(x, y)) {
        this.objects.push({
          type: v === 0 ? OBJECTS.ROCK : OBJECTS.ROCK_SMALL,
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          width: v === 0 ? 24 : 16,
          height: v === 0 ? 24 : 16,
          collision: { x: 2, y: 4, width: v === 0 ? 20 : 12, height: v === 0 ? 16 : 10 },
        });
      }
    }

    // House
    this.objects.push({
      type: OBJECTS.HOUSE,
      x: 5 * TILE_SIZE,
      y: 24 * TILE_SIZE,
      width: 96,
      height: 96,
      collision: { x: 8, y: 40, width: 80, height: 56 },
    });

    // Dog house
    this.objects.push({
      type: OBJECTS.DOG_HOUSE,
      x: 10 * TILE_SIZE,
      y: 26 * TILE_SIZE,
      width: 48,
      height: 48,
      collision: { x: 4, y: 20, width: 40, height: 28 },
    });

    // Fences around house area
    for (let i = 3; i <= 13; i++) {
      if (i !== 7 && i !== 8) { // gate
        this.objects.push({
          type: OBJECTS.FENCE_V,
          x: i * TILE_SIZE,
          y: 23 * TILE_SIZE,
          width: 32,
          height: 32,
          collision: { x: 4, y: 4, width: 24, height: 24 },
        });
      }
      this.objects.push({
        type: OBJECTS.FENCE_V,
        x: i * TILE_SIZE,
        y: 30 * TILE_SIZE,
        width: 32,
        height: 32,
        collision: { x: 4, y: 4, width: 24, height: 24 },
      });
    }
  }

  placeInteractables() {
    // Signs
    this.interactables.push({
      type: OBJECTS.SIGN,
      x: 16 * TILE_SIZE,
      y: 19 * TILE_SIZE,
      width: 32,
      height: 40,
      collision: { x: 4, y: 16, width: 24, height: 24 },
      interaction: {
        type: 'dialogue',
        speaker: 'Wooden Sign',
        messages: [
          'Welcome to Mladost Village!',
          'A peaceful place where dogs roam free.',
          'Explore the meadows, find bones, and enjoy the scenery!',
        ],
      },
    });

    this.interactables.push({
      type: OBJECTS.SIGN,
      x: 28 * TILE_SIZE,
      y: 19 * TILE_SIZE,
      width: 32,
      height: 40,
      collision: { x: 4, y: 16, width: 24, height: 24 },
      interaction: {
        type: 'dialogue',
        speaker: 'Direction Sign',
        messages: [
          '← Village  |  Meadows →',
          'North: Forest  |  South: Beach',
        ],
      },
    });

    this.interactables.push({
      type: OBJECTS.SIGN,
      x: 40 * TILE_SIZE,
      y: 19 * TILE_SIZE,
      width: 32,
      height: 40,
      collision: { x: 4, y: 16, width: 24, height: 24 },
      interaction: {
        type: 'dialogue',
        speaker: 'Old Sign',
        messages: [
          'The eastern meadows are full of wildflowers.',
          'Legend says a golden bone is hidden somewhere...',
        ],
      },
    });

    // Berry bushes
    const bushPositions = [
      [32, 8], [34, 10], [44, 25], [46, 26], [12, 40], [14, 41],
    ];
    for (const [x, y] of bushPositions) {
      this.interactables.push({
        type: OBJECTS.BUSH_BERRIES,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width: 40,
        height: 32,
        collision: { x: 4, y: 8, width: 32, height: 24 },
        interaction: {
          type: 'collect',
          item: 'berries',
          message: '*sniff sniff* Found some tasty berries! Woof!',
          respawnTime: 10000,
        },
        collected: false,
        respawnTimer: 0,
      });
    }

    // Regular bushes (decorative with fun text)
    const decorBushPositions = [[20, 5], [48, 20], [36, 43]];
    for (const [x, y] of decorBushPositions) {
      this.interactables.push({
        type: OBJECTS.BUSH,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width: 40,
        height: 32,
        collision: { x: 4, y: 8, width: 32, height: 24 },
        interaction: {
          type: 'dialogue',
          speaker: 'Bush',
          messages: ['*rustling noises* ...just the wind. Or is it?'],
        },
      });
    }

    // Dog house interaction
    this.interactables.push({
      type: OBJECTS.DOG_HOUSE,
      x: 10 * TILE_SIZE,
      y: 26 * TILE_SIZE,
      width: 48,
      height: 48,
      collision: { x: 4, y: 20, width: 40, height: 28 },
      interaction: {
        type: 'dialogue',
        speaker: 'Dog House',
        messages: [
          'Home sweet home!',
          'Your cozy dog house. Perfect for naps.',
          '*yawn* Maybe later... there\'s exploring to do!',
        ],
      },
      isOverlay: true, // Don't render as it's already an object
    });

    // House door
    this.interactables.push({
      type: OBJECTS.HOUSE,
      x: 7 * TILE_SIZE,
      y: 27 * TILE_SIZE,
      width: 32,
      height: 32,
      collision: { x: 0, y: 0, width: 32, height: 32 },
      interaction: {
        type: 'dialogue',
        speaker: 'House',
        messages: [
          'The door is locked. Your humans must be away.',
          'That\'s okay - the whole world is your playground!',
        ],
      },
      isOverlay: true,
    });
  }

  placeCollectibles() {
    const bonePositions = [
      [9, 9], [22, 6], [38, 18], [48, 35], [15, 44],
      [50, 6], [28, 38], [3, 30], [46, 14], [55, 25],
      [20, 30], [33, 22],
    ];
    for (const [x, y] of bonePositions) {
      // Skip bones that would land on water
      if (this.getTile(x, y) === TILES.WATER) continue;
      this.collectibles.push({
        type: OBJECTS.BONE,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width: 24,
        height: 16,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2,
      });
    }

    // Golden bone - hidden in the flower patch (where the sign hints)
    this.collectibles.push({
      type: 'golden_bone',
      x: 10 * TILE_SIZE,
      y: 10 * TILE_SIZE,
      width: 28,
      height: 20,
      collected: false,
      bobOffset: 0,
      isGolden: true,
    });
  }

  placeNPCs() {
    const butterflyPositions = [
      [10, 8, 0], [42, 31, 1], [20, 38, 2], [50, 10, 0],
      [30, 15, 1], [8, 42, 2], [45, 44, 0], [35, 6, 1],
    ];
    for (const [x, y, variant] of butterflyPositions) {
      this.npcs.push({
        type: OBJECTS.BUTTERFLY,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        originX: x * TILE_SIZE,
        originY: y * TILE_SIZE,
        variant,
        frame: Math.floor(Math.random() * 3),
        frameTimer: 0,
        moveAngle: Math.random() * Math.PI * 2,
        moveTimer: 0,
        wanderRadius: 48,
      });
    }

    // Flowers as decorative objects
    const flowerPositions = [
      [9, 8, 0], [10, 9, 1], [11, 8, 2], [8, 9, 3],
      [43, 30, 0], [44, 31, 4], [43, 32, 1], [42, 30, 2],
      [19, 38, 3], [20, 39, 0], [18, 39, 4], [21, 38, 1],
    ];
    for (const [x, y, variant] of flowerPositions) {
      this.objects.push({
        type: OBJECTS.FLOWER,
        x: x * TILE_SIZE + 8,
        y: y * TILE_SIZE + 8,
        width: 16,
        height: 20,
        variant,
        collision: null, // No collision for flowers
      });
    }
  }

  isValidObjectPlacement(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
    const tile = this.tiles[ty][tx];
    return tile !== TILES.WATER && tile !== TILES.PATH && tile !== TILES.BRIDGE;
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return TILES.WATER;
    return this.tiles[ty][tx];
  }

  isWalkable(px, py, pw, ph) {
    // Check tile walkability
    const left = Math.floor(px / TILE_SIZE);
    const right = Math.floor((px + pw) / TILE_SIZE);
    const top = Math.floor(py / TILE_SIZE);
    const bottom = Math.floor((py + ph) / TILE_SIZE);

    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const tile = this.getTile(tx, ty);
        if (tile === TILES.WATER) return false;
      }
    }

    // Check object collisions
    for (const obj of this.objects) {
      if (!obj.collision) continue;
      const ox = obj.x + obj.collision.x;
      const oy = obj.y + obj.collision.y;
      const ow = obj.collision.width;
      const oh = obj.collision.height;

      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        return false;
      }
    }

    // Check interactable collisions
    for (const obj of this.interactables) {
      if (obj.isOverlay) continue;
      const ox = obj.x + obj.collision.x;
      const oy = obj.y + obj.collision.y;
      const ow = obj.collision.width;
      const oh = obj.collision.height;

      if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
        return false;
      }
    }

    return true;
  }

  // Get nearby interactable object
  getNearbyInteractable(px, py, radius = 40) {
    let closest = null;
    let closestDist = radius;

    for (const obj of this.interactables) {
      const cx = obj.x + (obj.width / 2);
      const cy = obj.y + (obj.height / 2);
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = obj;
      }
    }

    return closest;
  }

  // Get nearby collectible
  getNearbyCollectible(px, py, radius = 32) {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist < radius) return item;
    }
    return null;
  }

  update(dt) {
    // Update NPCs
    for (const npc of this.npcs) {
      npc.frameTimer += dt;
      if (npc.frameTimer > 200) {
        npc.frame = (npc.frame + 1) % 3;
        npc.frameTimer = 0;
      }

      npc.moveTimer += dt;
      if (npc.moveTimer > 2000) {
        npc.moveAngle = Math.random() * Math.PI * 2;
        npc.moveTimer = 0;
      }

      // Gentle movement
      const speed = 0.015;
      npc.x += Math.cos(npc.moveAngle) * speed * dt;
      npc.y += Math.sin(npc.moveAngle) * speed * dt;

      // Stay near origin
      const dx = npc.x - npc.originX;
      const dy = npc.y - npc.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > npc.wanderRadius) {
        npc.moveAngle = Math.atan2(-dy, -dx);
      }
    }

    // Update respawn timers for collected interactables
    for (const obj of this.interactables) {
      if (obj.collected && obj.interaction.respawnTime) {
        obj.respawnTimer += dt;
        if (obj.respawnTimer >= obj.interaction.respawnTime) {
          obj.collected = false;
          obj.respawnTimer = 0;
        }
      }
    }
  }
}
