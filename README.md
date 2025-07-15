# minecraft.js

A modular WebGL demo inspired by Minecraft block rendering.

## Features

- **WebGL Renderer**: Renders a textured cube using a perspective camera and custom matrix math.
- **Texture Atlas**: Uses a generated atlas for block faces (side, top, bottom) with UV mapping.
- **Modular Classes**: Includes `WebGLRenderer`, `Scene`, `TestCube`, `TextureLoader`, and utility classes.
- **Animated Cube**: The cube rotates in all three axes at different rates for a dynamic 3D effect.
- **Camera**: Perspective camera implemented with custom view/projection matrices.
- **Build Script**: Generates a grass block texture atlas from individual PNGs.

## File Structure

- `js/WebGLRenderer.js`: Main renderer class.
- `js/Scene.js`: Manages scene objects and rendering.
- `js/TestCube.js`: Cube geometry with UV mapping for the texture atlas.
- `js/TextureLoader.js`: Loads images as WebGL textures.
- `js/TextureAtlasBuilder.js`: Utility for building texture atlases.
- `js/buildGrass.js`: Script to generate the grass block atlas.
- `styles/main.css`: Basic styles.
- `textures/`: Contains block face and skybox textures.
- `index.html`: Entry point for the demo.

## How to Run

1. Open `index.html` in a browser to view the demo.
2. To generate the grass atlas, run `js/buildGrass.js` with Node.js.

## Current Status

- Renders a single animated cube with correct texture mapping and perspective.
- Modular and extensible for future block types, camera controls, or user interaction.

## Credits

Created by lilithebowman. Powered by WebGL and JavaScript ES6 modules.
