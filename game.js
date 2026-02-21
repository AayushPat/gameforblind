// ─── CONTINUOUS MAP CONFIGURATION ────────────────────────────────────────────
const MAP = { w: 15, h: 25 };
const CELL = 30; // canvas pixels per grid cell (for developer testing)

// The story checkpoints the player must reach in order.
const STORY_NODES = [
  {
    title: "The Safehouse",
    x: 7, y: 24, // Starting position
    text: "Chapter 1. You wake up. The SOS signal is breaking through the static. You need to grab your gear and find the door out."
  },
  {
    title: "The Alleyway",
    x: 7, y: 19,
    text: "Chapter 2. You step outside into a light drizzle. Navigate the narrow alley, but avoid the jagged scrap metal."
  },
  {
    title: "The Flooded Street",
    x: 2, y: 14,
    text: "Chapter 3. The main road is flooded. The water is deep and fast. Step carefully across the submerged cars."
  },
  {
    title: "The Overgrown Park",
    x: 12, y: 9,
    text: "Chapter 4. You enter a park reclaimed by wild dogs. Move quietly so they don't hear you."
  },
  {
    title: "The Subway Descent",
    x: 7, y: 4,
    text: "Chapter 5. The streets are blocked. You must go underground into the echoing subway tunnels."
  },
  {
    title: "The Broadcast Tower",
    x: 7, y: 0, // Final destination
    text: "Chapter 6. You reach the door to the transmission room. The radio signal is deafeningly clear. You've made it."
  }
];

// All hazards across the entire map
const HAZARDS = [
  // Alleyway scrap metal (around y: 19)
  { zones: [{x:6, y:20}, {x:8, y:20}, {x:6, y:18}, {x:8, y:18}], intensityRadius: 2.0 },
  // Flooded street water (around y: 14)
  { zones: [{x:1, y:15}, {x:3, y:15}, {x:1, y:13}, {x:3, y:13}, {x:2, y:15}, {x:2, y:13}], intensityRadius: 1.5 },
  // Park dogs (around y: 9)
  { zones: [{x:10, y:10}, {x:11, y:10}, {x:10, y:8}, {x:13, y:10}], intensityRadius: 3.0 },
  // Subway rubble (around y: 4)
  { zones: [{x:6, y:5}, {x:8, y:5}, {x:6, y:3}, {x:8, y:3}], intensityRadius: 2.0 }
];

// ─── GLOBAL STATE ────────────────────────────────────────────────────────────
let currentNodeIndex = 0;

const game = {
  player: { x: STORY_NODES[0].x, y: STORY_NODES[0].y },
  goal: { x: STORY_NODES[1].x, y: STORY_NODES[1].y },
  started: false,
  won: false,

  distanceFactor() {
    const dx = this.goal.x - this.player.x;
    const dy = this.goal.y - this.player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    // Max distance is roughly the diagonal of the whole map
    const maxDist = Math.sqrt(MAP.w ** 2 + MAP.h ** 2);
    return Math.min(1, dist / maxDist);
  },

  move(dx, dy) {
    if (!this.started || this.won) return;

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    // Check Map Boundaries
    if (nx < 0 || nx >= MAP.w || ny < 0 || ny >= MAP.h) {
      if (typeof playTone === 'function') playTone({ freq: 150, type: 'square', duration: 0.1, volume: 0.1 }); // Placeholder wall bump
      return;
    }

    this.player.x = nx;
    this.player.y = ny;

    // Check if player reached the current checkpoint
    if (this.player.x === this.goal.x && this.player.y === this.goal.y) {
      this.advanceCheckpoint();
    }

    renderGrid();
  },

  advanceCheckpoint() {
    currentNodeIndex++;

    // Check if they reached the final node
    if (currentNodeIndex >= STORY_NODES.length) {
      this.won = true;
      if (typeof speak === 'function') speak("You have completed the journey.");
      document.getElementById('status').textContent = 'GAME CLEARED.';
      return;
    }

    // Play the story text for reaching this node
    const node = STORY_NODES[currentNodeIndex];
    if (typeof speak === 'function') speak(node.text);
    document.getElementById('status').textContent = node.title;

    // Set the goal to the NEXT checkpoint, unless we are on the last one
    if (currentNodeIndex + 1 < STORY_NODES.length) {
      this.goal.x = STORY_NODES[currentNodeIndex + 1].x;
      this.goal.y = STORY_NODES[currentNodeIndex + 1].y;
    }
  },

  interact() {
    if (!this.started || this.won) return;
    const df = this.distanceFactor();
    let msg;

    if (df < 0.1) msg = "The signal is strong. The next location is right here.";
    else if (df < 0.3) msg = "You're getting closer. Keep tracking.";
    else msg = "The signal is faint. You have a long way to go.";

    if (typeof speak === 'function') speak(msg);
  }
};

// ─── DEVELOPER VISUALS (For testing only) ────────────────────────────────────
function renderGrid() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');

  const W = MAP.w * CELL;
  const H = MAP.h * CELL;
  canvas.width = W;
  canvas.height = H;

  // Clear background
  c.fillStyle = '#3a1878';
  c.fillRect(0, 0, W, H);

  // Draw Grid Lines
  c.strokeStyle = 'rgba(255, 215, 0, 0.1)';
  c.lineWidth = 1;
  for (let x = 0; x <= MAP.w; x++) {
    c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, H); c.stroke();
  }
  for (let y = 0; y <= MAP.h; y++) {
    c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(W, y * CELL); c.stroke();
  }

  // Draw Hazards (Red)
  HAZARDS.forEach(hazard => {
    hazard.zones.forEach(z => {
      c.fillStyle = 'rgba(220, 0, 40, 0.5)';
      c.fillRect(z.x * CELL, z.y * CELL, CELL, CELL);
    });
  });

  // Draw the Active Goal (Gold)
  if (!game.won) {
    c.fillStyle = '#ffd700';
    c.fillRect(game.goal.x * CELL + 5, game.goal.y * CELL + 5, CELL - 10, CELL - 10);
  }

  // Draw Player (Cyan)
  c.fillStyle = '#00ffcc';
  c.beginPath();
  c.arc(game.player.x * CELL + CELL / 2, game.player.y * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
  c.fill();
}

// ─── START & INPUTS ──────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  // If you still have audio.js attached, initialize it
  if (typeof initAudio === 'function') initAudio();

  document.getElementById('intro-ui').style.display = 'none';
  const gameUI = document.getElementById('game-ui');
  gameUI.style.display = 'block';
  gameUI.removeAttribute('aria-hidden');
  game.started = true;

  // Reset state
  currentNodeIndex = 0;
  game.player.x = STORY_NODES[0].x;
  game.player.y = STORY_NODES[0].y;
  game.goal.x = STORY_NODES[1].x;
  game.goal.y = STORY_NODES[1].y;
  game.won = false;

  // Narrate the very first checkpoint
  if (typeof speak === 'function') speak(STORY_NODES[0].text);
  document.getElementById('status').textContent = STORY_NODES[0].title;

  renderGrid();
});

const KEY_MAP = {
  w: { dx:  0, dy: -1 },
  s: { dx:  0, dy:  1 },
  a: { dx: -1, dy:  0 },
  d: { dx:  1, dy:  0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 }
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
