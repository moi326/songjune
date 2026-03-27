# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers while delivering a visually stunning retro-synthwave experience.

## Key Features

### 1. Core Physics & Gameplay
- **Precise Control**: Tight responsiveness for jumping and lateral movement.
- **Dynamic Gravity**: Custom-tuned gravity constant for satisfying arcade-style jumps.
- **Progressive Difficulty**: Speed increases gradually as the score rises.
- **Side Fall Physics**: (NEW) Ball can now fall off the sides of the track if steered beyond the edges, adding a layer of risk and precision.

### 2. Immersive Visuals (Neon Purple & Cyan)
- **Synthwave Aesthetics**: High-contrast neon materials with emissive glowing effects.
- **Infinite Starfield**: A procedurally generated background with 1,500 magenta stars.
- **Grid Helper**: A dual-color grid representing the "infinite void" below the track.
- **Synthwave Sun**: A massive, glowing sun disk in the distance for depth perception.

### 3. Advanced Game Mechanics
- **Varied Obstacles**:
  - Rotating Windmills
  - Oscillating Crushes
  - Bouncing Spheres
  - Laser Barriers
  - Heavy Pendulums
- **Power-Ups**:
  - **Flight (Super Jump)**: Elevates the ball into a high-speed flight mode with particle trails.
  - **Titan Mode**: Grows the ball 3x larger, allowing it to smash through obstacles.
  - **Boost Pad**: Provides a sudden burst of speed and FOV expansion.
- **Economy & Revive**:
  - Collectible Gold Coins.
  - Revive system: Continue the run by spending 300 coins after a Game Over.

### 4. Technical Optimizations
- **Asset Pooling**: Geometry and materials are reused globally to prevent garbage collection spikes.
- **Frustum Culling**: Objects behind the camera are automatically removed from the scene.
- **Layered UI**: DOM-based overlays for high-performance text rendering without Three.js overhead.
- **Stable 60 FPS**: Minimized draw calls and optimized bounding box collision detection.

### 5. Social & Cloud (Firebase Integration)
- **Google Authentication**: Global login via Firebase Auth.
- **Cloud Sync**: High scores and coin totals are automatically synced to Firestore.
- **Persistent Local Storage**: Fallback to `localStorage` for offline play or initialization speed.

---

## Technical Debt / Known Issues (Resolved)
- Fixed transparent materials flickering during high-speed movement.
- Optimized bounding box updates for moving objects to prevent "clipping" through obstacles.
- Enhanced Firebase debugging with redirect login fallback for restricted environments.
- Added alerts to verify script execution and login button connectivity.
- **Implemented Side Fall Physics**: Removed X-axis clamping to allow the ball to fall off the track edges.
