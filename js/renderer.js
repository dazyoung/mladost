// Canvas renderer - draws the world, objects, and UI

import { TILE_SIZE, TILES } from './world.js';
import { SpriteSheet } from './sprites.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = new SpriteSheet();
    this.waterFrame = 0;
    this.waterTimer = 0;
    this.particleEffects = [];

    // Tile colors
    this.tileColors = {
      [TILES.GRASS]: '#7aba6b',
      [TILES.GRASS_DARK]: '#5a9a4b',
      [TILES.WATER]: '#4a90c4',
      [TILES.PATH]: '#c8b088',
      [TILES.SAND]: '#e8d8a8',
      [TILES.BRIDGE]: '#a08050',
      [TILES.GRASS_FLOWERS]: '#7aba6b',
    };

    // Grass detail patterns (pre-computed per tile)
    this.grassDetails = new Map();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    // Disable smoothing for pixel art
    this.ctx.imageSmoothingEnabled = false;
  }

  render(world, player, camera, dt) {
    const ctx = this.ctx;
    const cam = camera;

    // Update water animation
    this.waterTimer += dt;
    if (this.waterTimer > 300) {
      this.waterFrame = (this.waterFrame + 1) % 4;
      this.waterTimer = 0;
    }

    // Clear
    ctx.fillStyle = '#4a90c4'; // Water color for edges
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate visible tile range
    const startTX = Math.max(0, Math.floor(cam.x / TILE_SIZE) - 1);
    const startTY = Math.max(0, Math.floor(cam.y / TILE_SIZE) - 1);
    const endTX = Math.min(world.width, Math.ceil((cam.x + cam.viewWidth) / TILE_SIZE) + 1);
    const endTY = Math.min(world.height, Math.ceil((cam.y + cam.viewHeight) / TILE_SIZE) + 1);

    // Draw tiles
    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = world.getTile(tx, ty);
        const sx = Math.floor(tx * TILE_SIZE - cam.x);
        const sy = Math.floor(ty * TILE_SIZE - cam.y);

        if (tile === TILES.WATER) {
          const waterSprite = this.sprites.getWaterTile(this.waterFrame);
          ctx.drawImage(waterSprite, sx, sy, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILES.BRIDGE) {
          ctx.fillStyle = this.tileColors[TILES.BRIDGE];
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          // Plank lines
          ctx.fillStyle = '#907040';
          for (let i = 0; i < TILE_SIZE; i += 8) {
            ctx.fillRect(sx + i, sy, 1, TILE_SIZE);
          }
        } else {
          ctx.fillStyle = this.tileColors[tile];
          ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

          // Add grass details
          if (tile === TILES.GRASS || tile === TILES.GRASS_DARK || tile === TILES.GRASS_FLOWERS) {
            this.drawGrassDetail(ctx, sx, sy, tx, ty, tile);
          }

          // Path edges
          if (tile === TILES.PATH) {
            ctx.fillStyle = '#b8a078';
            ctx.fillRect(sx, sy, TILE_SIZE, 1);
            ctx.fillRect(sx, sy, 1, TILE_SIZE);
          }
        }
      }
    }

    // Collect all drawable entities for y-sorting
    const drawables = [];

    // Objects
    for (const obj of world.objects) {
      const sx = obj.x - cam.x;
      const sy = obj.y - cam.y;
      if (sx + obj.width > -32 && sx < cam.viewWidth + 32 &&
          sy + obj.height > -32 && sy < cam.viewHeight + 32) {
        drawables.push({
          y: obj.y + (obj.height || 0),
          draw: () => this.drawObject(ctx, obj, cam),
        });
      }
    }

    // Interactables
    for (const obj of world.interactables) {
      if (obj.isOverlay) continue;
      if (obj.collected) continue;
      const sx = obj.x - cam.x;
      const sy = obj.y - cam.y;
      if (sx + obj.width > -32 && sx < cam.viewWidth + 32 &&
          sy + obj.height > -32 && sy < cam.viewHeight + 32) {
        drawables.push({
          y: obj.y + (obj.height || 0),
          draw: () => this.drawInteractable(ctx, obj, cam),
        });
      }
    }

    // Collectibles
    for (const item of world.collectibles) {
      if (item.collected) continue;
      const sx = item.x - cam.x;
      const sy = item.y - cam.y;
      if (sx > -32 && sx < cam.viewWidth + 32 && sy > -32 && sy < cam.viewHeight + 32) {
        drawables.push({
          y: item.y + item.height,
          draw: () => this.drawCollectible(ctx, item, cam),
        });
      }
    }

    // NPCs
    for (const npc of world.npcs) {
      const sx = npc.x - cam.x;
      const sy = npc.y - cam.y;
      if (sx > -32 && sx < cam.viewWidth + 32 && sy > -32 && sy < cam.viewHeight + 32) {
        drawables.push({
          y: npc.y + 20,
          draw: () => this.drawNPC(ctx, npc, cam),
        });
      }
    }

    // Player
    drawables.push({
      y: player.y + player.height,
      draw: () => this.drawPlayer(ctx, player, cam),
    });

    // Sort by y position and draw
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      d.draw();
    }

    // Draw particles
    this.updateAndDrawParticles(ctx, dt);

    // Draw HUD
    this.drawHUD(ctx, player, world);
  }

  drawGrassDetail(ctx, sx, sy, tx, ty, tile) {
    const key = `${tx},${ty}`;
    if (!this.grassDetails.has(key)) {
      // Generate random grass details for this tile
      const details = [];
      const seed = tx * 1000 + ty;
      const rng = this.seededRandom(seed);

      for (let i = 0; i < 3; i++) {
        details.push({
          x: rng() * (TILE_SIZE - 4) + 2,
          y: rng() * (TILE_SIZE - 4) + 2,
          type: rng() > 0.5 ? 'blade' : 'dot',
        });
      }

      if (tile === TILES.GRASS_FLOWERS) {
        details.push({
          x: rng() * (TILE_SIZE - 6) + 3,
          y: rng() * (TILE_SIZE - 6) + 3,
          type: 'flower',
          color: ['#ff6b8a', '#ffdd57', '#7bc8ff', '#d68aff'][Math.floor(rng() * 4)],
        });
      }

      this.grassDetails.set(key, details);
    }

    const details = this.grassDetails.get(key);
    for (const d of details) {
      if (d.type === 'blade') {
        ctx.fillStyle = tile === TILES.GRASS_DARK ? '#4a8a3b' : '#6aaa5b';
        ctx.fillRect(sx + d.x, sy + d.y, 1, 3);
      } else if (d.type === 'dot') {
        ctx.fillStyle = tile === TILES.GRASS_DARK ? '#4a8a3b' : '#6aaa5b';
        ctx.fillRect(sx + d.x, sy + d.y, 2, 2);
      } else if (d.type === 'flower') {
        ctx.fillStyle = d.color;
        ctx.fillRect(sx + d.x, sy + d.y, 3, 3);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(sx + d.x + 1, sy + d.y + 1, 1, 1);
      }
    }
  }

  seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  drawObject(ctx, obj, cam) {
    const sx = Math.floor(obj.x - cam.x);
    const sy = Math.floor(obj.y - cam.y);

    let sprite;
    switch (obj.type) {
      case 'tree':
        sprite = this.sprites.getTree(0);
        break;
      case 'tree_alt':
        sprite = this.sprites.getTree(1);
        break;
      case 'rock':
        sprite = this.sprites.getRock(0);
        break;
      case 'rock_small':
        sprite = this.sprites.getRock(1);
        break;
      case 'flower':
        sprite = this.sprites.getFlower(obj.variant || 0);
        break;
      case 'fence_v':
        sprite = this.sprites.getFence('vertical');
        break;
      case 'fence_h':
        sprite = this.sprites.getFence('horizontal');
        break;
      case 'house':
        sprite = this.sprites.getHouse();
        break;
      case 'dog_house':
        sprite = this.sprites.getDogHouse();
        break;
      default:
        return;
    }

    if (sprite) {
      ctx.drawImage(sprite, sx, sy, obj.width, obj.height);
    }
  }

  drawInteractable(ctx, obj, cam) {
    const sx = Math.floor(obj.x - cam.x);
    const sy = Math.floor(obj.y - cam.y);

    let sprite;
    switch (obj.type) {
      case 'sign':
        sprite = this.sprites.getSign();
        break;
      case 'bush_berries':
        sprite = this.sprites.getBush(true);
        break;
      case 'bush':
        sprite = this.sprites.getBush(false);
        break;
      default:
        return;
    }

    if (sprite) {
      ctx.drawImage(sprite, sx, sy, obj.width, obj.height);
    }
  }

  drawCollectible(ctx, item, cam) {
    const sx = Math.floor(item.x - cam.x);
    // Bob animation
    const bob = Math.sin(Date.now() * 0.003 + item.bobOffset) * 3;
    const sy = Math.floor(item.y - cam.y + bob);

    const sprite = this.sprites.getBone();
    ctx.drawImage(sprite, sx, sy, item.width, item.height);

    // Sparkle effect
    const sparkle = Math.sin(Date.now() * 0.005 + item.bobOffset) * 0.5 + 0.5;
    ctx.globalAlpha = sparkle * 0.6;
    ctx.fillStyle = '#ffe8a0';
    ctx.fillRect(sx + item.width / 2 - 1, sy - 4, 2, 2);
    ctx.globalAlpha = 1;
  }

  drawNPC(ctx, npc, cam) {
    const sx = Math.floor(npc.x - cam.x);
    const sy = Math.floor(npc.y - cam.y);

    if (npc.type === 'butterfly') {
      const sprite = this.sprites.getButterfly(npc.frame, npc.variant);
      ctx.drawImage(sprite, sx, sy, 24, 20);
    }
  }

  drawPlayer(ctx, player, cam) {
    const sx = Math.floor(player.x - cam.x);
    const sy = Math.floor(player.y - cam.y);

    const sprite = this.sprites.getDogSprite(
      player.direction,
      player.frame,
      player.isMoving
    );

    ctx.drawImage(sprite, sx, sy, player.width, player.height);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(sx + player.width / 2, sy + player.height - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHUD(ctx, player, world) {
    const padding = 12;
    const totalBones = world.collectibles.length;

    // Bone counter - top left
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(padding, padding, 120, 36, 8);
    ctx.fill();

    ctx.fillStyle = '#f0e8d8';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'left';

    // Bone icon
    const boneSprite = this.sprites.getBone();
    ctx.drawImage(boneSprite, padding + 8, padding + 10, 20, 14);
    ctx.fillText(`${player.bones} / ${totalBones}`, padding + 36, padding + 24);

    // Berry counter if any
    if (player.berries > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(padding, padding + 44, 100, 36, 8);
      ctx.fill();

      ctx.fillStyle = '#e83050';
      ctx.fillRect(padding + 10, padding + 56, 8, 8);
      ctx.fillStyle = '#f0e8d8';
      ctx.fillText(`${player.berries}`, padding + 28, padding + 66);
    }

    // Music indicator - top right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(this.canvas.width - padding - 40, padding, 40, 28, 6);
    ctx.fill();

    ctx.fillStyle = '#ddd';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M', this.canvas.width - padding - 20, padding + 19);
  }

  addParticle(x, y, type) {
    const count = type === 'collect' ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      this.particleEffects.push({
        x, y,
        vx: Math.cos(angle) * (40 + Math.random() * 30),
        vy: Math.sin(angle) * (40 + Math.random() * 30) - 20,
        life: 1,
        decay: 1.5 + Math.random(),
        color: type === 'collect' ? '#ffe066' : '#88ff88',
        size: 3 + Math.random() * 2,
      });
    }
  }

  updateAndDrawParticles(ctx, dt) {
    const dtSec = dt / 1000;
    this.particleEffects = this.particleEffects.filter(p => {
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += 60 * dtSec; // gravity
      p.life -= p.decay * dtSec;

      if (p.life <= 0) return false;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1;

      return true;
    });
  }
}
