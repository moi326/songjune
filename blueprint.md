# Blueprint: 3D Rolling Ball Game

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. The player controls a ball rolling along a track, avoiding obstacles and hitting jump pads to maintain momentum or reach higher ground. The goal is to survive as long as possible and achieve the highest score.

## Game Design & Features

*   **3D Environment:** A stylized 3D world with a perspective camera following the ball.
*   **Player Controls:**
    - **Move Left/Right:** Arrow keys or A/D.
    - **Jump:** NOT ALLOWED (Manual jumping is disabled).
    - **Start/Restart:** Spacebar.
*   **Core Mechanics:**
    - **Forward Momentum:** The ball moves forward automatically.
    - **Obstacles:** Various shapes (cubes, cylinders) that the player must dodge. Colliding with one results in a Game Over.
    - **Jump Pads:** Specific zones on the track that propel the ball into the air, allowing it to bypass certain obstacles or reach elevated paths.
    - **Score System:** Score increases based on the distance traveled.
*   **Visual Aesthetics:**
    - Modern HUD with a clean layout.
    - Vibrant colors using `oklch`.
    - Soft shadows and depth of field effects.
    - Subtle background textures for a premium feel.

## Project Structure

*   `index.html`: UI structure, Three.js canvas container, and HUD.
*   `style.css`: Modern styling for the game interface and immersive layout.
*   `main.js`: Core game logic, Three.js scene setup, physics, and gameplay.

## Implementation Details

### UI (HUD & Overlays)
- **Top Score:** Real-time distance tracking.
- **Start/Game Over Overlay:** A centered message with a backdrop blur for "Press Space to Start/Restart".

### Three.js Components
- **Renderer:** WebGLRenderer with high-quality settings.
- **Camera:** Perspective camera positioned behind and slightly above the ball.
- **Lighting:** Ambient light for basic visibility + Directional light for shadows and depth.
- **Objects:**
    - **Player:** A sphere with a distinct material.
    - **Track:** A long plane or procedural segment-based track.
    - **Obstacles:** Randomly spawned meshes.
    - **Jump Pads:** Distinctly colored areas on the track with simple collision logic to apply vertical velocity.

### Logic & Physics
- **Game State Machine:** `START`, `PLAYING`, `GAMEOVER`.
- **Movement Logic:** 
    - `z-position` increases (or decreases) constantly.
    - `x-position` modified by user input (clamped to track width).
    - `y-position` managed by simple gravity and jump pad impulses.
- **Collision Detection:** Bounding volume checks for obstacles and track boundaries.

## Plan for Current Task

1.  **Refactor `index.html`**: Clean up structure and add Three.js CDN.
2.  **Style `style.css`**: Create a polished UI for the score and overlays.
3.  **Implement `main.js`**:
    - Setup the Three.js scene.
    - Create the player and track.
    - Implement obstacle and jump pad spawning logic.
    - Implement the core game loop (movement, collisions, scoring).
    - Add the "Space to Start" mechanism.
