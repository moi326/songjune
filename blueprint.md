# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers while maintaining high visual fidelity and cloud data synchronization with Firebase.

## Design & Aesthetics

- **Visual Style:** High-contrast aesthetics with a majestic "Space Odyssey" theme.
- **Lighting & Visibility:** 
    - Ambient (0.4) and Directional (1.0).
    - **Brightened Elements:** Floor tiles, obstacles, and pads have been brightened for better visibility.
    - **Subtle Glow:** Key game pads (jump, boost, score) feature a subtle emissive glow to make them "pop" against the dark space background.
    - Standard materials used with optimized roughness and metalness.
- **Background:**
    - **Space Adventure Theme:** 
        - **Distant Planets:** Large, slowly rotating spheres in various colors.
        - **Shooting Stars:** Dynamic streaks of light flying across the distance.
        - **Layered Starfield:** Multiple layers of stars for a parallax effect.
        - **Distant Nebula:** A subtle, deep purple glow effect.
- **Voice Feedback:**
    - Real-time voice feedback using `SpeechSynthesisUtterance`.
- **Animations:**
    - High-performance sprite-based floating text.
    - Smooth camera movement following the ball.

## Features

- **Core Gameplay:** Endless runner style with increasing speed based on score.
- **Obstacles:** Variety of moving and static obstacles.
- **Power-ups:** Jump, Super Jump (Flight), Titan Orb (Invincibility), Boost Pad.
- **Currency & Scoring:** Coins, Score, and High Score systems.
- **Firebase Integration:** Google Auth and Firestore data sync.

## Recent Changes (March 21, 2026)

- **Aesthetic Refinement:** 
    - Brightened floor tiles (`0x222222`) and obstacles for better gameplay clarity.
    - Re-introduced subtle emissive properties to interactive pads to improve visibility.
    - Optimized material properties (roughness/metalness) for a cleaner look.
- **Space Odyssey Upgrade:** Added planets and shooting stars to the background.
