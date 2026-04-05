# Mladost

A relaxing 2D exploration game where you play as a dog roaming through a peaceful village and its surrounding meadows. Inspired by the charm of Stardew Valley, built entirely with Claude Code.

**[Play the game](https://dazyoung.github.io/mladost/)** (once deployed to GitHub Pages)

## How to Play

### Desktop
- **WASD** or **Arrow Keys** - Move your dog
- **E** or **Space** - Interact with objects / Bark
- **M** - Toggle background music

### Mobile
- **Virtual Joystick** (left side) - Move your dog
- **Paw Button** (right side) - Interact / Bark
- **+ Button** - Create an NPC doggo

## Features

- 6 selectable dog breeds (Golden, Husky, Chocolate, Dalmatian, Shiba, Black Lab)
- Pixel art dog character with directional walk animations
- **NPC Dogs** - Create up to 5 AI-powered companion dogs with unique personalities and skills
- **Chat System** - Talk to NPC dogs with free text or quick replies; they respond based on personality
- Procedurally generated sprite art (no external image assets)
- Tile-based world with grass, paths, water, sand, and bridges
- Interactive objects: signs, berry bushes, dog house, cottage
- Collectible bones + a hidden legendary golden bone
- Animated butterflies and water tiles
- Procedural ambient music via Web Audio API
- Dialogue system for reading signs and interacting with objects
- Smooth camera following
- Touch controls with virtual joystick for mobile play
- Y-sorted rendering for proper depth ordering

## Running Locally

No build step required. Just serve the files with any static server:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# Or just open index.html in a browser (some browsers may block ES modules from file://)
```

## Project Structure

```
mladost/
  index.html          - Entry point
  css/style.css       - Styling and mobile responsive layout
  js/
    main.js           - Game loop, state management, UI
    world.js          - Tile map generation, objects, interactions
    player.js         - Dog character movement and animation
    camera.js         - Smooth-following camera
    renderer.js       - Canvas rendering, sprites, particles, HUD
    sprites.js        - Procedural pixel art sprite generator
    npc-dogs.js       - NPC dog personality engine + response generation
    input.js          - Keyboard + touch input handling
    audio.js          - Web Audio API procedural music + SFX
```

## Tech Stack

- Vanilla JavaScript (ES modules, no framework)
- HTML5 Canvas for rendering
- Web Audio API for procedural music and sound effects
- Zero external dependencies

---

## Built with Claude Code - Prompt Log

This project was built interactively using [Claude Code](https://claude.ai/code), Anthropic's AI coding assistant. Below is a log of the prompts used to build it, serving as an instructional example of how to develop a game with AI pair programming.

### Prompt 1 - Initial Creation
> This is an empty repository. I want you to create a new web application for mladost. To start, this should be a 2d game world which you can control a character (a dog) and explore and interact with the world, reminiscent of stardew valley. When committing to GitHub, as I want this to be instructional and show how Claude and Claude code can be used, the readme should give a step by step and a log of the prompts used over time. Start by creating a basic but relaxing and serene game world with calm background music and a sprite dog that you can control to roam around and interact with different game elements.

**What Claude built:**
- Complete game engine from scratch using HTML5 Canvas
- Procedural pixel art sprite system (dog with 4-direction walk animations, trees, flowers, rocks, bushes, signs, bones, butterflies, houses)
- 60x50 tile world with grass, paths, water, ponds, river with bridge, sand areas, flower patches
- Interaction system: read signs, collect berries from bushes, auto-collect bones, bark
- Dialogue UI system
- Procedural ambient music using Web Audio API (pentatonic melody + chord pads + reverb)
- Sound effects (collect, interact, bark)
- Particle effects on collection
- Smooth camera following
- Y-sorted rendering for depth
- HUD with bone counter

### Prompt 2 - Mobile Support
> This should also work well on a phone, in case there are changes you need to make to accommodate that

**What Claude added:**
- Virtual joystick (left side) with touch drag control
- Action buttons (E for interact, M for music) on right side
- Mobile viewport meta tags (no-zoom, safe area support)
- Responsive CSS for smaller screens
- Touch event handling with dead zone and directional threshold
- Prevents default touch behaviors (scroll, zoom) during gameplay
- Shows appropriate control instructions on start screen based on device

### Prompt 3 - Mobile Chrome Fix
> On mobile google chrome cuts out some of the controls as the browser controls overlap them at the bottom of the screen

**What Claude fixed:**
- Moved touch controls (joystick + buttons) higher to clear Chrome/Safari bottom navigation bar
- Used `100dvh` (dynamic viewport height) to account for browser chrome
- Added `visualViewport` API for accurate canvas sizing
- Applied `env(safe-area-inset-bottom)` throughout control positioning

### Prompt 4 - Map Fixes & Dog Selection
> I want to extend the game a bit, eg the map should be adjusted - some bones appear in the water and the bridge to cross the water in the middle isn't accessible. On the home page, you should be able to select your doggo.

**What Claude fixed/added:**
- **Bridge fix**: Traced the river's sine-wave wobble to calculate exact water tile positions; bridge now dynamically covers the full river width across all path rows (y=18-22)
- **Bone fix**: Moved bones at [42,14] and [5,35] that were landing inside ponds; added water validation so bones on water tiles are automatically skipped
- **Dog selector**: Added 6 dog breeds to choose from on the start screen:
  - Golden, Husky, Chocolate, Dalmatian, Shiba, Black Lab
  - Each with unique pixel art color palette (body, dark fur, belly, nose)
  - Interactive selection UI with preview sprites and breed names
  - Selected breed is applied to the in-game dog sprite

### Prompt 5 - Naming & Icon Buttons
> I don't want it to be called a dog's world. Don't make E the action button on mobile, just have an action button with a symbol instead

**What Claude changed:**
- Renamed to just "Mladost" with subtitle "Explore. Sniff. Discover."
- Replaced text buttons with SVG icons: paw print for interact, music note for toggle

### Prompt 6 - NPC Dogs with Personality Engine & Golden Bone
> I want to be able to create NPC doggos. They should be powered by a basic LLM to give them personality. I should have a button instead of the music button which allows me to add a new one. There should be max of 5 of them. I should be able to interact with them, write predefined or free text messages to get a response. When creating them I should have a popup with some options which will guide their skills, personality and appearance

**What Claude built:**
- **NPC Dog System** (up to 5 dogs):
  - Creation popup with name, breed, personality, and skill selection
  - 6 personality types: Friendly, Shy, Adventurous, Wise, Playful, Grumpy
  - 5 skill types: Guide, Storyteller, Forager, Guard, Comedian
  - Dogs wander around near their spawn point with idle/walk states
  - Name tags displayed above each NPC dog
- **Personality-Driven Response Engine** (`npc-dogs.js`):
  - Intent detection via keyword matching (greetings, questions, topics, farewells, etc.)
  - Personality-specific greetings, farewells, and tone modifiers
  - Skill-specific knowledge responses (directions, stories, jokes, foraging tips, etc.)
  - Template system with dynamic variable substitution
  - Chat history per NPC dog
- **Chat Interface**:
  - Opens when interacting with an NPC dog
  - Quick reply buttons for common messages
  - Free text input for custom messages
  - Chat bubble history with player/NPC styling
  - Auto-greeting on first interaction
- **Mobile Controls Update**:
  - Replaced music button with + (add dog) button
  - Music plays by default, M key still works on desktop
  - N key opens create dog popup on desktop
- **Golden Bone**:
  - Hidden legendary collectible in the flower patch
  - Special golden sprite with glow effect and rotating sparkles
  - Finding all regular bones hints at its existence
  - Special dialogue when discovered
