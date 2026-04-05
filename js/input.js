// Input handler for keyboard and touch controls

export class InputManager {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      interact: false,
    };

    this.justPressed = {
      interact: false,
      music: false,
      addDog: false,
    };

    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this._keyDown = this._keyDown.bind(this);
    this._keyUp = this._keyUp.bind(this);

    window.addEventListener('keydown', this._keyDown);
    window.addEventListener('keyup', this._keyUp);

    // Touch controls
    this.touchControls = null;
    this.joystickActive = false;
    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickTouchId = null;

    if (this.isMobile) {
      this.createTouchControls();
    }
  }

  createTouchControls() {
    // Create touch control overlay
    this.touchControls = document.createElement('div');
    this.touchControls.id = 'touch-controls';
    this.touchControls.innerHTML = `
      <div id="joystick-zone">
        <div id="joystick-base">
          <div id="joystick-knob"></div>
        </div>
      </div>
      <div id="touch-buttons">
        <button id="btn-interact" class="touch-btn" aria-label="Interact">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="currentColor">
            <circle cx="9" cy="6" r="3.5"/>
            <circle cx="21" cy="6" r="3.5"/>
            <circle cx="5" cy="14" r="3.5"/>
            <circle cx="25" cy="14" r="3.5"/>
            <ellipse cx="15" cy="20" rx="6" ry="5"/>
          </svg>
        </button>
        <button id="btn-add-dog" class="touch-btn touch-btn-small" aria-label="Add NPC Dog">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="9" y="3" width="2" height="14" rx="1"/>
            <rect x="3" y="9" width="14" height="2" rx="1"/>
          </svg>
        </button>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.touchControls);

    // Add touch control styles
    const style = document.createElement('style');
    style.textContent = `
      #touch-controls {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
      }
      #joystick-zone {
        position: absolute;
        bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        left: 20px;
        width: 150px;
        height: 150px;
        pointer-events: auto;
        touch-action: none;
      }
      #joystick-base {
        position: absolute;
        bottom: 10px;
        left: 10px;
        width: 120px;
        height: 120px;
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #joystick-knob {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transition: transform 0.05s;
      }
      #touch-buttons {
        position: absolute;
        bottom: calc(90px + env(safe-area-inset-bottom, 0px));
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
        pointer-events: auto;
      }
      .touch-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: rgba(232, 213, 163, 0.5);
        border: 2px solid rgba(232, 213, 163, 0.7);
        color: #fff;
        font-family: 'Courier New', monospace;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .touch-btn:active {
        background: rgba(232, 213, 163, 0.8);
        transform: scale(0.9);
      }
      .touch-btn-small {
        width: 40px;
        height: 40px;
        font-size: 14px;
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
      }
    `;
    document.head.appendChild(style);

    // Joystick touch handling
    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');
    const joystickBase = document.getElementById('joystick-base');

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.joystickTouchId = touch.identifier;
      const rect = joystickBase.getBoundingClientRect();
      this.joystickOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      this.joystickActive = true;
      this.updateJoystick(touch.clientX, touch.clientY, joystickKnob);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystick(touch.clientX, touch.clientY, joystickKnob);
        }
      }
    }, { passive: false });

    const endJoystick = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          this.keys.up = false;
          this.keys.down = false;
          this.keys.left = false;
          this.keys.right = false;
          joystickKnob.style.transform = 'translate(0, 0)';
        }
      }
    };

    joystickZone.addEventListener('touchend', endJoystick);
    joystickZone.addEventListener('touchcancel', endJoystick);

    // Button handlers
    const btnInteract = document.getElementById('btn-interact');
    btnInteract.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.interact = true;
      this.justPressed.interact = true;
    }, { passive: false });
    btnInteract.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys.interact = false;
    });

    const btnAddDog = document.getElementById('btn-add-dog');
    btnAddDog.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.justPressed.addDog = true;
    }, { passive: false });
  }

  updateJoystick(touchX, touchY, knobEl) {
    const dx = touchX - this.joystickOrigin.x;
    const dy = touchY - this.joystickOrigin.y;
    const maxDist = 45;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    knobEl.style.transform = `translate(${knobX}px, ${knobY}px)`;

    // Dead zone
    const deadZone = 12;
    if (dist < deadZone) {
      this.keys.up = false;
      this.keys.down = false;
      this.keys.left = false;
      this.keys.right = false;
      return;
    }

    // Convert to directional input
    const normX = dx / dist;
    const normY = dy / dist;
    const threshold = 0.4;

    this.keys.left = normX < -threshold;
    this.keys.right = normX > threshold;
    this.keys.up = normY < -threshold;
    this.keys.down = normY > threshold;
  }

  _keyDown(e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':
        this.keys.up = true; e.preventDefault(); break;
      case 'ArrowDown': case 'KeyS':
        this.keys.down = true; e.preventDefault(); break;
      case 'ArrowLeft': case 'KeyA':
        this.keys.left = true; e.preventDefault(); break;
      case 'ArrowRight': case 'KeyD':
        this.keys.right = true; e.preventDefault(); break;
      case 'KeyE': case 'Space':
        if (!this.keys.interact) {
          this.keys.interact = true;
          this.justPressed.interact = true;
        }
        e.preventDefault();
        break;
      case 'KeyM':
        this.justPressed.music = true;
        e.preventDefault();
        break;
      case 'KeyN':
        this.justPressed.addDog = true;
        e.preventDefault();
        break;
    }
  }

  _keyUp(e) {
    switch (e.code) {
      case 'ArrowUp': case 'KeyW':
        this.keys.up = false; break;
      case 'ArrowDown': case 'KeyS':
        this.keys.down = false; break;
      case 'ArrowLeft': case 'KeyA':
        this.keys.left = false; break;
      case 'ArrowRight': case 'KeyD':
        this.keys.right = false; break;
      case 'KeyE': case 'Space':
        this.keys.interact = false; break;
    }
  }

  consumeJustPressed(key) {
    if (this.justPressed[key]) {
      this.justPressed[key] = false;
      return true;
    }
    return false;
  }

  destroy() {
    window.removeEventListener('keydown', this._keyDown);
    window.removeEventListener('keyup', this._keyUp);
  }
}
