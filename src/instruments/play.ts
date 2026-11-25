// Ponto único para tocar: dispara o som e avisa as animações 3D.

import { bus } from '../core/events';
import { noteOff, noteOn, playDrum } from '../core/AudioEngine';
import { useExperience } from '../stores/useExperience';
import type { DrumPiece } from './mappings';

export function hitDrum(piece: DrumPiece, velocity = 0.9) {
  bus.emit('drumHit', { piece, velocity });
  playDrum(piece, velocity);
}

export function pressNote(midi: number, velocity = 0.8) {
  bus.emit('noteOn', { midi, velocity });
  noteOn(midi, velocity, useExperience.getState().keyboardPreset);
}

export function releaseNote(midi: number) {
  bus.emit('noteOff', { midi });
  noteOff(midi);
}

// ------------------------------------------------------------------ Web MIDI (opcional)

/** Notas da bateria no padrão General MIDI. */
const GM_DRUMS: Record<number, DrumPiece> = {
  35: 'bumbo', 36: 'bumbo', 38: 'caixa', 40: 'caixa', 42: 'chimbal', 44: 'chimbal', 46: 'chimbal',
  48: 'tom1', 50: 'tom1', 45: 'tom2', 47: 'tom2', 41: 'surdo', 43: 'surdo', 49: 'ataque', 57: 'ataque',
  51: 'conducao', 59: 'conducao',
};

let midiAccess: MIDIAccess | null = null;

function onMidi(e: MIDIMessageEvent) {
  const data = e.data;
  if (!data || data.length < 3) return;
  const [status, note, vel] = data;
  const cmd = status & 0xf0;
  const view = useExperience.getState().view;
  if (cmd === 0x90 && vel > 0) {
    if (view === 'bateria') {
      const piece = GM_DRUMS[note];
      if (piece) hitDrum(piece, vel / 127);
    } else pressNote(note, vel / 127);
  } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
    if (view !== 'bateria') releaseNote(note);
  }
}

/** Conecta teclados/baterias MIDI. Retorna quantos dispositivos de entrada foram encontrados. */
export async function connectMidi(): Promise<number> {
  if (!('requestMIDIAccess' in navigator)) throw new Error('Este navegador não oferece Web MIDI.');
  midiAccess ??= await navigator.requestMIDIAccess();
  const bind = () => midiAccess!.inputs.forEach((input) => (input.onmidimessage = onMidi));
  bind();
  midiAccess.onstatechange = bind;
  return midiAccess.inputs.size;
}
