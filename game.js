// ─── AMBIENT INTERACTIVE BACKGROUND ──────────────────────────────────────────
const bgCanvas = document.createElement("canvas");
bgCanvas.id = "ambient-bg";
Object.assign(bgCanvas.style, {
  position: "fixed", top: "0", left: "0",
  width: "100vw", height: "100vh",
  zIndex: "-1", pointerEvents: "none"
});
document.body.appendChild(bgCanvas);
document.body.style.backgroundColor = "#07040f"; // Deep tech void
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
document.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

let globalRipples = [];
function spawnGlobalRipple(colorStr, speed, width) {
  globalRipples.push({ radius: 0, color: colorStr, speed: speed, width: width });
}

function drawAmbientBackground() {
  const ctx = bgCanvas.getContext("2d");
  const w = bgCanvas.width = window.innerWidth;
  const h = bgCanvas.height = window.innerHeight;

  ctx.fillStyle = "#07040f";
  ctx.fillRect(0, 0, w, h);

  const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 500);
  gradient.addColorStop(0, "rgba(0, 255, 204, 0.05)");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  const gridSize = 100;
  const timeOffset = (Date.now() / 40) % gridSize;

  for (let x = -timeOffset; x < w; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = -timeOffset; y < h; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  for (let i = globalRipples.length - 1; i >= 0; i--) {
    let rip = globalRipples[i];
    rip.radius += rip.speed;
    let alpha = Math.max(0, 1 - (rip.radius / (w * 0.8)));

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, rip.radius, 0, Math.PI * 2);
    ctx.strokeStyle = rip.color.replace("ALPHA", alpha);
    ctx.lineWidth = rip.width;
    ctx.stroke();

    if (rip.radius > w) globalRipples.splice(i, 1);
  }
}

// ─── CONTINUOUS MAP CONFIGURATION ────────────────────────────────────────────
const MAP = { w: 20, h: 80 };
const CELL = 40;

const STORY_NODES = [
  { title: "The Safehouse", x: 10, y: 78, text: "Chapter 1. You wake up. The SOS signal is breaking through the static. You need to grab your gear and find the door out." },
  { title: "The Alleyway", x: 10, y: 69, text: "Chapter 2. You step outside into a light drizzle. Navigate the narrow alley, but avoid the jagged scrap metal piled against the walls." },
  { title: "The Flooded Street", x: 4, y: 60, text: "Chapter 3. The main road is flooded. The water is deep and moving fast. Step carefully across the submerged cars." },
  { title: "The Overgrown Park", x: 15, y: 51, text: "Chapter 4. You enter a park reclaimed by wild dogs. Move quietly so they don't hear you." },
  { title: "The Subway Descent", x: 10, y: 42, text: "Chapter 5. The streets are blocked. You must go underground into the echoing, pitch-black subway tunnels." },
  { title: "The Train Graveyard", x: 5, y: 33, text: "Chapter 6. You are lost in a maze of derailed subway cars. Weave through the open doors to find the exit stairs." },
  { title: "The Ascend", x: 15, y: 24, text: "Chapter 7. You find the stairwell of the skyscraper. It's a grueling climb, but the signal is getting louder." },
  { title: "The Collapsed Floor", x: 10, y: 15, text: "Chapter 8. The floorboards here are rotted. One wrong step and you'll fall through the ceiling. Listen for the groaning wood." },
  { title: "The Roof Edge", x: 10, y: 8, text: "Chapter 9. You are on the roof. The wind is howling. Walk along the narrow ledge to reach the tower." },
  { title: "The Broadcast Tower", x: 10, y: 1, text: "Chapter 10. You open the door, cutting off the wind. The room hums with electricity. You found the source." }
];

function createWall(y, gapStartX, gapEndX) {
  let zones = [];
  for (let x = 0; x < MAP.w; x++) {
    if (x < gapStartX || x > gapEndX) {
      zones.push({ x: x, y: y });
    }
  }
  return { zones: zones, intensityRadius: 2.0 };
}

function createBlock(startX, startY, w, h) {
  let zones = [];
  for (let x = startX; x < startX + w; x++) {
    for (let y = startY; y < startY + h; y++) {
      if (x >= 0 && x < MAP.w && y >= 0 && y < MAP.h) {
        zones.push({ x: x, y: y });
      }
    }
  }
  return { zones: zones, intensityRadius: 2.5 };
}

let HAZARDS = [
  createWall(74, 8, 12),
  createBlock(2, 65, 3, 3),
  createBlock(14, 64, 4, 2),
  createBlock(8, 66, 2, 2),
  createBlock(10, 62, 2, 2),
  createBlock(0, 56, 6, 4),
  createBlock(14, 56, 6, 4),
  createWall(48, 1, 6),
  createWall(45, 13, 18),
  createBlock(4, 38, 12, 4),
  createBlock(0, 28, 5, 2),
  createBlock(8, 28, 4, 2),
  createBlock(15, 28, 5, 2),
  createBlock(2, 18, 6, 2),
  createBlock(12, 18, 6, 2),
  createBlock(6, 20, 8, 2),
  createBlock(0, 2, 9, 6),
  createBlock(11, 2, 9, 6)
];

let PATROLLERS = [
  { x: 2, y: 65, minX: 1, maxX: 18, dir: 1 },
  { x: 18, y: 55, minX: 1, maxX: 18, dir: -1 },
  { x: 5, y: 45, minX: 1, maxX: 18, dir: 1 },
  { x: 15, y: 30, minX: 1, maxX: 18, dir: -1 },
  { x: 8, y: 17, minX: 1, maxX: 18, dir: 1 }
];

// ─── TUTORIAL ────────────────────────────────────────────────────────────────
const MAIN_HAZARDS    = HAZARDS;
const MAIN_PATROLLERS = PATROLLERS;

// Single hazard wall with a gap — the only obstacle in the tutorial
const TUTORIAL_HAZARDS = [createWall(74, 8, 12)];

let isTutorial    = false;
let tutorialStep  = 0;
let tutorialMoves = 0;

const TUTORIAL_LINES = [
  // 0 — on start
  "Welcome to Wake Up. You navigate this world using sound alone. " +
  "The ambient music pans left and right to guide you toward safety. " +
  "Use the arrow keys or W A S D to move. Explore the space.",

  // 1 — after first move
  "There is a danger zone ahead. As you get closer you will hear " +
  "a warning tone rise and pan toward the threat. The guide music " +
  "will shift left or right to point you toward the safe gap. " +
  "Walk toward the danger and listen.",

  // 2 — player is close to the wall
  "Danger is close. Follow the guide music — it is panning toward " +
  "the gap in the wall. Move through the opening.",

  // 3 — player crossed the wall
  "You made it through. Keep following the guide music. " +
  "The checkpoint is just ahead.",

  // 4 — tutorial checkpoint reached
  "Tutorial complete. Trust the music. The real mission begins now.",

  // 5 — hit a hazard during tutorial
  "You walked into a danger zone and were sent back to the start. " +
  "The guide music pans toward the safe gap in the wall. " +
  "Follow the panning — do not walk straight into the red. Find the opening."
];

// Updates the on-screen narration box AND speaks via TTS if available.
function tutorialNarrate(text, onDone = null) {
  const el = document.getElementById("narration-game");
  if (el) el.textContent = text;
  speak(text, { lock: true, canCut: false, onDone });
}

// ─── ElevenLabs TTS ──────────────────────────────────────────────────────────
let _ttsAudio      = null;
let _ttsSpeaking   = false;
let _narrationLock = false;  // blocks player movement while tutorial is talking

// Cache blob URLs for known tutorial lines — pre-fetched at page load so
// playback is instant when the user presses start.
const _audioCache = new Map();

async function _fetchAudio(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": EL_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.50, similarity_boost: 0.75 }
      })
    }
  );
  if (!res.ok) throw new Error("TTS fetch failed");
  return URL.createObjectURL(await res.blob());
}

// Pre-warm all tutorial lines in parallel while user reads the intro screen.
// By the time they click start the blobs are ready → zero perceptible delay.
(async () => {
  await Promise.all(TUTORIAL_LINES.map(async text => {
    try { _audioCache.set(text, await _fetchAudio(text)); } catch (_) {}
  }));
})();

// options:
//   lock   — freeze player movement while this line plays
//   canCut — if false, bail out when already speaking (never cuts a live line)
//   onDone — callback fired when audio finishes (or on error)
async function speak(text, { lock = false, canCut = true, onDone = null } = {}) {
  // Tutorial lines must not cut each other — skip if already speaking
  if (!canCut && _ttsSpeaking) return;

  // Interrupt whatever is currently playing
  if (_ttsAudio) {
    _ttsAudio.pause();
    _ttsAudio.src = "";
    _ttsAudio = null;
  }

  _ttsSpeaking = true;
  if (lock) _narrationLock = true;

  const finish = () => {
    _ttsSpeaking   = false;
    _narrationLock = false;
    if (onDone) onDone();
  };

  try {
    // Use cached blob URL if available (tutorial lines), otherwise fetch live
    const url = _audioCache.has(text) ? _audioCache.get(text) : await _fetchAudio(text);
    _ttsAudio = new Audio(url);
    _ttsAudio.play().catch(() => {});
    _ttsAudio.onended = () => {
      // Only revoke if it was a live fetch (not a cached tutorial line)
      if (!_audioCache.has(text)) URL.revokeObjectURL(url);
      finish();
    };
  } catch (_) {
    finish();
  }
}

// ─── AUDIO SYSTEM ────────────────────────────────────────────────────────────
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  initAmbienceLoops();
}

function playTone({ freq, type, duration, volume, pan = 0 }) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  let panner = null;
  if (audioCtx.createStereoPanner) {
    panner = audioCtx.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), audioCtx.currentTime);
  }

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  if (panner) {
    osc.connect(gain);
    gain.connect(panner);
    panner.connect(audioCtx.destination);
  } else {
    osc.connect(gain);
    gain.connect(audioCtx.destination);
  }

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function normPan(dx) { return clamp(dx / 6, -1, 1); }

function nearestHazardInfo(nx, ny) {
  let best = { dist: Infinity, dx: 0, dy: 0 };
  for (const hazard of HAZARDS) {
    for (const z of hazard.zones) {
      const dx = z.x - nx;
      const dy = z.y - ny;
      const dist = Math.hypot(dx, dy);
      if (dist < best.dist) best = { dist, dx, dy };
    }
  }
  return best;
}

function nearestPatrollerInfo(nx, ny) {
  let best = { dist: Infinity, dx: 0, dy: 0 };
  for (const p of PATROLLERS) {
    const dx = p.x - nx;
    const dy = p.y - ny;
    const dist = Math.hypot(dx, dy);
    if (dist < best.dist) best = { dist, dx, dy };
  }
  return best;
}

// ─── PATHFINDING & NAVIGATION HELPERS ────────────────────────────────────────
let currentPath = [];

// Returns {dist, gapX} for the nearest gap cell in the next hazard wall ahead.
// Returns null if no walls between player and goal.
function nearestGapInfo(px, py, goalY) {
  const wallsAhead = HAZARDS.filter(h => {
    if (!h.zones.length) return false;
    const wallY = h.zones[0].y;
    return wallY < py && wallY > goalY;
  });
  if (!wallsAhead.length) return null;

  wallsAhead.sort((a, b) => Math.abs(a.zones[0].y - py) - Math.abs(b.zones[0].y - py));
  const nearestWall = wallsAhead[0];
  const wallY       = nearestWall.zones[0].y;
  const hazardXs    = new Set(nearestWall.zones.map(z => z.x));

  let minDist = Infinity, gapX = px;
  for (let x = 0; x < MAP.w; x++) {
    if (!hazardXs.has(x)) {
      const d = Math.sqrt((px - x) ** 2 + (py - wallY) ** 2);
      if (d < minDist) { minDist = d; gapX = x; }
    }
  }
  return { dist: minDist, gapX };
}

// Returns true if any hazard wall row sits between the player and goal Y.
function hasWallBetween(py, gy) {
  const minY = Math.min(py, gy);
  const maxY = Math.max(py, gy);
  return HAZARDS.some(h => {
    if (!h.zones.length) return false;
    const wallY = h.zones[0].y;
    return wallY > minY && wallY < maxY;
  });
}

function _buildBlockedSet() {
  const blocked = new Set();
  for (const hazard of HAZARDS)
    for (const z of hazard.zones)
      blocked.add(`${z.x},${z.y}`);
  return blocked;
}

function computePath(startX, startY, goalX, goalY) {
  const blocked = _buildBlockedSet();
  const startKey = `${startX},${startY}`;
  const goalKey  = `${goalX},${goalY}`;

  const queue   = [startKey];
  const visited = new Set([startKey]);
  const parent  = new Map();

  while (queue.length) {
    const key = queue.shift();
    if (key === goalKey) {
      const path = [];
      let k = key;
      while (k !== startKey) {
        const [x, y] = k.split(',').map(Number);
        path.unshift({ x, y });
        k = parent.get(k);
      }
      return path;
    }
    const [cx, cy] = key.split(',').map(Number);
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= MAP.w || ny < 0 || ny >= MAP.h) continue;
      const nk = `${nx},${ny}`;
      if (visited.has(nk) || blocked.has(nk)) continue;
      visited.add(nk);
      parent.set(nk, key);
      queue.push(nk);
    }
  }
  return []; // no path
}

// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let currentNodeIndex = 0;
let visualPulse = 0;
let frameId;
let screenShake = 0;

let lastMoveAt = 0;
let beaconTimer = 0;

function killPlayer(msg) {
  playTone({ freq: 50, type: "sawtooth", duration: 1.0, volume: 0.3, pan: 0 });
  screenShake = 20;

  spawnGlobalRipple("rgba(255, 0, 68, ALPHA)", 30, 15);

  if (typeof speak === "function") speak(msg);

  game.player.x = STORY_NODES[currentNodeIndex].x;
  game.player.y = STORY_NODES[currentNodeIndex].y;
  game.hp = game.maxHp;

  game.noise = 0;
  game.chaseTicks = 0;
  beaconTimer = 0;
}

const game = {
  player: { x: STORY_NODES[0].x, y: STORY_NODES[0].y },
  goal: { x: STORY_NODES[1].x, y: STORY_NODES[1].y },
  started: false,
  won: false,
  patrolInterval: null,

  hp: 100,
  maxHp: 100,

  pings: 3,
  maxPings: 3,
  noise: 0,
  noiseDecay: 0.02,
  chaseRadius: 6,
  chaseTicks: 0,

  distanceFactor() {
    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
    return Math.min(1, Math.sqrt(dx * dx + dy * dy) / 20);
  },

  move(dx, dy) {
    if (!this.started || this.won) return;
    if (_narrationLock) return;  // block input while narrator is speaking

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    visualPulse = 1.0;

    const now = performance.now();
    const dt = now - lastMoveAt;
    lastMoveAt = now;

    if (dt < 140) this.noise = Math.min(1, this.noise + 0.12);
    else if (dt < 250) this.noise = Math.min(1, this.noise + 0.06);
    else this.noise = Math.min(1, this.noise + 0.02);

    if (nx < 0 || nx >= MAP.w || ny < 0 || ny >= MAP.h) {
      playTone({ freq: 150, type: "square", duration: 0.2, volume: 0.1, pan: 0 });
      screenShake = 5;
      return;
    }

    let tookDamage = false;

    for (const hazard of HAZARDS) {
      for (const z of hazard.zones) {
        if (nx === z.x && ny === z.y) tookDamage = true;
      }
    }

    for (const p of PATROLLERS) {
      if (nx === p.x && ny === p.y) tookDamage = true;
    }

    // Danger music — reuse the helper results computed below for efficiency
    // (computed after the damage check so we can share hz/pt with tone system)
    if (tookDamage) {
      this.hp -= 10;
      playTone({ freq: 120, type: "sawtooth", duration: 0.3, volume: 0.2, pan: 0 });
      screenShake = 15;
      spawnGlobalRipple("rgba(255, 0, 68, ALPHA)", 20, 8);

      if (this.hp <= 0) {
        killPlayer("Vital signs lost. Restarting chapter.");
      } else {
        if (typeof speak === "function") speak(`Hazard hit. Falling back. HP at ${this.hp}.`);
        this.player.x = STORY_NODES[currentNodeIndex].x;
        this.player.y = STORY_NODES[currentNodeIndex].y;
      }
      return;
    }

    this.player.x = nx;
    this.player.y = ny;

    // Shared proximity info for both tone system and danger music
    const hz = nearestHazardInfo(nx, ny);
    const pt = nearestPatrollerInfo(nx, ny);
    const nearest = (pt.dist < hz.dist) ? pt : hz;
    const pan = normPan(nearest.dx);

    // Danger music crossfade
    const dangerLevel = Math.pow(Math.max(0, Math.min(1, (6 - nearest.dist) / 5)), 2);
    const dangerPan   = Math.max(-1, Math.min(1, nearest.dx / 1.2));
    if (typeof updateDangerMusic === "function") updateDangerMusic(dangerLevel, dangerPan);

    // Proximity oscillator tones
    if (nearest.dist <= 5.5) {
      const dl = clamp((5.5 - nearest.dist) / 5.5, 0, 1);
      playTone({
        freq: 220 + dl * 260,
        type: "square",
        duration: 0.12,
        volume: 0.03 + dl * 0.08,
        pan
      });
    } else {
      const gdx = this.goal.x - nx;
      playTone({
        freq: 420,
        type: "sine",
        duration: 0.04,
        volume: 0.02,
        pan: normPan(gdx)
      });
    }

    // Music path guide: fixed-volume ambience panned toward ideal next move
    currentPath = computePath(this.player.x, this.player.y, this.goal.x, this.goal.y);
    let pathGuidePan = 0;
    if (currentPath.length > 0) {
      const lookAhead = Math.min(5, currentPath.length);
      let xSum = 0;
      for (let i = 0; i < lookAhead; i++) xSum += currentPath[i].x;
      const avgX = xSum / lookAhead;
      pathGuidePan = clamp((avgX - this.player.x) / 2.5, -1, 1);
    }
    if (typeof updatePathGuide === "function") updatePathGuide(1, pathGuidePan);

    // ── Tutorial narration advancement ────────────────────────────────────────
    // Steps: 0=welcome(locked) 1=free 2=danger-ahead(locked) 3=free
    //        4=danger-close(locked) 5=free 6=made-it-thru(locked) 7=free→goal
    if (isTutorial) {
      tutorialMoves++;

      // Step 1 → 2: player has explored a bit and is approaching the wall
      if (tutorialStep === 1 && nearest.dist < 6 && tutorialMoves > 4) {
        tutorialStep = 2;
        tutorialNarrate(TUTORIAL_LINES[1], () => { tutorialStep = 3; });

      // Step 3 → 4: player is right on the edge of the danger zone
      } else if (tutorialStep === 3 && nearest.dist < 3) {
        tutorialStep = 4;
        tutorialNarrate(TUTORIAL_LINES[2], () => { tutorialStep = 5; });

      // Step 5 → 6: player has passed through the gap
      } else if (tutorialStep === 5 && this.player.y <= 73) {
        tutorialStep = 6;
        tutorialNarrate(TUTORIAL_LINES[3], () => { tutorialStep = 7; });
      }
    }

    if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
      if (typeof updatePathGuide === "function") updatePathGuide(0);
      playTone({ freq: 600, type: "sine", duration: 0.4, volume: 0.1, pan: 0 });
      setTimeout(() => playTone({ freq: 800, type: "sine", duration: 0.6, volume: 0.1, pan: 0 }), 200);

      this.hp = Math.min(this.maxHp, this.hp + 30);
      this.pings = Math.min(this.maxPings, this.pings + 1);

      // Minor ripple on normal checkpoint
      if (currentNodeIndex < STORY_NODES.length - 1) {
        spawnGlobalRipple("rgba(255, 215, 0, ALPHA)", 15, 6);
      }
      this.advanceCheckpoint();
    }
  },

  advanceCheckpoint() {
    // ── Tutorial completion: restore real world then fall through ─────────────
    if (isTutorial) {
      isTutorial = false;
      HAZARDS    = MAIN_HAZARDS;
      PATROLLERS = MAIN_PATROLLERS;
      tutorialStep = 5;

      if (typeof playCheckpoint === "function") playCheckpoint();
      tutorialNarrate(TUTORIAL_LINES[4]);

      // Set up chapter 2 manually (player is already at STORY_NODES[1] position)
      currentNodeIndex = 1;
      visualPulse = 2.0;
      this.goal.x = STORY_NODES[2].x;
      this.goal.y = STORY_NODES[2].y;
      currentPath = computePath(this.player.x, this.player.y, this.goal.x, this.goal.y);

      // Delay chapter 2 narration so "tutorial complete" speaks first
      setTimeout(() => {
        const el = document.getElementById("narration-game");
        if (el) el.textContent = STORY_NODES[1].text;
        if (typeof speak === "function") speak(STORY_NODES[1].text);
      }, 5000);

      return;
    }

    currentNodeIndex++;
    visualPulse = 2.0;

    if (currentNodeIndex >= STORY_NODES.length) {
      this.won = true;

      // ─── VICTORY EFFECTS ───
      if (typeof speak === "function") speak("Signal located. The Broadcast Tower is secure.");
      if (this.patrolInterval) clearInterval(this.patrolInterval);

      // Triumphant Victory Chords
      playTone({ freq: 440, type: "sine", duration: 0.3, volume: 0.1 }); // A4
      setTimeout(() => playTone({ freq: 554, type: "sine", duration: 0.3, volume: 0.1 }), 300); // C#5
      setTimeout(() => playTone({ freq: 659, type: "sine", duration: 1.0, volume: 0.1 }), 600); // E5

      // Massive slow cyan victory ripple
      spawnGlobalRipple("rgba(0, 255, 204, ALPHA)", 8, 25);
      return;
    }

    const node = STORY_NODES[currentNodeIndex];
    if (typeof speak === "function") speak(node.text);

    if (currentNodeIndex + 1 < STORY_NODES.length) {
      this.goal.x = STORY_NODES[currentNodeIndex + 1].x;
      this.goal.y = STORY_NODES[currentNodeIndex + 1].y;
    }
    currentPath = computePath(this.player.x, this.player.y, this.goal.x, this.goal.y);
  },

  interact() {
    if (!this.started || this.won) return;

    if (this.pings <= 0) {
      if (typeof speak === "function") speak("No pings left.");
      playTone({ freq: 140, type: "square", duration: 0.12, volume: 0.05, pan: 0 });
      return;
    }

    this.pings -= 1;
    visualPulse = 1.5;

    spawnGlobalRipple("rgba(0, 255, 204, ALPHA)", 18, 5);

    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
    const d = Math.hypot(dx, dy);

    let horiz = dx === 0 ? "" : (dx > 0 ? "right" : "left");
    let vert = dy === 0 ? "" : (dy > 0 ? "down" : "up");

    let dirMsg = "";
    if (horiz && vert) dirMsg = `${vert} and ${horiz}`;
    else dirMsg = horiz || vert || "here";

    let distMsg =
      d < 2 ? "very close" :
      d < 6 ? "close" :
      d < 12 ? "mid range" : "far";

    if (typeof speak === "function") speak(`Ping. Goal is ${distMsg}, ${dirMsg}. ${this.pings} pings left.`);

    playTone({
      freq: clamp(300 + (20 - d) * 35, 200, 1000),
      type: "triangle",
      duration: 0.2,
      volume: 0.10,
      pan: normPan(dx)
    });
  }
};

// ─── DYNAMIC CAMERA & RENDERER ───────────────────────────────────────────────
function drawLoop() {
  drawAmbientBackground();
  renderGrid();

  if (visualPulse > 0) {
    visualPulse -= 0.02;
    if (visualPulse < 0) visualPulse = 0;
  }

  if (screenShake > 0) {
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }

  if (game.started && !game.won) {
    game.noise = Math.max(0, game.noise - game.noiseDecay);

    beaconTimer += 1;
    const dx = game.goal.x - game.player.x;
    const dy = game.goal.y - game.player.y;
    const d = Math.hypot(dx, dy);

    const interval = clamp(Math.floor(90 - d * 6), 18, 90);
    if (beaconTimer >= interval) {
      beaconTimer = 0;
      const pan = normPan(dx);
      const freq = clamp(250 + (20 - d) * 25, 180, 900);
      const vol = clamp(0.02 + (1 - d / 20) * 0.08, 0.02, 0.12);
      playTone({ freq, type: "sine", duration: 0.08, volume: vol, pan });
    }
  }

  frameId = requestAnimationFrame(drawLoop);
}

function renderGrid() {
  const canvas = document.getElementById("grid-canvas");
  if (!canvas) return;
  const c = canvas.getContext("2d");

  const viewW = 800;
  const viewH = 800;
  canvas.width = viewW;
  canvas.height = viewH;

  c.fillStyle = "#0f081c";
  c.fillRect(0, 0, viewW, viewH);
  c.save();

  let shakeX = (Math.random() - 0.5) * screenShake;
  let shakeY = (Math.random() - 0.5) * screenShake;

  const camX = (viewW / 2) - (game.player.x * CELL + CELL / 2) + shakeX;
  const camY = (viewH / 2) - (game.player.y * CELL + CELL / 2) + shakeY;
  c.translate(Math.floor(camX), Math.floor(camY));

  c.strokeStyle = "rgba(0, 255, 204, 0.03)";
  c.lineWidth = 1;
  for (let x = 0; x <= MAP.w; x++) {
    c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, MAP.h * CELL); c.stroke();
  }
  for (let y = 0; y <= MAP.h; y++) {
    c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(MAP.w * CELL, y * CELL); c.stroke();
  }

  const time = Date.now() / 300;

  // Draw optimal path as faint dots
  currentPath.forEach((cell, i) => {
    const t = i / Math.max(1, currentPath.length - 1); // 0 = near player, 1 = near goal
    c.beginPath();
    c.arc(cell.x * CELL + CELL / 2, cell.y * CELL + CELL / 2, 3, 0, Math.PI * 2);
    c.fillStyle = `rgba(0, 255, 204, ${0.08 + t * 0.1})`; // slightly brighter toward goal
    c.fill();
  });

  HAZARDS.forEach(hazard => {
    hazard.zones.forEach(z => {
      const glow = 0.2 + Math.sin(time + z.x + z.y) * 0.15;
      c.shadowBlur = 15;
      c.shadowColor = "red";
      c.fillStyle = `rgba(200, 0, 0, ${glow})`;
      c.fillRect(z.x * CELL + 2, z.y * CELL + 2, CELL - 4, CELL - 4);
      c.shadowBlur = 0;

      c.strokeStyle = `rgba(255, 0, 0, ${glow + 0.3})`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(z.x * CELL + 2, z.y * CELL + 2);
      c.lineTo(z.x * CELL + CELL - 2, z.y * CELL + CELL - 2);
      c.moveTo(z.x * CELL + CELL - 2, z.y * CELL + 2);
      c.lineTo(z.x * CELL + 2, z.y * CELL + CELL - 2);
      c.stroke();
    });
  });

  STORY_NODES.forEach((node, i) => {
    if (i < currentNodeIndex) return;
    c.shadowBlur = i === currentNodeIndex + 1 ? 20 : 0;
    c.shadowColor = "#ffd700";
    c.fillStyle = i === currentNodeIndex + 1 ? "#ffd700" : "rgba(255, 215, 0, 0.2)";
    c.fillRect(node.x * CELL + 8, node.y * CELL + 8, CELL - 16, CELL - 16);
    c.shadowBlur = 0;

    c.fillStyle = "rgba(255, 255, 255, 0.9)";
    c.textAlign = "left";
    c.font = "bold 12px monospace";
    c.fillText(`CH ${i + 1}`, node.x * CELL + CELL, node.y * CELL + CELL / 2 + 5);
  });

  PATROLLERS.forEach(p => {
    const px = p.x * CELL + CELL / 2;
    const py = p.y * CELL + CELL / 2;

    c.shadowBlur = 20;
    c.shadowColor = "#ff0044";
    c.fillStyle = "#220011";
    c.beginPath(); c.arc(px, py, CELL / 2.5, 0, Math.PI * 2); c.fill();

    c.shadowBlur = 5;
    c.fillStyle = "#ff0044";
    c.beginPath(); c.arc(px, py, CELL / 5, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;
  });

  if (visualPulse > 0) {
    c.beginPath();
    c.arc(
      game.player.x * CELL + CELL / 2,
      game.player.y * CELL + CELL / 2,
      (2 - visualPulse) * CELL * 2,
      0,
      Math.PI * 2
    );
    c.strokeStyle = `rgba(0, 255, 204, ${visualPulse})`;
    c.lineWidth = 3;
    c.stroke();
  }

  const px = game.player.x * CELL + CELL / 2;
  const py = game.player.y * CELL + CELL / 2;

  c.shadowBlur = 25;
  c.shadowColor = "#00ffcc";
  c.fillStyle = "#00ffcc";
  c.beginPath(); c.arc(px, py, CELL / 3, 0, Math.PI * 2); c.fill();

  c.fillStyle = "#ffffff";
  c.beginPath(); c.arc(px, py, CELL / 6, 0, Math.PI * 2); c.fill();
  c.shadowBlur = 0;

  c.save();
  c.translate(px, py);
  c.rotate(Date.now() / 200);
  c.strokeStyle = "rgba(0, 255, 204, 0.8)";
  c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, CELL / 1.8, 0, Math.PI); c.stroke();
  c.restore();

  c.restore();

  // ─── UI HUD OVERLAY ───
  if (game.won) {
    // ─── GAME OVER / VICTORY OVERLAY ───
    c.fillStyle = "rgba(0, 0, 0, 0.85)";
    c.fillRect(0, 0, viewW, viewH);

    c.fillStyle = "#00ffcc";
    c.textAlign = "center";
    c.font = "bold 42px monospace";
    c.fillText("SIGNAL LOCATED", viewW / 2, viewH / 2 - 30);

    c.fillStyle = "#ffffff";
    c.font = "20px monospace";
    c.fillText("THE BROADCAST TOWER IS SECURE.", viewW / 2, viewH / 2 + 10);

    c.fillStyle = "#ffd700";
    c.font = "14px monospace";
    c.fillText("Refresh the page to play again.", viewW / 2, viewH / 2 + 70);

    c.textAlign = "left"; // Reset for safety
  } else {
    // ─── NORMAL HUD ───
    c.fillStyle = "rgba(0, 0, 0, 0.7)";
    c.fillRect(20, 20, 220, 55);
    c.strokeStyle = "#ff0044";
    c.lineWidth = 2;
    c.strokeRect(20, 20, 220, 55);

    const hpWidth = Math.max(0, (game.hp / game.maxHp) * 216);
    if (game.hp > 50) c.fillStyle = "#00ffcc";
    else if (game.hp > 25) c.fillStyle = "#ffd700";
    else c.fillStyle = "#ff0044";

    c.fillRect(22, 22, hpWidth, 21);

    c.fillStyle = "#ffffff";
    c.textAlign = "left";
    c.font = "bold 14px monospace";
    c.fillText(`PLAYER HP: ${game.hp}%`, 30, 38);

    c.font = "bold 12px monospace";
    c.fillText(`PINGS: ${game.pings}/${game.maxPings}`, 30, 58);

    // Tutorial badge
    if (isTutorial) {
      c.fillStyle = "rgba(0, 0, 0, 0.7)";
      c.fillRect(20, 82, 130, 24);
      c.strokeStyle = "#00ffcc";
      c.lineWidth = 1;
      c.strokeRect(20, 82, 130, 24);
      c.fillStyle = "#00ffcc";
      c.font = "bold 11px monospace";
      c.fillText("[ TUTORIAL MODE ]", 26, 98);
    }
  }
}

// ─── START & INPUTS ──────────────────────────────────────────────────────────
document.getElementById("start-btn").addEventListener("click", () => {
  if (typeof initAudio === "function") initAudio();

  const style = document.createElement('style');
  style.innerHTML = `body { color: transparent !important; } #game-ui, #grid-canvas, #game-ui * { color: white !important; }`;
  document.head.appendChild(style);

  document.getElementById("intro-ui").style.display = "none";
  const gameUI = document.getElementById("game-ui");
  gameUI.style.display = "block";
  gameUI.removeAttribute("aria-hidden");
  game.started = true;

  // ── Tutorial: swap to a single-wall world, no patrollers ──────────────────
  isTutorial    = true;
  tutorialStep  = 0;
  tutorialMoves = 0;
  HAZARDS    = TUTORIAL_HAZARDS;
  PATROLLERS = [];

  currentNodeIndex = 0;
  // Start player left-of-center so directional panning is noticeable
  game.player.x = 3;
  game.player.y = STORY_NODES[0].y;   // y = 78
  // Tutorial goal = first real checkpoint (wall gap leads right to it)
  game.goal.x = STORY_NODES[1].x;
  game.goal.y = STORY_NODES[1].y;
  game.won = false;

  game.hp = game.maxHp;
  game.pings = game.maxPings;
  game.noise = 0;
  game.chaseTicks = 0;
  beaconTimer = 0;
  lastMoveAt = 0;

  // Welcome locked — step advances to 1 only after audio fully finishes
  tutorialNarrate(TUTORIAL_LINES[0], () => {
    tutorialStep = 1;
    const el = document.getElementById("narration-game");
    if (el) el.textContent = "Explore. Move with arrow keys or W A S D.";
  });

  currentPath = computePath(game.player.x, game.player.y, game.goal.x, game.goal.y);
  if (!frameId) drawLoop();

  if (game.patrolInterval) clearInterval(game.patrolInterval);

  game.patrolInterval = setInterval(() => {
    if (!game.started || game.won) return;

    const isSafeZone = game.player.y <= 12;
    let nearestP = nearestPatrollerInfo(game.player.x, game.player.y);

    if (isSafeZone) {
      game.chaseTicks = 0;
    } else {
      if (nearestP.dist <= game.chaseRadius || game.noise > 0.55) {
        game.chaseTicks = Math.min(8, game.chaseTicks + 2);
      } else {
        game.chaseTicks = Math.max(0, game.chaseTicks - 1);
      }
    }

    let closestDrone = null;
    let minDist = Infinity;
    PATROLLERS.forEach(p => {
      let d = Math.hypot(game.player.x - p.x, game.player.y - p.y);
      if (d < minDist) {
        minDist = d;
        closestDrone = p;
      }
    });

    let playerHit = false;

    PATROLLERS.forEach(p => {
      if (game.chaseTicks > 0 && p === closestDrone && !isSafeZone) {
        const dx = game.player.x - p.x;
        const dy = game.player.y - p.y;

        if (Math.abs(dx) > Math.abs(dy)) p.x += Math.sign(dx);
        else p.y += Math.sign(dy);

        p.x = clamp(p.x, 0, MAP.w - 1);
        p.y = clamp(p.y, 0, MAP.h - 1);
      } else {
        p.x += p.dir;
        if (p.x >= p.maxX || p.x <= p.minX) p.dir *= -1;
      }

      if (p.x === game.player.x && p.y === game.player.y) playerHit = true;
    });

    nearestP = nearestPatrollerInfo(game.player.x, game.player.y);
    if (nearestP.dist <= 8) {
      const vol = clamp(0.01 + (1 - nearestP.dist / 8) * 0.12, 0.01, 0.14);
      const freq = clamp(180 + (1 - nearestP.dist / 8) * 280, 180, 550);
      playTone({ freq, type: "triangle", duration: 0.08, volume: vol, pan: normPan(nearestP.dx) });
    }

    if (playerHit) {
      game.hp -= 10;
      playTone({ freq: 120, type: "sawtooth", duration: 0.3, volume: 0.2, pan: 0 });
      screenShake = 15;
      spawnGlobalRipple("rgba(255, 0, 68, ALPHA)", 20, 8);

      if (game.hp <= 0) {
        killPlayer("Vital signs lost. Restarting chapter.");
      } else {
        if (typeof speak === "function") speak(`Drone strike. Falling back. HP at ${game.hp}.`);
        game.player.x = STORY_NODES[currentNodeIndex].x;
        game.player.y = STORY_NODES[currentNodeIndex].y;
      }
    }

    if (game.chaseTicks > 0) game.chaseTicks -= 1;
  }, 600);
});

const KEY_MAP = {
  w: { dx: 0, dy: -1 }, s: { dx: 0, dy: 1 },
  a: { dx: -1, dy: 0 }, d: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "j" || e.key === "J" || e.key === " ") {
    e.preventDefault();
    game.interact();
    return;
  }
  const move = KEY_MAP[e.key];
  if (move) {
    e.preventDefault();
    game.move(move.dx, move.dy);
  }
});
