// Liga o teclado do computador ao instrumento em foco.

import { useEffect } from 'react';
import { useExperience } from '../stores/useExperience';
import { releaseAllNotes } from '../core/AudioEngine';
import { DRUM_KEYS, MAX_OCTAVE, MIN_OCTAVE, keyToMidi } from './mappings';
import { hitDrum, pressNote, releaseNote } from './play';

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
};

export function useInstrumentKeys() {
  const view = useExperience((s) => s.view);
  const phase = useExperience((s) => s.phase);

  useEffect(() => {
    if (phase !== 'pub' || (view !== 'bateria' && view !== 'teclado')) return;
    const down = new Map<string, number>(); // tecla → nota MIDI que ela disparou

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      const key = e.key.toLowerCase();
      if (view === 'bateria') {
        const piece = DRUM_KEYS[key];
        if (!piece) return;
        e.preventDefault();
        hitDrum(piece, e.shiftKey ? 1 : 0.85);
        return;
      }
      const st = useExperience.getState();
      if (key === 'z' || key === 'x') {
        const octave = Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, st.octave + (key === 'z' ? -1 : 1)));
        st.set({ octave });
        return;
      }
      const midi = keyToMidi(key, st.octave);
      if (midi === null) return;
      e.preventDefault();
      down.set(key, midi);
      pressNote(midi, e.shiftKey ? 1 : 0.78);
    };
    const onUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midi = down.get(key);
      if (midi !== undefined) {
        down.delete(key);
        releaseNote(midi);
      }
    };
    const onBlur = () => {
      down.forEach((m) => releaseNote(m));
      down.clear();
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
      onBlur();
      releaseAllNotes();
    };
  }, [view, phase]);
}
