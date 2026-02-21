// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────
// Uses Web Audio API AudioBufferSourceNode for seamless gapless looping.
// audioCtx is created by game.js's initAudio() before initAmbienceLoops() runs.

let _exploring       = null;
let _exploringPanner = null;
let _danger          = null;
let _dangerPanner    = null;
let _audioReady      = false;

let _dangerLevel    = 0;
let _pathGuideLevel = 0;

// ─── INIT ──────────────────────────────────────────────────────────────────────
async function initAmbienceLoops() {
  _dangerPanner = audioCtx.createStereoPanner();
  _dangerPanner.pan.value = 0;
  _dangerPanner.connect(audioCtx.destination);

  _exploringPanner = audioCtx.createStereoPanner();
  _exploringPanner.pan.value = 0;
  _exploringPanner.connect(audioCtx.destination);

  [_exploring, _danger] = await Promise.all([
    _makeLoop('sounds/exploring.mp3', 0.0, _exploringPanner),
    _makeLoop('sounds/danger.mp3',    0.0, _dangerPanner),
  ]);
  _audioReady = true;
}

// Fetch, decode, and start a gapless looping buffer. Returns a volume proxy
// with fadeTo(target, seconds) for smooth ramps.
async function _makeLoop(src, initialVolume, outputNode) {
  const response    = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = initialVolume;
  gainNode.connect(outputNode);

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop   = true;
  source.connect(gainNode);
  source.start(0);

  return {
    get volume()  { return gainNode.gain.value; },
    set volume(v) {
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.value = Math.max(0, Math.min(4, v));
    },
    fadeTo(v, secs) {
      const clamped = Math.max(0, Math.min(4, v));
      gainNode.gain.cancelScheduledValues(audioCtx.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(clamped, audioCtx.currentTime + secs);
    }
  };
}

// ─── PATH / GAP GUIDE ─────────────────────────────────────────────────────────
// level: 0–1, pan: -1 left … 1 right (toward gap or checkpoint)
function updatePathGuide(level, pan = 0) {
  if (!_audioReady || !_exploring) return;
  _pathGuideLevel = level;
  // Fixed quiet baseline — volume stays constant, only pan shifts direction
  const target = level > 0 ? 0.45 * Math.max(0, 1 - _dangerLevel * 0.6) : 0;
  _exploring.fadeTo(target, 0.8);
  if (_exploringPanner) {
    _exploringPanner.pan.cancelScheduledValues(audioCtx.currentTime);
    _exploringPanner.pan.setTargetAtTime(
      Math.max(-1, Math.min(1, pan)),
      audioCtx.currentTime,
      0.15
    );
  }
}

// ─── DANGER CROSSFADE ─────────────────────────────────────────────────────────
// level: 0 = safe, 1 = max danger  |  pan: -1 left … 1 right
function updateDangerMusic(level, pan = 0) {
  if (!_audioReady) return;
  _dangerLevel = level;
  _danger.volume = level;
  // Re-sync path guide whenever danger changes
  if (_exploring) {
    const target = _pathGuideLevel * 2.0 * Math.max(0, 1 - _dangerLevel);
    _exploring.fadeTo(target, 0.4);
  }
  if (_dangerPanner) {
    _dangerPanner.pan.cancelScheduledValues(audioCtx.currentTime);
    _dangerPanner.pan.setTargetAtTime(
      Math.max(-1, Math.min(1, pan)),
      audioCtx.currentTime,
      0.15
    );
  }
}

// ─── CHECKPOINT STINGER ────────────────────────────────────────────────────────
function playCheckpoint() {
  const stinger = new Audio('sounds/cutaproachmusic.mp3');
  stinger.play().catch(() => {});
}

function playWin() { playCheckpoint(); }
