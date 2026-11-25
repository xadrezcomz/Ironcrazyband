// Controles do instrumento em foco: teclas, timbres, oitava e MIDI.

import { useState } from 'react';
import { startAudio } from '../core/AudioEngine';
import { useExperience, type KeyboardPreset } from '../stores/useExperience';
import { DRUM_LABEL, MAX_OCTAVE, MIN_OCTAVE, drumLegend } from '../instruments/mappings';
import { connectMidi, hitDrum } from '../instruments/play';

const PRESETS: { id: KeyboardPreset; label: string }[] = [
  { id: 'piano', label: 'Piano' },
  { id: 'orgao', label: 'Órgão' },
  { id: 'synth', label: 'Sintetizador' },
];

function SoundGate() {
  const soundOn = useExperience((s) => s.soundOn);
  const setSoundOn = useExperience((s) => s.setSoundOn);
  if (soundOn) return null;
  return (
    <button type="button" className="btn primary small" onClick={async () => { await startAudio(); setSoundOn(true); }}>
      ♪ Ativar som para tocar
    </button>
  );
}

function MidiButton() {
  const [status, setStatus] = useState<string | null>(null);
  if (!('requestMIDIAccess' in navigator)) return null;
  return (
    <div className="midi">
      <button
        type="button"
        className="btn small"
        onClick={async () => {
          try {
            const n = await connectMidi();
            setStatus(n ? `${n} dispositivo(s) MIDI conectado(s)` : 'Nenhum dispositivo MIDI encontrado');
          } catch (e) {
            setStatus((e as Error).message || 'Acesso MIDI negado');
          }
        }}
      >
        Conectar MIDI
      </button>
      {status && <span className="muted">{status}</span>}
    </div>
  );
}

export function InstrumentPanel() {
  const view = useExperience((s) => s.view);
  const preset = useExperience((s) => s.keyboardPreset);
  const octave = useExperience((s) => s.octave);
  const set = useExperience((s) => s.set);

  if (view === 'bateria') {
    return (
      <aside className="instrument" aria-label="Controles da bateria">
        <h2>Bateria</h2>
        <SoundGate />
        <ul className="keymap">
          {drumLegend().map(({ piece, keys }) => (
            <li key={piece}>
              <button type="button" className="pad" onPointerDown={() => hitDrum(piece, 0.9)}>
                {DRUM_LABEL[piece]}
              </button>
              <span className="keys">{keys.map((k) => <kbd key={k}>{k}</kbd>)}</span>
            </li>
          ))}
        </ul>
        <p className="muted">Shift = golpe mais forte. Bateria MIDI segue o padrão General MIDI.</p>
        <MidiButton />
      </aside>
    );
  }

  if (view === 'teclado') {
    return (
      <aside className="instrument" aria-label="Controles do teclado">
        <h2>Teclado</h2>
        <SoundGate />
        <div className="seg" role="group" aria-label="Timbre">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={preset === p.id} onClick={() => set({ keyboardPreset: p.id })}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="octave">
          <span>Oitava</span>
          <button type="button" className="btn small" disabled={octave <= MIN_OCTAVE} onClick={() => set({ octave: octave - 1 })} aria-label="Oitava abaixo">−</button>
          <b>{octave}</b>
          <button type="button" className="btn small" disabled={octave >= MAX_OCTAVE} onClick={() => set({ octave: octave + 1 })} aria-label="Oitava acima">+</button>
        </div>
        <p className="muted">
          Brancas: <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd><kbd>G</kbd><kbd>H</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd><kbd>Ç</kbd>
          <br />Pretas: <kbd>W</kbd><kbd>E</kbd><kbd>T</kbd><kbd>Y</kbd><kbd>U</kbd><kbd>O</kbd><kbd>P</kbd>
          <br /><kbd>Z</kbd>/<kbd>X</kbd> mudam a oitava. Polifônico: toque acordes.
        </p>
        <MidiButton />
      </aside>
    );
  }
  return null;
}
