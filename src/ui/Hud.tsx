// HUD: cabeçalho discreto, dica contextual, atalhos inferiores e botão de voltar.

import { useEffect } from 'react';
import { VIEWS, isInstrumentView, type ViewId } from '../core/views';
import { setAmbience, setMasterVolume, startAudio } from '../core/AudioEngine';
import { useExperience, type Panel } from '../stores/useExperience';
import type { Acervo } from '../data/acervo';
import { InstrumentPanel } from './InstrumentPanel';
import { CLASSIC_URL } from '../core/links';

function useAudioSync() {
  const volume = useExperience((s) => s.volume);
  const soundOn = useExperience((s) => s.soundOn);
  const ambience = useExperience((s) => s.ambience);
  const view = useExperience((s) => s.view);
  const phase = useExperience((s) => s.phase);
  useEffect(() => setMasterVolume(soundOn ? volume : 0), [volume, soundOn]);
  useEffect(() => setAmbience(soundOn && ambience && phase !== 'intro', isInstrumentView(view)), [soundOn, ambience, view, phase]);
}

function useEscape() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const st = useExperience.getState();
      if (st.panel) return st.setPanel(null);
      const parent = VIEWS[st.view].parent;
      if (st.phase === 'pub' && parent) st.setView(parent);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

const SHORTCUTS: ({ kind: 'view'; id: ViewId; label: string } | { kind: 'panel'; id: Exclude<Panel, null>; label: string })[] = [
  { kind: 'view', id: 'salao', label: 'Salão' },
  { kind: 'view', id: 'palco', label: 'Palco' },
  { kind: 'view', id: 'parede', label: 'Memórias' },
  { kind: 'panel', id: 'historia', label: 'História' },
  { kind: 'panel', id: 'banda', label: 'Banda' },
  { kind: 'panel', id: 'mapa', label: 'Mapa' },
];

export function Hud({ acervo }: { acervo: Acervo }) {
  useAudioSync();
  useEscape();
  const phase = useExperience((s) => s.phase);
  const view = useExperience((s) => s.view);
  const hovered = useExperience((s) => s.hovered);
  const panel = useExperience((s) => s.panel);
  const soundOn = useExperience((s) => s.soundOn);
  const volume = useExperience((s) => s.volume);
  const { setView, setPanel, set, setSoundOn } = useExperience.getState();

  if (phase !== 'pub') return null;
  const parent = VIEWS[view].parent;

  return (
    <>
      <header className="hud-top">
        <div className="brand">
          <strong>{acervo.banda}</strong>
          <span>{acervo.anos.replace(/\s/g, '')}</span>
        </div>
        <div className="hud-actions">
          {soundOn ? (
            <label className="vol" title="Volume">
              <button type="button" className="icon" aria-label={volume > 0 ? 'Silenciar' : 'Ativar volume'} onClick={() => set({ volume: volume > 0 ? 0 : 0.8 })}>
                {volume > 0 ? '♪' : '✕'}
              </button>
              <input type="range" min={0} max={1} step={0.01} value={volume} aria-label="Volume" onChange={(e) => set({ volume: +e.target.value })} />
            </label>
          ) : (
            <button type="button" className="btn small" onClick={async () => { await startAudio(); setSoundOn(true); }}>♪ Ativar som</button>
          )}
          <button type="button" className="icon" aria-label="Configurações" onClick={() => setPanel('config')}>⚙</button>
          <a className="btn small ghost" href={CLASSIC_URL}>Modo clássico</a>
        </div>
      </header>

      {parent && !panel && (
        <button type="button" className="back" onClick={() => setView(parent)}>
          ← {VIEWS[parent].label} <kbd>Esc</kbd>
        </button>
      )}

      <InstrumentPanel />

      <div className="hint" aria-live="polite">{hovered ?? VIEWS[view].hint}</div>

      <nav className="hud-bottom" aria-label="Atalhos">
        {SHORTCUTS.map((s) => {
          const active = s.kind === 'view' ? view === s.id : panel === s.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-current={active}
              onClick={() => (s.kind === 'view' ? (setPanel(null), setView(s.id)) : setPanel(panel === s.id ? null : s.id))}
            >
              {s.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
