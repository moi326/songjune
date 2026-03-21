# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers while maintaining high visual fidelity and cloud data synchronization with Firebase.

## Design & Aesthetics

- **Visual Style:** High-contrast neon aesthetics with a deep space theme.
- **Lighting:** 
    - High-intensity ambient (1.0) and directional (2.5) lighting for a vibrant environment.
    - Dynamic SpotLight "headlight" and PointLight "glow" attached to the player ball.
    - Intense emissive materials for tiles, coins, and power-ups.
- **Background:**
    - Deep space scene with a 2000-star starfield.
    - Fog effect (0x0a0a25) for depth and performance.
    - Pulsing neon grid on the floor.
- **Voice Feedback:**
    - Real-time voice feedback using `SpeechSynthesisUtterance`.
    - Natural voice parameters (rate 1.0, pitch 1.0).
- **Animations:**
    - High-performance sprite-based floating text.
    - Smooth camera movement following the ball.
    - Material pulsing and particle trails.

## Features

- **Core Gameplay:** Endless runner style with increasing speed based on score.
- **Obstacles:** Variety of moving and static obstacles (boxes, crushers, windmills, bouncers, lasers, pendulums, gates).
- **Power-ups:**
    - **Jump Pad:** Standard jump.
    - **Super Jump Pad:** Initiates flight mode with a rainbow trail.
    - **Titan Orb:** Increases ball size and grants invincibility.
    - **Boost Pad:** Temporary speed increase and FOV expansion.
- **Currency & Scoring:**
    - Coins collected during gameplay (stored in LocalStorage and Firestore).
    - Score calculated based on distance and bonuses.
    - **Revive System:** Costs 300 coins to continue after a crash.
- **Firebase Integration:**
    - Google Authentication for user identification.
    - Firestore synchronization for high scores and coin totals.
    - Automatic data merging between LocalStorage and Cloud.

## File Structure

- `index.html`: UI structure, including game overlays and auth status.
- `style.css`: Modern CSS using variables and OKLCH color space.
- `main.js`: Core game logic, Three.js implementation, and Firebase integration.
- `firebase-config.js`: Firebase SDK configuration.

## Recent Changes (March 21, 2026)

- **Aesthetic Restoration:** 
    - Reverted lighting and background to original "intense" levels.
    - Restored ball headlight and immediate glow effects.
    - Restored high emissive intensities for all game objects.
    - Reverted voice feedback to natural rate and pitch.
    - Set sound to be enabled by default.
