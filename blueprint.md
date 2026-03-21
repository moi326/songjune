# Blueprint: 3D Rolling Ball Game (Fully Optimized)

## Overview

A high-performance, immersive 3D rolling ball game built with Three.js. This version features "Top-to-Bottom" optimizations ensuring 60 FPS on modern web browsers while maintaining high visual fidelity and cloud data synchronization with Firebase.

## Design & Aesthetics

- **Visual Style:** Iconic "Cyber Sunset" (Synthwave) theme with high-intensity neon colors.
- **Lighting & Visibility:** 
    - Ambient (0.5) and Directional (1.2, Magenta).
    - **Neon Elements:** Vibrant pink, cyan, and purple color palette for all game objects.
    - **Interactive Pads:** Brighter emissive glow for jump, boost, and items.
- **Background:**
    - **Synthwave Theme:** 
        - **Retro Neon Sun:** A massive orange/yellow sun centered in the distant horizon.
        - **Magenta Starfield:** Glowing pink stars filling the upper atmosphere.
        - **Infinite Grid:** A glowing cyan/magenta grid floor extending to the horizon.
        - **Deep Purple Fog:** Atmospheric fog creating a seamless transition into the neon horizon.
- **Voice Feedback:**
    - Real-time voice feedback using `SpeechSynthesisUtterance`.
- **Animations:**
    - High-performance sprite-based floating text.
    - Smooth camera movement following the ball.

## Features

- **Core Gameplay:** Endless runner style with increasing speed based on score.
- **Obstacles:** Variety of moving and static neon obstacles.
- **Power-ups:** Jump, Super Jump (Flight), Titan Orb (Invincibility), Boost Pad.
- **Currency & Scoring:** Coins, Score, and High Score systems.
- **Firebase Integration:** Google Auth and Firestore data sync.

## Recent Changes (March 21, 2026)

- **Cyber Sunset Transformation:** 
    - Replaced the space theme with a retro-future Synthwave aesthetic.
    - Added a massive 2D neon sun and magenta-tinted starfield.
    - Re-colored all materials to fit the neon purple/cyan color scheme.
    - Enhanced grid visuals with high-contrast magenta and cyan lines.
    - Brightened all interactive elements for maximum neon impact.
