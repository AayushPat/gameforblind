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

const game = {
  player: { x: 4, y: 4 },        // start in center (your bed)
  goal: { x: 0, y: 0 },          // front door — top-left
  started: false,
  won: false,

  distanceFactor() {
    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxDist = Math.sqrt(GRID_W*GRID_W + GRID_H*GRID_H);
    return Math.min(1, dist / maxDist);
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
    if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) {
      // Bump into wall
      playTone({ freq: 180, type: 'square', duration: 0.08, volume: 0.12 });
      announce('Wall.');
      return;
    }
    this.player.x = nx;
    this.player.y = ny;

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
function renderGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const W = GRID_W * CELL;
  const H = GRID_H * CELL;

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
}

// ─── NARRATION ───────────────────────────────────────────────────────────────
const narrations = {
  far:    ["Something out there is waiting for you.", "The house is quiet. Too quiet.", "You feel like you need to find the way out."],
  mid:    ["You're getting closer.", "A faint light — somewhere ahead.", "Keep moving. You can feel it."],
  close:  ["Almost there.", "The air feels different here.", "You can almost touch it."],
  danger: ["Something is wrong.", "Your skin prickles.", "Don't stop. Move."],
};

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

  const intro = "You're awake. Sitting on the edge of your bed. Something pulled you out of sleep. You need to find the door.";
  setNarrationGame(intro);
  speak(intro);
  renderGrid();

  // Kick off beacon
  setTimeout(() => {
    startBeacon(game.beaconPan(), game.distanceFactor());
    game.updateSounds();
  }, 800);
});

// ─── KEYBOARD ────────────────────────────────────────────────────────────────
const KEY_MAP = {
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