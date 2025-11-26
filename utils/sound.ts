// Enhanced sound system with multiple layers and richer audio
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    } catch (e) {
      console.error("AudioContext creation failed", e);
      return null;
    }
  }
  // Resume context if suspended (required by some browsers)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Helper to create a tone with multiple oscillators
const createTone = (
  ctx: AudioContext,
  frequencies: number[],
  type: OscillatorType = 'sine',
  duration: number = 0.2,
  gainStart: number = 0.15,
  gainEnd: number = 0
) => {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(gainStart, ctx.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(gainEnd || 0.001, ctx.currentTime + duration);

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  });
};

// Helper to create a noise-like sound (for shaking/rattling)
const createNoise = (ctx: AudioContext, duration: number = 0.3, intensity: number = 0.1) => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * intensity;
  }
  
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(intensity, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.start(ctx.currentTime);
};

// Helper to create dice-to-dice collision sound (wood hitting wood)
// Short, sharp, high frequency with quick decay
const createDiceToDiceImpact = (ctx: AudioContext, time: number, intensity: number = 0.1) => {
  // Create a sharp "tick" sound with multiple harmonics
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  // High frequency components for wood-on-wood impact
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(800 + Math.random() * 400, time);
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1200 + Math.random() * 600, time);
  
  // Bandpass filter to emphasize impact frequencies
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000 + Math.random() * 500, time);
  filter.Q.setValueAtTime(15, time);
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  // Very quick attack and decay (wood impact is sharp)
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(intensity, time + 0.001); // Quick attack
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02); // Quick decay
  
  osc1.start(time);
  osc1.stop(time + 0.02);
  osc2.start(time);
  osc2.stop(time + 0.02);
};

// Helper to create dice-to-bowl collision sound (wood hitting ceramic)
// Longer decay, lower frequency, with resonance/reverb effect
const createDiceToBowlImpact = (ctx: AudioContext, time: number, intensity: number = 0.12) => {
  // Create a "thud" with resonance
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const reverbGain = ctx.createGain();
  
  // Lower frequencies for ceramic impact
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(200 + Math.random() * 100, time);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(400 + Math.random() * 150, time);
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(600 + Math.random() * 200, time);
  
  // Low-pass filter to simulate ceramic resonance
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800 + Math.random() * 300, time);
  filter.Q.setValueAtTime(8, time);
  
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);
  filter.connect(gain);
  
  // Direct sound
  gain.connect(ctx.destination);
  
  // Reverb effect (simulated with delayed gain)
  filter.connect(reverbGain);
  reverbGain.connect(ctx.destination);
  reverbGain.gain.setValueAtTime(0.3, time);
  
  // Envelope: quick attack, longer decay (ceramic rings)
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(intensity, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  
  reverbGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  
  osc1.start(time);
  osc1.stop(time + 0.08);
  osc2.start(time);
  osc2.stop(time + 0.08);
  osc3.start(time);
  osc3.stop(time + 0.08);
};

// Helper to create rolling/rumbling sound (dice sliding)
const createDiceRolling = (ctx: AudioContext, time: number, duration: number, intensity: number = 0.08) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150 + Math.random() * 100, time);
  
  // LFO for variation
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5 + Math.random() * 3, time);
  lfoGain.gain.setValueAtTime(30, time);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  gain.gain.setValueAtTime(intensity, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  lfo.start(time);
  lfo.stop(time + duration);
  osc.start(time);
  osc.stop(time + duration);
};

export const playSound = (
  type: 'roll' | 'win' | 'loss' | 'chip' | 'shake' | 'reveal' | 'bigWin' | 'triple' | 'button'
) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;

    switch (type) {
      case 'roll':
        // Enhanced rolling sound with multiple frequencies
        createTone(ctx, [150, 300, 600], 'square', 0.15, 0.12, 0.01);
        createNoise(ctx, 0.1, 0.08);
        break;

      case 'shake':
        // Realistic dice shaking: dice-to-dice and dice-to-bowl collisions
        const shakeDuration = 1.0;
        const shakeNow = ctx.currentTime;
        
        // Generate random collision times (more realistic than fixed intervals)
        const generateCollisionTimes = (count: number, duration: number): number[] => {
          const times: number[] = [];
          for (let i = 0; i < count; i++) {
            times.push(Math.random() * duration);
          }
          return times.sort((a, b) => a - b);
        };
        
        // Dice-to-dice collisions (wood hitting wood) - many small impacts
        const diceToDiceTimes = generateCollisionTimes(25, shakeDuration);
        diceToDiceTimes.forEach((delay) => {
          const impactTime = shakeNow + delay;
          const intensity = 0.06 + Math.random() * 0.08; // Varying intensity
          createDiceToDiceImpact(ctx, impactTime, intensity);
        });
        
        // Dice-to-bowl collisions (wood hitting ceramic) - fewer, louder impacts
        const diceToBowlTimes = generateCollisionTimes(12, shakeDuration);
        diceToBowlTimes.forEach((delay, i) => {
          const impactTime = shakeNow + delay;
          // Stronger impacts at the beginning (more energy)
          const intensity = 0.1 + (i < 4 ? 0.05 : 0.02) + Math.random() * 0.03;
          createDiceToBowlImpact(ctx, impactTime, intensity);
        });
        
        // Continuous rolling/rumbling sound (dice sliding and tumbling)
        const rollingSegments = 8;
        for (let i = 0; i < rollingSegments; i++) {
          const segmentStart = shakeNow + (i / rollingSegments) * shakeDuration;
          const segmentDuration = shakeDuration / rollingSegments;
          const segmentIntensity = 0.06 + Math.random() * 0.04;
          createDiceRolling(ctx, segmentStart, segmentDuration, segmentIntensity);
        }
        
        // Subtle background noise (air movement, friction)
        createNoise(ctx, shakeDuration, 0.04);
        
        // Low frequency rumble (bowl movement and resonance)
        const rumbleOsc = ctx.createOscillator();
        const rumbleGain = ctx.createGain();
        const rumbleLFO = ctx.createOscillator();
        const rumbleLFOGain = ctx.createGain();
        
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(50, shakeNow);
        rumbleOsc.frequency.linearRampToValueAtTime(80, shakeNow + shakeDuration);
        
        rumbleLFO.type = 'sine';
        rumbleLFO.frequency.setValueAtTime(2.5, shakeNow);
        rumbleLFOGain.gain.setValueAtTime(12, shakeNow);
        
        rumbleLFO.connect(rumbleLFOGain);
        rumbleLFOGain.connect(rumbleOsc.frequency);
        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(ctx.destination);
        
        rumbleGain.gain.setValueAtTime(0.08, shakeNow);
        rumbleGain.gain.linearRampToValueAtTime(0.1, shakeNow + 0.25);
        rumbleGain.gain.linearRampToValueAtTime(0.06, shakeNow + 0.7);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, shakeNow + shakeDuration);
        
        rumbleLFO.start(shakeNow);
        rumbleLFO.stop(shakeNow + shakeDuration);
        rumbleOsc.start(shakeNow);
        rumbleOsc.stop(shakeNow + shakeDuration);
        break;

      case 'reveal':
        // Suspenseful reveal sound
        createTone(ctx, [300, 600], 'sine', 0.2, 0.15, 0.05);
        setTimeout(() => {
          if (ctx) createTone(ctx, [500, 1000], 'sine', 0.15, 0.12, 0.01);
        }, 100);
        break;

      case 'win':
        // Pleasant win sound - ascending chime
        createTone(ctx, [523.25, 659.25, 783.99], 'sine', 0.4, 0.2, 0.01); // C, E, G major chord
        setTimeout(() => {
          if (ctx) createTone(ctx, [659.25, 783.99, 987.77], 'sine', 0.3, 0.15, 0.01); // Higher chord
        }, 200);
        break;

      case 'bigWin':
        // Epic big win fanfare
        createTone(ctx, [523.25, 659.25, 783.99, 1046.50], 'sine', 0.6, 0.25, 0.01);
        setTimeout(() => {
          if (ctx) {
            createTone(ctx, [659.25, 783.99, 987.77, 1318.51], 'sine', 0.5, 0.2, 0.01);
            createNoise(ctx, 0.3, 0.05); // Sparkle effect
          }
        }, 300);
        setTimeout(() => {
          if (ctx) createTone(ctx, [783.99, 987.77, 1174.66, 1567.98], 'sine', 0.4, 0.18, 0.01);
        }, 600);
        break;

      case 'triple':
        // Special triple sound - dramatic and exciting
        createTone(ctx, [261.63, 329.63, 392.00], 'sine', 0.3, 0.2, 0.05); // C major
        setTimeout(() => {
          if (ctx) {
            createTone(ctx, [392.00, 493.88, 587.33], 'sine', 0.3, 0.2, 0.05);
            createNoise(ctx, 0.2, 0.1); // Impact effect
          }
        }, 200);
        setTimeout(() => {
          if (ctx) createTone(ctx, [523.25, 659.25, 783.99, 1046.50], 'sine', 0.5, 0.25, 0.01);
        }, 400);
        break;

      case 'chip':
        // Crisp chip placement sound
        createTone(ctx, [1200, 1800], 'sine', 0.08, 0.12, 0.01);
        createTone(ctx, [800], 'square', 0.06, 0.05, 0.01);
        break;

      case 'button':
        // Button click sound
        createTone(ctx, [800, 1000], 'sine', 0.1, 0.1, 0.01);
        break;

      case 'loss':
        // Disappointing but not harsh loss sound
        createTone(ctx, [200, 150], 'sawtooth', 0.25, 0.15, 0.01);
        createTone(ctx, [100], 'sine', 0.3, 0.08, 0.01);
        break;

      default:
        break;
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};