// ─── AUDIO ENGINE ────────────────────────────────────────────────────────────
let ctx = null;
let masterGain = null;
let heartbeatInterval = null;
let beaconInterval = null;
let ambienceNodes = {};

function initAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(ctx.destination);
  startAmbience();
  startHeartbeat(60);
}

// Tone generator
function playTone({ freq = 440, type = 'sine', duration = 0.1, volume = 0.3, pan = 0, attack = 0.01, decay = 0.05, detune = 0 }) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  panner.pan.value = Math.max(-1, Math.min(1, pan));

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration - decay);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Noise burst (footstep)
function playNoise({ duration = 0.06, volume = 0.08, pan = 0 }) {
  if (!ctx) return;
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const panner = ctx.createStereoPanner();

  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.value = 300;
  filter.Q.value = 0.8;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  panner.pan.value = pan;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);
  src.start();
}

// Heartbeat
function startHeartbeat(bpm) {
  stopHeartbeat();
  const interval = (60 / bpm) * 1000;
  function beat() {
    playTone({ freq: 55, type: 'sine', duration: 0.12, volume: 0.18, attack: 0.005 });
    setTimeout(() => playTone({ freq: 48, type: 'sine', duration: 0.1, volume: 0.12, attack: 0.005 }), 120);
  }
  beat();
  heartbeatInterval = setInterval(beat, interval);
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

function setHeartbeatBPM(bpm) {
  stopHeartbeat();
  startHeartbeat(bpm);
}

// Beacon — directional tone toward goal
function startBeacon(pan, distanceFactor) {
  stopBeacon();
  // distanceFactor: 0 = at goal, 1 = far away
  const baseFreq = 330 + (1 - distanceFactor) * 220; // higher = closer
  const vol = 0.05 + (1 - distanceFactor) * 0.2;

  function pulse() {
    playTone({ freq: baseFreq, type: 'sine', duration: 0.3, volume: vol, pan, attack: 0.05, decay: 0.2 });
  }

  const pulseRate = 400 + distanceFactor * 800; // faster when closer
  pulse();
  beaconInterval = setInterval(() => {
    const df = game.distanceFactor();
    const p = game.beaconPan();
    const f = 330 + (1 - df) * 220;
    const v = 0.05 + (1 - df) * 0.2;
    playTone({ freq: f, type: 'sine', duration: 0.3, volume: v, pan: p, attack: 0.05, decay: 0.2 });
  }, 1200);
}

function stopBeacon() {
  if (beaconInterval) clearInterval(beaconInterval);
}

// Danger sound
function playDanger(intensity) {
  // intensity 0–1
  if (intensity <= 0) return;
  playTone({ freq: 60 + intensity * 40, type: 'sawtooth', duration: 0.4, volume: intensity * 0.15, attack: 0.1, detune: Math.random() * 30 });
}

// Ambient room sound (soft, looping hum — bedroom at night)
function startAmbience() {
  // Very soft hum like a house settling
  playTone({ freq: 80, type: 'sine', duration: 60, volume: 0.02, attack: 2 });
}

// UI blip
function playBlip() {
  playTone({ freq: 660, type: 'sine', duration: 0.05, volume: 0.15, attack: 0.005 });
}

// Win sound — rising warmth
function playWin() {
  stopBeacon();
  stopHeartbeat();
  [440, 554, 659, 880].forEach((f, i) => {
    setTimeout(() => playTone({ freq: f, type: 'sine', duration: 1.2, volume: 0.2, attack: 0.1 }), i * 200);
  });
}
