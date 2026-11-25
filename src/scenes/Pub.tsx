// Salão do pub: tijolo, madeira envelhecida, couro, metal e luz âmbar.
// Medidas: x de -7 a 7, z de -9 (palco) a 8 (porta), pé-direito de 4,6 m.

import { useMemo } from 'react';
import * as THREE from 'three';
import { brickTexture, tiled, woodTexture } from '../core/textures';
import { useQuality } from '../core/quality';

export const ROOM = { x0: -7, x1: 7, z0: -9, z1: 8, h: 4.6, door: { w: 1.8, h: 2.6 } };

function useMaterials() {
  return useMemo(() => {
    const brick = brickTexture();
    const wood = woodTexture('claro');
    const dark = woodTexture('escuro');
    return {
      brickBack: new THREE.MeshStandardMaterial({ map: tiled(brick, 14.6, 7.7), roughness: 0.95, color: '#b8a496' }),
      brickSide: new THREE.MeshStandardMaterial({ map: tiled(brick, 17.7, 7.7), roughness: 0.95, color: '#b8a496' }),
      brickFront: new THREE.MeshStandardMaterial({ map: tiled(brick, 6.4, 9), roughness: 0.95, color: '#b8a496' }),
      brickTop: new THREE.MeshStandardMaterial({ map: tiled(brick, 1.9, 4.7), roughness: 0.95, color: '#b8a496' }),
      floor: new THREE.MeshStandardMaterial({ map: tiled(wood, 4, 5), roughness: 0.5, metalness: 0.04, color: '#b39a80' }),
      ceiling: new THREE.MeshStandardMaterial({ color: '#15100d', roughness: 1 }),
      beam: new THREE.MeshStandardMaterial({ map: tiled(dark, 4, 1), roughness: 0.8 }),
      darkWood: new THREE.MeshStandardMaterial({ map: tiled(dark, 1, 1), roughness: 0.55, color: '#d0b8a0' }),
      panel: new THREE.MeshStandardMaterial({ map: tiled(dark, 8, 1), roughness: 0.6 }),
      leather: new THREE.MeshStandardMaterial({ color: '#38261d', roughness: 0.55 }),
      brass: new THREE.MeshStandardMaterial({ color: '#c49a5c', metalness: 0.95, roughness: 0.3 }),
      iron: new THREE.MeshStandardMaterial({ color: '#2a2725', metalness: 0.7, roughness: 0.5 }),
      bulb: new THREE.MeshStandardMaterial({ color: '#ffd29a', emissive: '#ffb45a', emissiveIntensity: 6, toneMapped: false }),
    };
  }, []);
}

export type PubMaterials = ReturnType<typeof useMaterials>;

function Walls({ m }: { m: PubMaterials }) {
  const { x0, x1, z0, z1, h, door } = ROOM;
  const w = x1 - x0, d = z1 - z0, cz = (z0 + z1) / 2;
  const side = (w - door.w) / 2;
  return (
    <group>
      <mesh material={m.floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, cz]} receiveShadow>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh material={m.ceiling} rotation={[Math.PI / 2, 0, 0]} position={[0, h, cz]}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh material={m.brickBack} position={[0, h / 2, z0]} receiveShadow>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh material={m.brickSide} position={[x0, h / 2, cz]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
      </mesh>
      <mesh material={m.brickSide} position={[x1, h / 2, cz]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
      </mesh>

      {/* parede da frente com a porta (caixas grossas: servem de fachada por fora) */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.brickFront} position={[s * (door.w / 2 + side / 2), (h + 0.8) / 2, z1 + 0.15]} castShadow receiveShadow>
          <boxGeometry args={[side, h + 0.8, 0.3]} />
        </mesh>
      ))}
      <mesh material={m.brickTop} position={[0, door.h + (h + 0.8 - door.h) / 2, z1 + 0.15]}>
        <boxGeometry args={[door.w, h + 0.8 - door.h, 0.3]} />
      </mesh>

      {/* vigas do teto */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} material={m.beam} position={[0, h - 0.16, z0 + 1.2 + i * 2.45]} castShadow>
          <boxGeometry args={[w, 0.3, 0.26]} />
        </mesh>
      ))}

      {/* lambri de madeira nas laterais */}
      {[x0 + 0.03, x1 - 0.03].map((x) => (
        <group key={x}>
          <mesh material={m.panel} position={[x, 0.55, cz + 0.3]}>
            <boxGeometry args={[0.06, 1.1, d - 0.6]} />
          </mesh>
          <mesh material={m.darkWood} position={[x + (x < 0 ? 0.04 : -0.04), 1.12, cz + 0.3]}>
            <boxGeometry args={[0.1, 0.05, d - 0.6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pendant({ position, m, light }: { position: [number, number, number]; m: PubMaterials; light: boolean }) {
  const [x, y, z] = position;
  const cord = ROOM.h - y;
  return (
    <group position={[x, y, z]}>
      <mesh material={m.iron} position={[0, cord / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, cord, 6]} />
      </mesh>
      <mesh material={m.iron} position={[0, 0.08, 0]}>
        <coneGeometry args={[0.22, 0.2, 24, 1, true]} />
      </mesh>
      <mesh material={m.bulb} position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.05, 16, 12]} />
      </mesh>
      {light && <pointLight position={[0, -0.1, 0]} color="#ffb46b" intensity={28} distance={9} decay={2} castShadow={false} />}
    </group>
  );
}

function Table({ position, m, candle }: { position: [number, number, number]; m: PubMaterials; candle: boolean }) {
  return (
    <group position={position}>
      <mesh material={m.darkWood} position={[0, 0.75, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
      </mesh>
      <mesh material={m.iron} position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.72, 10]} />
      </mesh>
      <mesh material={m.iron} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.04, 20]} />
      </mesh>
      {[0, 2.2, 4.2].map((a) => (
        <group key={a} position={[Math.cos(a) * 0.78, 0, Math.sin(a) * 0.78]} rotation={[0, -a - Math.PI / 2, 0]}>
          <mesh material={m.leather} position={[0, 0.46, 0]} castShadow>
            <boxGeometry args={[0.42, 0.06, 0.42]} />
          </mesh>
          <mesh material={m.darkWood} position={[0, 0.78, -0.19]}>
            <boxGeometry args={[0.42, 0.6, 0.04]} />
          </mesh>
          {[-0.18, 0.18].flatMap((dx) => [-0.18, 0.18].map((dz) => (
            <mesh key={`${dx}${dz}`} material={m.iron} position={[dx, 0.22, dz]}>
              <cylinderGeometry args={[0.015, 0.015, 0.44, 6]} />
            </mesh>
          )))}
        </group>
      ))}
      <mesh material={m.bulb} position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 12]} />
      </mesh>
      {candle && <pointLight position={[0, 0.95, 0]} color="#ff9a45" intensity={2.5} distance={2.5} decay={2} />}
    </group>
  );
}

function Bar({ m, light }: { m: PubMaterials; light: boolean }) {
  const bottles = useMemo(() => {
    const colors = ['#5a2a12', '#2f4a2a', '#6e4a1a', '#3a1a14', '#7a5a2a', '#1f2f26'];
    const out: { p: [number, number, number]; c: string; h: number }[] = [];
    for (const y of [1.62, 2.12, 2.62]) {
      for (let i = 0; i < 18; i++) {
        out.push({ p: [-6.82, y + 0.13, -2.6 + i * 0.32 + (Math.sin(i * 7.3) * 0.06)], c: colors[(i * 5 + y * 10) % colors.length | 0], h: 0.22 + ((i * 13) % 5) * 0.025 });
      }
    }
    return out;
  }, []);
  const glass = useMemo(() => colorsToMaterials(bottles.map((b) => b.c)), [bottles]);

  return (
    <group>
      {/* balcão */}
      <mesh material={m.darkWood} position={[-5.7, 0.54, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.75, 1.08, 6.6]} />
      </mesh>
      <mesh material={m.leather} position={[-5.62, 1.11, 0.4]} castShadow>
        <boxGeometry args={[1.0, 0.06, 6.8]} />
      </mesh>
      <mesh material={m.brass} position={[-5.18, 0.2, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 6.6, 10]} />
      </mesh>
      {/* banquetas */}
      {[-1.8, -0.4, 1.0, 2.4].map((z) => (
        <group key={z} position={[-4.85, 0, z]}>
          <mesh material={m.leather} position={[0, 0.78, 0]} castShadow>
            <cylinderGeometry args={[0.19, 0.19, 0.08, 20]} />
          </mesh>
          <mesh material={m.iron} position={[0, 0.39, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.76, 8]} />
          </mesh>
          <mesh material={m.iron} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.012, 6, 20]} />
          </mesh>
          <mesh material={m.iron} position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.03, 16]} />
          </mesh>
        </group>
      ))}
      {/* prateleiras e garrafas */}
      {[1.6, 2.1, 2.6].map((y) => (
        <mesh key={y} material={m.darkWood} position={[-6.82, y, 0.2]}>
          <boxGeometry args={[0.3, 0.04, 6.2]} />
        </mesh>
      ))}
      {bottles.map((b, i) => (
        <mesh key={i} material={glass[i]} position={b.p}>
          <cylinderGeometry args={[0.035, 0.04, b.h, 10]} />
        </mesh>
      ))}
      {/* faixa de luz atrás das garrafas */}
      <mesh material={m.bulb} position={[-6.95, 1.63, 0.2]}>
        <boxGeometry args={[0.02, 0.015, 6.0]} />
      </mesh>
      {light && <pointLight position={[-6.3, 2.1, 0.2]} color="#ffa95a" intensity={16} distance={6} decay={2} />}
    </group>
  );
}

function colorsToMaterials(colors: string[]) {
  const by = new Map<string, THREE.Material>();
  return colors.map((c) => {
    if (!by.has(c)) by.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.08, metalness: 0.1, emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.88 }));
    return by.get(c)!;
  });
}

export function Pub() {
  const m = useMaterials();
  const q = useQuality();
  const tables: [number, number, number][] = [[-2.2, 0, 1.6], [2.3, 0, 0.4], [-1.6, 0, -2.4], [2.6, 0, -2.9]];
  return (
    <group>
      <Walls m={m} />
      <Bar m={m} light={q.extraLights} />
      {tables.map((p, i) => (
        <group key={i}>
          <Table position={p} m={m} candle={q.extraLights} />
          <Pendant position={[p[0], 2.45, p[2]]} m={m} light={i < 2 || q.extraLights} />
        </group>
      ))}
      <Pendant position={[0, 3.05, 3.2]} m={m} light />
      <hemisphereLight args={['#6a4a34', '#1a0f0a', 1.1]} />
    </group>
  );
}
