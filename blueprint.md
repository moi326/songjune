# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers by leveraging asset reuse, texture caching, and dynamic shadow management.

## Game Design & Features

*   **3D Environment:** Stylized world with a perspective camera following the ball. Features high-detail neon tunnels and a grid-covered bottom floor.
*   **Core Mechanics:**
    - **Movement:** Automatic forward momentum with increasing speed. Left/Right control with gravity and jump pad physics.
    - **Items:** Titan Orb (Invincibility/Size), Boost Pad (FOV Warp), Super Jump (Rainbow Trail Flight).
    - **Obstacles:** Animated boxes, crushers, windmills, bouncers, lasers, pendulums, and closing gates.
*   **Authentication & Cloud:** Firebase Auth (Google Login) and Firestore real-time sync for high scores and coins.

## Optimization Details (From Start to Finish)

### 1. Asset Management (Memory & CPU)
- **Geometry & Material Reuse:** All tiles, coins, and basic obstacles share global `Geometry` and `Material` instances to prevent heap memory growth.
- **Texture Caching:** Sprite textures for score pads are pre-rendered and cached to avoid redundant canvas draw calls.

### 2. Rendering & Lighting
- **Dynamic Shadow Camera:** The shadow frustum is tightly constrained and follows the player's position, providing high-quality shadows only where needed.
- **Adaptive Pixel Ratio:** Limited to 2.0 to maintain performance on Retina/High-DPI displays without sacrificing visual clarity.
- **WebGL Power Preference:** Configured for "high-performance" GPU usage.

### 3. Logic & Physics
- **Minimal DOM Interaction:** UI updates (Score, Coins) are triggered only when values change, preventing layout thrashing.
- **Optimized Collision:** Uses pre-calculated `Box3` and `Sphere` checks. Animated obstacles update their bounding volumes only when necessary.
- **Batched Cloud Sync:** Database writes are performed at key game state changes (GameOver/Revive) rather than every item collection.

## Project Structure

*   `index.html`: Optimized HUD and 3D container.
*   `style.css`: Modern UI with GPU-accelerated effects.
*   `main.js`: Refactored core logic with full optimization patterns.
*   `firebase-config.js`: Cloud configuration.

## Current Status
- **Final Refinement Complete:** The codebase has been fully audited and optimized from start to finish.
