import * as THREE from 'three';

// --- CONFIGURATION ---
const TRACK_WIDTH = 10;
const TRACK_LENGTH = 10000;
const BALL_RADIUS = 0.5;
const GRAVITY = -0.015;
const JUMP_IMPULSE = 0.35;
const FORWARD_SPEED = 0.3;
const SIDE_SPEED = 0.2;
const OBSTACLE_SPAWN_INTERVAL = 20; // Every 20 z-units (was 50)
const JUMP_PAD_SPAWN_INTERVAL = 100; // Every 100 z-units (was 200)
const SCORE_DIVIDER = 5; // To slow down score progression

// --- GAME STATE ---
let state = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let scene, camera, renderer, ball;
let clock = new THREE.Clock();
let obstacles = [];
let jumpPads = [];
let keys = {};
let ballVelocity = new THREE.Vector3(0, 0, 0);

// --- ELEMENTS ---
const scoreValue = document.getElementById('score-value');
const finalScore = document.getElementById('final-score');
const startOverlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const container = document.getElementById('canvas-container');

// --- INITIALIZATION ---
function init() {
    // Scene & Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 10, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 8);
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

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Ball (Player)
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffcc, 
        emissive: 0x00ffcc, 
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
    });
    ball = new THREE.Mesh(ballGeo, ballMat);
    ball.castShadow = true;
    ball.position.y = BALL_RADIUS;
    scene.add(ball);

    // Track
    createTrack();

    // Event Listeners
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'Space') handleSpacePress();
    });
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function createTrack() {
    const trackGeo = new THREE.PlaneGeometry(TRACK_WIDTH, TRACK_LENGTH);
    const trackMat = new THREE.MeshStandardMaterial({ 
        color: 0x111122,
        roughness: 0.1,
        metalness: 0.5
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.receiveShadow = true;
    scene.add(track);

    // Add grid lines for sense of speed
    const grid = new THREE.GridHelper(TRACK_LENGTH, 100, 0x00ffcc, 0x222244);
    grid.rotation.x = 0;
    grid.position.y = 0.01;
    scene.add(grid);
}

function handleSpacePress() {
    if (state === 'START' || state === 'GAMEOVER') {
        resetGame();
    }
}

function resetGame() {
    state = 'PLAYING';
    score = 0;
    ball.position.set(0, BALL_RADIUS, 0);
    ballVelocity.set(0, 0, 0);
    
    // Clear obstacles & jump pads
    obstacles.forEach(o => scene.remove(o));
    jumpPads.forEach(j => scene.remove(j));
    obstacles = [];
    jumpPads = [];

    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
}

function spawnObstacle(z) {
    const types = ['box', 'cylinder'];
    const type = types[Math.floor(Math.random() * types.length)];
    let geo, mat;

    if (type === 'box') {
        const w = 1 + Math.random() * 2;
        const h = 1 + Math.random() * 2;
        geo = new THREE.BoxGeometry(w, h, 1);
        mat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
    } else {
        const r = 0.5 + Math.random();
        geo = new THREE.CylinderGeometry(r, r, 3, 32);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 2), type === 'box' ? 0.5 : 1.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    obstacles.push(mesh);
}

function spawnJumpPad(z) {
    const geo = new THREE.BoxGeometry(3, 0.2, 3);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        emissive: 0x00ff00, 
        emissiveIntensity: 1 
    });
    const pad = new THREE.Mesh(geo, mat);
    pad.position.set((Math.random() - 0.5) * (TRACK_WIDTH - 3), 0.1, z);
    scene.add(pad);
    jumpPads.push(pad);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePhysics() {
    if (state !== 'PLAYING') return;

    // Forward Movement
    ball.position.z -= FORWARD_SPEED + (score / 5000); // Gradually speed up (was 10000)
    score = Math.floor(Math.abs(ball.position.z) / SCORE_DIVIDER);
    scoreValue.innerText = score;

    // Side Movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
        ball.position.x -= SIDE_SPEED;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        ball.position.x += SIDE_SPEED;
    }
    ball.position.x = Math.max(-TRACK_WIDTH/2 + BALL_RADIUS, Math.min(TRACK_WIDTH/2 - BALL_RADIUS, ball.position.x));

    // Vertical Physics (Gravity & Jump Pads)
    ballVelocity.y += GRAVITY;
    ball.position.y += ballVelocity.y;

    // Ground collision
    if (ball.position.y < BALL_RADIUS) {
        ball.position.y = BALL_RADIUS;
        ballVelocity.y = 0;
    }

    // Spawning Logic
    const nextSpawnZ = ball.position.z - 50;
    if (Math.abs(nextSpawnZ % OBSTACLE_SPAWN_INTERVAL) < FORWARD_SPEED) {
        spawnObstacle(nextSpawnZ - 20);
    }
    if (Math.abs(nextSpawnZ % JUMP_PAD_SPAWN_INTERVAL) < FORWARD_SPEED) {
        spawnJumpPad(nextSpawnZ - 20);
    }

    // Collision Detection: Obstacles
    obstacles.forEach(o => {
        const box = new THREE.Box3().setFromObject(o);
        const ballSphere = new THREE.Sphere(ball.position, BALL_RADIUS);
        if (box.intersectsSphere(ballSphere)) {
            gameOver();
        }
    });

    // Collision Detection: Jump Pads
    jumpPads.forEach(j => {
        const box = new THREE.Box3().setFromObject(j);
        const ballSphere = new THREE.Sphere(ball.position, BALL_RADIUS);
        if (box.intersectsSphere(ballSphere)) {
            ballVelocity.y = JUMP_IMPULSE;
        }
    });

    // Cleanup old objects
    obstacles = obstacles.filter(o => {
        if (o.position.z > ball.position.z + 10) {
            scene.remove(o);
            return false;
        }
        return true;
    });
    jumpPads = jumpPads.filter(j => {
        if (j.position.z > ball.position.z + 10) {
            scene.remove(j);
            return false;
        }
        return true;
    });

    // Camera follow
    camera.position.z = ball.position.z + 8;
    camera.position.x = ball.position.x * 0.5;
    camera.lookAt(ball.position.x, ball.position.y, ball.position.z - 5);
}

function gameOver() {
    state = 'GAMEOVER';
    finalScore.innerText = score;
    gameOverOverlay.style.display = 'flex';
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

init();
