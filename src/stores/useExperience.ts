import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewId } from '../core/views';

export type Phase = 'intro' | 'entering' | 'pub';
export type Quality = 'economico' | 'medio' | 'alto' | 'cinematografico';
export type Panel = 'historia' | 'banda' | 'mapa' | 'config' | null;
export type KeyboardPreset = 'piano' | 'orgao' | 'synth';

export const QUALITY_LABEL: Record<Quality, string> = {
  economico: 'Econômico',
  medio: 'Médio',
  alto: 'Alto',
  cinematografico: 'Cinematográfico',
};

interface ExperienceState {
  phase: Phase;
  view: ViewId;
  panel: Panel;
  hovered: string | null;
  doorOpen: boolean;
  soundOn: boolean;
  /** entrar direto no salão, sem a cena da porta */
  introSkip: boolean;

  // preferências (persistidas)
  visited: boolean;
  volume: number;
  ambience: boolean;
  quality: Quality;
  reducedMotion: boolean;
  sensitivity: number;
  keyboardPreset: KeyboardPreset;
  octave: number;

  setPhase: (p: Phase) => void;
  setView: (v: ViewId) => void;
  setPanel: (p: Panel) => void;
  setHovered: (h: string | null) => void;
  setDoorOpen: (o: boolean) => void;
  setSoundOn: (s: boolean) => void;
  set: (patch: Partial<ExperienceState>) => void;
}

const prefersReduced =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultQuality = (): Quality => {
  if (typeof navigator === 'undefined') return 'medio';
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 4;
  if (mobile || cores <= 4) return 'economico';
  return cores >= 8 ? 'alto' : 'medio';
};

export const useExperience = create<ExperienceState>()(
  persist(
    (set) => ({
      phase: 'intro',
      view: 'fachada',
      panel: null,
      hovered: null,
      doorOpen: false,
      soundOn: false,
      introSkip: false,

      visited: false,
      volume: 0.8,
      ambience: true,
      quality: defaultQuality(),
      reducedMotion: prefersReduced,
      sensitivity: 1,
      keyboardPreset: 'piano',
      octave: 3,

      setPhase: (phase) => set({ phase }),
      setView: (view) => set({ view, hovered: null }),
      setPanel: (panel) => set({ panel }),
      setHovered: (hovered) => set({ hovered }),
      setDoorOpen: (doorOpen) => set({ doorOpen }),
      setSoundOn: (soundOn) => set({ soundOn }),
      set: (patch) => set(patch),
    }),
    {
      name: 'iron-crazy-preferencias',
      partialize: (s) => ({
        visited: s.visited,
        volume: s.volume,
        ambience: s.ambience,
        quality: s.quality,
        reducedMotion: s.reducedMotion,
        sensitivity: s.sensitivity,
        keyboardPreset: s.keyboardPreset,
      }),
    }
  )
);
