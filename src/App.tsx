import { Suspense, use, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { CameraRig } from './core/CameraRig';
import { QUALITY } from './core/quality';
import { VIEWS } from './core/views';
import { loadAcervo, type Acervo } from './data/acervo';
import { useInstrumentKeys } from './instruments/useInstrumentKeys';
import { Effects } from './scenes/Effects';
import { World } from './scenes/World';
import { useExperience } from './stores/useExperience';
import { Hud } from './ui/Hud';
import { IntroScreen } from './ui/IntroScreen';
import { Panels } from './ui/Panels';

function Experience({ acervo }: { acervo: Acervo }) {
  const quality = useExperience((s) => s.quality);
  const q = QUALITY[quality];
  const [dprScale, setDprScale] = useState(1);
  useInstrumentKeys();

  // queda de desempenho: reduz a resolução antes de cair de nível
  const dpr: [number, number] = [q.dpr[0], Math.max(q.dpr[0], q.dpr[1] * dprScale)];

  return (
    <>
      <Canvas
        key={quality /* recria o renderer ao trocar sombras/antialias */}
        className="stage-canvas"
        shadows={q.shadows ? 'soft' : false}
        dpr={dpr}
        gl={{ antialias: q.antialias && !q.post, powerPreference: 'high-performance' }}
        camera={{ fov: 50, near: 0.05, far: 90, position: VIEWS.fachada.position }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
        onPointerMissed={() => useExperience.getState().setHovered(null)}
      >
        <color attach="background" args={['#07060a']} />
        <fog attach="fog" args={['#0b0908', 16, 46]} />
        <PerformanceMonitor onDecline={() => setDprScale((s) => Math.max(0.6, s - 0.2))} onIncline={() => setDprScale((s) => Math.min(1, s + 0.1))} />
        <Suspense fallback={null}>
          <World acervo={acervo} />
          <Effects />
        </Suspense>
        <CameraRig />
      </Canvas>
      <IntroScreen acervo={acervo} />
      <Hud acervo={acervo} />
      <Panels acervo={acervo} />
    </>
  );
}

function Loaded() {
  const acervo = use(loadAcervo());
  return <Experience acervo={acervo} />;
}

export function App() {
  return (
    <Suspense fallback={<div className="boot">Afinando os instrumentos…</div>}>
      <Loaded />
    </Suspense>
  );
}

/** Para aparelhos sem WebGL2: oferece o modo clássico. */
export function NoWebGL() {
  return (
    <div className="intro">
      <div className="intro-card">
        <h1>Iron Crazy Band</h1>
        <p className="intro-anos">Memorial interativo · 2010–2026</p>
        <p className="intro-epi">Este aparelho não oferece os gráficos 3D (WebGL 2) que o pub precisa.</p>
        <div className="intro-actions">
          <a className="btn primary" href="./classico/">Abrir o modo clássico</a>
        </div>
      </div>
    </div>
  );
}
