// AudioEngine — Web Audio via Tone.js.
// O Tone só é baixado quando o visitante escolhe entrar com som (o navegador também
// exige um gesto do usuário para liberar o áudio). Contexto em modo "interactive" e
// lookAhead zero para a menor latência possível ao tocar.

import type * as ToneNS from 'tone';
import type { DrumPiece } from '../instruments/mappings';
import type { KeyboardPreset } from '../stores/useExperience';

type Tone = typeof ToneNS;

let T: Tone | null = null;
let ready: Promise<Tone> | null = null;

interface Bus {
  instruments: ToneNS.Gain;   // tudo que é tocado passa por aqui
  reverb: ToneNS.Reverb;
  ambience: ToneNS.Gain;
  ambienceNoise: ToneNS.Noise;
}
let bus: Bus | null = null;

export const audioReady = () => T !== null && bus !== null;

export function startAudio(): Promise<Tone> {
  if (ready) return ready;
  ready = (async () => {
    const tone = await import('tone');
    tone.setContext(new tone.Context({ latencyHint: 'interactive', lookAhead: 0 }));
    await tone.start();
    T = tone;

    const reverb = new tone.Reverb({ decay: 2.4, preDelay: 0.012, wet: 0.22 }).toDestination();
    const comp = new tone.Compressor({ threshold: -16, ratio: 3, attack: 0.004, release: 0.2 }).connect(reverb);
    const instruments = new tone.Gain(1).connect(comp);

    // "tom de sala": ruído rosa filtrado, bem baixo, respirando devagar
    const ambience = new tone.Gain(0).toDestination();
    const filter = new tone.Filter({ type: 'lowpass', frequency: 420, Q: 0.4 }).connect(ambience);
    const ambienceNoise = new tone.Noise('pink').connect(filter);
    const lfo = new tone.LFO({ frequency: 0.07, min: 280, max: 620 }).connect(filter.frequency);
    lfo.start();
    ambienceNoise.start();

    bus = { instruments, reverb, ambience, ambienceNoise };
    return tone;
  })();
  return ready;
}

export function setMasterVolume(v: number) {
  if (!T) return;
  const db = v <= 0.001 ? -Infinity : 20 * Math.log10(v);
  T.getDestination().volume.rampTo(db, 0.08);
}

/** Som ambiente do pub; "ducked" quando um instrumento está em foco. */
export function setAmbience(on: boolean, ducked: boolean) {
  if (!bus || !T) return;
  const level = !on ? 0 : ducked ? 0.012 : 0.045;
  bus.ambience.gain.rampTo(level, 0.6);
}

// ------------------------------------------------------------------ bateria

type Voice = { trigger: (velocity: number) => void };
let drums: Record<DrumPiece, Voice> | null = null;

function buildDrums(t: Tone, out: ToneNS.ToneAudioNode): Record<DrumPiece, Voice> {
  const now = () => t.now();

  const kick = new t.MembraneSynth({
    pitchDecay: 0.045, octaves: 6.5,
    envelope: { attack: 0.001, decay: 0.42, sustain: 0, release: 0.1 },
    volume: -2,
  }).connect(out);

  const snareBody = new t.MembraneSynth({
    pitchDecay: 0.02, octaves: 2.5,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
    volume: -10,
  }).connect(out);
  const snareFilter = new t.Filter({ type: 'bandpass', frequency: 2400, Q: 0.7 }).connect(out);
  const snareNoise = new t.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.19, sustain: 0, release: 0.04 },
    volume: -6,
  }).connect(snareFilter);

  const metal = (decay: number, freq: number, volume: number, resonance: number) => {
    const m = new t.MetalSynth({
      envelope: { attack: 0.001, decay, release: decay * 0.6 },
      harmonicity: 5.1, modulationIndex: 32, resonance, octaves: 1.5,
      volume,
    }).connect(out);
    m.frequency.value = freq;
    return m;
  };
  const hat = metal(0.06, 420, -20, 6200);
  const crash = metal(1.5, 300, -18, 4200);
  const ride = metal(0.9, 520, -22, 5200);

  const mkTom = (note: string, decay: number) => {
    const s = new t.MembraneSynth({
      pitchDecay: 0.06, octaves: 2.2,
      envelope: { attack: 0.001, decay, sustain: 0, release: 0.1 },
      volume: -6,
    }).connect(out);
    return (v: number) => s.triggerAttackRelease(note, '8n', now(), v);
  };

  return {
    bumbo: { trigger: (v) => kick.triggerAttackRelease('C1', '8n', now(), v) },
    caixa: {
      trigger: (v) => {
        snareBody.triggerAttackRelease('E3', '16n', now(), v);
        snareNoise.triggerAttackRelease('16n', now(), v);
      },
    },
    chimbal: { trigger: (v) => hat.triggerAttackRelease('32n', now(), v * 0.9) },
    tom1: { trigger: mkTom('A2', 0.42) },
    tom2: { trigger: mkTom('E2', 0.5) },
    surdo: { trigger: mkTom('A1', 0.7) },
    ataque: { trigger: (v) => crash.triggerAttackRelease('2n', now(), v) },
    conducao: { trigger: (v) => ride.triggerAttackRelease('4n', now(), v * 0.8) },
  };
}

export function playDrum(piece: DrumPiece, velocity = 0.9) {
  if (!T || !bus) return;
  drums ??= buildDrums(T, bus.instruments);
  drums[piece].trigger(velocity);
}

// ------------------------------------------------------------------ teclado

interface Keys {
  preset: KeyboardPreset;
  synth: ToneNS.PolySynth;
  chain: ToneNS.ToneAudioNode[];
}
let keys: Keys | null = null;
const held = new Set<number>();

function buildKeys(t: Tone, preset: KeyboardPreset, out: ToneNS.ToneAudioNode): Keys {
  if (preset === 'orgao') {
    const vibrato = new t.Vibrato({ frequency: 6.2, depth: 0.08 }).connect(out);
    const synth = new t.PolySynth(t.Synth, {
      oscillator: { type: 'custom', partials: [1, 0.7, 0.45, 0, 0.32, 0, 0.18, 0.12] },
      envelope: { attack: 0.008, decay: 0.05, sustain: 0.92, release: 0.09 },
      volume: -15,
    }).connect(vibrato);
    synth.maxPolyphony = 24;
    return { preset, synth, chain: [vibrato] };
  }
  if (preset === 'synth') {
    const filter = new t.Filter({ type: 'lowpass', frequency: 2600, Q: 1.2 }).connect(out);
    const synth = new t.PolySynth(t.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
      envelope: { attack: 0.012, decay: 0.35, sustain: 0.45, release: 0.55 },
      volume: -19,
    }).connect(filter);
    synth.maxPolyphony = 16;
    return { preset, synth, chain: [filter] };
  }
  // piano (síntese FM; troque por amostras reais quando houver gravações licenciadas)
  const synth = new t.PolySynth(t.FMSynth, {
    harmonicity: 2,
    modulationIndex: 1.6,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.002, decay: 1.4, sustain: 0.06, release: 1.1 },
    modulationEnvelope: { attack: 0.002, decay: 0.5, sustain: 0.1, release: 0.6 },
    volume: -9,
  }).connect(out);
  synth.maxPolyphony = 24;
  return { preset, synth, chain: [] };
}

function ensureKeys(preset: KeyboardPreset) {
  if (!T || !bus) return null;
  if (!keys || keys.preset !== preset) {
    if (keys) {
      keys.synth.releaseAll();
      const old = keys;
      setTimeout(() => { old.synth.dispose(); old.chain.forEach((n) => n.dispose()); }, 1500);
    }
    keys = buildKeys(T, preset, bus.instruments);
    held.clear();
  }
  return keys;
}

export function noteOn(midi: number, velocity: number, preset: KeyboardPreset) {
  const k = ensureKeys(preset);
  if (!k || !T || held.has(midi)) return;
  held.add(midi);
  k.synth.triggerAttack(T.Frequency(midi, 'midi').toFrequency(), T.now(), velocity);
}

export function noteOff(midi: number) {
  if (!keys || !T || !held.has(midi)) return;
  held.delete(midi);
  keys.synth.triggerRelease(T.Frequency(midi, 'midi').toFrequency(), T.now());
}

export function releaseAllNotes() {
  keys?.synth.releaseAll();
  held.clear();
}
