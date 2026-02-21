<<<<<<< HEAD
// ─── CONTINUOUS MAP CONFIGURATION ────────────────────────────────────────────
const MAP = { w: 20, h: 45 };
const CELL = 40; // Pixel size per grid cell

// All 10 Story Checkpoints
const STORY_NODES = [
  { title: "The Safehouse", x: 10, y: 43, text: "Chapter 1. You wake up. The SOS signal is breaking through the static. You need to grab your gear and find the door out." },
  { title: "The Alleyway", x: 10, y: 38, text: "Chapter 2. You step outside into a light drizzle. Navigate the narrow alley, but avoid the jagged scrap metal piled against the walls." },
  { title: "The Flooded Street", x: 4, y: 32, text: "Chapter 3. The main road is flooded. The water is deep and moving fast. Step carefully across the submerged cars." },
  { title: "The Overgrown Park", x: 15, y: 26, text: "Chapter 4. You enter a park reclaimed by wild dogs. Move quietly so they don't hear you." },
  { title: "The Subway Descent", x: 10, y: 20, text: "Chapter 5. The streets are blocked. You must go underground into the echoing, pitch-black subway tunnels." },
  { title: "The Train Graveyard", x: 5, y: 15, text: "Chapter 6. You are lost in a maze of derailed subway cars. Weave through the open doors to find the exit stairs." },
  { title: "The Ascend", x: 10, y: 10, text: "Chapter 7. You find the stairwell of the skyscraper. It's a grueling climb, but the signal is getting louder." },
  { title: "The Collapsed Floor", x: 15, y: 6, text: "Chapter 8. The floorboards here are rotted. One wrong step and you'll fall through the ceiling. Listen for the groaning wood." },
  { title: "The Roof Edge", x: 10, y: 2, text: "Chapter 9. You are on the roof. The wind is howling. Walk along the narrow ledge to reach the tower." },
  { title: "The Broadcast Tower", x: 10, y: 0, text: "Chapter 10. You open the door, cutting off the wind. The room hums with electricity. You found the source." }
];

// Hazards across the entire map
const HAZARDS = [
  // Alley scrap metal
  { zones: [{x:9, y:39}, {x:11, y:39}, {x:9, y:37}, {x:11, y:37}], intensityRadius: 2.0 },
  // Flooded street
  { zones: [{x:3, y:33}, {x:5, y:33}, {x:3, y:31}, {x:5, y:31}, {x:2, y:32}, {x:6, y:32}], intensityRadius: 1.5 },
  // Park dogs
  { zones: [{x:14, y:27}, {x:16, y:27}, {x:13, y:25}, {x:17, y:25}], intensityRadius: 3.0 },
  // Subway rubble
  { zones: [{x:9, y:21}, {x:11, y:21}, {x:8, y:19}, {x:12, y:19}], intensityRadius: 2.0 },
  // Train maze
  { zones: [{x:4, y:16}, {x:6, y:16}, {x:4, y:14}, {x:6, y:14}], intensityRadius: 1.5 },
  // Collapsed Floor
  { zones: [{x:14, y:7}, {x:16, y:7}, {x:14, y:5}, {x:16, y:5}], intensityRadius: 1.0 },
  // Roof winds (High danger on the edges)
  { zones: [{x:8, y:3}, {x:8, y:2}, {x:8, y:1}, {x:12, y:3}, {x:12, y:2}, {x:12, y:1}], intensityRadius: 2.5 }
];

// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let currentNodeIndex = 0;
let visualPulse = 0; // For the cool UI sonar effect
let frameId;

=======
// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
const GRID_W = 9;
const GRID_H = 9;
const CELL = 40; // canvas pixels per grid cell

// Danger zones: list of {x, y} positions
const DANGER_ZONES = [
  {x:2, y:2}, {x:3, y:2},
  {x:6, y:5}, {x:6, y:6},
  {x:1, y:6}, {x:2, y:7},
  {x:7, y:1}, {x:7, y:2},
];

>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
const game = {
  player: { x: 4, y: 4 },        // start in center (your bed)
  goal: { x: 0, y: 0 },          // front door — top-left
  started: false,
  won: false,

  distanceFactor() {
    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
<<<<<<< HEAD
    return Math.min(1, Math.sqrt(dx*dx + dy*dy) / 15); // Localized distance feeling
=======
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = Math.sqrt(GRID_W*GRID_W + GRID_H*GRID_H);
    return Math.min(1, dist / maxDist);
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
  },

  beaconPan() {
    const dx = this.goal.x - this.player.x;
    const maxDx = GRID_W;
    return Math.max(-1, Math.min(1, dx / maxDx * 1.5));
  },

  dangerIntensity() {
    let minDist = Infinity;
    for (const d of DANGER_ZONES) {
      const dx = d.x - this.player.x;
      const dy = d.y - this.player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDist) minDist = dist;
    }
    if (minDist <= 0) return 1;
    if (minDist >= 2.5) return 0;
    return 1 - (minDist / 2.5);
  },

  move(dx, dy) {
    if (!this.started || this.won) return;
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
<<<<<<< HEAD

    // Trigger visual sonar ping
    visualPulse = 1.0;

    // Check Map Boundaries
    if (nx < 0 || nx >= MAP.w || ny < 0 || ny >= MAP.h) {
      if (typeof playTone === 'function') playTone({ freq: 150, type: 'square', duration: 0.1, volume: 0.1 });
=======
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) {
      // Bump into wall
      playTone({ freq: 180, type: 'square', duration: 0.08, volume: 0.12 });
      announce('Wall.');
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
      return;
    }
    this.player.x = nx;
    this.player.y = ny;

<<<<<<< HEAD
    // Check if player reached the checkpoint
    if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
      this.advanceCheckpoint();
    }
  },

  advanceCheckpoint() {
    currentNodeIndex++;
    visualPulse = 2.0; // Big ping on level up

    if (currentNodeIndex >= STORY_NODES.length) {
      this.won = true;
      if (typeof speak === 'function') speak(STORY_NODES[STORY_NODES.length - 1].text);
      document.getElementById('status').textContent = 'SIGNAL LOCATED. GAME CLEARED.';
      return;
    }

    const node = STORY_NODES[currentNodeIndex];
    if (typeof speak === 'function') speak(node.text);
    document.getElementById('status').textContent = node.title;

    if (currentNodeIndex + 1 < STORY_NODES.length) {
      this.goal.x = STORY_NODES[currentNodeIndex + 1].x;
      this.goal.y = STORY_NODES[currentNodeIndex + 1].y;
    }
  },

  interact() {
    if (!this.started || this.won) return;
    visualPulse = 1.5; // Medium ping

    const df = this.distanceFactor();
    let msg;
    if (df < 0.1) msg = "The signal is strong. The next location is right here.";
    else if (df < 0.4) msg = "You're getting closer. Keep tracking.";
    else msg = "The signal is faint. Keep moving.";
=======
    // Footstep
    playNoise({ volume: 0.12, pan: 0 });
    playBlip();
    pulsePing();
    renderGrid();

    // Check win
    if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
      this.won = true;
      handleWin();
      return;
    }

    // Update sounds
    this.updateSounds();
  },

  updateSounds() {
    const df = this.distanceFactor();
    const danger = this.dangerIntensity();

    // Heartbeat rate
    const bpm = 58 + danger * 60;
    setHeartbeatBPM(bpm);
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc

    // One-shot danger stinger
    if (danger > 0.1) playDanger(danger);

    // Drive FMOD adaptive music + danger snapshot
    setMusicVolume(danger, df);
    triggerDangerSnapshot(danger);

    // Update beacon panning/distance live
    updateBeacon(this.beaconPan(), df);

    // Visual ambience + colour theme
    updateAmbience(danger, df);
    updateTheme(danger, df);

    // Narration hints (sparse)
    triggerNarration(df, danger);
  }
};

<<<<<<< HEAD
// ─── DYNAMIC CAMERA & RENDERER ───────────────────────────────────────────────
function drawLoop() {
  renderGrid();

  // Animate the visual pulse fading out
  if (visualPulse > 0) {
    visualPulse -= 0.02;
    if (visualPulse < 0) visualPulse = 0;
  }

  frameId = requestAnimationFrame(drawLoop);
}

=======
// ─── MOOD / THEME SYSTEM (JoJo: color = emotion, not physics) ────────────────
// Each mood is a complementary-color pair that creates psychological tension.
const MOODS = {
  neutral: { bg: '#3a1878', fg: '#ffd700', accentRgb: '255,215,0',   label: 'royal'    }, // purple + gold
  close:   { bg: '#04102e', fg: '#ff8c00', accentRgb: '255,140,0',   label: 'heroic'   }, // blue + orange
  uneasy:  { bg: '#031a10', fg: '#ff1493', accentRgb: '255,20,147',  label: 'unstable' }, // green + hot pink
  danger:  { bg: '#150200', fg: '#00ffcc', accentRgb: '0,255,204',   label: 'madness'  }, // red + electric teal
};

let activeMood = MOODS.neutral;

function updateTheme(danger, df) {
  let mood;
  if      (danger >= 0.55) mood = MOODS.danger;
  else if (danger >= 0.2)  mood = MOODS.uneasy;
  else if (df <= 0.3)      mood = MOODS.close;
  else                     mood = MOODS.neutral;

  if (mood === activeMood) return;
  activeMood = mood;

  document.body.style.backgroundColor = mood.bg;
  document.body.style.color            = mood.fg;
  document.documentElement.style.setProperty('--accent-rgb', mood.accentRgb);

  // Sync canvas pulse speed to current heartbeat BPM
  const bpm = 58 + danger * 60;
  const beatSec = (60 / bpm * 2).toFixed(2); // one glow cycle per 2 beats
  document.getElementById('grid-canvas').style.animationDuration = `${beatSec}s`;
}

// ─── GRID RENDERER ───────────────────────────────────────────────────────────
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
function renderGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const W = GRID_W * CELL;
  const H = GRID_H * CELL;

<<<<<<< HEAD
  // Fix canvas size to a nice viewport window
  const viewW = 400;
  const viewH = 400;
  canvas.width = viewW;
  canvas.height = viewH;

  // Clear background
  c.fillStyle = '#1a0b35'; // Deep dark purple
  c.fillRect(0, 0, viewW, viewH);

  c.save();

  // Camera Logic: Center the view on the player
  const camX = (viewW / 2) - (game.player.x * CELL + CELL / 2);
  const camY = (viewH / 2) - (game.player.y * CELL + CELL / 2);

  // Smoothly translate the grid to the camera position
  c.translate(Math.floor(camX), Math.floor(camY));

  // Draw Grid Lines (Subtle)
  c.strokeStyle = 'rgba(255, 215, 0, 0.05)';
  c.lineWidth = 1;
  for (let x = 0; x <= MAP.w; x++) {
    c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, MAP.h * CELL); c.stroke();
  }
  for (let y = 0; y <= MAP.h; y++) {
    c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(MAP.w * CELL, y * CELL); c.stroke();
  }

  // Draw Hazards with a pulsing glow
  const time = Date.now() / 300;
  HAZARDS.forEach(hazard => {
    hazard.zones.forEach(z => {
      const glow = 0.3 + Math.sin(time + z.x + z.y) * 0.2; // organic pulsing
      c.fillStyle = `rgba(220, 0, 40, ${glow})`;
      c.fillRect(z.x * CELL + 2, z.y * CELL + 2, CELL - 4, CELL - 4);
    });
  });

  // Draw Checkpoints (Dimly lit future ones, bright active one)
  STORY_NODES.forEach((node, i) => {
    if (i <= currentNodeIndex) return; // Skip past ones
    c.fillStyle = i === currentNodeIndex + 1 ? '#ffd700' : 'rgba(255, 215, 0, 0.2)';
    c.fillRect(node.x * CELL + 8, node.y * CELL + 8, CELL - 16, CELL - 16);
  });

  // Draw Player Sonar Pulse
  if (visualPulse > 0) {
    c.beginPath();
    c.arc(game.player.x * CELL + CELL / 2, game.player.y * CELL + CELL / 2, (2 - visualPulse) * CELL * 1.5, 0, Math.PI * 2);
    c.strokeStyle = `rgba(0, 255, 204, ${visualPulse / 2})`;
    c.lineWidth = 2;
    c.stroke();
  }

  // Draw Player
  c.fillStyle = '#00ffcc';
=======
  const m = activeMood;
  const a = m.accentRgb; // shorthand

  // Background
  c.fillStyle = m.bg;
  c.fillRect(0, 0, W, H);

  // Grid lines — accent color, very subtle
  c.strokeStyle = `rgba(${a},0.1)`;
  c.lineWidth = 1;
  for (let x = 0; x <= GRID_W; x++) {
    c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, H); c.stroke();
  }
  for (let y = 0; y <= GRID_H; y++) {
    c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(W, y * CELL); c.stroke();
  }

  // Danger zones — always psychologically wrong: sickly opposing color
  for (const d of DANGER_ZONES) {
    c.fillStyle = 'rgba(200,0,30,0.28)';
    c.fillRect(d.x * CELL + 1, d.y * CELL + 1, CELL - 2, CELL - 2);
    const rg = c.createRadialGradient(
      d.x * CELL + CELL / 2, d.y * CELL + CELL / 2, 0,
      d.x * CELL + CELL / 2, d.y * CELL + CELL / 2, CELL * 0.7
    );
    rg.addColorStop(0, 'rgba(220,0,40,0.3)');
    rg.addColorStop(1, 'rgba(220,0,40,0)');
    c.fillStyle = rg;
    c.fillRect(d.x * CELL, d.y * CELL, CELL, CELL);
  }

  // Goal — blazing accent glow
  const gx = game.goal.x * CELL + CELL / 2;
  const gy = game.goal.y * CELL + CELL / 2;
  const gg = c.createRadialGradient(gx, gy, 0, gx, gy, CELL * 1.1);
  gg.addColorStop(0, `rgba(${a},0.7)`);
  gg.addColorStop(1, `rgba(${a},0)`);
  c.fillStyle = gg;
  c.fillRect(game.goal.x * CELL, game.goal.y * CELL, CELL, CELL);
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
  c.beginPath();
  c.arc(gx, gy, 6, 0, Math.PI * 2);
  c.fillStyle = m.fg;
  c.fill();

  // Player — accent dot with halo
  const px = game.player.x * CELL + CELL / 2;
  const py = game.player.y * CELL + CELL / 2;
  const pg = c.createRadialGradient(px, py, 0, px, py, CELL * 0.55);
  pg.addColorStop(0, `rgba(${a},0.4)`);
  pg.addColorStop(1, `rgba(${a},0)`);
  c.fillStyle = pg;
  c.beginPath();
  c.arc(px, py, CELL * 0.55, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(px, py, 8, 0, Math.PI * 2);
  c.fillStyle = m.fg;
  c.fill();

  c.restore();
}

<<<<<<< HEAD
// ─── START & INPUTS ──────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  if (typeof initAudio === 'function') initAudio();
=======
// ─── NARRATION ───────────────────────────────────────────────────────────────
const narrations = {
  far:    ["Something out there is waiting for you.", "The house is quiet. Too quiet.", "You feel like you need to find the way out."],
  mid:    ["You're getting closer.", "A faint light — somewhere ahead.", "Keep moving. You can feel it."],
  close:  ["Almost there.", "The air feels different here.", "You can almost touch it."],
  danger: ["Something is wrong.", "Your skin prickles.", "Don't stop. Move."],
};
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc

let lastNarration = '';
let narrationCooldown = false;

function triggerNarration(df, danger) {
  if (narrationCooldown) return;
  let pool;
  if (danger > 0.5) pool = narrations.danger;
  else if (df > 0.65) pool = narrations.far;
  else if (df > 0.35) pool = narrations.mid;
  else pool = narrations.close;

  const available = pool.filter(n => n !== lastNarration);
  const line = available[Math.floor(Math.random() * available.length)];
  setNarrationGame(line);
  lastNarration = line;

  narrationCooldown = true;
  setTimeout(() => narrationCooldown = false, 4000);
}

// ─── VISUAL HELPERS (atmospheric only) ───────────────────────────────────────
function updateAmbience(danger, df) {
  const el = document.getElementById('ambience');
  el.className = '';
  if (danger > 0.4) el.classList.add('danger-near');
  else if (df < 0.3) el.classList.add('goal-near');
}

function pulsePing() {
  const ring = document.getElementById('pulse-ring');
  ring.classList.remove('ping');
  void ring.offsetWidth;
  ring.classList.add('ping');
}

function spawnDust() {
  const dust = document.createElement('div');
  dust.className = 'dust';
  const x = Math.random() * 100;
  const dur = 8 + Math.random() * 12;
  const drift = (Math.random() - 0.5) * 60;
  dust.style.cssText = `left:${x}vw; bottom:-5px; animation-duration:${dur}s; animation-delay:${-Math.random()*dur}s; --drift-x:${drift}px;`;
  document.body.appendChild(dust);
  setTimeout(() => dust.remove(), (dur + 1) * 1000);
}

// Spawn dust periodically
setInterval(spawnDust, 800);
for (let i = 0; i < 8; i++) spawnDust();

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function setNarrationGame(text) {
  document.getElementById('narration-game').textContent = text;
  announce(text);
}

function announce(text) {
  const el = document.getElementById('sr-announce');
  el.textContent = '';
  setTimeout(() => el.textContent = text, 50);
}

// ─── WIN ─────────────────────────────────────────────────────────────────────
function handleWin() {
  playWin();
  renderGrid();
  document.getElementById('win-flash').classList.add('show');
  setNarrationGame('You made it. The door opens. Light floods in.');
  announce('You win! You reached the door. The game is over.');
  document.getElementById('status').textContent = 'You found the way out.';
  speak('You made it. The door opens. Light floods in.');
}

// ─── SPEECH (ElevenLabs) ─────────────────────────────────────────────────────
// EL_API_KEY and EL_VOICE_ID are loaded from config.js (gitignored)

async function speak(text) {
  if (typeof EL_API_KEY === 'undefined' || !EL_API_KEY || EL_API_KEY.startsWith('your_')) return;
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': EL_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
      }),
    });
    if (!response.ok) { console.error('ElevenLabs error', response.status, await response.text()); return; }
    // Decode through the existing AudioContext (already unlocked) to bypass autoplay restrictions
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.error('speak failed:', e);
  }
}

// ─── START ───────────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  initAudio(); // FMOD init — loads banks, starts music + heartbeat
  document.getElementById('intro-ui').style.display = 'none';
  const gameUI = document.getElementById('game-ui');
  gameUI.style.display = 'block';
  gameUI.removeAttribute('aria-hidden');
  game.started = true;

<<<<<<< HEAD
  currentNodeIndex = 0;
  game.player.x = STORY_NODES[0].x;
  game.player.y = STORY_NODES[0].y;
  game.goal.x = STORY_NODES[1].x;
  game.goal.y = STORY_NODES[1].y;
  game.won = false;

  if (typeof speak === 'function') speak(STORY_NODES[0].text);
  document.getElementById('status').textContent = STORY_NODES[0].title;

  // Kick off the drawing loop
  if (!frameId) drawLoop();
=======
  const intro = "You're awake. Sitting on the edge of your bed. Something pulled you out of sleep. You need to find the door.";
  setNarrationGame(intro);
  speak(intro);
  renderGrid();

  // Kick off beacon
  setTimeout(() => {
    startBeacon(game.beaconPan(), game.distanceFactor());
    game.updateSounds();
  }, 800);
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
});

// ─── KEYBOARD ────────────────────────────────────────────────────────────────
const KEY_MAP = {
<<<<<<< HEAD
  w: { dx:  0, dy: -1 }, s: { dx:  0, dy:  1 },
  a: { dx: -1, dy:  0 }, d: { dx:  1, dy:  0 },
  ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 }
=======
  w: { dx:  0, dy: -1 },
  s: { dx:  0, dy:  1 },
  a: { dx: -1, dy:  0 },
  d: { dx:  1, dy:  0 },
};

let lastDir = { dx: 0, dy: -1 }; // default direction: up
let lastSpaceMs = 0;
const DOUBLE_TAP_MS = 280;

// Jump — leap 2 cells in last direction, skipping the intermediate cell
game.jump = function() {
  if (!this.started || this.won) return;
  const nx = Math.max(0, Math.min(GRID_W - 1, this.player.x + lastDir.dx * 2));
  const ny = Math.max(0, Math.min(GRID_H - 1, this.player.y + lastDir.dy * 2));
  this.player.x = nx;
  this.player.y = ny;
  playTone({ freq: 900, type: 'sine', duration: 0.12, volume: 0.13, attack: 0.005, decay: 0.08 });
  pulsePing();
  renderGrid();
  if (this.player.x === this.goal.x && this.player.y === this.goal.y) { this.won = true; handleWin(); return; }
  this.updateSounds();
};

// Dodge — snap 2 cells in the opposite direction
game.dodge = function() {
  if (!this.started || this.won) return;
  const nx = Math.max(0, Math.min(GRID_W - 1, this.player.x - lastDir.dx * 2));
  const ny = Math.max(0, Math.min(GRID_H - 1, this.player.y - lastDir.dy * 2));
  this.player.x = nx;
  this.player.y = ny;
  playTone({ freq: 220, type: 'sawtooth', duration: 0.1, volume: 0.14, attack: 0.002, decay: 0.06 });
  pulsePing();
  renderGrid();
  this.updateSounds();
};

// Interact — scan surroundings or open the door
game.interact = function() {
  if (!this.started || this.won) return;
  if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
    this.won = true; handleWin(); return;
  }
  const danger = this.dangerIntensity();
  const df = this.distanceFactor();
  let msg;
  if      (danger > 0.6) msg = "Something is right here with you. Move. Now.";
  else if (danger > 0.2) msg = "You feel a presence nearby. Don't stay.";
  else if (df < 0.25)    msg = "The exit is close. You can almost feel the air change.";
  else                   msg = "Nothing here. The way out is still ahead of you.";
  setNarrationGame(msg);
  speak(msg);
  playTone({ freq: 528, type: 'sine', duration: 0.25, volume: 0.08, attack: 0.03 });
>>>>>>> 957e4cc84cb480f599fede08771e096353aca8fc
};

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSpaceMs < DOUBLE_TAP_MS) {
      lastSpaceMs = 0;
      game.dodge();
    } else {
      lastSpaceMs = now;
      game.jump();
    }
    return;
  }
  if (e.key === 'j' || e.key === 'J') {
    e.preventDefault();
    game.interact();
    return;
  }
  const move = KEY_MAP[e.key];
  if (move) {
    e.preventDefault();
    lastDir = move;
    game.move(move.dx, move.dy);
  }
});