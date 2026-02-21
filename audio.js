// ─── AUDIO ENGINE (FMOD) ──────────────────────────────────────────────────────
// Requires fmodstudio.js + fmodstudio.wasm from fmod.com (HTML5 export)
// Banks expected in ./banks/ : Master.bank, Master.strings.bank, SFX.bank, Music.bank

let gStudio = null;       // FMOD Studio system
let gCoreSystem = null;   // FMOD Core system (for update loop)

// Persistent event instances (looping sounds)
let instHeartbeat = null;
let instBeacon    = null;
let instMusic     = null;
let instDangerSnap = null; // snapshot

let fmodReady = false;
let updateHandle = null;

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initAudio() {
  // FMOD's HTML5 module is loaded by fmodstudio.js and exposed as FMOD global
  const FMODModule = {};

  await new Promise((resolve) => {
    FMODModule['onRuntimeInitialized'] = resolve;
    FMOD(FMODModule);
  });

  let out = {};

  FMODModule.Studio.System.create(out);
  gStudio = out.val;

  gStudio.getCoreSystem(out);
  gCoreSystem = out.val;

  gStudio.initialize(
    64,                             // max channels
    FMODModule.STUDIO_INITFLAGS.NORMAL,
    FMODModule.INITFLAGS.NORMAL,
    null
  );

  // Load banks (place .bank files in a ./banks/ folder next to gfb.html)
  const banks = ['Master.bank', 'Master.strings.bank', 'SFX.bank', 'Music.bank'];
  for (const name of banks) {
    gStudio.loadBankFile(`banks/${name}`, FMODModule.STUDIO_LOAD_BANK_FLAGS.NORMAL, out);
  }

  fmodReady = true;

  // FMOD requires a periodic update call
  updateHandle = setInterval(() => gStudio.update(), 16);

  _startMusic();
  _startHeartbeat();
}

// ─── HELPER: create and start an event instance ───────────────────────────────
function _createInstance(path) {
  if (!fmodReady) return null;
  const out = {};
  const result = gStudio.getEvent(path, out);
  if (result !== 0 /* FMOD_OK */) { console.warn('FMOD event not found:', path); return null; }
  out.val.createInstance(out);
  return out.val;
}

function _playOneShot(path, params = {}) {
  const inst = _createInstance(path);
  if (!inst) return;
  for (const [k, v] of Object.entries(params)) inst.setParameterByName(k, v, false);
  inst.start();
  inst.release(); // auto-clean when done
}

// ─── MUSIC ────────────────────────────────────────────────────────────────────
function _startMusic() {
  instMusic = _createInstance('event:/Music/Adaptive');
  if (!instMusic) return;
  instMusic.setParameterByName('Danger', 0, false);
  instMusic.start();
}

// Called by game.js updateSounds() — danger and df are 0–1
function setMusicVolume(danger, df) {
  if (!instMusic) return;
  instMusic.setParameterByName('Danger', danger, false);
  // Optional: drive a Distance/Goal parameter if you add one in FMOD Studio
  // instMusic.setParameterByName('Distance', df, false);
}

// ─── HEARTBEAT ────────────────────────────────────────────────────────────────
function _startHeartbeat() {
  instHeartbeat = _createInstance('event:/SFX/Heartbeat');
  if (!instHeartbeat) return;
  instHeartbeat.setParameterByName('BPM', 60, false);
  instHeartbeat.start();
}

function setHeartbeatBPM(bpm) {
  if (!instHeartbeat) return;
  instHeartbeat.setParameterByName('BPM', Math.max(40, Math.min(180, bpm)), false);
}

// ─── BEACON ───────────────────────────────────────────────────────────────────
function startBeacon(pan, distanceFactor) {
  if (instBeacon) { instBeacon.stop(0); instBeacon.release(); }
  instBeacon = _createInstance('event:/SFX/Beacon');
  if (!instBeacon) return;
  instBeacon.setParameterByName('Pan', pan, false);
  instBeacon.setParameterByName('Distance', distanceFactor, false);
  instBeacon.start();
}

function stopBeacon() {
  if (!instBeacon) return;
  instBeacon.stop(0 /* FMOD_STUDIO_STOP_ALLOWFADEOUT */);
  instBeacon.release();
  instBeacon = null;
}

// Update beacon parameters each move (called by game logic)
function updateBeacon(pan, distanceFactor) {
  if (!instBeacon) return;
  instBeacon.setParameterByName('Pan', pan, false);
  instBeacon.setParameterByName('Distance', distanceFactor, false);
}

// ─── DANGER SNAPSHOT ─────────────────────────────────────────────────────────
// Snapshots apply mix effects (e.g. low-pass, reverb) globally via FMOD Studio
function triggerDangerSnapshot(intensity) {
  if (!fmodReady) return;
  if (intensity > 0.4 && !instDangerSnap) {
    instDangerSnap = _createInstance('snapshot:/DangerZone');
    if (instDangerSnap) instDangerSnap.start();
  } else if (intensity <= 0.4 && instDangerSnap) {
    instDangerSnap.stop(0);
    instDangerSnap.release();
    instDangerSnap = null;
  }
}

// ─── ONE-SHOT SFX ─────────────────────────────────────────────────────────────
function playNoise({ pan = 0 } = {}) {
  _playOneShot('event:/SFX/Footstep', { Pan: pan });
}

function playBlip() {
  _playOneShot('event:/SFX/Blip');
}

function playDanger(intensity) {
  if (intensity <= 0) return;
  _playOneShot('event:/SFX/Danger', { Intensity: intensity });
}

function playWin() {
  stopBeacon();
  // Heartbeat will auto-stop if you set it to 0 or stop the instance
  if (instHeartbeat) { instHeartbeat.stop(0); instHeartbeat.release(); instHeartbeat = null; }
  _playOneShot('event:/SFX/Win');
}

// Wall bump — reuse Blip or give it its own event
function playTone({ freq } = {}) {
  // Thin compatibility shim: game.js calls playTone for wall bumps
  // Route to a generic UI event; FMOD Studio controls the actual sound
  _playOneShot('event:/SFX/Wall');
}
