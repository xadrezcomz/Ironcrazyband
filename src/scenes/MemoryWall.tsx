// Parede de memórias (lado direito do salão): TV de tubo que exibe as fotos do
// acervo em ASCII colorido, foto emoldurada e cartaz da linha do tempo.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AsciiEngine } from '../core/ascii/AsciiEngine.js';
import { labelTexture, posterTexture, woodTexture, tiled } from '../core/textures';
import { useInteractive } from '../core/interaction';
import { useExperience } from '../stores/useExperience';
import { media, type Acervo } from '../data/acervo';
import { AimedSpot } from './lights';

const X = 6.93; // face da parede direita (um pouco à frente do tijolo)

const frameMat = new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: 0.5, metalness: 0.1 });
const brass = new THREE.MeshStandardMaterial({ color: '#c49a5c', metalness: 0.95, roughness: 0.3 });

/** Renderiza a foto com o motor ASCII num canvas que vira textura da tela da TV. */
function useAsciiTexture(src: string) {
  const state = useMemo(() => {
    const target = document.createElement('canvas');
    target.width = 640;
    target.height = 480;
    const tex = new THREE.CanvasTexture(target);
    tex.colorSpace = THREE.SRGBColorSpace;
    let engine: AsciiEngine | null = null;
    try {
      engine = new AsciiEngine(document.createElement('canvas'), { cellHeight: 13, stars: 0.6, fit: 'cover', focus: [0.55, 0.4] });
      engine.dpr = 1;
      engine.buildAtlas();
    } catch {
      engine = null; // sem WebGL2 extra: a TV mostra a foto normal
    }
    return { target, tex, engine, img: null as HTMLImageElement | null, start: 0 };
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      state.img = img;
      state.start = performance.now();
      if (!state.engine) {
        state.target.getContext('2d')!.drawImage(img, 0, 0, state.target.width, state.target.height);
        state.tex.needsUpdate = true;
      }
    };
    img.src = src;
  }, [src, state]);

  useEffect(() => () => { state.tex.dispose(); }, [state]);

  const replay = () => (state.start = performance.now());
  const frame = useRef(0);
  useFrame(() => {
    if (!state.engine || !state.img || frame.current++ % 2) return; // 30 fps bastam para a TV
    const p = Math.min(1, (performance.now() - state.start) / 3200);
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    if (state.engine.renderInto(state.img, state.target, performance.now() / 1000, eased)) state.tex.needsUpdate = true;
  });
  return { texture: state.tex, replay };
}

function CrtTv({ src }: { src: string }) {
  const { texture, replay } = useAsciiTexture(src);
  const setView = useExperience((s) => s.setView);
  const view = useExperience((s) => s.view);
  const handlers = useInteractive('TV — fotos do acervo em ASCII', () => {
    replay();
    if (view !== 'parede') setView('parede');
  });
  const screen = useMemo(() => new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }), [texture]);
  const body = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(woodTexture('escuro'), 1, 1), roughness: 0.4 }), []);
  const glow = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.intensity = 4 + Math.sin(clock.elapsedTime * 23) * 0.25;
  });

  return (
    <group position={[X - 0.38, 0, 0]} rotation={[0, -Math.PI / 2, 0]} {...handlers}>
      {/* rack */}
      <mesh material={body} position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.9, 0.6]} />
      </mesh>
      {/* gabinete da TV */}
      <mesh material={body} position={[0, 1.36, -0.02]} castShadow>
        <boxGeometry args={[1.12, 0.9, 0.62]} />
      </mesh>
      <mesh material={frameMat} position={[0, 1.38, 0.29]}>
        <boxGeometry args={[0.9, 0.7, 0.02]} />
      </mesh>
      <mesh material={screen} position={[0, 1.38, 0.302]}>
        <planeGeometry args={[0.82, 0.615]} />
      </mesh>
      {/* botões */}
      {[0, 1].map((i) => (
        <mesh key={i} material={brass} position={[0.5, 1.12 + i * 0.1, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 14]} />
        </mesh>
      ))}
      <pointLight ref={glow} position={[0, 1.38, 0.7]} color="#ffcf9a" intensity={1.2} distance={3} decay={2} />
    </group>
  );
}

function FramedPhoto({ src, z, w, h }: { src: string; z: number; w: number; h: number }) {
  const tex = useTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  return (
    <group position={[X, 2.05, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh material={frameMat} castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.05]} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.027]}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

function Poster({ acervo, z }: { acervo: Acervo; z: number }) {
  const setPanel = useExperience((s) => s.setPanel);
  const handlers = useInteractive('Linha do tempo — clique para abrir', () => setPanel('historia'));
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: posterTexture(acervo.linhaDoTempo.map(({ ano, titulo }) => ({ ano, titulo }))), roughness: 0.85 }),
    [acervo]
  );
  return (
    <group position={[X, 2.05, z]} rotation={[0, -Math.PI / 2, 0]} {...handlers}>
      <mesh material={frameMat}>
        <boxGeometry args={[0.92, 1.32, 0.04]} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.022]}>
        <planeGeometry args={[0.84, 1.24]} />
      </mesh>
    </group>
  );
}

/** Moldura vazia identificada: indica o que falta no acervo (sem inventar conteúdo). */
function Placeholder({ z, text, sub }: { z: number; text: string; sub: string }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: labelTexture(text, sub), roughness: 0.9 }), [text, sub]);
  return (
    <group position={[X, 2.15, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh material={frameMat}>
        <boxGeometry args={[0.86, 0.68, 0.04]} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.022]}>
        <planeGeometry args={[0.78, 0.6]} />
      </mesh>
    </group>
  );
}

export function MemoryWall({ acervo }: { acervo: Acervo }) {
  const photo = media(acervo.hero.src);
  return (
    <group>
      <CrtTv src={photo} />
      <FramedPhoto src={photo} z={-2.7} w={0.9} h={1.2} />
      <Poster acervo={acervo} z={2.7} />
      <Placeholder z={-5.0} text="FOTO EM BREVE" sub="banda reunida" />
      <Placeholder z={4.9} text="FOTO EM BREVE" sub="primeiros shows · 2010" />
      {/* luzes de quadro */}
      <AimedSpot position={[5.6, 4.2, -2.7]} target={[X, 2.0, -2.7]} color="#ffd6a0" intensity={40} angle={0.35} penumbra={0.8} distance={6} />
      <AimedSpot position={[5.6, 4.2, 2.7]} target={[X, 2.0, 2.7]} color="#ffd6a0" intensity={40} angle={0.35} penumbra={0.8} distance={6} />
      <AimedSpot position={[5.2, 4.2, 0]} target={[X, 1.3, 0]} color="#ffc283" intensity={22} angle={0.5} penumbra={0.9} distance={6} />
    </group>
  );
}
