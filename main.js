import * as THREE from 'three';

// --- CONFIGURATION ---
const TRACK_WIDTH = 10;
const TRACK_LENGTH = 10000;
const TILE_SIZE = 4; // Larger, simpler tiles
const BALL_RADIUS = 0.6;
const GRAVITY = -0.012; // Slightly lower gravity for better feel
const JUMP_IMPULSE = 0.32;
const FORWARD_SPEED = 0.4;
const SIDE_SPEED = 0.25;
const OBSTACLE_SPAWN_INTERVAL = 40; // Reduced obstacles
const JUMP_PAD_SPAWN_INTERVAL = 30; // More frequent jump pads
const COIN_SPAWN_INTERVAL = 10;
const GAP_SPAWN_INTERVAL = 80; 
const TUNNEL_SPAWN_INTERVAL = 150; // New: Tunnels
const SCORE_DIVIDER = 5;
const REVIVE_COST = 300;

// --- GAME STATE ---
let state = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let coins = parseInt(localStorage.getItem('totalCoins')) || 0;
let scene, camera, renderer, ball, bottomFloor;
let clock = new THREE.Clock();
let obstacles = [];
let jumpPads = [];
let coinMeshes = [];
let floorTiles = [];
let tunnels = [];
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

// Update coin display immediately
if (coinValue) coinValue.innerText = coins;

// --- INITIALIZATION ---
function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 150);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ball (Player)
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    // Texture-like material for rotation visibility
    const ballMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffcc, 
        roughness: 0.2,
        metalness: 0.5,
        wireframe: false
    });
    // Add some pattern to the ball to see it roll
    const ballGroup = new THREE.Group();
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    
    // Add detail to see rotation
    const stripeGeo = new THREE.TorusGeometry(BALL_RADIUS, 0.05, 16, 100);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
    const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe2.rotation.y = Math.PI / 2;
    ball.add(stripe1);
    ball.add(stripe2);
    
    scene.add(ball);

    // Thrilling Bottom Floor
    const bottomGeo = new THREE.PlaneGeometry(500, 500);
    const bottomMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122,
        transparent: true,
        opacity: 0.5,
        roughness: 1
    });
    bottomFloor = new THREE.Mesh(bottomGeo, bottomMat);
    bottomFloor.rotation.x = -Math.PI / 2;
    bottomFloor.position.y = -60;
    scene.add(bottomFloor);

    // Add grid to bottom floor
    const grid = new THREE.GridHelper(500, 50, 0x4444ff, 0x222244);
    grid.position.y = -59.9;
    scene.add(grid);

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
    // Don't reset total coins, just current session coins
    coinValue.innerText = coins;
    ball.position.set(0, BALL_RADIUS + 2, 0);
    ball.rotation.set(0, 0, 0);
    ballVelocity.set(0, 0, 0);
    
    clearWorld();

    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';

    // Initial floor generation
    for(let z = 20; z > -150; z -= TILE_SIZE) {
        spawnFloorRow(z);
    }
}

function clearWorld() {
    obstacles.forEach(o => scene.remove(o));
    jumpPads.forEach(j => scene.remove(j));
    coinMeshes.forEach(c => scene.remove(c));
    floorTiles.forEach(t => scene.remove(t));
    tunnels.forEach(t => scene.remove(t));
    obstacles = [];
    jumpPads = [];
    coinMeshes = [];
    floorTiles = [];
    tunnels = [];
}

function reviveGame() {
    if (coins >= REVIVE_COST) {
        coins -= REVIVE_COST;
        localStorage.setItem('totalCoins', coins);
        coinValue.innerText = coins;
        state = 'PLAYING';
        
        ballVelocity.set(0, 0, 0);
        ball.position.y = BALL_RADIUS + 10; // High in air
        ball.position.x = 0; // Center it
        
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
    // Dynamic difficulty: gaps get longer
    const gapLength = 2 + Math.floor(score / 500); 
    const isGap = z < -40 && Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE * gapLength;
    
    if (isGap) {
        // Only spawn jump pad at the start of the gap
        if (Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE) {
            spawnJumpPad(z + TILE_SIZE, true); 
        }
        return; 
    }

    // Simple tiles
    const tileGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.5, TILE_SIZE);
    const tileMat = new THREE.MeshStandardMaterial({ 
        color: 0x223344,
        roughness: 0.8,
        metalness: 0.2
    });

    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(0, -0.25, z);
    tile.receiveShadow = true;
    scene.add(tile);
    floorTiles.push(tile);
    
    // Maybe spawn a tunnel
    if (z < -100 && Math.abs(z % TUNNEL_SPAWN_INTERVAL) < TILE_SIZE) {
        spawnTunnel(z);
    }
}

function spawnTunnel(z) {
    const tunnelGroup = new THREE.Group();
    const height = 4;
    const length = TILE_SIZE * 8;
    const isNarrow = Math.random() > 0.5;
    const width = isNarrow ? 4 : TRACK_WIDTH;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    
    // Left Wall
    const sideWallGeo = new THREE.BoxGeometry(1, height, length);
    const leftWall = new THREE.Mesh(sideWallGeo, wallMat);
    leftWall.position.set(-width/2 - 0.5, height/2 - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(sideWallGeo, wallMat);
    rightWall.position.set(width/2 + 0.5, height/2 - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(rightWall);

    // Ceiling
    const ceilingGeo = new THREE.BoxGeometry(width + 2, 0.5, length);
    const ceiling = new THREE.Mesh(ceilingGeo, wallMat);
    ceiling.position.set(0, height - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(ceiling);

    tunnelGroup.position.z = z;
    scene.add(tunnelGroup);
    tunnels.push(tunnelGroup);
}

function spawnObstacle(z) {
    // Don't spawn obstacles inside tunnels or near gaps
    if (tunnels.some(t => Math.abs(t.position.z - z) < 30)) return;
    
    const types = ['box', 'movingBox', 'crusher', 'pyramid'];
    const type = types[Math.floor(Math.random() * types.length)];
    let geo, mat, mesh;

    if (type === 'box') {
        const w = 2 + Math.random() * 2;
        geo = new THREE.BoxGeometry(w, 1.5, 1.5);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - w), 0.75, z);
    } else if (type === 'movingBox') {
        const w = 3;
        geo = new THREE.BoxGeometry(w, 1.5, 1.5);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 0.75, z);
        mesh.userData = { isMoving: true, speed: (Math.random() > 0.5 ? 1 : -1) * 0.1 };
    } else if (type === 'crusher') {
        geo = new THREE.BoxGeometry(TRACK_WIDTH, 2, 2);
        mat = new THREE.MeshStandardMaterial({ color: 0xaa00ff });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 4, z);
        mesh.userData = { isCrusher: true, timeOffset: Math.random() * Math.PI, speed: 0.005 };
    } else if (type === 'pyramid') {
        geo = new THREE.ConeGeometry(1.5, 3, 4);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3300 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 3), 1.5, z);
    }

    if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    }
}

function spawnJumpPad(z, force = false) {
    const geo = new THREE.BoxGeometry(4, 0.4, 4);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00ff00, 
        emissiveIntensity: 1 
    });
    const pad = new THREE.Mesh(geo, mat);
    const xPos = force ? 0 : (Math.random() - 0.5) * (TRACK_WIDTH - 4);
    pad.position.set(xPos, 0.1, z);
    scene.add(pad);
    jumpPads.push(pad);
}

function spawnCoin(z) {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        metalness: 1, 
        roughness: 0.1,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
    });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.x = Math.PI / 2;
    coin.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 2), 1, z);
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
    const currentSpeed = FORWARD_SPEED + (score / 1000); 
    ball.position.z -= currentSpeed;
    score = Math.floor(Math.abs(ball.position.z) / SCORE_DIVIDER);
    scoreValue.innerText = score;

    // Side Movement - NO CLAMP (can fall off)
    let sideMove = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) sideMove = -SIDE_SPEED;
    if (keys['ArrowRight'] || keys['KeyD']) sideMove = SIDE_SPEED;
    ball.position.x += sideMove;

    // Ball Rotation (Visual)
    ball.rotation.x -= currentSpeed / BALL_RADIUS;
    ball.rotation.z -= sideMove / BALL_RADIUS;

    // Vertical Physics
    ballVelocity.y += GRAVITY;
    ball.position.y += ballVelocity.y;

    // Check Ground Collision
    let onGround = false;
    const ballBottom = ball.position.y - BALL_RADIUS;

    // Simplified Collision with Tiles
    floorTiles.forEach(tile => {
        if (Math.abs(ball.position.z - tile.position.z) < TILE_SIZE / 2 + BALL_RADIUS) {
            if (Math.abs(ball.position.x) < TRACK_WIDTH / 2 + BALL_RADIUS) {
                if (ballBottom <= 0 && ballBottom > -1 && ballVelocity.y <= 0) {
                    ball.position.y = BALL_RADIUS;
                    ballVelocity.y = 0;
                    onGround = true;
                }
            }
        }
    });

    // Fall check (Thrilling fall to bottom)
    if (ball.position.y < -55) {
        gameOver();
    }
    
    // Instant Game Over if hits bottom floor but we want to see the fall
    if (ball.position.y < -10 && !onGround && state === 'PLAYING') {
        // Just let it fall
    }

    // Update Animations
    obstacles.forEach(o => {
        if (o.userData) {
            if (o.userData.isMoving) {
                o.position.x += o.userData.speed;
                if (Math.abs(o.position.x) > TRACK_WIDTH / 2 - 1) o.userData.speed *= -1;
            } else if (o.userData.isCrusher) {
                const time = Date.now() * o.userData.speed + o.userData.timeOffset;
                o.position.y = 1.0 + Math.abs(Math.sin(time)) * 5;
            }
        }
    });

    coinMeshes.forEach(c => { c.rotation.z += 0.05; });

    // Spawning Logic
    const nextSpawnZ = ball.position.z - 120;
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
        if (box.intersectsSphere(ballSphere)) {
            ballVelocity.y = JUMP_IMPULSE * 1.5;
        }
    });

    // Collision Detection: Coins
    coinMeshes = coinMeshes.filter(c => {
        const dist = ball.position.distanceTo(c.position);
        if (dist < BALL_RADIUS + 0.6) {
            coins += 10;
            localStorage.setItem('totalCoins', coins);
            coinValue.innerText = coins;
            scene.remove(c);
            return false;
        }
        return true;
    });

    // Cleanup
    const cleanupZ = ball.position.z + 50;
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
    tunnels = tunnels.filter(t => {
        if (t.position.z > cleanupZ) { scene.remove(t); return false; }
        return true;
    });

    // Camera follow
    camera.position.z = ball.position.z + 14;
    camera.position.x = ball.position.x * 0.5;
    camera.position.y = 8 + Math.max(0, -ball.position.y * 0.2); // Look down when falling
    camera.lookAt(ball.position.x, ball.position.y, ball.position.z - 10);
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

