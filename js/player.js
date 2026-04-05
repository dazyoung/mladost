// Dog player character with movement, animation, and state management

import { TILE_SIZE } from './world.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.speed = 120;

    // Collision box (smaller than sprite for better feel)
    this.collisionBox = { x: 4, y: 16, width: 24, height: 14 };

    // Animation
    this.direction = 'down';
    this.isMoving = false;
    this.frame = 0;
    this.frameTimer = 0;
    this.frameInterval = 180; // ms per frame

    // State
    this.bones = 0;
    this.berries = 0;
    this.totalBones = 0;

    // Interaction
    this.interacting = false;
  }

  update(dt, keys, world, touchTarget = null) {
    let dx = 0;
    let dy = 0;

    // Touch-to-move: move toward world-space target
    if (touchTarget) {
      const tdx = touchTarget.x - this.getCenterX();
      const tdy = touchTarget.y - this.getCenterY();
      const dist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (dist > 8) { // dead zone so dog doesn't jitter at target
        dx = tdx / dist;
        dy = tdy / dist;
      }
    }

    // Keyboard/joystick override
    if (keys.up || keys.down || keys.left || keys.right) {
      dx = 0;
      dy = 0;
      if (keys.up) dy -= 1;
      if (keys.down) dy += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    this.isMoving = dx !== 0 || dy !== 0;

    // Update direction
    if (this.isMoving) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 'right' : 'left';
      } else {
        this.direction = dy > 0 ? 'down' : 'up';
      }
    }

    // Try to move
    if (this.isMoving) {
      const moveX = dx * this.speed * (dt / 1000);
      const moveY = dy * this.speed * (dt / 1000);

      // Check X movement
      const newX = this.x + moveX;
      const colX = newX + this.collisionBox.x;
      const colY = this.y + this.collisionBox.y;
      if (world.isWalkable(colX, colY, this.collisionBox.width, this.collisionBox.height)) {
        this.x = newX;
      }

      // Check Y movement
      const newY = this.y + moveY;
      const colX2 = this.x + this.collisionBox.x;
      const colY2 = newY + this.collisionBox.y;
      if (world.isWalkable(colX2, colY2, this.collisionBox.width, this.collisionBox.height)) {
        this.y = newY;
      }

      // Keep in bounds
      this.x = Math.max(0, Math.min(this.x, world.width * TILE_SIZE - this.width));
      this.y = Math.max(0, Math.min(this.y, world.height * TILE_SIZE - this.height));
    }

    // Animation
    if (this.isMoving) {
      this.frameTimer += dt;
      if (this.frameTimer >= this.frameInterval) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }
    } else {
      this.frameTimer += dt;
      if (this.frameTimer >= 400) {
        this.frame = (this.frame + 1) % 2;
        this.frameTimer = 0;
      }
    }

    // Auto-collect bones
    const bone = world.getNearbyCollectible(
      this.x + this.width / 2,
      this.y + this.height / 2,
      24
    );
    if (bone && !bone.collected) {
      bone.collected = true;
      if (bone.isGolden) {
        return { type: 'golden_bone_collected' };
      }
      this.bones++;
      this.totalBones++;
      return { type: 'bone_collected', total: this.bones };
    }

    return null;
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }
}
