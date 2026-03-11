import * as THREE from 'three';

// --- CONFIGURATION ---
const TRACK_WIDTH = 10;
const TRACK_LENGTH = 10000;
const TILE_SIZE = 4; 
const BALL_RADIUS = 0.6;
const GRAVITY = -0.012; 
const JUMP_IMPULSE = 0.32;
const SUPER_JUMP_IMPULSE = 1.5; // Huge jump
const FLIGHT_DURATION = 10; // Seconds
const FORWARD_SPEED = 0.4;
const SIDE_SPEED = 0.25;
const OBSTACLE_SPAWN_INTERVAL = 40; 
const JUMP_PAD_SPAWN_INTERVAL = 30; 
const COIN_SPAWN_INTERVAL = 10;
const GAP_SPAWN_INTERVAL = 80; 
const TUNNEL_SPAWN_INTERVAL = 150; 
const SCORE_DIVIDER = 5;
const REVIVE_COST = 300;

// --- GAME STATE ---
let state = 'START'; 
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let coins = parseInt(localStorage.getItem('totalCoins')) || 0;
let isFlying = false;
let flightTimer = 0;
let scene, camera, renderer, ball, bottomFloor;
let clock = new THREE.Clock();
let obstacles = [];
let jumpPads = [];
let superJumpPads = [];
let scorePads = [];
let coinMeshes = [];
let floorTiles = [];
let tunnels = [];
let flightTrail = [];
let titanOrbs = [];
let boostPads = [];
let keys = {};
let ballVelocity = new THREE.Vector3(0, 0, 0);
let isTitan = false;
let titanTimer = 0;
let isBoosting = false;
let boostTimer = 0;

// --- ELEMENTS ---
const scoreValue = document.getElementById('score-value');
const highScoreValue = document.getElementById('high-score-value');
const coinValue = document.getElementById('coin-value');
const finalScore = document.getElementById('final-score');
const startOverlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const reviveContainer = document.getElementById('revive-container');
const reviveButton = document.getElementById('revive-button');
const container = document.getElementById('canvas-container');

if (coinValue) coinValue.innerText = coins;
if (highScoreValue) highScoreValue.innerText = highScore;

// --- INITIALIZATION ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 250); // Increased fog range for flight

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffcc, 
        roughness: 0.2,
        metalness: 0.5
    });
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    
    const stripeGeo = new THREE.TorusGeometry(BALL_RADIUS, 0.05, 16, 100);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
    const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
    stripe2.rotation.y = Math.PI / 2;
    ball.add(stripe1);
    ball.add(stripe2);
    scene.add(ball);

    const bottomGeo = new THREE.PlaneGeometry(1000, 1000);
    const bottomMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122,
        transparent: true,
        opacity: 0.5
    });
    bottomFloor = new THREE.Mesh(bottomGeo, bottomMat);
    bottomFloor.rotation.x = -Math.PI / 2;
    bottomFloor.position.y = -100;
    scene.add(bottomFloor);

    const grid = new THREE.GridHelper(1000, 50, 0x4444ff, 0x222244);
    grid.position.y = -99.9;
    scene.add(grid);

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
    isFlying = false;
    flightTimer = 0;
    coinValue.innerText = coins;
    ball.position.set(0, BALL_RADIUS + 2, 0);
    ball.rotation.set(0, 0, 0);
    ballVelocity.set(0, 0, 0);
    ball.material.emissive.setHex(0x000000);
    
    clearWorld();

    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';

    for(let z = 20; z > -150; z -= TILE_SIZE) {
        spawnFloorRow(z);
    }
}

function clearWorld() {
    [obstacles, jumpPads, superJumpPads, scorePads, coinMeshes, floorTiles, tunnels, flightTrail, titanOrbs, boostPads].forEach(arr => {
        arr.forEach(o => scene.remove(o));
        arr.length = 0;
    });
}

function reviveGame() {
    if (coins >= REVIVE_COST) {
        coins -= REVIVE_COST;
        localStorage.setItem('totalCoins', coins);
        coinValue.innerText = coins;
        state = 'PLAYING';
        isFlying = false;
        flightTimer = 0;
        isTitan = false;
        titanTimer = 0;
        isBoosting = false;
        boostTimer = 0;
        ball.scale.set(1, 1, 1);
        camera.fov = 75;
        camera.updateProjectionMatrix();
        ballVelocity.set(0, 0, 0);
        ball.position.y = BALL_RADIUS + 10;
        ball.position.x = 0;
        gameOverOverlay.style.display = 'none';
    }
}

function spawnFloorRow(z) {
    const gapLength = 2 + Math.floor(score / 500); 
    const isGap = z < -40 && Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE * gapLength;
    
    if (isGap) {
        if (Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE) {
            // Randomly spawn super jump pad instead of normal jump pad
            if (Math.random() > 0.8) spawnSuperJumpPad(z + TILE_SIZE);
            else spawnJumpPad(z + TILE_SIZE, true); 
        }
        return; 
    }

    const tileGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.5, TILE_SIZE);
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x223344 });
    const tile = new THREE.Mesh(tileGeo, tileMat);
    tile.position.set(0, -0.25, z);
    tile.receiveShadow = true;
    scene.add(tile);
    floorTiles.push(tile);
    
    // Randomly spawn negative score pads on normal floor
    if (Math.abs(z) > 100 && Math.random() > 0.92) {
        spawnScorePad(z);
    }

    if (z < -100 && Math.abs(z % TUNNEL_SPAWN_INTERVAL) < TILE_SIZE) {
        spawnTunnel(z);
    }
}

function spawnTunnel(z) {
    const tunnelGroup = new THREE.Group();
    const height = 6;
    const length = TILE_SIZE * 12;
    const width = TRACK_WIDTH + 2;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8, roughness: 0.2 });
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, length), wallMat);
    leftWall.position.set(-width/2, height/2 - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, length), wallMat);
    rightWall.position.set(width/2, height/2 - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.5, length), wallMat);
    ceiling.position.set(0, height - 0.25, -length/2 + TILE_SIZE/2);
    tunnelGroup.add(ceiling);

    // Neon Ribs
    for(let i=0; i<length; i+=4) {
        const ribGeo = new THREE.BoxGeometry(width + 1, 0.2, 0.2);
        const rib = new THREE.Mesh(ribGeo, neonMat);
        rib.position.set(0, height - 0.5, -i + TILE_SIZE/2);
        tunnelGroup.add(rib);
        
        const sideRibGeo = new THREE.BoxGeometry(0.2, height, 0.2);
        const lRib = new THREE.Mesh(sideRibGeo, neonMat);
        lRib.position.set(-width/2 + 0.3, height/2, -i + TILE_SIZE/2);
        tunnelGroup.add(lRib);
        const rRib = new THREE.Mesh(sideRibGeo, neonMat);
        rRib.position.set(width/2 - 0.3, height/2, -i + TILE_SIZE/2);
        tunnelGroup.add(rRib);
    }

    tunnelGroup.position.z = z;
    scene.add(tunnelGroup);
    tunnels.push(tunnelGroup);
}

function spawnObstacle(z) {
    if (tunnels.some(t => Math.abs(t.position.z - z) < 40)) return;
    
    const types = ['box', 'movingBox', 'crusher', 'pyramid', 'windmill', 'bouncer', 'laser', 'pendulum', 'gates', 'spikes', 'blackhole'];
    const type = types[Math.floor(Math.random() * types.length)];
    let geo, mat, mesh;

    if (type === 'box') {
        const w = 2 + Math.random() * 2;
        geo = new THREE.BoxGeometry(w, 1.5, 1.5);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - w), 0.75, z);
    } else if (type === 'movingBox') {
        geo = new THREE.BoxGeometry(3, 1.5, 1.5);
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
    } else if (type === 'windmill') {
        geo = new THREE.BoxGeometry(TRACK_WIDTH + 4, 1.0, 1.0);
        mat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 1.5, z);
        mesh.userData = { isWindmill: true, speed: (Math.random() > 0.5 ? 1 : -1) * 0.05 };
    } else if (type === 'bouncer') {
        const r = 1.5 + Math.random();
        geo = new THREE.SphereGeometry(r, 16, 16);
        mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - r*2), r, z);
        mesh.userData = { isBouncer: true, timeOffset: Math.random() * Math.PI * 2, bounceSpeed: 0.005, height: 4 + Math.random() * 5, startY: r };
    } else if (type === 'laser') {
        geo = new THREE.CylinderGeometry(0.2, 0.2, TRACK_WIDTH + 4);
        mat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(0, 1.5, z);
        mesh.userData = { isLaser: true, timeOffset: Math.random() * Math.PI * 2, blinkSpeed: 0.003 };
    } else if (type === 'pendulum') {
        const group = new THREE.Group();
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0x888888 }));
        rod.position.y = -5;
        group.add(rod);
        const pBall = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
        pBall.position.y = -10;
        group.add(pBall);
        group.position.set(0, 12, z);
        group.userData = { isPendulum: true, timeOffset: Math.random() * Math.PI * 2, speed: 0.002, angle: Math.PI / 3 };
        mesh = group;
    } else if (type === 'gates') {
        const group = new THREE.Group();
        const lGate = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH/2, 4, 1), new THREE.MeshStandardMaterial({ color: 0x4444ff }));
        lGate.position.x = -TRACK_WIDTH/4 - 2;
        const rGate = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH/2, 4, 1), new THREE.MeshStandardMaterial({ color: 0x4444ff }));
        rGate.position.x = TRACK_WIDTH/4 + 2;
        group.add(lGate, rGate);
        group.position.set(0, 2, z);
        group.userData = { isGates: true, timeOffset: Math.random() * Math.PI * 2, speed: 0.002, leftGate: lGate, rightGate: rGate };
        mesh = group;
    } else if (type === 'spikes') {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0x222222 })));
        const spikeGeo = new THREE.ConeGeometry(0.3, 1.5, 8);
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        for(let i=0; i<5; i++) for(let j=0; j<3; j++) {
            const s = new THREE.Mesh(spikeGeo, spikeMat);
            s.position.set(-TRACK_WIDTH/2 + 1 + i*2, 0, -1.5 + j*1.5);
            group.add(s);
        }
        group.position.set(0, -0.1, z);
        group.userData = { isSpikes: true, timeOffset: Math.random() * Math.PI * 2, speed: 0.004 };
        mesh = group;
    } else if (type === 'blackhole') {
        geo = new THREE.CylinderGeometry(2, 2, 0.2, 32);
        mat = new THREE.MeshBasicMaterial({ color: 0x110022 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 4), 0.1, z);
        
        const auraGeo = new THREE.TorusGeometry(2, 0.2, 16, 100);
        const auraMat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.5 });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.rotation.x = Math.PI / 2;
        mesh.add(aura);
        
        mesh.userData = { isBlackhole: true };
    }

    if (mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    }
}

function spawnJumpPad(z, force = false) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 }));
    pad.position.set(force ? 0 : (Math.random() - 0.5) * (TRACK_WIDTH - 4), 0.1, z);
    scene.add(pad);
    jumpPads.push(pad);
}

function spawnSuperJumpPad(z) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 5), new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 }));
    pad.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 5), 0.1, z);
    // Add rainbow ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.1, 16, 100), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    ring.rotation.x = Math.PI / 2;
    pad.add(ring);
    scene.add(pad);
    superJumpPads.push(pad);
}

function spawnScorePad(z) {
    const values = [10, 20, 30, 40, 50];
    const val = values[Math.floor(Math.random() * values.length)];
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 3), new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }));
    pad.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 3), 0.05, z);
    pad.userData = { scorePenalty: val };
    
    // Floating text-like indicator
    const sprite = createTextSprite("-" + val);
    sprite.position.y = 2;
    pad.add(sprite);
    
    scene.add(pad);
    scorePads.push(pad);
}

function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64; canvas.height = 64;
    ctx.fillStyle = 'red'; ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center'; ctx.fillText(text, 32, 45);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(2, 2, 1);
    return sprite;
}

function spawnCoin(z) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, emissive: 0xffd700, emissiveIntensity: 0.5 }));
    coin.rotation.x = Math.PI / 2;
    coin.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 2), 1, z);
    scene.add(coin);
    coinMeshes.push(coin);
}

function spawnTitanOrb(z) {
    const geo = new THREE.IcosahedronGeometry(0.8, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: true, emissive: 0x00ffff, emissiveIntensity: 2 });
    const orb = new THREE.Mesh(geo, mat);
    orb.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 2), 1.5, z);
    scene.add(orb);
    titanOrbs.push(orb);
}

function spawnBoostPad(z) {
    const geo = new THREE.BoxGeometry(4, 0.2, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1 });
    const pad = new THREE.Mesh(geo, mat);
    pad.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 4), 0.1, z);
    // Add chevron arrows
    const arrowGeo = new THREE.ConeGeometry(1.5, 2, 3);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow1 = new THREE.Mesh(arrowGeo, arrowMat);
    arrow1.rotation.x = -Math.PI / 2;
    arrow1.position.set(0, 0.2, 1);
    const arrow2 = new THREE.Mesh(arrowGeo, arrowMat);
    arrow2.rotation.x = -Math.PI / 2;
    arrow2.position.set(0, 0.2, -2);
    pad.add(arrow1, arrow2);
    
    scene.add(pad);
    boostPads.push(pad);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePhysics() {
    if (state !== 'PLAYING') return;

    if (isTitan) {
        titanTimer -= 1/60;
        if (titanTimer <= 0) {
            isTitan = false;
            ball.scale.set(1, 1, 1);
        }
    }
    
    if (isBoosting) {
        boostTimer -= 1/60;
        camera.fov = THREE.MathUtils.lerp(camera.fov, 110, 0.1);
        camera.updateProjectionMatrix();
        if (boostTimer <= 0) {
            isBoosting = false;
        }
    } else {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 75, 0.1);
        camera.updateProjectionMatrix();
    }

    let currentSpeed = FORWARD_SPEED + (score / 1000);
    if (isBoosting) currentSpeed += 1.5;

    ball.position.z -= currentSpeed;
    score = Math.max(0, Math.floor(Math.abs(ball.position.z) / SCORE_DIVIDER));
    scoreValue.innerText = score;

    if (score > highScore) {
        highScore = score;
        highScoreValue.innerText = highScore;
    }

    let sideMove = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) sideMove = -SIDE_SPEED;
    if (keys['ArrowRight'] || keys['KeyD']) sideMove = SIDE_SPEED;
    ball.position.x += sideMove;

    ball.rotation.x -= currentSpeed / BALL_RADIUS;
    ball.rotation.z -= sideMove / BALL_RADIUS;

    if (isFlying) {
        flightTimer -= 1/60;
        ballVelocity.y = 0; // Float
        ball.position.y = THREE.MathUtils.lerp(ball.position.y, 40, 0.05); // Rise to sky
        ball.material.emissive.setHSL(Date.now() % 1000 / 1000, 1, 0.5);
        
        // Spawn trail
        if (Math.abs(ball.position.z % 2) < currentSpeed) {
            const p = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({ color: ball.material.emissive.clone() }));
            p.position.copy(ball.position);
            scene.add(p);
            flightTrail.push(p);
        }

        if (flightTimer <= 0) {
            isFlying = false;
            ball.material.emissive.setHex(0x000000);
        }
    } else {
        ballVelocity.y += GRAVITY;
        ball.position.y += ballVelocity.y;
    }

    let onGround = false;
    const ballBottom = ball.position.y - BALL_RADIUS;

    floorTiles.forEach(tile => {
        if (Math.abs(ball.position.z - tile.position.z) < TILE_SIZE / 2 + BALL_RADIUS) {
            if (Math.abs(ball.position.x) < TRACK_WIDTH / 2 + BALL_RADIUS) {
                if (ballBottom <= 0 && ballBottom > -1 && ballVelocity.y <= 0 && !isFlying) {
                    ball.position.y = BALL_RADIUS;
                    ballVelocity.y = 0;
                    onGround = true;
                }
            }
        }
    });

    if (ball.position.y < -90) gameOver();

    obstacles.forEach(o => {
        if (o.userData) {
            const time = Date.now() * (o.userData.speed || o.userData.bounceSpeed || 0.002) + o.userData.timeOffset;
            if (o.userData.isMoving) {
                o.position.x += o.userData.speed;
                if (Math.abs(o.position.x) > TRACK_WIDTH / 2 - 1) o.userData.speed *= -1;
            } else if (o.userData.isCrusher) o.position.y = 1.0 + Math.abs(Math.sin(time)) * 5;
            else if (o.userData.isWindmill) { o.rotation.y += o.userData.speed; o.rotation.z += o.userData.speed; }
            else if (o.userData.isBouncer) o.position.y = o.userData.startY + Math.abs(Math.sin(time)) * o.userData.height;
            else if (o.userData.isLaser) o.visible = Math.sin(time) > 0;
            else if (o.userData.isPendulum) o.rotation.z = Math.sin(time) * o.userData.angle;
            else if (o.userData.isGates) {
                const offset = Math.abs(Math.sin(time)) * 4;
                o.userData.leftGate.position.x = -TRACK_WIDTH / 4 - 2 + offset;
                o.userData.rightGate.position.x = TRACK_WIDTH / 4 + 2 - offset;
            } else if (o.userData.isSpikes) {
                const spikeY = Math.max(-1.5, Math.sin(time) * 2);
                o.children.forEach((c, i) => { if (i > 0) c.position.y = spikeY; });
            } else if (o.userData.isBlackhole) {
                o.rotation.y -= 0.05;
                o.children[0].rotation.z += 0.1;
                const distZ = Math.abs(ball.position.z - o.position.z);
                if (distZ < 20 && !isFlying && !isTitan) {
                    const pullStr = (20 - distZ) * 0.005;
                    ball.position.x = THREE.MathUtils.lerp(ball.position.x, o.position.x, pullStr);
                }
            }
        }
    });

    coinMeshes.forEach(c => { c.rotation.z += 0.05; });
    flightTrail.forEach(p => { p.scale.multiplyScalar(0.95); if(p.scale.x < 0.1) { scene.remove(p); flightTrail.shift(); } });

    const nextSpawnZ = ball.position.z - 120;
    if (Math.abs(nextSpawnZ % TILE_SIZE) < currentSpeed) spawnFloorRow(nextSpawnZ);
    if (Math.abs(nextSpawnZ % OBSTACLE_SPAWN_INTERVAL) < currentSpeed) spawnObstacle(nextSpawnZ);
    if (Math.abs(nextSpawnZ % COIN_SPAWN_INTERVAL) < currentSpeed) spawnCoin(nextSpawnZ);
    if (Math.abs(nextSpawnZ % 200) < currentSpeed) spawnTitanOrb(nextSpawnZ);
    if (Math.abs(nextSpawnZ % 150) < currentSpeed) spawnBoostPad(nextSpawnZ);

    if (!isFlying) {
        obstacles = obstacles.filter(o => {
            if (!o.visible) return true;
            const box = new THREE.Box3().setFromObject(o);
            const ballSphere = new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS);
            if (box.intersectsSphere(ballSphere)) {
                if (isTitan && !o.userData.isBlackhole) {
                    scene.remove(o);
                    return false; // Destroy obstacle
                } else {
                    gameOver();
                }
            }
            return true;
        });
    }

    jumpPads.forEach(j => {
        if (new THREE.Box3().setFromObject(j).intersectsSphere(new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS))) ballVelocity.y = JUMP_IMPULSE * 1.5;
    });

    superJumpPads.forEach(s => {
        if (new THREE.Box3().setFromObject(s).intersectsSphere(new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS))) {
            ballVelocity.y = SUPER_JUMP_IMPULSE;
            isFlying = true;
            flightTimer = FLIGHT_DURATION;
        }
    });

    scorePads = scorePads.filter(p => {
        if (new THREE.Box3().setFromObject(p).intersectsSphere(new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS))) {
            const penalty = p.userData.scorePenalty * SCORE_DIVIDER;
            ball.position.z += penalty; // Move ball backward to reduce distance-based score
            scene.remove(p);
            return false;
        }
        return true;
    });

    titanOrbs = titanOrbs.filter(t => {
        t.rotation.y += 0.05;
        t.rotation.x += 0.05;
        if (new THREE.Box3().setFromObject(t).intersectsSphere(new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS))) {
            isTitan = true;
            titanTimer = 8;
            ball.scale.set(3, 3, 3);
            scene.remove(t);
            return false;
        }
        return true;
    });

    boostPads.forEach(b => {
        if (new THREE.Box3().setFromObject(b).intersectsSphere(new THREE.Sphere(ball.position, isTitan ? BALL_RADIUS * 3 : BALL_RADIUS))) {
            isBoosting = true;
            boostTimer = 3;
        }
    });

    coinMeshes = coinMeshes.filter(c => {
        if (ball.position.distanceTo(c.position) < (isTitan ? BALL_RADIUS * 3 : BALL_RADIUS) + 0.6) {
            coins += 10;
            localStorage.setItem('totalCoins', coins);
            coinValue.innerText = coins;
            scene.remove(c);
            return false;
        }
        return true;
    });

    const cleanupZ = ball.position.z + 50;
    [floorTiles, obstacles, jumpPads, superJumpPads, scorePads, coinMeshes, tunnels, titanOrbs, boostPads].forEach(arr => {
        for(let i=arr.length-1; i>=0; i--) {
            if (arr[i].position.z > cleanupZ) { scene.remove(arr[i]); arr.splice(i, 1); }
        }
    });

    camera.position.z = ball.position.z + 14;
    camera.position.x = ball.position.x * 0.5;
    camera.position.y = isFlying ? 50 : 8 + Math.max(0, -ball.position.y * 0.2);
    camera.lookAt(ball.position.x, ball.position.y, ball.position.z - 10);
}

function gameOver() {
    state = 'GAMEOVER';
    finalScore.innerText = score;
    localStorage.setItem('highScore', highScore);
    gameOverOverlay.style.display = 'flex';
    reviveContainer.style.display = coins >= REVIVE_COST ? 'block' : 'none';
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

init();

