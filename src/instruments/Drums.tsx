// Bateria: bumbo, caixa, chimbal, dois tons, surdo, prato de ataque e de condução.
// Fora do foco, um clique aproxima a câmera; em foco, cada peça toca e reage.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../core/events';
import { kickHeadTexture } from '../core/textures';
import { useExperience } from '../stores/useExperience';
import { DRUM_LABEL, type DrumPiece } from './mappings';
import { hitDrum } from './play';
import { AimedSpot } from '../scenes/lights';

type Vec3 = [number, number, number];

const shell = new THREE.MeshStandardMaterial({ color: '#772529', metalness: 0.35, roughness: 0.28 });
const chrome = new THREE.MeshStandardMaterial({ color: '#d8d8d8', metalness: 1, roughness: 0.18 });
const head = new THREE.MeshStandardMaterial({ color: '#d9d1bf', roughness: 0.75 });
const bronze = new THREE.MeshStandardMaterial({ color: '#c9a04f', metalness: 1, roughness: 0.26, side: THREE.DoubleSide });
const black = new THREE.MeshStandardMaterial({ color: '#141212', roughness: 0.7 });

interface PieceProps {
  piece: DrumPiece;
  position: Vec3;
  rotation?: Vec3;
  focused: boolean;
  children: React.ReactNode;
  /** "drum" afunda; "cymbal" balança */
  kind: 'drum' | 'cymbal';
}

function Piece({ piece, position, rotation = [0, 0, 0], focused, children, kind }: PieceProps) {
  const group = useRef<THREE.Group>(null);
  const energy = useRef(0);
  const setView = useExperience((s) => s.setView);
  const setHovered = useExperience((s) => s.setHovered);
  const phase = useExperience((s) => s.phase);

  useEffect(() => bus.on('drumHit', (e) => {
    if (e.piece === piece) energy.current = Math.min(1.4, energy.current + e.velocity);
  }), [piece]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const e = energy.current;
    energy.current *= Math.exp(-dt * (kind === 'cymbal' ? 3.2 : 14));
    const t = performance.now() / 1000;
    if (kind === 'cymbal') {
      g.rotation.x = rotation[0] + Math.sin(t * 18) * 0.12 * e;
      g.rotation.z = rotation[2] + Math.cos(t * 15) * 0.08 * e;
    } else {
      g.position.y = position[1] - 0.012 * e;
      g.scale.setScalar(1 + 0.03 * e);
    }
  });

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (phase !== 'pub') return;
    if (!focused) return setView('bateria');
    // golpe mais forte perto do centro da peça
    hitDrum(piece, 0.95);
  };

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerDown={onDown}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (phase !== 'pub') return;
        setHovered(focused ? DRUM_LABEL[piece] : 'Bateria — clique para tocar');
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = '';
      }}
    >
      {children}
    </group>
  );
}

function Drum({ r, h, color = shell }: { r: number; h: number; color?: THREE.Material }) {
  return (
    <group>
      <mesh material={color} castShadow>
        <cylinderGeometry args={[r, r, h, 40, 1, true]} />
      </mesh>
      <mesh material={head} position={[0, h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.98, 40]} />
      </mesh>
      <mesh material={chrome} position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.008, 8, 40]} />
      </mesh>
      <mesh material={chrome} position={[0, -h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.008, 8, 40]} />
      </mesh>
    </group>
  );
}

function Cymbal({ r }: { r: number }) {
  return (
    <mesh material={bronze} castShadow>
      <cylinderGeometry args={[r * 0.08, r, 0.018, 48, 1]} />
    </mesh>
  );
}

function Stand({ from, height }: { from: Vec3; height: number }) {
  return (
    <group position={from}>
      <mesh material={chrome} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.011, 0.011, height, 8]} />
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} material={chrome} position={[Math.cos(a) * 0.13, 0.06, Math.sin(a) * 0.13]} rotation={[0, -a, 0.95]}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Kit montado sobre o palco. `position` = centro do kit no chão do palco. */
export function Drums({ position }: { position: Vec3 }) {
  const view = useExperience((s) => s.view);
  const focused = view === 'bateria';
  const kickFront = useMemo(() => new THREE.MeshStandardMaterial({ map: kickHeadTexture(), roughness: 0.7, color: '#9a9284' }), []);
  const light = useRef<THREE.SpotLight>(null);
  const flash = useRef(0);

  useEffect(() => bus.on('drumHit', (e) => (flash.current = Math.min(1, flash.current + e.velocity * 0.5))), []);
  useFrame((_, dt) => {
    flash.current *= Math.exp(-dt * 6);
    if (light.current) {
      const target = focused ? 34 : 22;
      light.current.intensity += (target + flash.current * 40 - light.current.intensity) * Math.min(1, dt * 8);
    }
  });

  return (
    <group position={position}>
      <AimedSpot lightRef={light} position={[0, 3.4, 1.2]} target={[0, 0.5, 0]} angle={0.5} penumbra={0.7} distance={8} color="#ffc98a" intensity={22} />

      {/* bumbo: eixo ao longo de z, pele com o nome voltada para o público */}
      <Piece piece="bumbo" kind="drum" focused={focused} position={[0, 0.29, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Drum r={0.28} h={0.42} />
        {/* com o grupo girado 90° em x, o +y local aponta para o público (+z) */}
        <mesh material={kickFront} position={[0, 0.213, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.275, 48]} />
        </mesh>
      </Piece>

      <Piece piece="tom1" kind="drum" focused={focused} position={[0.17, 0.78, -0.02]} rotation={[-0.32, 0, -0.12]}>
        <Drum r={0.12} h={0.14} />
      </Piece>
      <Piece piece="tom2" kind="drum" focused={focused} position={[-0.17, 0.78, -0.02]} rotation={[-0.32, 0, 0.12]}>
        <Drum r={0.14} h={0.15} />
      </Piece>

      <Piece piece="caixa" kind="drum" focused={focused} position={[0.42, 0.62, -0.36]} rotation={[-0.08, 0, -0.06]}>
        <Drum r={0.17} h={0.13} color={chrome} />
      </Piece>
      <Stand from={[0.42, 0, -0.36]} height={0.55} />

      <Piece piece="surdo" kind="drum" focused={focused} position={[-0.52, 0.42, -0.42]}>
        <Drum r={0.2} h={0.36} />
      </Piece>

      <Piece piece="chimbal" kind="cymbal" focused={focused} position={[0.78, 0.86, -0.42]}>
        <Cymbal r={0.17} />
        <group position={[0, -0.03, 0]} rotation={[Math.PI, 0, 0]}>
          <Cymbal r={0.17} />
        </group>
      </Piece>
      <Stand from={[0.78, 0, -0.42]} height={0.84} />

      <Piece piece="ataque" kind="cymbal" focused={focused} position={[0.62, 1.28, 0.12]} rotation={[0.28, 0, -0.18]}>
        <Cymbal r={0.24} />
      </Piece>
      <Stand from={[0.66, 0, 0.18]} height={1.26} />

      <Piece piece="conducao" kind="cymbal" focused={focused} position={[-0.72, 1.15, 0.05]} rotation={[0.25, 0, 0.2]}>
        <Cymbal r={0.28} />
      </Piece>
      <Stand from={[-0.76, 0, 0.1]} height={1.13} />

      {/* banco do baterista */}
      <mesh material={black} position={[0.05, 0.5, -0.85]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.09, 24]} />
      </mesh>
      <Stand from={[0.05, 0, -0.85]} height={0.46} />
    </group>
  );
}
