// Tela inicial: o visitante escolhe ativar o som (o navegador exige um gesto)
// e, a partir da segunda visita, pode pular a entrada cinematográfica.

import { useProgress } from '@react-three/drei';
import { startAudio } from '../core/AudioEngine';
import { useExperience } from '../stores/useExperience';
import type { Acervo } from '../data/acervo';

export function IntroScreen({ acervo }: { acervo: Acervo }) {
  const phase = useExperience((s) => s.phase);
  const visited = useExperience((s) => s.visited);
  const { active, progress } = useProgress();
  const loading = active && progress < 100;

  if (phase === 'entering') {
    return (
      <button className="skip-intro" type="button" onClick={() => window.dispatchEvent(new Event('ironcrazy:skip-intro'))}>
        Pular introdução →
      </button>
    );
  }
  if (phase !== 'intro') return null;

  const enter = async (sound: boolean, skip = false) => {
    const st = useExperience.getState();
    if (sound) {
      try {
        await startAudio();
        st.setSoundOn(true);
      } catch {
        st.setSoundOn(false);
      }
    }
    st.set({ introSkip: skip, phase: 'entering' });
  };

  return (
    <div className="intro" role="dialog" aria-label="Entrada do memorial">
      <div className="intro-card">
        <p className="intro-selo">{acervo.selo}</p>
        <h1>{acervo.banda}</h1>
        <p className="intro-anos">Memorial interativo · {acervo.anos.replace(/\s/g, '')}</p>
        <p className="intro-epi">{acervo.epigrafe}</p>

        <div className="intro-actions">
          <button type="button" className="btn primary" disabled={loading} onClick={() => enter(true)}>
            {loading ? `Montando o palco… ${Math.round(progress)}%` : '♪ Entrar com som'}
          </button>
          <button type="button" className="btn" disabled={loading} onClick={() => enter(false)}>
            Entrar sem som
          </button>
        </div>
        {visited && (
          <button type="button" className="link" disabled={loading} onClick={() => enter(true, true)}>
            Pular introdução e ir direto ao salão
          </button>
        )}
        <p className="intro-foot">
          Use fones para a melhor experiência · <a href="./classico/">modo clássico (sem 3D)</a>
        </p>
      </div>
    </div>
  );
}
