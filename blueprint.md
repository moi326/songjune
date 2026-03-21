# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers while maintaining high visual fidelity and cloud data synchronization with Firebase.

## Design & Aesthetics

- **Visual Style:** High-contrast aesthetics with a deep space theme.
- **Lighting:** 
    - Original intensities restored: Ambient (0.4) and Directional (1.0).
    - No direct light sources attached to the player ball.
    - All game objects use standard materials without self-illumination (emissive effects removed).
- **Background:**
    - Original background color (`0x050510`) and fog (`0x050510`, 10, 150) restored.
    - Deep space scene with a 2000-star starfield.
    - Pulsing neon grid on the floor.
- **Voice Feedback:**
    - Real-time voice feedback using `SpeechSynthesisUtterance`.
    - Natural voice parameters (rate 1.0, pitch 1.0).
- **Animations:**
    - High-performance sprite-based floating text.
    - Smooth camera movement following the ball.
    - White particle trails during flight mode.

## Features

- **Core Gameplay:** Endless runner style with increasing speed based on score.
- **Obstacles:** Variety of moving and static obstacles (boxes, crushers, windmills, bouncers, lasers, pendulums, gates).
- **Power-ups:**
    - **Jump Pad:** Standard jump.
    - **Super Jump Pad:** Initiates flight mode with a white trail.
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

- **Initial Brightness Restoration:** 
    - Reverted lighting (Ambient 0.4, Directional 1.0) and background/fog colors (`0x050510`) to the state of the first 3D version.
    - Completely removed ball headlight and glow effects.
    - Removed all emissive (shining) properties from materials while keeping original colors.
