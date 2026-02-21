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

const game = {
  player: { x: STORY_NODES[0].x, y: STORY_NODES[0].y },
  goal: { x: STORY_NODES[1].x, y: STORY_NODES[1].y },
  started: false,
  won: false,

  distanceFactor() {
    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
    return Math.min(1, Math.sqrt(dx*dx + dy*dy) / 15); // Localized distance feeling
  },

  move(dx, dy) {
    if (!this.started || this.won) return;

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    // Trigger visual sonar ping
    visualPulse = 1.0;

    // Check Map Boundaries
    if (nx < 0 || nx >= MAP.w || ny < 0 || ny >= MAP.h) {
      if (typeof playTone === 'function') playTone({ freq: 150, type: 'square', duration: 0.1, volume: 0.1 });
      return;
    }

    this.player.x = nx;
    this.player.y = ny;

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

    // Update UI Progress Tracker
    document.getElementById('status').textContent = `Chapter ${currentNodeIndex + 1} of ${STORY_NODES.length}: ${node.title}`;

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

    if (typeof speak === 'function') speak(msg);
  }
};

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

function renderGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');

  // Fix canvas size to a nice viewport window (INCREASED SIZE)
  const viewW = 800;
  const viewH = 800;
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

  // (The dotted line code was removed from here)

  // Draw Checkpoints with Numbers
  STORY_NODES.forEach((node, i) => {
    // Only show current and future nodes (optional, but keeps map clean)
    if (i < currentNodeIndex) return;

    // Draw the square
    c.fillStyle = i === currentNodeIndex + 1 ? '#ffd700' : 'rgba(255, 215, 0, 0.3)';
    c.fillRect(node.x * CELL + 8, node.y * CELL + 8, CELL - 16, CELL - 16);

    // Draw the Chapter Number next to it
    c.fillStyle = 'rgba(255, 255, 255, 0.8)';
    c.font = '14px sans-serif';
    c.fillText(`Ch ${i + 1}`, node.x * CELL + CELL, node.y * CELL + CELL / 2 + 5);
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
  c.beginPath();
  c.arc(game.player.x * CELL + CELL / 2, game.player.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

// ─── START & INPUTS ──────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  if (typeof initAudio === 'function') initAudio();

  document.getElementById('intro-ui').style.display = 'none';
  const gameUI = document.getElementById('game-ui');
  gameUI.style.display = 'block';
  gameUI.removeAttribute('aria-hidden');
  game.started = true;

  currentNodeIndex = 0;
  game.player.x = STORY_NODES[0].x;
  game.player.y = STORY_NODES[0].y;
  game.goal.x = STORY_NODES[1].x;
  game.goal.y = STORY_NODES[1].y;
  game.won = false;

  if (typeof speak === 'function') speak(STORY_NODES[0].text);

  // Set initial UI tracker text
  document.getElementById('status').textContent = `Chapter 1 of ${STORY_NODES.length}: ${STORY_NODES[0].title}`;

  // Kick off the drawing loop
  if (!frameId) drawLoop();
});

const KEY_MAP = {
  w: { dx:  0, dy: -1 }, s: { dx:  0, dy:  1 },
  a: { dx: -1, dy:  0 }, d: { dx:  1, dy:  0 },
  ArrowUp: { dx: 0, dy: -1 }, ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 }, ArrowRight: { dx: 1, dy: 0 }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'j' || e.key === 'J' || e.key === ' ') {
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
