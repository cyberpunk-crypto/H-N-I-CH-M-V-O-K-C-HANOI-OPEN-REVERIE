const fs = require('fs');
const path = require('path');
const lamejs = require('./lame.all.cjs');

const SAMPLE_RATE = 44100;

function encodeToMp3(samples, sampleRate = SAMPLE_RATE, kbps = 128) {
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, kbps);
  const mp3Data = [];
  
  // Convert float array (-1.0 to 1.0) to Int16Array
  const int16Samples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const blockSize = 1152;
  for (let i = 0; i < int16Samples.length; i += blockSize) {
    const chunk = int16Samples.subarray(i, i + blockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(Buffer.from(mp3buf));
    }
  }
  
  const endBuf = mp3encoder.flush();
  if (endBuf.length > 0) {
    mp3Data.push(Buffer.from(endBuf));
  }
  
  return Buffer.concat(mp3Data);
}

// -------------------------------------------------------------
// AUDIO 1: SHUTTER CLICK (crisp mechanical Leica M3 camera shutter)
// -------------------------------------------------------------
function synthShutterClick() {
  const duration = 0.35; // seconds
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // Phase 1: Finger press & trigger release (t = 0.005s)
    if (t >= 0.005 && t < 0.04) {
      const dt = t - 0.005;
      const env = Math.exp(-dt * 180);
      const click = Math.sin(2 * Math.PI * 3400 * dt) + 0.5 * Math.sin(2 * Math.PI * 5200 * dt);
      const noise = (Math.random() * 2 - 1) * 0.4;
      s += (click + noise) * env * 0.6;
    }

    // Phase 2: Main curtain snap (t = 0.025s) - heavy mechanical crunch
    if (t >= 0.025 && t < 0.12) {
      const dt = t - 0.025;
      const env = Math.exp(-dt * 65);
      const thud = Math.sin(2 * Math.PI * 480 * Math.exp(-dt * 20) * dt);
      const metallic = Math.sin(2 * Math.PI * 1850 * dt) * 0.4 + Math.sin(2 * Math.PI * 2700 * dt) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.8;
      s += (thud * 0.7 + metallic + noise) * env * 0.95;
    }

    // Phase 3: Secondary curtain close & spring damper (t = 0.07s)
    if (t >= 0.07 && t < 0.22) {
      const dt = t - 0.07;
      const env = Math.exp(-dt * 45);
      const bounce = Math.sin(2 * Math.PI * 920 * dt) * 0.4 + Math.sin(2 * Math.PI * 2150 * dt) * 0.3;
      const noise = (Math.random() * 2 - 1) * 0.3;
      s += (bounce + noise) * env * 0.5;
    }

    // Phase 4: Tiny delicate spring reverberation (t = 0.12s)
    if (t >= 0.12) {
      const dt = t - 0.12;
      const env = Math.exp(-dt * 25);
      const spring = Math.sin(2 * Math.PI * 1420 * dt) * Math.sin(2 * Math.PI * 45 * dt);
      s += spring * env * 0.15;
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 2: AMBIENT LAKE (Hoan Kiem lake breeze, gentle waves, temple bell)
// -------------------------------------------------------------
function synthAmbientLake() {
  const duration = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  // Bell events at t = 1.5s and t = 6.2s
  const bells = [1.5, 6.2];

  // Simple state for noise filters
  let b0 = 0, b1 = 0, b2 = 0;
  let w0 = 0, w1 = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // 1. Water waves lapping (swell every ~ 2.8s)
    const swell = (Math.sin(2 * Math.PI * 0.35 * t) * 0.5 + 0.5) ** 2;
    const white = Math.random() * 2 - 1;
    // Lowpass pink-like noise
    b0 = 0.96 * b0 + white * 0.04;
    b1 = 0.94 * b1 + b0 * 0.06;
    s += b1 * (0.15 + swell * 0.25);

    // 2. Willow wind whisper (high breathy filtered noise)
    const windLFO = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.18 * t + 1.2);
    w0 = 0.85 * w0 + (Math.random() * 2 - 1) * 0.15;
    w1 = 0.85 * w1 + (w0 - b1) * 0.1;
    s += w1 * windLFO * 0.08;

    // 3. Distant bronze temple bell (Ngoc Son temple)
    for (const bt of bells) {
      if (t >= bt) {
        const dt = t - bt;
        const decay = Math.exp(-dt * 0.7); // long ring
        if (decay > 0.001) {
          const bellSound = 
            0.50 * Math.sin(2 * Math.PI * 440 * dt) +       // A4 fundamental
            0.35 * Math.sin(2 * Math.PI * 884 * dt) +       // octave overtone
            0.20 * Math.sin(2 * Math.PI * 1238 * dt) +      // minor third overtone
            0.15 * Math.sin(2 * Math.PI * 1762 * dt) +      // strike tone
            0.08 * Math.sin(2 * Math.PI * 2640 * dt);
          s += bellSound * decay * 0.32;
        }
      }
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 3: AMBIENT TRAIN (Train horn, rail clatter, deep rumble)
// -------------------------------------------------------------
function synthAmbientTrain() {
  const duration = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  const hornTriggers = [1.2, 5.8];
  let trackFilter = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // 1. Steel wheel rhythmic clatter ("ca-clack ... ca-clack")
    const trainSpeed = 1.8; // clatter cycle in seconds
    const phase = (t % (1 / trainSpeed)) * trainSpeed; // 0 to 1
    // Click 1 at phase 0.0, Click 2 at phase 0.18
    let clack = 0;
    if (phase < 0.05) {
      clack += Math.exp(-phase * 120) * (Math.sin(2 * Math.PI * 650 * phase) + (Math.random() * 2 - 1) * 0.5);
    }
    if (phase >= 0.12 && phase < 0.18) {
      const dt = phase - 0.12;
      clack += Math.exp(-dt * 130) * (Math.sin(2 * Math.PI * 580 * dt) + (Math.random() * 2 - 1) * 0.4);
    }
    s += clack * 0.22;

    // 2. Track rumble (low frequency drone)
    trackFilter = 0.97 * trackFilter + (Math.random() * 2 - 1) * 0.03;
    const rumble = Math.sin(2 * Math.PI * 55 * t) * 0.1 + trackFilter * 0.18;
    s += rumble * 0.35;

    // 3. Train Horn in distance (Vietnamese diesel locomotive chord: D#4, F#4, A#4, D#5)
    for (const ht of hornTriggers) {
      if (t >= ht && t < ht + 2.4) {
        const dt = t - ht;
        // Horn envelope: attack 0.15s, sustain, release 0.6s
        let env = 1.0;
        if (dt < 0.15) env = dt / 0.15;
        else if (dt > 1.8) env = Math.max(0, (2.4 - dt) / 0.6);

        // Gentle doppler pitch bend downwards
        const pitchBend = 1.0 - 0.015 * (dt / 2.4);
        const f1 = 311.13 * pitchBend;
        const f2 = 369.99 * pitchBend;
        const f3 = 466.16 * pitchBend;
        const f4 = 622.25 * pitchBend;

        const chord = 
          0.35 * Math.sin(2 * Math.PI * f1 * dt) +
          0.30 * Math.sin(2 * Math.PI * f2 * dt) +
          0.25 * Math.sin(2 * Math.PI * f3 * dt) +
          0.18 * Math.sin(2 * Math.PI * f4 * dt) +
          0.08 * (Math.random() * 2 - 1); // brass breath

        s += chord * env * 0.45;
      }
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 4: AMBIENT STREET (Hanoi cicadas, bicycle bell, street vendor)
// -------------------------------------------------------------
function synthAmbientStreet() {
  const duration = 10.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  const bellTriggers = [2.5, 7.0];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // 1. Summer Cicadas (Ve sầu râm ran)
    // Modulated high frequency buzz ~ 5200 Hz with 8Hz and 18Hz tremolo
    const cicadaTremolo = (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.5 * t)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 18 * t));
    const cicadaCarrier = Math.sin(2 * Math.PI * 5400 * t) + 0.4 * Math.sin(2 * Math.PI * 5900 * t);
    const cicadaSwell = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
    s += cicadaCarrier * cicadaTremolo * cicadaSwell * 0.12;

    // 2. Bicycle Bell ("kính coong kính coong" double ring)
    for (const bt of bellTriggers) {
      if (t >= bt && t < bt + 1.2) {
        const dt = t - bt;
        // Ring 1 at dt = 0.0
        if (dt < 0.45) {
          const dec = Math.exp(-dt * 12);
          const chime = Math.sin(2 * Math.PI * 2350 * dt) + 0.4 * Math.sin(2 * Math.PI * 3150 * dt);
          s += chime * dec * 0.28;
        }
        // Ring 2 at dt = 0.2
        if (dt >= 0.2) {
          const dt2 = dt - 0.2;
          const dec2 = Math.exp(-dt2 * 11);
          const chime2 = Math.sin(2 * Math.PI * 2350 * dt2) + 0.4 * Math.sin(2 * Math.PI * 3150 * dt2);
          s += chime2 * dec2 * 0.32;
        }
      }
    }

    // 3. Street vendor melodic chanting tone (Formant synthesis of "Ai xôi lạc bánh khúc đê...")
    // Melodic street vendor call motif at t = 4.2s to t = 6.2s
    if (t >= 4.2 && t < 6.2) {
      const dt = t - 4.2;
      // Melody pitches: E4 (330Hz) -> G4 (392Hz) -> E4 (330Hz) -> C4 (261Hz)
      let pitch = 330;
      if (dt > 0.4 && dt <= 1.0) pitch = 392;
      else if (dt > 1.0 && dt <= 1.5) pitch = 330;
      else if (dt > 1.5) pitch = 261;

      const env = Math.sin((dt / 2.0) * Math.PI); // smooth arch envelope
      const vocalTone = Math.sin(2 * Math.PI * pitch * dt) + 
                        0.5 * Math.sin(2 * Math.PI * pitch * 2 * dt) + 
                        0.25 * Math.sin(2 * Math.PI * pitch * 3 * dt);
      // Distance filter
      s += vocalTone * env * 0.14;
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 5: PHOTO DEVELOP (Darkroom liquid tray slosh & paper drip)
// -------------------------------------------------------------
function synthPhotoDevelop() {
  const duration = 4.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  let sloshFilter = 0;
  const dripTimes = [0.6, 1.1, 1.7, 2.3, 2.9, 3.4];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // 1. Liquid slosh in tray (swells at ~ 1.2s intervals)
    const traySwell = Math.max(0, Math.sin(2 * Math.PI * 0.8 * t));
    const noise = Math.random() * 2 - 1;
    sloshFilter = 0.92 * sloshFilter + noise * 0.08;
    s += sloshFilter * (traySwell ** 1.5) * 0.45;

    // 2. Paper handling / chemical dripping droplets
    for (const dt of dripTimes) {
      if (t >= dt && t < dt + 0.15) {
        const timeSinceDrip = t - dt;
        const decay = Math.exp(-timeSinceDrip * 50);
        // Frequency sweep downwards 1400 -> 900 Hz
        const freq = 1400 - timeSinceDrip * 3500;
        const drip = Math.sin(2 * Math.PI * Math.max(400, freq) * timeSinceDrip);
        s += drip * decay * 0.35;
      }
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 6: GRAMOPHONE MELODY (Vintage 78 RPM gramophone waltz & vinyl crackle)
// -------------------------------------------------------------
function synthGramophoneMelody() {
  const duration = 12.0; // seconds
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  // Pentatonic / romantic waltz melody notes (frequencies in Hz)
  // C4, E4, G4, A4, B4, C5, D5, E5
  const melody = [
    { time: 0.0, freq: 261.63, dur: 0.8 }, // C4
    { time: 1.0, freq: 329.63, dur: 0.8 }, // E4
    { time: 2.0, freq: 392.00, dur: 1.6 }, // G4
    { time: 4.0, freq: 440.00, dur: 0.8 }, // A4
    { time: 5.0, freq: 392.00, dur: 0.8 }, // G4
    { time: 6.0, freq: 329.63, dur: 1.6 }, // E4
    { time: 8.0, freq: 293.66, dur: 0.8 }, // D4
    { time: 9.0, freq: 329.63, dur: 0.8 }, // E4
    { time: 10.0, freq: 261.63, dur: 1.8 }, // C4
  ];

  let hornFilter = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    // 1. Vinyl/Shellac surface noise & periodic 78 RPM click (~1.3Hz)
    const revPeriod = 60 / 78; // ~0.77 sec per rotation
    const revPhase = (t % revPeriod) / revPeriod;
    if (revPhase < 0.02) {
      const pop = Math.exp(-revPhase * 300) * (Math.random() * 2 - 1) * 0.25;
      s += pop;
    }
    // Random dust crackles
    if (Math.random() < 0.003) {
      s += (Math.random() * 2 - 1) * 0.15;
    }
    // Continuous hiss
    const hiss = (Math.random() * 2 - 1) * 0.035;
    s += hiss;

    // 2. Synthesize nostalgic piano / flute melody
    for (const note of melody) {
      if (t >= note.time && t < note.time + note.dur + 0.3) {
        const dt = t - note.time;
        const env = Math.exp(-dt * 2.2);
        // Vintage warmth with odd harmonics
        const tone = Math.sin(2 * Math.PI * note.freq * dt)
                   + 0.4 * Math.sin(2 * Math.PI * note.freq * 2 * dt)
                   + 0.15 * Math.sin(2 * Math.PI * note.freq * 3 * dt);
        // Slight tape flutter / wow
        const wow = 1 + 0.004 * Math.sin(2 * Math.PI * 3.5 * t);
        s += tone * env * 0.45 * wow;
      }
    }

    // 3. Gramophone bandpass horn resonance (~500Hz to ~2800Hz)
    hornFilter = 0.85 * hornFilter + s * 0.15;
    out[i] = Math.max(-1, Math.min(1, hornFilter * 1.4));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 7: CLOCK PENDULUM (Mechanical oak wall clock ticking)
// -------------------------------------------------------------
function synthClockPendulum() {
  const duration = 6.0; // seconds
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  // 1 tick per second (alternating Tick and Tock)
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    const secondPhase = t % 1.0;
    const isEvenSec = Math.floor(t) % 2 === 0;

    // Tick at start of each second
    if (secondPhase < 0.12) {
      const dt = secondPhase;
      const env = Math.exp(-dt * 45);
      // Alternate pitch between 1200Hz (tick) and 850Hz (tock)
      const baseFreq = isEvenSec ? 1250 : 880;
      const woodThump = Math.sin(2 * Math.PI * baseFreq * Math.exp(-dt * 15) * dt);
      const escapementClick = (Math.random() * 2 - 1) * Math.exp(-dt * 120) * 0.4;
      s += (woodThump + escapementClick) * env * 0.65;
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// AUDIO 8: BICYCLE BELL (Classic Thong Nhat brass bicycle dual bell ring)
// -------------------------------------------------------------
function synthBicycleBell() {
  const duration = 2.5; // seconds
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(numSamples);

  // Dual strike: Ring 1 at 0.05s, Ring 2 at 0.35s ("Kính... Coong...")
  const strikes = [
    { time: 0.05, f1: 2450, f2: 3680, dur: 1.2 },
    { time: 0.35, f1: 2180, f2: 3260, dur: 1.8 }
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;

    for (const strike of strikes) {
      if (t >= strike.time && t < strike.time + strike.dur) {
        const dt = t - strike.time;
        // Exponential bell decay with subtle tremolo
        const decay = Math.exp(-dt * 4.0);
        const tremolo = 1.0 + 0.18 * Math.sin(2 * Math.PI * 18 * dt);
        // Clear brass harmonics
        const ring = Math.sin(2 * Math.PI * strike.f1 * dt)
                   + 0.55 * Math.sin(2 * Math.PI * strike.f2 * dt)
                   + 0.2 * Math.sin(2 * Math.PI * (strike.f1 * 1.5) * dt);
        s += ring * decay * tremolo * 0.55;
      }
    }

    out[i] = Math.max(-1, Math.min(1, s));
  }
  return out;
}

// -------------------------------------------------------------
// MAIN COMPILATION AND EXPORT
// -------------------------------------------------------------
const tracks = [
  { name: 'shutter_click.mp3', synth: synthShutterClick },
  { name: 'ambient_lake.mp3', synth: synthAmbientLake },
  { name: 'ambient_train.mp3', synth: synthAmbientTrain },
  { name: 'ambient_street.mp3', synth: synthAmbientStreet },
  { name: 'photo_develop.mp3', synth: synthPhotoDevelop },
  { name: 'gramophone_melody.mp3', synth: synthGramophoneMelody },
  { name: 'clock_pendulum.mp3', synth: synthClockPendulum },
  { name: 'bicycle_bell.mp3', synth: synthBicycleBell },
];

console.log('Synthesizing high-fidelity audio assets...');
for (const track of tracks) {
  console.log(`Generating ${track.name}...`);
  const floatSamples = track.synth();
  const mp3Buffer = encodeToMp3(floatSamples);
  const outPath = path.join(__dirname, 'assets', 'audio', track.name);
  fs.writeFileSync(outPath, mp3Buffer);
  console.log(`  -> Wrote ${outPath} (${mp3Buffer.length} bytes)`);
}
console.log('All audio assets generated successfully!');
