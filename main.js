import * as THREE from 'three';

// --- CONFIGURATION ---
const TRACK_WIDTH = 10;
const TRACK_LENGTH = 10000;
const TILE_SIZE = 2; // Size of each arena tile
const BALL_RADIUS = 0.5;
const GRAVITY = -0.015;
const JUMP_IMPULSE = 0.35;
const FORWARD_SPEED = 0.3;
const SIDE_SPEED = 0.2;
const OBSTACLE_SPAWN_INTERVAL = 15;
const JUMP_PAD_SPAWN_INTERVAL = 40; // More frequent to help with gaps
const COIN_SPAWN_INTERVAL = 5;
const GAP_SPAWN_INTERVAL = 60; // Gaps appear every 60 units
const SCORE_DIVIDER = 5;
const REVIVE_COST = 300;

// --- GAME STATE ---
let state = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let coins = 0;
let scene, camera, renderer, ball;
let clock = new THREE.Clock();
let obstacles = [];
let jumpPads = [];
let coinMeshes = [];
let floorTiles = [];
let keys = {};
let ballVelocity = new THREE.Vector3(0, 0, 0);

// --- ELEMENTS ---
const scoreValue = document.getElementById('score-value');
const coinValue = document.getElementById('coin-value');
const finalScore = document.getElementById('final-score');
const startOverlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const reviveContainer = document.getElementById('revive-container');
const reviveButton = document.getElementById('revive-button');
const container = document.getElementById('canvas-container');

// --- INITIALIZATION ---
function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020205);
    scene.fog = new THREE.Fog(0x020205, 15, 80);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 6, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    // Ball (Player)
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffcc, 
        emissive: 0x00ffcc, 
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9
    });
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.y = BALL_RADIUS + 2;
    scene.add(ball);

    // Event Listeners
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') handleSpacePress();
    });
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('resize', onWindowResize);
    reviveButton.addEventListener('click', reviveGame);

    animate();
}

function handleSpacePress() {
    if (state === 'START' || state === 'GAMEOVER') {
        resetGame();
    }
}

function resetGame() {
    state = 'PLAYING';
    score = 0;
    coins = 0;
    coinValue.innerText = coins;
    ball.position.set(0, BALL_RADIUS + 2, 0);
    ballVelocity.set(0, 0, 0);
    
    clearWorld();

    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';

    // Initial floor generation
    for(let z = 20; z > -100; z -= TILE_SIZE) {
        spawnFloorRow(z);
    }
}

function clearWorld() {
    obstacles.forEach(o => scene.remove(o));
    jumpPads.forEach(j => scene.remove(j));
    coinMeshes.forEach(c => scene.remove(c));
    floorTiles.forEach(t => scene.remove(t));
    obstacles = [];
    jumpPads = [];
    coinMeshes = [];
    floorTiles = [];
}

function reviveGame() {
    if (coins >= REVIVE_COST) {
        coins -= REVIVE_COST;
        coinValue.innerText = coins;
        state = 'PLAYING';
        
        ballVelocity.set(0, 0, 0);
        ball.position.y = BALL_RADIUS + 10; // High in air
        
        const currentZ = ball.position.z;
        obstacles = obstacles.filter(o => {
            if (o.position.z < currentZ && o.position.z > currentZ - 50) {
                scene.remove(o);
                return false;
            }
            return true;
        });

        gameOverOverlay.style.display = 'none';
    }
}

function spawnFloorRow(z) {
    // Determine if this row is a GAP
    // We don't want a gap at the very beginning
    const isGap = z < -30 && Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE;
    
    if (isGap) {
        // Before a gap, spawn a guaranteed jump pad
        spawnJumpPad(z + TILE_SIZE * 3, true); 
        return; 
    }

    const tileGeo = new THREE.BoxGeometry(TILE_SIZE - 0.1, 0.4, TILE_SIZE - 0.1);
    const tileMat = new THREE.MeshStandardMaterial({ 
        color: 0x112233,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x001122,
        emissiveIntensity: 0.2
    });

    for(let x = -TRACK_WIDTH/2 + TILE_SIZE/2; x < TRACK_WIDTH/2; x += TILE_SIZE) {
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(x, -0.2, z);
        tile.receiveShadow = true;
        scene.add(tile);
        floorTiles.push(tile);
    }
}

function spawnObstacle(z) {
    const types = ['box', 'tallBox', 'movingBox', 'crusher', 'laser', 'pyramid', 'drone', 'mines'];
    const type = types[Math.floor(Math.random() * types.length)];
    let geo, mat, mesh;

    if (type === 'box') {
        const w = 1 + Math.random() * 2;
        const h = 1 + Math.random() * 2;
        geo = new THREE.BoxGeometry(w, h, 1.5);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3366, roughness: 0.4 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - w), h / 2, z);
    } else if (type === 'tallBox') {
        const r = 0.5 + Math.random();
        geo = new THREE.CylinderGeometry(r, r, 5 + Math.random() * 3, 16);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.5 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - r * 2), 2.5, z);
    } else if (type === 'movingBox') {
        const w = 2 + Math.random();
        const h = 1.5;
        geo = new THREE.BoxGeometry(w, h, 1.5);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.8, roughness: 0.2 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, h / 2, z);
        mesh.userData = { isMoving: true, speed: (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.15) };
    } else if (type === 'crusher') {
        const w = 2 + Math.random() * 2;
        geo = new THREE.BoxGeometry(w, 2, 2);
        mat = new THREE.MeshStandardMaterial({ color: 0xaa00ff, roughness: 0.1 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - w), 4, z);
        mesh.userData = { isCrusher: true, timeOffset: Math.random() * Math.PI * 2, speed: 0.005 + Math.random() * 0.005 };
    } else if (type === 'laser') {
        const w = TRACK_WIDTH / 1.5;
        geo = new THREE.BoxGeometry(w, 0.4, 0.4);
        mat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
        mesh = new THREE.Mesh(geo, mat);
        const side = Math.random() > 0.5 ? 1 : -1;
        mesh.position.set(side * (TRACK_WIDTH / 4), 0.5 + Math.random() * 1.5, z);
        mesh.userData = { isLaser: true, timeOffset: Math.random() * 100 };
    } else if (type === 'pyramid') {
        geo = new THREE.ConeGeometry(1.5, 3, 4);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3300, flatShading: true });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 3), 1.5, z);
    } else if (type === 'drone') {
        geo = new THREE.OctahedronGeometry(1.2);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ffaa, emissive: 0x00ffaa, emissiveIntensity: 0.5, wireframe: true });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 1.5, z);
        mesh.userData = { isDrone: true, timeOffset: Math.random() * 100, speed: 0.003 + Math.random() * 0.002 };
    } else if (type === 'mines') {
        geo = new THREE.IcosahedronGeometry(0.7);
        mat = new THREE.MeshStandardMaterial({ color: 0xff0044, metalness: 0.8 });
        for (let i = -1; i <= 1; i++) {
            if (Math.random() > 0.2) {
                const mine = new THREE.Mesh(geo, mat);
                mine.position.set(i * (TRACK_WIDTH / 2.5) + (Math.random() - 0.5), 0.7, z + (Math.random() * 2 - 1));
                mine.userData = { isMine: true };
                mine.castShadow = true;
                mine.receiveShadow = true;
                scene.add(mine);
                obstacles.push(mine);
            }
        }
        return;
    }

    if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    }
}

function spawnJumpPad(z, force = false) {
    if (!force && jumpPads.some(j => Math.abs(j.position.z - z) < 5)) return;

    const geo = new THREE.BoxGeometry(4, 0.4, 3);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00ff00, 
        emissiveIntensity: 1.5 
    });
    const pad = new THREE.Mesh(geo, mat);
    // Center it more if it's a gap-closer
    const xPos = force ? 0 : (Math.random() - 0.5) * (TRACK_WIDTH - 4);
    pad.position.set(xPos, 0.2, z);
    scene.add(pad);
    jumpPads.push(pad);
}

function spawnCoin(z) {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        metalness: 1, 
        roughness: 0.1,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 2), 0.8 + Math.random() * 2, z);
    scene.add(coin);
    coinMeshes.push(coin);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePhysics() {
    if (state !== 'PLAYING') return;

    // Forward Movement
    const currentSpeed = FORWARD_SPEED + (score / 1500); 
    ball.position.z -= currentSpeed;
    score = Math.floor(Math.abs(ball.position.z) / SCORE_DIVIDER);
    scoreValue.innerText = score;

    // Side Movement
    if (keys['ArrowLeft'] || keys['KeyA']) ball.position.x -= SIDE_SPEED;
    if (keys['ArrowRight'] || keys['KeyD']) ball.position.x += SIDE_SPEED;
    ball.position.x = Math.max(-TRACK_WIDTH/2 + BALL_RADIUS, Math.min(TRACK_WIDTH/2 - BALL_RADIUS, ball.position.x));

    // Vertical Physics
    ballVelocity.y += GRAVITY;
    ball.position.y += ballVelocity.y;

    // Check Ground Collision (with Tiles)
    let onGround = false;
    const ballBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(ball.position.x, ball.position.y - BALL_RADIUS, ball.position.z),
        new THREE.Vector3(BALL_RADIUS, 0.2, BALL_RADIUS)
    );

    floorTiles.forEach(tile => {
        const tileBox = new THREE.Box3().setFromObject(tile);
        if (tileBox.intersectsBox(ballBox)) {
            if (ballVelocity.y <= 0) {
                ball.position.y = BALL_RADIUS;
                ballVelocity.y = 0;
                onGround = true;
            }
        }
    });

    // Fall check (Gap detection)
    if (ball.position.y < -10) {
        gameOver();
    }

    // Update Animations
    obstacles.forEach(o => {
        if (o.userData) {
            if (o.userData.isMoving) {
                o.position.x += o.userData.speed;
                if (o.position.x > TRACK_WIDTH / 2 - 1 || o.position.x < -TRACK_WIDTH / 2 + 1) o.userData.speed *= -1;
            } else if (o.userData.isCrusher) {
                const time = Date.now() * o.userData.speed + o.userData.timeOffset;
                o.position.y = 1.0 + Math.abs(Math.sin(time)) * 4;
            } else if (o.userData.isLaser) {
                const time = Date.now() * 0.01 + o.userData.timeOffset;
                const scale = 0.2 + 0.8 * Math.abs(Math.sin(time));
                o.scale.set(1, scale, scale);
            } else if (o.userData.isDrone) {
                const time = Date.now() * o.userData.speed + o.userData.timeOffset;
                o.position.x = Math.sin(time) * (TRACK_WIDTH / 2 - 1.5);
                o.rotation.y += 0.05;
                o.rotation.z += 0.05;
            } else if (o.userData.isMine) {
                o.rotation.x += 0.02;
                o.rotation.y += 0.03;
            }
        }
    });

    coinMeshes.forEach(c => { c.rotation.z += 0.05; });

    // Spawning Logic
    const nextSpawnZ = ball.position.z - 80;
    if (Math.abs(nextSpawnZ % TILE_SIZE) < currentSpeed) {
        spawnFloorRow(nextSpawnZ);
    }
    if (Math.abs(nextSpawnZ % OBSTACLE_SPAWN_INTERVAL) < currentSpeed) {
        spawnObstacle(nextSpawnZ);
    }
    if (Math.abs(nextSpawnZ % JUMP_PAD_SPAWN_INTERVAL) < currentSpeed) {
        spawnJumpPad(nextSpawnZ);
    }
    if (Math.abs(nextSpawnZ % COIN_SPAWN_INTERVAL) < currentSpeed) {
        spawnCoin(nextSpawnZ);
    }

    // Collision Detection: Obstacles
    obstacles.forEach(o => {
        const box = new THREE.Box3().setFromObject(o);
        const ballSphere = new THREE.Sphere(ball.position, BALL_RADIUS);
        if (box.intersectsSphere(ballSphere)) gameOver();
    });

    // Collision Detection: Jump Pads
    jumpPads.forEach(j => {
        const box = new THREE.Box3().setFromObject(j);
        const ballSphere = new THREE.Sphere(ball.position, BALL_RADIUS);
        if (box.intersectsSphere(ballSphere)) ballVelocity.y = JUMP_IMPULSE * 1.5;
    });

    // Collision Detection: Coins
    coinMeshes = coinMeshes.filter(c => {
        const dist = ball.position.distanceTo(c.position);
        if (dist < BALL_RADIUS + 0.6) {
            coins += 10;
            coinValue.innerText = coins;
            scene.remove(c);
            return false;
        }
        return true;
    });

    // Cleanup
    const cleanupZ = ball.position.z + 20;
    floorTiles = floorTiles.filter(t => {
        if (t.position.z > cleanupZ) { scene.remove(t); return false; }
        return true;
    });
    obstacles = obstacles.filter(o => {
        if (o.position.z > cleanupZ) { scene.remove(o); return false; }
        return true;
    });
    jumpPads = jumpPads.filter(j => {
        if (j.position.z > cleanupZ) { scene.remove(j); return false; }
        return true;
    });
    coinMeshes = coinMeshes.filter(c => {
        if (c.position.z > cleanupZ) { scene.remove(c); return false; }
        return true;
    });

    // Camera follow
    camera.position.z = ball.position.z + 10;
    camera.position.x = ball.position.x * 0.7;
    camera.lookAt(ball.position.x, ball.position.y, ball.position.z - 5);
}

function gameOver() {
    state = 'GAMEOVER';
    finalScore.innerText = score;
    gameOverOverlay.style.display = 'flex';
    reviveContainer.style.display = coins >= REVIVE_COST ? 'block' : 'none';
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

init();
