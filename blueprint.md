# Blueprint: 3D Rolling Ball Game

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. The player controls a ball rolling along a track, avoiding obstacles and hitting jump pads to maintain momentum or reach higher ground. The goal is to survive as long as possible and achieve the highest score.

## Game Design & Features

*   **3D Environment:** A stylized 3D world with a perspective camera following the ball. Features a "thrilling" bottom floor for falling sequences.
*   **Player Controls:**
    - **Move Left/Right:** Arrow keys or A/D. The ball can now fall off the sides of the track!
    - **Start/Restart:** Spacebar.
*   **Core Mechanics:**
    - **Forward Momentum:** The ball moves forward automatically, speeding up as the score increases.
    - **Ball Physics:** Realistic rolling animation with visual rotation.
    - **Obstacles:** A diverse set of obstacles including:
        - **Box:** Static obstacles to navigate around.
        - **Moving Box:** Side-to-side moving blocks.
        - **Crusher:** Blocks that move up and down.
        - **Windmill:** Spinning bars across the track.
        - **Bouncer:** Giant spheres that bounce vertically.
        - **Laser:** Blinking red beams that must be timed.
        - **Pendulum:** Swinging spheres from above.
        - **Closing Gates:** Walls that slide together and apart.
    - **Items & Pads:**
        - **Jump Pads:** Propel the ball over gaps or into tunnels.
        - **Super Jump (Rainbow Pad):** Launches the ball high into the sky, triggering 10 seconds of flight with a neon trail.
        - **Score Pads (Negative):** Red glowing pads that subtract points (-10 to -50) when touched.
        - **Titan Orb:** A glowing blue item that makes the ball 3x larger and invincible, destroying obstacles on contact for 8 seconds.
        - **Boost Pad:** A glowing cyan chevron pad that drastically increases speed and warps the camera FOV for 3 seconds.
    - **Enhanced Tunnels:** High-detail tunnel segments with neon ribs and metallic surfaces.
    - **Gaps:** Procedural gaps that get longer as the player progresses.
    *   **User Authentication:**
        - Google Login integration using Firebase Auth.
        - Persistent user profiles with display names and photos.
    *   **Cloud Data Sync:**
        - High scores and coin counts are automatically synced to Firebase Firestore.
        - Data is preserved across sessions and devices.
    *   **Persistent Stats:** 
        - Coins are saved in local storage and cloud.
        - **Best Score (High Score)** is saved in local storage and cloud, updated in real-time.
    *   **Falling Mechanic:** If the ball falls off the track or into a gap, it falls deep into a grid-covered bottom floor before Game Over.
    *   **Visual Aesthetics:**
        - Modern HUD with score, best score, and persistent coin count.
        - Simple, clean floor tiles for better performance and visibility.
        - Fog and lighting for atmosphere.


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
