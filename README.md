# Minecraft.js - CSS Edition

A modern, clean implementation of a Minecraft-like game built entirely with **CSS transforms** and **vanilla JavaScript**. No Three.js or WebGL required!

## ✨ Features

- **Pure CSS 3D rendering** using `transform3d` and `perspective`
- **Object-oriented architecture** with small, focused components
- **Chunk-based world generation** with infinite terrain
- **Smooth player movement** with physics simulation
- **Block placement/destruction** with animations
- **Performance optimized** with face culling and LOD
- **Responsive design** that works on different screen sizes
- **Modern ES6+ JavaScript** with modules and clean code

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the server:**

   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:22222`

## 🎮 Controls

- **WASD** - Move around
- **Mouse** - Look around (click to lock pointer)
- **Space** - Jump
- **Shift** - Sneak
- **Ctrl** - Sprint
- **Left Click** - Break block
- **Right Click** - Place block
- **F3** - Toggle debug info
- **F1** - Toggle controls help

## 🏗️ Architecture

### Core Components

- **`Game.js`** - Main game loop and system orchestration
- **`World.js`** - Chunk management and world generation
- **`Player.js`** - Player physics and movement
- **`Camera.js`** - 3D camera transforms
- **`InputManager.js`** - Input handling and event system
- **`UIManager.js`** - User interface management

### Block System

- **`Block.js`** - Individual block component with CSS cube faces
- **`Chunk.js`** - 16x16x128 chunk of blocks with optimization
- **Face culling** - Hidden faces are not rendered
- **Block types** - Grass, dirt, stone, wood, leaves, water, sand

### CSS 3D System

Instead of WebGL/Three.js, we use:

- **`perspective`** - Creates 3D viewing context
- **`transform3d`** - Positions blocks in 3D space
- **`preserve-3d`** - Maintains 3D transformations
- **Face positioning** - Each block has 6 faces positioned with transforms

## 🎨 Visual Design

- **Pixelated textures** created with CSS gradients and patterns
- **Smooth animations** for block placement/destruction
- **Crosshair and UI** styled with pure CSS
- **Loading screens** with progress bars
- **Debug panel** showing FPS, position, and chunk info

## 📱 Performance

- **Chunk-based rendering** - Only visible chunks are processed
- **Face culling** - Hidden block faces are not rendered
- **Update throttling** - Limits updates for better performance
- **Efficient DOM manipulation** - Minimal reflows and repaints
- **Memory management** - Proper cleanup of unused chunks

## 🔧 Technical Details

### Why CSS Instead of WebGL?

1. **Simpler to understand** - No complex 3D math or shaders
2. **Better debugging** - Use browser dev tools to inspect 3D elements
3. **Accessibility** - Screen readers can understand DOM structure
4. **Responsive** - CSS media queries work naturally
5. **Performance** - Leverages browser's optimized CSS engine

### Block Face Positioning

Each block is a DOM element with 6 child faces:

```css
.face-front { transform: translateZ(16px); }
.face-back { transform: translateZ(-16px) rotateY(180deg); }
.face-right { transform: rotateY(90deg) translateZ(16px); }
.face-left { transform: rotateY(-90deg) translateZ(16px); }
.face-top { transform: rotateX(90deg) translateZ(16px); }
.face-bottom { transform: rotateX(-90deg) translateZ(16px); }
```

### Camera System

The camera applies inverse transforms to the world:

```javascript
const transform = 
  `translate3d(${centerX}px, ${centerY}px, 0) ` +
  `rotateX(${-camera.pitch}rad) ` +
  `rotateY(${-camera.yaw}rad) ` +
  `translate3d(${-camera.x}px, ${camera.y}px, ${-camera.z}px)`;
```

## 🌍 World Generation

- **Noise-based terrain** using multiple octaves
- **Biome variety** with different block types
- **Structure generation** like simple trees
- **Infinite chunks** loaded/unloaded as player moves
- **Persistent world** with chunk caching

## 🔮 Future Enhancements

- **Multiplayer support** with WebSocket server
- **More block types** and materials
- **Lighting system** using CSS shadows
- **Water physics** and fluid simulation
- **Inventory system** with crafting
- **Mobs and entities** using CSS animations
- **Sound effects** with Web Audio API

## 📦 Dependencies

- **Express** - Web server for serving files
- **CORS** - Cross-origin resource sharing
- **body-parser** - Parse JSON requests
- **fs-extra** - Enhanced file system operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Goals

This project demonstrates that complex 3D games can be built with:

- **CSS transforms** instead of WebGL
- **Object-oriented design** with small components

---

**Built with ❤️ and modern web technologies**
