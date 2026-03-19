import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

// --- FIREBASE SETUP ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// --- CONFIGURATION ---
const TRACK_WIDTH = 10;
const TILE_SIZE = 4; 
const BALL_RADIUS = 0.6;
const GRAVITY = -0.012; 
const JUMP_IMPULSE = 0.32;
const SUPER_JUMP_IMPULSE = 1.5;
const FLIGHT_DURATION = 10;
const FORWARD_SPEED = 0.4;
const SIDE_SPEED = 0.25;
const OBSTACLE_SPAWN_INTERVAL = 40; 
const COIN_SPAWN_INTERVAL = 10;
const SCORE_DIVIDER = 5;
const REVIVE_COST = 300;
const GAP_SPAWN_INTERVAL = 120;
const TUNNEL_SPAWN_INTERVAL = 200;

// --- SHARED ASSETS (Performance: Reuse Geometries and Materials) ---
const GEOS = {
    tile: new THREE.BoxGeometry(TRACK_WIDTH, 0.5, TILE_SIZE),
    ball: new THREE.SphereGeometry(BALL_RADIUS, 24, 24),
    stripe: new THREE.TorusGeometry(BALL_RADIUS, 0.03, 8, 48),
    coin: new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12),
    pad: new THREE.BoxGeometry(4, 0.4, 4),
    superPad: new THREE.BoxGeometry(5, 0.6, 5),
    scorePad: new THREE.BoxGeometry(3, 0.2, 3),
    titan: new THREE.IcosahedronGeometry(0.8, 0),
    boost: new THREE.BoxGeometry(4, 0.2, 8),
    arrow: new THREE.ConeGeometry(1.5, 2, 3)
};

const MATS = {
    tile: new THREE.MeshStandardMaterial({ color: 0x223344 }),
    ball: new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.5 }),
    stripe: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    bottom: new THREE.MeshStandardMaterial({ color: 0x111122, transparent: true, opacity: 0.5 }),
    coin: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, emissive: 0xffd700, emissiveIntensity: 0.5 }),
    jump: new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 }),
    superJump: new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2 }),
    scorePad: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }),
    titan: new THREE.MeshStandardMaterial({ color: 0x00ffff, wireframe: true, emissive: 0x00ffff, emissiveIntensity: 2 }),
    boost: new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1 }),
    white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    wall: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.8, roughness: 0.2 }),
    neon: new THREE.MeshBasicMaterial({ color: 0x00ffff })
};

// Texture Cache for Score Pads
const scoreTextureCache = {};

// --- GAME STATE ---
let state = 'START'; 
let score = 0, lastDisplayedScore = -1;
let scoreBonus = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0, lastDisplayedHighScore = -1;
let coins = parseInt(localStorage.getItem('totalCoins')) || 0, lastDisplayedCoins = -1;
let isFlying = false, flightTimer = 0;
let isTitan = false, titanTimer = 0;
let isBoosting = false, boostTimer = 0;
let isMuted = false;
let scene, camera, renderer, ball, dirLight, audioListener, bgMusic;
let obstacles = [], jumpPads = [], superJumpPads = [], scorePads = [], coinMeshes = [], floorTiles = [], tunnels = [], titanOrbs = [], boostPads = [], flightTrail = [];
let keys = {}, ballVelocity = new THREE.Vector3();
const MUSIC_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a7348a.mp3';

// --- ELEMENTS ---
const scoreValue = document.getElementById('score-value');
const highScoreValue = document.getElementById('high-score-value');
const coinValue = document.getElementById('coin-value');
const finalScore = document.getElementById('final-score');
const startOverlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const reviveContainer = document.getElementById('revive-container');
const reviveButton = document.getElementById('revive-button');
const soundToggle = document.getElementById('sound-toggle');
const userNameDisplay = document.getElementById('user-name');
const userPhotoDisplay = document.getElementById('user-photo');
const userProfile = document.getElementById('user-profile');
const loginBtn = document.getElementById('login-btn');
const googleLoginBtn = document.getElementById('google-login-btn');

let currentUser = null;

// --- AUTH & SYNC ---
function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userNameDisplay.innerText = user.displayName || "Player";
            userPhotoDisplay.src = user.photoURL || "";
            await syncUserCloudData(user.uid);
        } else {
            currentUser = null;
            loginBtn.style.display = 'block';
            userProfile.style.display = 'none';
        }
    });
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    loginBtn.addEventListener('click', handleGoogleLogin);
    document.getElementById('logout-btn').addEventListener('click', () => { auth.signOut(); location.reload(); });
}

async function handleGoogleLogin() {
    try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); }
}

async function syncUserCloudData(uid) {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const d = snap.data();
        if (d.highScore > highScore) { highScore = d.highScore; localStorage.setItem('highScore', highScore); }
        if (d.coins > coins) { coins = d.coins; localStorage.setItem('totalCoins', coins); }
    } else {
        await setDoc(docRef, { highScore, coins, lastPlayed: Date.now() });
    }
}

async function saveUserDataToCloud() {
    if (currentUser) {
        await setDoc(doc(db, "users", currentUser.uid), { highScore, coins, lastPlayed: Date.now() }, { merge: true });
    }
}

// --- INITIALIZATION ---
function init() {
    initAuth();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 250);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    bgMusic = new THREE.Audio(audioListener);
    new THREE.AudioLoader().load(MUSIC_URL, (b) => { bgMusic.setBuffer(b); bgMusic.setLoop(true); bgMusic.setVolume(0.5); });

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -30; dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30; dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.mapSize.width = 1024; dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    ball = new THREE.Mesh(GEOS.ball, MATS.ball);
    ball.castShadow = true;
    const s1 = new THREE.Mesh(GEOS.stripe, MATS.stripe), s2 = new THREE.Mesh(GEOS.stripe, MATS.stripe);
    s2.rotation.y = Math.PI/2; ball.add(s1, s2);
    scene.add(ball);

    bottomFloor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), MATS.bottom);
    bottomFloor.rotation.x = -Math.PI/2; bottomFloor.position.y = -100;
    scene.add(bottomFloor);
    const grid = new THREE.GridHelper(1000, 50, 0x4444ff, 0x222244);
    grid.position.y = -99.9; scene.add(grid);

    window.addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') handleSpacePress(); });
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('resize', onWindowResize);
    reviveButton.addEventListener('click', reviveGame);
    startOverlay.addEventListener('click', (e) => { if (!e.target.closest('button')) handleSpacePress(); });
    gameOverOverlay.addEventListener('click', (e) => { if (!e.target.closest('button')) handleSpacePress(); });
    if (soundToggle) soundToggle.addEventListener('click', toggleSound);

    animate();
}

function toggleSound() {
    isMuted = !isMuted;
    if (bgMusic) {
        if (isMuted) { bgMusic.setVolume(0); soundToggle.innerText = "🔇 Sound Off"; }
        else { bgMusic.setVolume(0.5); soundToggle.innerText = "🔊 Sound On"; if (state === 'PLAYING') bgMusic.play(); }
    }
}

function handleSpacePress() { if (state === 'START' || state === 'GAMEOVER') { if (!isMuted && bgMusic.buffer) bgMusic.play(); resetGame(); } }

function resetGame() {
    state = 'PLAYING'; score = 0; scoreBonus = 0; isFlying = false; isTitan = false; isBoosting = false;
    ball.scale.set(1, 1, 1); ball.position.set(0, BALL_RADIUS + 2, 0); ballVelocity.set(0, 0, 0);
    clearWorld();
    startOverlay.style.display = 'none'; gameOverOverlay.style.display = 'none';
    for(let z = 20; z > -150; z -= TILE_SIZE) spawnFloorRow(z);
}

function clearWorld() {
    [obstacles, jumpPads, superJumpPads, scorePads, coinMeshes, floorTiles, tunnels, titanOrbs, boostPads].forEach(arr => {
        arr.forEach(o => scene.remove(o)); arr.length = 0;
    });
    flightTrail.forEach(t => scene.remove(t.mesh)); flightTrail.length = 0;
}

function removeAndDispose(obj, arr) {
    scene.remove(obj);
    if (arr) { const i = arr.indexOf(obj); if (i > -1) arr.splice(i, 1); }
}

function reviveGame() {
    if (coins >= REVIVE_COST) {
        coins -= REVIVE_COST; localStorage.setItem('totalCoins', coins);
        state = 'PLAYING'; isFlying = false; isTitan = false; titanTimer = 3; isBoosting = false;
        ball.scale.set(1, 1, 1); ball.position.set(0, BALL_RADIUS + 10, ball.position.z);
        gameOverOverlay.style.display = 'none';
    }
}

function spawnFloorRow(z) {
    const isGap = z < -40 && Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE * (2 + Math.floor(score/500));
    if (isGap) {
        if (Math.abs(z % GAP_SPAWN_INTERVAL) < TILE_SIZE) {
            if (Math.random() > 0.6) spawnSuperJumpPad(z + TILE_SIZE); else spawnJumpPad(z + TILE_SIZE, true);
        }
        return;
    }
    const tile = new THREE.Mesh(GEOS.tile, MATS.tile);
    tile.position.set(0, -0.25, z); tile.receiveShadow = true;
    scene.add(tile); floorTiles.push(tile);
    if (Math.abs(z) > 100 && Math.random() > 0.96) spawnScorePad(z);
    if (z < -100 && Math.abs(z % TUNNEL_SPAWN_INTERVAL) < TILE_SIZE) spawnTunnel(z);
}

function spawnTunnel(z) {
    const g = new THREE.Group();
    const l = TILE_SIZE * 12, w = TRACK_WIDTH + 2, h = 6;
    const lw = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, l), MATS.wall), rw = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, l), MATS.wall);
    lw.position.set(-w/2, h/2-0.25, -l/2+TILE_SIZE/2); rw.position.set(w/2, h/2-0.25, -l/2+TILE_SIZE/2);
    g.add(lw, rw);
    for(let i=0; i<l; i+=4) {
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.2), MATS.neon), r2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.2), MATS.neon);
        r1.position.set(-w/2+0.3, h/2, -i+TILE_SIZE/2); r2.position.set(w/2-0.3, h/2, -i+TILE_SIZE/2);
        g.add(r1, r2);
    }
    g.position.z = z; scene.add(g); tunnels.push(g);
}

function spawnObstacle(z) {
    if (tunnels.some(t => Math.abs(t.position.z - z) < 40)) return;
    const types = ['box', 'movingBox', 'crusher', 'windmill', 'bouncer', 'laser', 'pendulum', 'gates'];
    const type = types[Math.floor(Math.random() * types.length)];
    let mesh;
    if (type === 'box') {
        const w = 2 + Math.random()*2; mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0xff3366 }));
        mesh.position.set((Math.random()-0.5)*(TRACK_WIDTH-w), 0.75, z);
    } else if (type === 'movingBox') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0x00ffff }));
        mesh.position.set(0, 0.75, z); mesh.userData = { isMoving: true, speed: (Math.random()>0.5?1:-1)*0.1 };
    } else if (type === 'crusher') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH, 2, 2), new THREE.MeshStandardMaterial({ color: 0xaa00ff }));
        mesh.position.set(0, 4, z); mesh.userData = { isCrusher: true, timeOffset: Math.random()*Math.PI, speed: 0.005 };
    } else if (type === 'windmill') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH + 4, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff8800 }));
        mesh.position.set(0, 1.5, z); mesh.userData = { isWindmill: true, speed: (Math.random()>0.5?1:-1)*0.05 };
    } else if (type === 'bouncer') {
        const r = 1.5+Math.random(); mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
        mesh.position.set((Math.random()-0.5)*(TRACK_WIDTH-r*2), r, z); mesh.userData = { isBouncer: true, timeOffset: Math.random()*Math.PI*2, bounceSpeed: 0.005, height: 4+Math.random()*5, startY: r };
    } else if (type === 'laser') {
        mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, TRACK_WIDTH+4), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 }));
        mesh.rotation.z = Math.PI/2; mesh.position.set(0, 1.5, z); mesh.userData = { isLaser: true, timeOffset: Math.random()*Math.PI*2, blinkSpeed: 0.003 };
    } else if (type === 'pendulum') {
        mesh = new THREE.Group(); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 10), MATS.wall); rod.position.y = -5;
        const pball = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 24), MATS.wall); pball.position.y = -10;
        mesh.add(rod, pball); mesh.position.set(0, 12, z); mesh.userData = { isPendulum: true, timeOffset: Math.random()*Math.PI*2, speed: 0.002, angle: Math.PI/3 };
    } else if (type === 'gates') {
        mesh = new THREE.Group(); const l = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH/2, 4, 1), MATS.wall), r = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH/2, 4, 1), MATS.wall);
        l.position.x = -TRACK_WIDTH/4-2; r.position.x = TRACK_WIDTH/4+2; mesh.add(l, r); mesh.position.set(0, 2, z);
        mesh.userData = { isGates: true, timeOffset: Math.random()*Math.PI*2, speed: 0.002, leftGate: l, rightGate: r };
    }
    if (mesh) {
        mesh.castShadow = true; mesh.receiveShadow = true; mesh.updateMatrixWorld();
        mesh.userData.boundingBox = new THREE.Box3().setFromObject(mesh);
        scene.add(mesh); obstacles.push(mesh);
    }
}

function spawnJumpPad(z, force=false) {
    const p = new THREE.Mesh(GEOS.pad, MATS.jump);
    p.position.set(force?0:(Math.random()-0.5)*(TRACK_WIDTH-4), 0.1, z);
    p.updateMatrixWorld(); p.userData.boundingBox = new THREE.Box3().setFromObject(p);
    scene.add(p); jumpPads.push(p);
}

function spawnSuperJumpPad(z) {
    const p = new THREE.Mesh(GEOS.superPad, MATS.superJump);
    p.position.set((Math.random()-0.5)*(TRACK_WIDTH-5), 0.1, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.1, 16, 100), MATS.white); ring.rotation.x = Math.PI/2; p.add(ring);
    p.updateMatrixWorld(); p.userData.boundingBox = new THREE.Box3().setFromObject(p);
    scene.add(p); superJumpPads.push(p);
}

function spawnScorePad(z) {
    const v = [10, 20, 30, 40, 50][Math.floor(Math.random()*5)];
    const p = new THREE.Mesh(GEOS.scorePad, MATS.scorePad);
    p.position.set((Math.random()-0.5)*(TRACK_WIDTH-3), 0.05, z); p.userData = { scorePenalty: v };
    if (!scoreTextureCache[v]) {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64;
        const ctx = c.getContext('2d'); ctx.fillStyle = 'red'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText("-" + v, 32, 45);
        scoreTextureCache[v] = new THREE.CanvasTexture(c);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: scoreTextureCache[v] })); s.position.y = 2; s.scale.set(2, 2, 1); p.add(s);
    p.updateMatrixWorld(); p.userData.boundingBox = new THREE.Box3().setFromObject(p);
    scene.add(p); scorePads.push(p);
}

function spawnCoin(z) {
    const c = new THREE.Mesh(GEOS.coin, MATS.coin);
    c.rotation.x = Math.PI/2; c.position.set((Math.random()-0.5)*(TRACK_WIDTH-2), 1, z);
    scene.add(c); coinMeshes.push(c);
}

function spawnTitanOrb(z) {
    const o = new THREE.Mesh(GEOS.titan, MATS.titan);
    o.position.set((Math.random()-0.5)*(TRACK_WIDTH-2), 1.5, z);
    o.updateMatrixWorld(); o.userData.boundingBox = new THREE.Box3().setFromObject(o);
    scene.add(o); titanOrbs.push(o);
}

function spawnBoostPad(z) {
    const p = new THREE.Mesh(GEOS.boost, MATS.boost); p.position.set((Math.random()-0.5)*(TRACK_WIDTH-4), 0.1, z);
    const a1 = new THREE.Mesh(GEOS.arrow, MATS.white), a2 = new THREE.Mesh(GEOS.arrow, MATS.white);
    a1.rotation.x = -Math.PI/2; a1.position.set(0, 0.2, 1); a2.rotation.x = -Math.PI/2; a2.position.set(0, 0.2, -2);
    p.add(a1, a2); p.updateMatrixWorld(); p.userData.boundingBox = new THREE.Box3().setFromObject(p);
    scene.add(p); boostPads.push(p);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
}

const ballSphere = new THREE.Sphere();
function updatePhysics() {
    if (state !== 'PLAYING') return;
    if (isTitan) { titanTimer -= 1/60; if (titanTimer <= 0) { isTitan = false; ball.scale.set(1, 1, 1); } }
    if (isBoosting) { boostTimer -= 1/60; camera.fov = THREE.MathUtils.lerp(camera.fov, 110, 0.1); camera.updateProjectionMatrix(); if (boostTimer <= 0) isBoosting = false; }
    else { camera.fov = THREE.MathUtils.lerp(camera.fov, 75, 0.1); camera.updateProjectionMatrix(); }
    let speed = FORWARD_SPEED + (score / 1000); if (isBoosting) speed += 1.5;
    ball.position.z -= speed;
    score = Math.max(0, Math.floor(Math.abs(ball.position.z) / SCORE_DIVIDER) + scoreBonus);
    if (score > highScore) highScore = score;

    if (score !== lastDisplayedScore) { scoreValue.innerText = score; lastDisplayedScore = score; }
    if (highScore !== lastDisplayedHighScore) { highScoreValue.innerText = highScore; lastDisplayedHighScore = highScore; }
    if (coins !== lastDisplayedCoins) { coinValue.innerText = coins; lastDisplayedCoins = coins; }

    let sm = 0; if (keys['ArrowLeft'] || keys['KeyA']) sm = -SIDE_SPEED; if (keys['ArrowRight'] || keys['KeyD']) sm = SIDE_SPEED;
    ball.position.x += sm; ball.rotation.x -= speed / BALL_RADIUS; ball.rotation.z -= sm / BALL_RADIUS;
    ballSphere.center.copy(ball.position); ballSphere.radius = isTitan ? BALL_RADIUS * 3 : BALL_RADIUS;

    if (isFlying) {
        flightTimer -= 1/60; ball.position.y = THREE.MathUtils.lerp(ball.position.y, 40, 0.05);
        const h = (Date.now() % 1000) / 1000; ball.material.emissive.setHSL(h, 1, 0.5);
        if (Math.floor(Date.now() / 50) % 2 === 0) {
            const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h, 1, 0.5) }));
            d.position.copy(ball.position); scene.add(d); flightTrail.push({ mesh: d, life: 1.0 });
        }
        if (flightTimer <= 0) { isFlying = false; ball.material.emissive.setHex(0x000000); }
    } else { ballVelocity.y += GRAVITY; ball.position.y += ballVelocity.y; }

    for(let i=flightTrail.length-1; i>=0; i--) {
        const t = flightTrail[i]; t.life -= 0.02; t.mesh.scale.setScalar(t.life);
        if (t.life <= 0) { scene.remove(t.mesh); flightTrail.splice(i, 1); }
    }
    floorTiles.forEach(tile => {
        if (Math.abs(ball.position.z - tile.position.z) < TILE_SIZE/2 + BALL_RADIUS && Math.abs(ball.position.x) < TRACK_WIDTH/2 + BALL_RADIUS) {
            if (ball.position.y - BALL_RADIUS <= 0 && ball.position.y - BALL_RADIUS > -1 && ballVelocity.y <= 0 && !isFlying) { ball.position.y = BALL_RADIUS; ballVelocity.y = 0; }
        }
    });
    if (ball.position.y < -90) gameOver();

    obstacles.forEach(o => {
        if (o.userData.boundingBox) {
            const t = Date.now() * (o.userData.speed || o.userData.bounceSpeed || 0.002) + o.userData.timeOffset;
            let needsBox = false;
            if (o.userData.isMoving) { o.position.x += o.userData.speed; if (Math.abs(o.position.x) > TRACK_WIDTH/2 - 1) o.userData.speed *= -1; needsBox = true; }
            else if (o.userData.isCrusher) { o.position.y = 1 + Math.abs(Math.sin(t)) * 5; needsBox = true; }
            else if (o.userData.isWindmill) { o.rotation.y += o.userData.speed; o.rotation.z += o.userData.speed; }
            else if (o.userData.isBouncer) { o.position.y = o.userData.startY + Math.abs(Math.sin(t)) * o.userData.height; needsBox = true; }
            else if (o.userData.isLaser) o.visible = Math.sin(t) > 0;
            else if (o.userData.isPendulum) o.rotation.z = Math.sin(t) * o.userData.angle;
            else if (o.userData.isGates) {
                const off = Math.abs(Math.sin(t)) * 4; o.userData.leftGate.position.x = -TRACK_WIDTH/4-2+off; o.userData.rightGate.position.x = TRACK_WIDTH/4+2-off; needsBox = true;
            }
            if (needsBox) o.userData.boundingBox.setFromObject(o);
        }
    });

    const spawnZ = ball.position.z - 120;
    if (Math.abs(spawnZ % TILE_SIZE) < speed) spawnFloorRow(spawnZ);
    if (Math.abs(spawnZ % OBSTACLE_SPAWN_INTERVAL) < speed) spawnObstacle(spawnZ);
    if (Math.abs(spawnZ % 10) < speed) spawnCoin(spawnZ);
    if (Math.abs(spawnZ % 300) < speed) spawnTitanOrb(spawnZ);
    if (Math.abs(spawnZ % 100) < speed) spawnBoostPad(spawnZ);

    if (!isFlying) {
        obstacles = obstacles.filter(o => {
            if (!o.visible) return true;
            if (o.userData.boundingBox.intersectsSphere(ballSphere)) {
                if (isTitan) { removeAndDispose(o); return false; } else { gameOver(); }
            }
            return true;
        });
    }
    jumpPads.forEach(j => { if (j.userData.boundingBox.intersectsSphere(ballSphere)) ballVelocity.y = JUMP_IMPULSE * 1.5; });
    superJumpPads.forEach(s => { if (s.userData.boundingBox.intersectsSphere(ballSphere)) { ballVelocity.y = SUPER_JUMP_IMPULSE; isFlying = true; flightTimer = FLIGHT_DURATION; } });
    scorePads = scorePads.filter(p => { if (p.userData.boundingBox.intersectsSphere(ballSphere)) { scoreBonus -= p.userData.scorePenalty; removeAndDispose(p); return false; } return true; });
    titanOrbs = titanOrbs.filter(t => { t.rotation.y += 0.05; if (t.userData.boundingBox.intersectsSphere(ballSphere)) { isTitan = true; titanTimer = 8; ball.scale.set(3, 3, 3); removeAndDispose(t); return false; } return true; });
    boostPads.forEach(b => { if (b.userData.boundingBox.intersectsSphere(ballSphere)) { isBoosting = true; boostTimer = 3; } });
    coinMeshes = coinMeshes.filter(c => { c.rotation.y += 0.05; if (ball.position.distanceTo(c.position) < ballSphere.radius + 0.6) { coins += 10; localStorage.setItem('totalCoins', coins); removeAndDispose(c); return false; } return true; });

    const cleanZ = ball.position.z + 50;
    [floorTiles, obstacles, jumpPads, superJumpPads, scorePads, coinMeshes, tunnels, titanOrbs, boostPads].forEach(arr => {
        for(let i=arr.length-1; i>=0; i--) if (arr[i].position.z > cleanZ) { removeAndDispose(arr[i], arr); }
    });

    dirLight.position.z = ball.position.z + 30; dirLight.target.position.copy(ball.position); dirLight.target.updateMatrixWorld();
    camera.position.z = ball.position.z + 14; camera.position.x = ball.position.x * 0.5; camera.position.y = isFlying ? 50 : 8 + Math.max(0, -ball.position.y * 0.2);
    camera.lookAt(ball.position.x, ball.position.y, ball.position.z - 10);
}

function gameOver() {
    state = 'GAMEOVER'; if (bgMusic.isPlaying) bgMusic.pause();
    finalScore.innerText = score; localStorage.setItem('highScore', highScore); saveUserDataToCloud();
    gameOverOverlay.style.display = 'flex'; reviveContainer.style.display = coins >= REVIVE_COST ? 'block' : 'none';
}

function animate() { requestAnimationFrame(animate); updatePhysics(); renderer.render(scene, camera); }
init();
