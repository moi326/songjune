# Blueprint: 3D Rolling Ball Game

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. The player controls a ball rolling along a track, avoiding obstacles and hitting jump pads to maintain momentum or reach higher ground. The goal is to survive as long as possible and achieve the highest score.

## Game Design & Features

*   **3D Environment:** A stylized 3D world with a perspective camera following the ball. Features a "thrilling" bottom floor for falling sequences.
*   **Player Controls:**
    - **Move Left/Right:** Arrow keys or A/D. The ball can now fall off the sides of the track!
    - **Start/Restart:** Spacebar or **Click/Tap anywhere on the overlay**.
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
        - **Super Jump (Rainbow Pad):** Launches the ball high into the sky, triggering 10 seconds of flight with a dynamic neon dot trail that cycles through colors.
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
    *   **Visual & Audio Aesthetics:**
        - Modern HUD with score, best score, and persistent coin count.
        - Simple, clean floor tiles for better performance and visibility.
        - Fog and lighting for atmosphere.
        - Thrilling, energetic background music that plays during gameplay.


## Project Structure

*   `index.html`: UI structure, Three.js canvas container, and HUD.
*   `style.css`: Modern styling for the game interface and immersive layout.
*   `main.js`: Core game logic, Three.js scene setup, physics, and gameplay.

## Implementation Details

### UI (HUD & Overlays)
- **Top Score:** Real-time distance tracking.
- **Start/Game Over Overlay:** A centered message with a backdrop blur for "Press Space or Click to Start/Restart". Interactive and supports pointer events.

### Three.js Components (Optimized)
- **Renderer:** WebGLRenderer with `powerPreference: "high-performance"` and optimized pixel ratio (max 2).
- **Camera:** Perspective camera positioned behind and slightly above the ball.
- **Lighting:** Optimized Directional light with 1024x1024 shadow maps and constrained frustum.
- **Memory Management:** Explicit `dispose()` calls for geometries and materials of off-screen objects to prevent GPU memory leaks.

### Logic & Physics
- **Game State Machine:** `START`, `PLAYING`, `GAMEOVER`.
- **Movement Logic:** 
    - `z-position` increases (or decreases) constantly.
    - `x-position` modified by user input (clamped to track width).
    - `y-position` managed by simple gravity and jump pad impulses.
- **Collision Detection (Optimized):** Uses pre-computed `Box3` bounding boxes stored in `userData` to avoid expensive `setFromObject()` calls in the game loop. Reuses mathematical objects (`Sphere`, `Box3`) to minimize GC pressure.

## Current Progress & Optimization

1.  **Memory Leak Fix:** Implemented a global disposal system for all 3D entities.
2.  **Collision Efficiency:** Switched to cached bounding volume checks.
3.  **Rendering Performance:** Fine-tuned pixel ratio and shadow map settings for stable 60 FPS.
