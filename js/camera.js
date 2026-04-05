// Smooth-following camera system

import { TILE_SIZE } from './world.js';

export class Camera {
  constructor(viewWidth, viewHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.smoothing = 0.08;
  }

  follow(targetX, targetY, worldWidth, worldHeight) {
    const desiredX = targetX - this.viewWidth / 2;
    const desiredY = targetY - this.viewHeight / 2;

    // Smooth interpolation
    this.x += (desiredX - this.x) * this.smoothing;
    this.y += (desiredY - this.y) * this.smoothing;

    // Clamp to world bounds
    const maxX = worldWidth * TILE_SIZE - this.viewWidth;
    const maxY = worldHeight * TILE_SIZE - this.viewHeight;
    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));
  }

  resize(viewWidth, viewHeight) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }
}
