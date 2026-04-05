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
- **E Button** (right side) - Interact / Bark
- **M Button** - Toggle music

## Features

- 6 selectable dog breeds (Golden, Husky, Chocolate, Dalmatian, Shiba, Black Lab)
- Pixel art dog character with directional walk animations
- Procedurally generated sprite art (no external image assets)
- Tile-based world with grass, paths, water, sand, and bridges
- Interactive objects: signs, berry bushes, dog house, cottage
- Collectible bones scattered throughout the map
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
