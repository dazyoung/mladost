// Main game entry point - ties everything together

import { World, TILE_SIZE } from './world.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { AudioManager } from './audio.js';
import { SpriteSheet, DOG_BREEDS } from './sprites.js';
import { NPCDog, PERSONALITIES, SKILLS, QUICK_MESSAGES } from './npc-dogs.js';

const MAX_NPC_DOGS = 5;

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

    // NPC Dogs
    this.npcDogs = [];
    this.npcSprites = {}; // breed -> SpriteSheet

    // UI state
    this.uiState = 'game'; // game, dialogue, createDog, chat
    this.chatTarget = null;

    // Dialogue state
    this.dialogue = {
      active: false,
      messages: [],
      currentIndex: 0,
      speaker: '',
    };

    // Notification state
    this.notification = { active: false, text: '', timer: 0 };

    // UI elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');
    this.dialogueBox = document.getElementById('dialogue-box');
    this.dialogueSpeaker = document.getElementById('dialogue-speaker');
    this.dialogueText = document.getElementById('dialogue-text');

    // Setup modals
    this.setupCreateDogPopup();
    this.setupChatUI();

    // Handle resize
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

  // ====== Start Screen Dog Selector ======
  setupDogSelector() {
    const container = document.getElementById('dog-selector');
    const breedNameEl = document.getElementById('breed-name');
    if (!container) return;

    Object.keys(DOG_BREEDS).forEach((id) => {
      const option = document.createElement('div');
      option.className = 'dog-option' + (id === this.selectedBreed ? ' selected' : '');

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

  // ====== Create NPC Dog Popup ======
  setupCreateDogPopup() {
    const overlay = document.getElementById('create-dog-overlay');
    const closeBtn = document.getElementById('create-dog-close');
    const confirmBtn = document.getElementById('create-dog-confirm');

    // Close handlers
    closeBtn.addEventListener('click', () => this.closeCreateDog());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeCreateDog();
    });

    // Populate breed options
    const breedGrid = document.getElementById('npc-breed-selector');
    this.createDogState = { breed: 'golden', personality: 'friendly', skill: 'guide' };

    Object.entries(DOG_BREEDS).forEach(([id, breed]) => {
      const card = document.createElement('div');
      card.className = 'option-card' + (id === 'golden' ? ' selected' : '');
      const preview = SpriteSheet.renderBreedPreview(id, 32);
      if (preview) card.appendChild(preview);
      const name = document.createElement('div');
      name.className = 'option-name';
      name.textContent = breed.name;
      card.appendChild(name);

      card.addEventListener('click', () => {
        breedGrid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.createDogState.breed = id;
      });
      breedGrid.appendChild(card);
    });

    // Populate personality options
    const persGrid = document.getElementById('npc-personality-selector');
    Object.entries(PERSONALITIES).forEach(([id, p]) => {
      const card = document.createElement('div');
      card.className = 'option-card' + (id === 'friendly' ? ' selected' : '');
      card.innerHTML = `<span class="option-emoji">${p.emoji}</span><div class="option-name">${p.name}</div><div class="option-desc">${p.description}</div>`;
      card.addEventListener('click', () => {
        persGrid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.createDogState.personality = id;
      });
      persGrid.appendChild(card);
    });

    // Populate skill options
    const skillGrid = document.getElementById('npc-skill-selector');
    Object.entries(SKILLS).forEach(([id, s]) => {
      const card = document.createElement('div');
      card.className = 'option-card' + (id === 'guide' ? ' selected' : '');
      card.innerHTML = `<span class="option-emoji">${s.emoji}</span><div class="option-name">${s.name}</div><div class="option-desc">${s.description}</div>`;
      card.addEventListener('click', () => {
        skillGrid.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.createDogState.skill = id;
      });
      skillGrid.appendChild(card);
    });

    // Confirm
    confirmBtn.addEventListener('click', () => this.confirmCreateDog());
  }

  openCreateDog() {
    if (this.npcDogs.length >= MAX_NPC_DOGS) {
      this.showNotification(`Max ${MAX_NPC_DOGS} NPC doggos allowed!`);
      return;
    }
    this.uiState = 'createDog';
    document.getElementById('npc-name').value = '';
    document.getElementById('create-dog-overlay').classList.remove('hidden');
    // Reset to defaults
    document.querySelectorAll('#npc-breed-selector .option-card, #npc-personality-selector .option-card, #npc-skill-selector .option-card')
      .forEach(c => c.classList.remove('selected'));
    document.querySelector('#npc-breed-selector .option-card')?.classList.add('selected');
    document.querySelector('#npc-personality-selector .option-card')?.classList.add('selected');
    document.querySelector('#npc-skill-selector .option-card')?.classList.add('selected');
    this.createDogState = { breed: 'golden', personality: 'friendly', skill: 'guide' };
  }

  closeCreateDog() {
    this.uiState = 'game';
    document.getElementById('create-dog-overlay').classList.add('hidden');
  }

  confirmCreateDog() {
    const nameInput = document.getElementById('npc-name');
    const name = nameInput.value.trim() || this.generateDogName();
    const { breed, personality, skill } = this.createDogState;

    // Place near the player
    const offsetAngle = Math.random() * Math.PI * 2;
    const offsetDist = 80 + Math.random() * 60;
    let spawnX = this.player.x + Math.cos(offsetAngle) * offsetDist;
    let spawnY = this.player.y + Math.sin(offsetAngle) * offsetDist;

    // Clamp to world bounds
    spawnX = Math.max(TILE_SIZE, Math.min(spawnX, (this.world.width - 2) * TILE_SIZE));
    spawnY = Math.max(TILE_SIZE, Math.min(spawnY, (this.world.height - 2) * TILE_SIZE));

    const npc = new NPCDog({
      name, breed, personality, skill,
      x: spawnX, y: spawnY,
    });

    this.npcDogs.push(npc);

    // Ensure we have a sprite sheet for this breed
    if (!this.npcSprites[breed]) {
      this.npcSprites[breed] = new SpriteSheet(breed);
    }

    this.closeCreateDog();
    this.audio.playSfx('collect');
    this.showNotification(`${name} the ${DOG_BREEDS[breed].name} has joined!`);
  }

  generateDogName() {
    const names = ['Buddy', 'Luna', 'Max', 'Bella', 'Charlie', 'Daisy', 'Rocky', 'Coco',
      'Bear', 'Sadie', 'Duke', 'Lola', 'Zeus', 'Nala', 'Finn', 'Ruby',
      'Milo', 'Penny', 'Rex', 'Willow', 'Gus', 'Pepper', 'Scout', 'Maple'];
    const used = new Set(this.npcDogs.map(d => d.name));
    const available = names.filter(n => !used.has(n));
    return available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : 'Doggo' + (this.npcDogs.length + 1);
  }

  // ====== Chat UI ======
  setupChatUI() {
    const overlay = document.getElementById('chat-overlay');
    const closeBtn = document.getElementById('chat-close');
    const sendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');

    closeBtn.addEventListener('click', () => this.closeChat());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeChat();
    });

    sendBtn.addEventListener('click', () => this.sendChatMessage());
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendChatMessage();
      }
      e.stopPropagation(); // Prevent game input while typing
    });
    chatInput.addEventListener('keyup', (e) => e.stopPropagation());

    // Quick replies
    const quickContainer = document.getElementById('chat-quick-replies');
    QUICK_MESSAGES.forEach((qm) => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = qm.text;
      btn.addEventListener('click', () => {
        chatInput.value = qm.text;
        this.sendChatMessage();
      });
      quickContainer.appendChild(btn);
    });
  }

  openChat(npcDog) {
    this.uiState = 'chat';
    this.chatTarget = npcDog;

    // Update header
    document.getElementById('chat-npc-name').textContent = npcDog.name;
    const traitEl = document.getElementById('chat-npc-trait');
    traitEl.textContent = `${PERSONALITIES[npcDog.personality].name} ${SKILLS[npcDog.skill].name}`;

    // Draw avatar
    const avatarCanvas = document.getElementById('chat-npc-avatar');
    const avatarCtx = avatarCanvas.getContext('2d');
    avatarCtx.clearRect(0, 0, 32, 32);
    const preview = SpriteSheet.renderBreedPreview(npcDog.breed, 32);
    if (preview) avatarCtx.drawImage(preview, 0, 0);

    // Load chat history
    this.refreshChatMessages();

    // Show and focus
    document.getElementById('chat-overlay').classList.remove('hidden');

    // Auto-greet if first interaction
    if (npcDog.interactionCount === 0) {
      const greeting = npcDog.respond('hello');
      this.addChatBubble(greeting, 'npc');
    }

    setTimeout(() => document.getElementById('chat-input').focus(), 100);
  }

  closeChat() {
    this.uiState = 'game';
    this.chatTarget = null;
    document.getElementById('chat-overlay').classList.add('hidden');
    document.getElementById('chat-input').blur();
  }

  sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !this.chatTarget) return;

    input.value = '';
    this.addChatBubble(text, 'player');

    // Small delay for natural feel
    setTimeout(() => {
      const response = this.chatTarget.respond(text);
      this.addChatBubble(response, 'npc');
      this.audio.playSfx('interact');
    }, 300 + Math.random() * 400);
  }

  addChatBubble(text, from) {
    const container = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-msg from-${from}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  refreshChatMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    if (!this.chatTarget) return;

    for (const msg of this.chatTarget.chatHistory) {
      const bubble = document.createElement('div');
      bubble.className = `chat-msg from-${msg.from === 'player' ? 'player' : 'npc'}`;
      bubble.textContent = msg.text;
      container.appendChild(bubble);
    }
    container.scrollTop = container.scrollHeight;
  }

  // ====== Nearby NPC detection ======
  getNearbyNPCDog(radius = 48) {
    const px = this.player.getCenterX();
    const py = this.player.getCenterY();
    let closest = null;
    let closestDist = radius;

    for (const npc of this.npcDogs) {
      const cx = npc.x + 16;
      const cy = npc.y + 16;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = npc;
      }
    }
    return closest;
  }

  // ====== Core Game ======
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
    this.renderer.sprites.setBreed(this.selectedBreed);

    const startScreen = document.getElementById('start-screen');
    startScreen.style.transition = 'opacity 0.5s';
    startScreen.style.opacity = '0';
    setTimeout(() => startScreen.classList.add('hidden'), 500);

    // Start music by default
    await this.audio.init();
    this.audio.toggle();

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = Math.min(timestamp - this.lastTime, 50);
    this.lastTime = timestamp;

    this.update(dt);
    this.renderer.render(this.world, this.player, this.camera, dt);
    this.drawNPCDogs();
    this.drawNotification();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // Music toggle (keyboard only now)
    if (this.input.consumeJustPressed('music')) {
      this.audio.toggle();
    }

    // Add dog button
    if (this.input.consumeJustPressed('addDog')) {
      if (this.uiState === 'game') {
        this.openCreateDog();
        return;
      }
    }

    // Don't process game input when modal is open
    if (this.uiState !== 'game' && this.uiState !== 'dialogue') {
      // Consume inputs to prevent queuing
      this.input.consumeJustPressed('interact');
      return;
    }

    // Handle dialogue
    if (this.dialogue.active) {
      if (this.input.consumeJustPressed('interact')) {
        this.advanceDialogue();
      }
      return;
    }

    // Update player
    const event = this.player.update(dt, this.input.keys, this.world);

    if (event) {
      const regularBones = this.world.collectibles.filter(c => !c.isGolden).length;

      if (event.type === 'bone_collected') {
        this.audio.playSfx('collect');
        this.renderer.addParticle(
          this.player.getCenterX() - this.camera.x,
          this.player.getCenterY() - this.camera.y,
          'collect'
        );
        this.showNotification(`Bone found! (${event.total}/${regularBones})`);

        if (event.total === regularBones) {
          setTimeout(() => {
            this.showDialogue('Congratulations!', [
              'You found all the bones! What a good dog!',
              'The meadows of Mladost are proud of you.',
              'But wait... legend speaks of a GOLDEN bone...',
            ]);
          }, 1000);
        }
      } else if (event.type === 'golden_bone_collected') {
        this.audio.playSfx('collect');
        this.renderer.addParticle(
          this.player.getCenterX() - this.camera.x,
          this.player.getCenterY() - this.camera.y,
          'collect'
        );
        setTimeout(() => {
          this.showDialogue('The Golden Bone!', [
            '✨ You found the legendary GOLDEN BONE! ✨',
            'Hidden among the wildflowers, just as the old sign said.',
            'You are truly the greatest explorer Mladost has ever known!',
          ]);
        }, 300);
      }
    }

    // Check for nearby NPC dogs first (priority over world interactables)
    const nearbyNPC = this.getNearbyNPCDog(52);

    // Check for nearby world interactables
    const nearby = this.world.getNearbyInteractable(
      this.player.getCenterX(),
      this.player.getCenterY(),
      48
    );

    if (nearbyNPC) {
      this.showPrompt(`Talk to ${nearbyNPC.name}`);
      if (this.input.consumeJustPressed('interact')) {
        this.audio.playSfx('interact');
        this.openChat(nearbyNPC);
      }
    } else if (nearby && !nearby.collected) {
      this.showPrompt(nearby.interaction.type === 'collect' ? 'Sniff' : 'Interact');
      if (this.input.consumeJustPressed('interact')) {
        this.handleInteraction(nearby);
      }
    } else {
      this.hidePrompt();
      if (this.input.consumeJustPressed('interact')) {
        this.audio.playSfx('bark');
      }
    }

    // Update NPC dogs
    for (const npc of this.npcDogs) {
      npc.update(dt);
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

  drawNPCDogs() {
    const ctx = this.renderer.ctx;

    for (const npc of this.npcDogs) {
      const sx = Math.floor(npc.x - this.camera.x);
      const sy = Math.floor(npc.y - this.camera.y);

      // Skip if off screen
      if (sx < -64 || sx > this.canvas.width + 64 || sy < -64 || sy > this.canvas.height + 64) continue;

      // Get or create sprite sheet for this breed
      if (!this.npcSprites[npc.breed]) {
        this.npcSprites[npc.breed] = new SpriteSheet(npc.breed);
      }
      const sprites = this.npcSprites[npc.breed];
      const sprite = sprites.getDogSprite(npc.direction, npc.frame, npc.isMoving);
      ctx.drawImage(sprite, sx, sy, 32, 32);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy + 30, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Name tag
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'center';
      const nameWidth = ctx.measureText(npc.name).width;
      ctx.beginPath();
      ctx.roundRect(sx + 16 - nameWidth / 2 - 4, sy - 14, nameWidth + 8, 14, 4);
      ctx.fill();
      ctx.fillStyle = '#e8d5a3';
      ctx.fillText(npc.name, sx + 16, sy - 4);
    }

    ctx.textAlign = 'left';
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
    this.uiState = 'dialogue';
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
    this.uiState = 'game';
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
    ctx.textAlign = 'left';
  }
}

// Initialize game
const game = new Game();
