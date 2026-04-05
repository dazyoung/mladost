// Procedural ambient music using Web Audio API
// Creates a calm, Stardew Valley-inspired soundtrack

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.initialized = false;
    this.masterGain = null;
    this.musicPlaying = false;

    // Music state
    this.noteIndex = 0;
    this.chordIndex = 0;
    this.nextNoteTime = 0;
    this.nextChordTime = 0;
    this.schedulerTimer = null;

    // Pentatonic scale in C (peaceful sounding)
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    // Chord progressions (calm, pastoral)
    this.chords = [
      [261.63, 329.63, 392.00],  // C major
      [220.00, 261.63, 329.63],  // Am
      [246.94, 311.13, 392.00],  // G/B
      [261.63, 329.63, 392.00],  // C
      [220.00, 261.63, 329.63],  // Am
      [174.61, 220.00, 261.63],  // F
      [196.00, 246.94, 293.66],  // G
      [261.63, 329.63, 392.00],  // C
    ];

    // Melody patterns (intervals in the scale)
    this.melodyPatterns = [
      [0, 2, 4, 3, 2, 1, 2, 0],
      [4, 3, 2, 0, 1, 2, 3, 4],
      [0, 1, 2, 4, 5, 4, 2, 0],
      [2, 4, 5, 4, 2, 1, 0, 1],
      [5, 4, 3, 2, 1, 0, 1, 2],
    ];
    this.currentPattern = 0;
    this.patternNote = 0;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      // Create reverb
      this.reverb = await this.createReverb();

      this.initialized = true;
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  }

  async createReverb() {
    const length = this.ctx.sampleRate * 2;
    const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }

    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;

    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.15;

    convolver.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    return convolver;
  }

  toggle() {
    if (!this.initialized) return;

    this.enabled = !this.enabled;
    if (this.enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.enabled;
  }

  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.musicPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.nextChordTime = this.ctx.currentTime + 0.1;

    this.schedule();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  schedule() {
    if (!this.musicPlaying) return;

    const lookAhead = 0.2;
    const now = this.ctx.currentTime;

    // Schedule melody notes
    while (this.nextNoteTime < now + lookAhead) {
      this.playMelodyNote(this.nextNoteTime);
      this.nextNoteTime += 0.4 + Math.random() * 0.1; // Slightly varied timing
    }

    // Schedule chord pads
    while (this.nextChordTime < now + lookAhead) {
      this.playChord(this.nextChordTime);
      this.nextChordTime += 3.2;
    }

    this.schedulerTimer = setTimeout(() => this.schedule(), 100);
  }

  playMelodyNote(time) {
    if (!this.ctx) return;

    const pattern = this.melodyPatterns[this.currentPattern];
    const noteIdx = pattern[this.patternNote];
    const freq = this.scale[noteIdx];

    // Occasional rest
    if (Math.random() < 0.15) {
      this.patternNote = (this.patternNote + 1) % pattern.length;
      if (this.patternNote === 0) {
        this.currentPattern = Math.floor(Math.random() * this.melodyPatterns.length);
      }
      return;
    }

    // Main note with soft attack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Soft envelope
    const duration = 0.3 + Math.random() * 0.2;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.reverb);

    osc.start(time);
    osc.stop(time + duration + 0.1);

    // Advance pattern
    this.patternNote = (this.patternNote + 1) % pattern.length;
    if (this.patternNote === 0) {
      this.currentPattern = Math.floor(Math.random() * this.melodyPatterns.length);
    }
  }

  playChord(time) {
    if (!this.ctx) return;

    const chord = this.chords[this.chordIndex];
    this.chordIndex = (this.chordIndex + 1) % this.chords.length;

    for (const freq of chord) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Use triangle wave for softer pad sound
      osc.type = 'triangle';
      osc.frequency.value = freq / 2; // One octave lower for warmth

      const duration = 3.0;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.04, time + 0.5);
      gain.gain.setValueAtTime(0.04, time + duration - 1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(this.reverb);

      osc.start(time);
      osc.stop(time + duration + 0.1);
    }
  }

  // Play a short sound effect
  playSfx(type) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') return;

    const now = this.ctx.currentTime;

    if (type === 'collect') {
      // Happy ascending notes
      [0, 1, 2].forEach((i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 523 * (1 + i * 0.25);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
    } else if (type === 'interact') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'bark') {
      // Short playful bark sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }
}
