// Painéis: História (linha do tempo), Banda (camarim), Mapa e Configurações.

import { useEffect, useRef } from 'react';
import { MAP_ORDER, VIEWS } from '../core/views';
import { QUALITY_LABEL, useExperience, type Quality } from '../stores/useExperience';
import { isPlaceholder, type Acervo } from '../data/acervo';

function Sheet({ title, children }: { title: string; children: React.ReactNode }) {
  const setPanel = useExperience((s) => s.setPanel);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div className="sheet-backdrop" onClick={() => setPanel(null)}>
      <div className="sheet" role="dialog" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button type="button" className="close" aria-label="Fechar" onClick={() => setPanel(null)}>×</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

const Txt = ({ s }: { s: string }) => <span className={isPlaceholder(s) ? 'placeholder' : undefined}>{s}</span>;

function Historia({ acervo }: { acervo: Acervo }) {
  return (
    <Sheet title="História">
      <p className="lead">{acervo.chamada}</p>
      {acervo.historia.map((p, i) => <p key={i} className="prose">{p}</p>)}
      <h3>Linha do tempo</h3>
      <p className="muted">Divisões provisórias. Os detalhes entram conforme o acervo for catalogado.</p>
      <ol className="timeline">
        {acervo.linhaDoTempo.map((m) => (
          <li key={m.ano + m.titulo}>
            <span className="ano">{m.ano}</span>
            <strong>{m.titulo}</strong>
            <p><Txt s={m.texto} /></p>
          </li>
        ))}
      </ol>
    </Sheet>
  );
}

function Banda({ acervo }: { acervo: Acervo }) {
  return (
    <Sheet title="Camarim · integrantes">
      <ul className="members">
        {acervo.integrantes.map((m) => (
          <li key={m.nome}>
            <div className="avatar" aria-hidden="true">{m.photo ? <img src={`./${m.photo}`} alt="" /> : <span>{m.nome[0]}</span>}</div>
            <div>
              <strong>{m.nome}</strong>
              <span>{m.papel}</span>
              {m.nota && <em>{m.nota}</em>}
              {!m.photo && <small className="muted">foto ainda não adicionada ao acervo</small>}
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function Mapa() {
  const view = useExperience((s) => s.view);
  const setView = useExperience((s) => s.setView);
  const setPanel = useExperience((s) => s.setPanel);
  return (
    <Sheet title="Mapa do pub">
      <div className="map">
        {MAP_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`map-spot map-${id}`}
            aria-current={view === id}
            onClick={() => { setView(id); setPanel(null); }}
          >
            {VIEWS[id].label}
          </button>
        ))}
      </div>
      <p className="muted">Palco ao fundo, balcão à esquerda, parede de memórias à direita, mesas no centro.</p>
    </Sheet>
  );
}

function Config() {
  const s = useExperience();
  return (
    <Sheet title="Configurações">
      <label className="field">
        <span>Volume geral</span>
        <input type="range" min={0} max={1} step={0.01} value={s.volume} onChange={(e) => s.set({ volume: +e.target.value })} />
      </label>
      <label className="field check">
        <input type="checkbox" checked={s.ambience} onChange={(e) => s.set({ ambience: e.target.checked })} />
        <span>Som ambiente do pub</span>
      </label>
      <fieldset className="field">
        <legend>Qualidade gráfica</legend>
        <div className="seg">
          {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
            <button key={q} type="button" aria-pressed={s.quality === q} onClick={() => s.set({ quality: q })}>
              {QUALITY_LABEL[q]}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Sensibilidade do mouse (paralaxe)</span>
        <input type="range" min={0} max={2} step={0.05} value={s.sensitivity} onChange={(e) => s.set({ sensitivity: +e.target.value })} />
      </label>
      <label className="field check">
        <input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.set({ reducedMotion: e.target.checked })} />
        <span>Reduzir movimento (sem transições de câmera)</span>
      </label>
      <button
        type="button"
        className="btn"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
      >
        Tela cheia
      </button>
    </Sheet>
  );
}

export function Panels({ acervo }: { acervo: Acervo }) {
  const panel = useExperience((s) => s.panel);
  if (panel === 'historia') return <Historia acervo={acervo} />;
  if (panel === 'banda') return <Banda acervo={acervo} />;
  if (panel === 'mapa') return <Mapa />;
  if (panel === 'config') return <Config />;
  return null;
}
