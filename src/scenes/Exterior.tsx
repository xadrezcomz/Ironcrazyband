// Fachada noturna: letreiro IRON CRAZY BAND · EST. 2010, porta de madeira que se abre,
// arandelas, poste de rua e céu estrelado.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { asphaltTexture, brickTexture, signTexture, tiled, woodTexture } from '../core/textures';
import { useInteractive } from '../core/interaction';
import { useExperience } from '../stores/useExperience';
import { ROOM } from './Pub';
import { AimedSpot } from './lights';

const FRONT = ROOM.z1 + 0.3; // face externa da parede da frente

const iron = new THREE.MeshStandardMaterial({ color: '#1e1c1b', metalness: 0.75, roughness: 0.45 });
const brass = new THREE.MeshStandardMaterial({ color: '#c49a5c', metalness: 0.95, roughness: 0.3 });
const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff0d0', emissive: '#ffbf6e', emissiveIntensity: 7, toneMapped: false });

function Door() {
  const hinge = useRef<THREE.Group>(null);
  const open = useExperience((s) => s.doorOpen);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(woodTexture('escuro'), 0.6, 1), roughness: 0.6, color: '#b08868' }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf8f', emissive: '#d98a3a', emissiveIntensity: 1.4, roughness: 0.2, transparent: true, opacity: 0.85 }), []);
  const { w, h } = ROOM.door;

  useEffect(() => {
    if (!hinge.current) return;
    const fast = useExperience.getState().reducedMotion;
    gsap.to(hinge.current.rotation, { y: open ? 1.85 : 0, duration: fast ? 0 : 1.4, ease: 'power2.inOut' });
  }, [open]);

  // duas folhas: cada uma gira na sua dobradiça, para dentro do pub
  return (
    <group position={[0, 0, ROOM.z1 + 0.15]}>
      <group ref={hinge} position={[-w / 2, 0, 0]}>
        <DoorLeaf w={w} h={h} wood={wood} glass={glass} side={1} />
      </group>
      <MirrorLeaf w={w} h={h} wood={wood} glass={glass} open={open} />
      {/* batente */}
      <mesh material={brass} position={[0, h + 0.04, 0.16]}>
        <boxGeometry args={[w + 0.2, 0.08, 0.04]} />
      </mesh>
    </group>
  );
}

function DoorLeaf({ w, h, wood, glass, side }: { w: number; h: number; wood: THREE.Material; glass: THREE.Material; side: 1 | -1 }) {
  const lw = w / 2;
  return (
    <group position={[(side * lw) / 2, 0, 0]}>
      <mesh material={wood} position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[lw - 0.01, h, 0.07]} />
      </mesh>
      <mesh material={glass} position={[0, h * 0.68, 0.04]}>
        <planeGeometry args={[lw * 0.6, h * 0.34]} />
      </mesh>
      <mesh material={glass} position={[0, h * 0.68, -0.04]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[lw * 0.6, h * 0.34]} />
      </mesh>
      <mesh material={brass} position={[side * (lw / 2 - 0.08), h * 0.45, 0.06]}>
        <boxGeometry args={[0.03, 0.3, 0.03]} />
      </mesh>
    </group>
  );
}

function MirrorLeaf({ w, h, wood, glass, open }: { w: number; h: number; wood: THREE.Material; glass: THREE.Material; open: boolean }) {
  const hinge = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!hinge.current) return;
    const fast = useExperience.getState().reducedMotion;
    gsap.to(hinge.current.rotation, { y: open ? -1.85 : 0, duration: fast ? 0 : 1.4, ease: 'power2.inOut', delay: fast ? 0 : 0.08 });
  }, [open]);
  return (
    <group ref={hinge} position={[w / 2, 0, 0]}>
      <DoorLeaf w={w} h={h} wood={wood} glass={glass} side={-1} />
    </group>
  );
}

function Sign() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: signTexture(), roughness: 0.55, emissive: '#ffffff', emissiveMap: signTexture(), emissiveIntensity: 0.32 }), []);
  const W = 4.4, H = 1.65;
  const bulbs = useMemo(() => {
    const out: [number, number][] = [];
    const n = 16, m = 6;
    for (let i = 0; i <= n; i++) out.push([-W / 2 + (i * W) / n, H / 2 + 0.06], [-W / 2 + (i * W) / n, -H / 2 - 0.06]);
    for (let j = 1; j < m; j++) out.push([-W / 2 - 0.06, -H / 2 + (j * H) / m], [W / 2 + 0.06, -H / 2 + (j * H) / m]);
    return out;
  }, []);
  const group = useRef<THREE.Group>(null);
  // lâmpadas de letreiro antigo, piscando em onda
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m && 'emissiveIntensity' in m) m.emissiveIntensity = 4 + 4 * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.55));
    });
  });
  const bulbMats = useMemo(() => bulbs.map(() => bulbMat.clone()), [bulbs]);
  return (
    <group position={[0, 3.75, FRONT + 0.12]}>
      <mesh material={iron} position={[0, 0, -0.06]}>
        <boxGeometry args={[W + 0.3, H + 0.3, 0.1]} />
      </mesh>
      <mesh material={mat}>
        <planeGeometry args={[W, H]} />
      </mesh>
      <group ref={group}>
        {bulbs.map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.03]} material={bulbMats[i]}>
            <sphereGeometry args={[0.04, 10, 8]} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, -0.6, 0.8]} color="#ffbf7a" intensity={22} distance={8} decay={2} />
    </group>
  );
}

function WallLamp({ x }: { x: number }) {
  return (
    <group position={[x, 2.35, FRONT]}>
      <mesh material={iron} position={[0, 0, 0.08]}>
        <boxGeometry args={[0.05, 0.05, 0.18]} />
      </mesh>
      <mesh material={iron} position={[0, 0.05, 0.2]}>
        <cylinderGeometry args={[0.07, 0.11, 0.16, 6]} />
      </mesh>
      <mesh material={bulbMat} position={[0, -0.04, 0.2]}>
        <sphereGeometry args={[0.045, 12, 10]} />
      </mesh>
      <pointLight position={[0, -0.1, 0.3]} color="#ffad5e" intensity={10} distance={5} decay={2} />
    </group>
  );
}

function StreetLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh material={iron} position={[0, 2.3, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 4.6, 10]} />
      </mesh>
      <mesh material={iron} position={[-0.45, 4.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.9, 8]} />
      </mesh>
      <mesh material={iron} position={[-0.9, 4.45, 0]}>
        <coneGeometry args={[0.22, 0.25, 12, 1, true]} />
      </mesh>
      <mesh material={bulbMat} position={[-0.9, 4.36, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
      </mesh>
      <AimedSpot position={[-0.9, 4.3, 0]} target={[-1.4, 0, -0.8]} color="#ffcf91" intensity={160} angle={0.75} penumbra={0.8} distance={10} shadow />
    </group>
  );
}

export function Exterior() {
  const phase = useExperience((s) => s.phase);
  const setView = useExperience((s) => s.setView);
  const view = useExperience((s) => s.view);
  const street = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(asphaltTexture(), 12, 8), roughness: 0.75, metalness: 0.1, color: '#6d6762' }), []);
  const walk = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(brickTexture(), 10, 1.2), roughness: 0.9, color: '#6a5c56' }), []);
  const neighbor = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0f0d0d', roughness: 1 }), []);
  const doorHandlers = useInteractive('Entrar no pub', () => setView('salao'), view === 'fachada');

  return (
    <group>
      {/* calçada e rua */}
      <mesh material={walk} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, FRONT + 1.6]} receiveShadow>
        <planeGeometry args={[30, 3.2]} />
      </mesh>
      <mesh material={street} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, FRONT + 12]} receiveShadow>
        <planeGeometry args={[60, 22]} />
      </mesh>
      <mesh material={walk} position={[0, 0.06, FRONT + 3.2]}>
        <boxGeometry args={[30, 0.12, 0.12]} />
      </mesh>

      {/* prédios vizinhos em silhueta, para dar profundidade */}
      {[-11.5, 11.5].map((x, i) => (
        <mesh key={x} material={neighbor} position={[x, 3.5 + i, ROOM.z1 - 2]}>
          <boxGeometry args={[8, 7 + i * 2, 12]} />
        </mesh>
      ))}
      {/* cornija e laterais do prédio do pub */}
      <mesh material={iron} position={[0, ROOM.h + 0.85, FRONT + 0.05]}>
        <boxGeometry args={[14.6, 0.2, 0.4]} />
      </mesh>

      <Sign />
      <Door />
      <group {...doorHandlers}>
        <mesh position={[0, ROOM.door.h / 2, FRONT + 0.05]} visible={false}>
          <boxGeometry args={[ROOM.door.w, ROOM.door.h, 0.2]} />
        </mesh>
      </group>
      <WallLamp x={-1.5} />
      <WallLamp x={1.5} />
      <StreetLamp position={[4.6, 0, FRONT + 3.0]} />

      {/* luar frio, bem discreto */}
      <directionalLight position={[-8, 12, 20]} intensity={phase === 'pub' ? 0.05 : 0.18} color="#8fa2c8" />
      <Stars radius={60} depth={30} count={1800} factor={3} saturation={0} fade speed={0.4} />
    </group>
  );
}
