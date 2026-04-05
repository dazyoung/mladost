// Main game entry point - ties everything together

import { World, TILE_SIZE } from './world.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { SpriteSheet, DOG_BREEDS } from './sprites.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.selectedBreed = 'golden';

    // Set up dog selector on start screen
    this.setupDogSelector();

    this.world = new World();
    this.player = new Player(15 * TILE_SIZE, 22 * TILE_SIZE);
    this.camera = new Camera(800, 600);
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager();
    this.audio = new AudioManager();

    this.running = false;
    this.lastTime = 0;

    // Dialogue state
    this.dialogue = {
      active: false,
      messages: [],
      currentIndex: 0,
      speaker: '',
    };

    // Notification state
    this.notification = {
      active: false,
      text: '',
      timer: 0,
    };

    // UI elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');
    this.dialogueBox = document.getElementById('dialogue-box');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueText = document.getElementById('dialogue-text');

    // Handle resize - use visualViewport on mobile for accurate size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }

    // Start button
    document.getElementById('start-button').addEventListener('click', () => {
      this.start();
    });
  }

  setupDogSelector() {
    const container = document.getElementById('dog-selector');
    const breedNameEl = document.getElementById('breed-name');
    if (!container) return;

    const breedIds = Object.keys(DOG_BREEDS);

    breedIds.forEach((id) => {
      const option = document.createElement('div');
      option.className = 'dog-option' + (id === this.selectedBreed ? ' selected' : '');
      option.dataset.breed = id;

      const preview = SpriteSheet.renderBreedPreview(id, 44);
      if (preview) {
        preview.style.imageRendering = 'pixelated';
        option.appendChild(preview);
      }

      option.addEventListener('click', () => {
        container.querySelectorAll('.dog-option').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        this.selectedBreed = id;
        breedNameEl.textContent = DOG_BREEDS[id].name;
      });

      container.appendChild(option);
    });
  }

  resize() {
    const vv = window.visualViewport;
    const width = vv ? vv.width : window.innerWidth;
    const height = vv ? vv.height : window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.resize(width, height);
    this.camera.resize(width, height);
  }

  async start() {
    // Apply selected breed
    this.renderer.sprites.setBreed(this.selectedBreed);

    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    startScreen.style.transition = 'opacity 0.5s';
    startScreen.style.opacity = '0';
    setTimeout(() => startScreen.classList.add('hidden'), 500);

    // Initialize audio
    await this.audio.init();
    this.audio.toggle(); // Start music

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(timestamp - this.lastTime, 50); // Cap delta time
    this.lastTime = timestamp;

    this.update(dt);
    this.renderer.render(this.world, this.player, this.camera, dt);
    this.drawNotification();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Toggle music
    if (this.input.consumeJustPressed('music')) {
      this.audio.toggle();
    }

    // Handle dialogue
    if (this.dialogue.active) {
      if (this.input.consumeJustPressed('interact')) {
        this.advanceDialogue();
      }
      return; // Don't process movement during dialogue
    }

    // Update player
    const event = this.player.update(dt, this.input.keys, this.world);

    // Handle events from player
    if (event) {
      if (event.type === 'bone_collected') {
        this.audio.playSfx('collect');
        this.renderer.addParticle(
          this.player.getCenterX() - this.camera.x,
          this.player.getCenterY() - this.camera.y,
          'collect'
        );
        this.showNotification(`Bone found! (${event.total}/${this.world.collectibles.length})`);

        if (event.total === this.world.collectibles.length) {
          setTimeout(() => {
            this.showDialogue('Congratulations!', [
              'You found all the bones! What a good dog!',
              'The meadows of Mladost are proud of you.',
              'Keep exploring - there\'s always more to discover!',
            ]);
          }, 1000);
        }
      }
    }

    // Check for nearby interactables
    const nearby = this.world.getNearbyInteractable(
      this.player.getCenterX(),
      this.player.getCenterY(),
      48
    );

    if (nearby && !nearby.collected) {
      this.showPrompt(nearby.interaction.type === 'collect' ? 'Sniff' : 'Interact');

      if (this.input.consumeJustPressed('interact')) {
        this.handleInteraction(nearby);
      }
    } else {
      this.hidePrompt();
      // Consume interact press even if nothing nearby (bark!)
      if (this.input.consumeJustPressed('interact')) {
        this.audio.playSfx('bark');
      }
    }

    // Update world
    this.world.update(dt);

    // Update camera
    this.camera.follow(
      this.player.getCenterX(),
      this.player.getCenterY(),
      this.world.width,
      this.world.height
    );

    // Update notification
    if (this.notification.active) {
      this.notification.timer -= dt;
      if (this.notification.timer <= 0) {
        this.notification.active = false;
      }
    }
  }

  handleInteraction(obj) {
    this.audio.playSfx('interact');

    if (obj.interaction.type === 'dialogue') {
      this.showDialogue(obj.interaction.speaker, obj.interaction.messages);
    } else if (obj.interaction.type === 'collect') {
      if (!obj.collected) {
        obj.collected = true;
        obj.respawnTimer = 0;
        this.player.berries++;
        this.audio.playSfx('collect');
        this.renderer.addParticle(
          obj.x + obj.width / 2 - this.camera.x,
          obj.y + obj.height / 2 - this.camera.y,
          'collect'
        );
        this.showNotification(obj.interaction.message);
      }
    }
  }

  showDialogue(speaker, messages) {
    this.dialogue.active = true;
    this.dialogue.speaker = speaker;
    this.dialogue.messages = messages;
    this.dialogue.currentIndex = 0;

    this.dialogueBox.classList.remove('hidden');
    this.dialogueSpeaker.textContent = speaker;
    this.dialogueText.textContent = messages[0];
    this.hidePrompt();
  }

  advanceDialogue() {
    this.dialogue.currentIndex++;
    if (this.dialogue.currentIndex >= this.dialogue.messages.length) {
      this.closeDialogue();
    } else {
      this.dialogueText.textContent = this.dialogue.messages[this.dialogue.currentIndex];
      this.audio.playSfx('interact');
    }
  }

  closeDialogue() {
    this.dialogue.active = false;
    this.dialogueBox.classList.add('hidden');
  }

  showPrompt(text) {
    this.promptEl.classList.remove('hidden');
    this.promptTextEl.textContent = text;
  }

  hidePrompt() {
    this.promptEl.classList.add('hidden');
  }

  showNotification(text) {
    this.notification.active = true;
    this.notification.text = text;
    this.notification.timer = 3000;
  }

  drawNotification() {
    if (!this.notification.active) return;

    const ctx = this.renderer.ctx;
    const alpha = Math.min(1, this.notification.timer / 500);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.font = '14px "Courier New", monospace';
    ctx.textAlign = 'center';

    const textWidth = ctx.measureText(this.notification.text).width;
    const x = this.canvas.width / 2;
    const y = 60;

    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2 - 16, y - 14, textWidth + 32, 32, 8);
    ctx.fill();

    ctx.fillStyle = '#f0e6d0';
    ctx.fillText(this.notification.text, x, y + 5);
    ctx.globalAlpha = 1;
  }
}

// Initialize game
const game = new Game();
