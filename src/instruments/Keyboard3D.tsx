// Teclado de 25 teclas (Dó3 a Dó5) num suporte em X.
// Mouse e toque: pressionar toca, arrastar faz glissando, soltar libera a nota.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { bus } from '../core/events';
import { useExperience } from '../stores/useExperience';
import { keyboardLayout, noteName } from './mappings';
import { pressNote, releaseNote } from './play';
import { AimedSpot } from '../scenes/lights';

type Vec3 = [number, number, number];

const WHITE_W = 0.046;
const WHITE = { w: WHITE_W - 0.003, h: 0.022, d: 0.15 };
const BLACK = { w: 0.026, h: 0.02, d: 0.092 };

const caseMat = new THREE.MeshStandardMaterial({ color: '#141313', roughness: 0.45, metalness: 0.2 });
const panelMat = new THREE.MeshStandardMaterial({ color: '#38261d', roughness: 0.6 });
const standMat = new THREE.MeshStandardMaterial({ color: '#222', metalness: 0.8, roughness: 0.35 });

export function Keyboard3D({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  const layout = useMemo(() => keyboardLayout(), []);
  const whites = layout.filter((k) => !k.black).length;
  const width = whites * WHITE_W;
  const view = useExperience((s) => s.view);
  const phase = useExperience((s) => s.phase);
  const setView = useExperience((s) => s.setView);
  const setHovered = useExperience((s) => s.setHovered);
  const focused = view === 'teclado';

  const keyRefs = useRef(new Map<number, THREE.Mesh>());
  const pressed = useRef(new Map<number, number>()); // midi → profundidade alvo (0..1)
  const pointerNote = useRef(new Map<number, number>()); // pointerId → midi
  const light = useRef<THREE.SpotLight>(null);

  const mats = useMemo(() => {
    const white = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.4 });
    const black = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.3 });
    const lit = new THREE.MeshStandardMaterial({ color: '#e7b46a', roughness: 0.35, emissive: '#c4562c', emissiveIntensity: 0.9 });
    return { white, black, lit };
  }, []);

  useEffect(() => {
    const a = bus.on('noteOn', ({ midi }) => pressed.current.set(midi, 1));
    const b = bus.on('noteOff', ({ midi }) => pressed.current.set(midi, 0));
    return () => { a(); b(); };
  }, []);

  useFrame((_, dt) => {
    keyRefs.current.forEach((mesh, midi) => {
      const targetDepth = pressed.current.get(midi) ?? 0;
      const ud = mesh.userData as { depth: number; baseY: number; black: boolean };
      ud.depth += (targetDepth - ud.depth) * Math.min(1, dt * 30);
      mesh.rotation.x = ud.depth * 0.07;
      mesh.position.y = ud.baseY - ud.depth * 0.006;
      mesh.material = targetDepth > 0 ? mats.lit : ud.black ? mats.black : mats.white;
    });
    if (light.current) light.current.intensity += ((focused ? 20 : 14) - light.current.intensity) * Math.min(1, dt * 5);
  });

  const start = (midi: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (phase !== 'pub') return;
    if (!focused) return setView('teclado');
    (e.target as Element | null)?.releasePointerCapture?.(e.pointerId);
    pointerNote.current.set(e.pointerId, midi);
    pressNote(midi, 0.8);
  };
  const enter = (midi: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (focused) setHovered(noteName(midi));
    const cur = pointerNote.current.get(e.pointerId);
    if (cur === undefined || cur === midi || e.buttons === 0) return;
    releaseNote(cur);
    pointerNote.current.set(e.pointerId, midi);
    pressNote(midi, 0.7);
  };
  const end = (e: ThreeEvent<PointerEvent>) => {
    const cur = pointerNote.current.get(e.pointerId);
    if (cur !== undefined) {
      releaseNote(cur);
      pointerNote.current.delete(e.pointerId);
    }
  };

  // solta notas presas se o ponteiro sair da tela
  useEffect(() => {
    const up = (e: PointerEvent) => {
      const cur = pointerNote.current.get(e.pointerId);
      if (cur !== undefined) { releaseNote(cur); pointerNote.current.delete(e.pointerId); }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, []);

  const top = 0.92; // altura do tampo das teclas acima do chão do palco

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <AimedSpot lightRef={light} position={[0.2, 3.2, 1.4]} target={[0, top, 0]} angle={0.42} penumbra={0.8} distance={7} color="#ffd8a3" intensity={22} />

      {/* suporte em X */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 - 0.12), 0, 0]}>
          <mesh material={standMat} position={[0, top / 2 - 0.03, 0]} rotation={[0.55, 0, 0]}>
            <boxGeometry args={[0.03, top * 1.15, 0.03]} />
          </mesh>
          <mesh material={standMat} position={[0, top / 2 - 0.03, 0]} rotation={[-0.55, 0, 0]}>
            <boxGeometry args={[0.03, top * 1.15, 0.03]} />
          </mesh>
        </group>
      ))}

      {/* corpo */}
      <group
        position={[0, top, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (phase !== 'pub') return;
          if (!focused) setHovered('Teclado — clique para tocar');
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = ''; }}
        onPointerDown={(e) => { e.stopPropagation(); if (phase === 'pub' && !focused) setView('teclado'); }}
      >
        <mesh material={caseMat} position={[0, -0.03, -0.02]} castShadow>
          <boxGeometry args={[width + 0.12, 0.07, 0.3]} />
        </mesh>
        <mesh material={panelMat} position={[0, 0.012, -0.125]}>
          <boxGeometry args={[width + 0.1, 0.03, 0.05]} />
        </mesh>
        {/* botões do painel (decoração do próprio instrumento) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} material={standMat} position={[-width / 2 + 0.06 + i * 0.05, 0.03, -0.125]}>
            <cylinderGeometry args={[0.008, 0.008, 0.012, 12]} />
          </mesh>
        ))}

        {layout.map((k) => {
          const x = -width / 2 + (k.x + 0.5) * WHITE_W;
          const dims = k.black ? BLACK : WHITE;
          const baseY = k.black ? 0.02 : 0.011;
          const z = k.black ? -0.03 : 0;
          return (
            <mesh
              key={k.midi}
              ref={(m) => {
                if (m) {
                  m.userData = { depth: 0, baseY, black: k.black };
                  keyRefs.current.set(k.midi, m);
                } else keyRefs.current.delete(k.midi);
              }}
              position={[x, baseY, z]}
              material={k.black ? mats.black : mats.white}
              onPointerDown={start(k.midi)}
              onPointerEnter={enter(k.midi)}
              onPointerUp={end}
              castShadow
            >
              <boxGeometry args={[dims.w, dims.h, dims.d]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
