import { Bloom, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing';
import { useQuality } from '../core/quality';

export function Effects() {
  const q = useQuality();
  if (!q.post) return null;
  return (
    <EffectComposer multisampling={q.antialias ? 4 : 0}>
      {q.ao ? <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.8} halfRes /> : <></>}
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.7} />
      <Vignette offset={0.28} darkness={0.72} />
    </EffectComposer>
  );
}
