// Palco ao fundo do salão: tablado, banner, backline, treliça de luz e instrumentos.

import { useMemo } from 'react';
import * as THREE from 'three';
import { bannerTexture, tiled, woodTexture } from '../core/textures';
import { useInteractive } from '../core/interaction';
import { useQuality } from '../core/quality';
import { useExperience } from '../stores/useExperience';
import { Drums } from '../instruments/Drums';
import { Keyboard3D } from '../instruments/Keyboard3D';
import { AimedSpot } from './lights';

export const STAGE = { x0: -5.6, x1: 5.6, z0: -9, z1: -5.2, h: 0.55 };

type Vec3 = [number, number, number];

const tolex = new THREE.MeshStandardMaterial({ color: '#151414', roughness: 0.85 });
const grille = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 1 });
const brass = new THREE.MeshStandardMaterial({ color: '#c49a5c', metalness: 0.95, roughness: 0.3 });
const metal = new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.85, roughness: 0.35 });
const chrome = new THREE.MeshStandardMaterial({ color: '#cfcfcf', metalness: 1, roughness: 0.2 });

function Amp({ position, size = [0.75, 0.6, 0.32], rotY = 0 }: { position: Vec3; size?: Vec3; rotY?: number }) {
  const [w, h, d] = size;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh material={tolex} position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
      </mesh>
      <mesh material={grille} position={[0, h * 0.42, d / 2 + 0.002]}>
        <planeGeometry args={[w * 0.88, h * 0.62]} />
      </mesh>
      <mesh material={brass} position={[0, h * 0.86, d / 2 + 0.002]}>
        <planeGeometry args={[w * 0.9, h * 0.12]} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} material={tolex} position={[-w * 0.35 + i * w * 0.14, h * 0.86, d / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 12]} />
        </mesh>
      ))}
    </group>
  );
}

function MicStand({ position, rotY = 0 }: { position: Vec3; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh material={metal} position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.14, 0.15, 0.03, 20]} />
      </mesh>
      <mesh material={metal} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 1.5, 8]} />
      </mesh>
      <mesh material={metal} position={[0, 1.5, 0.15]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.38, 8]} />
      </mesh>
      <mesh material={metal} position={[0, 1.6, 0.3]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.012, 0.15, 12]} />
      </mesh>
      <mesh material={chrome} position={[0, 1.66, 0.36]}>
        <sphereGeometry args={[0.026, 16, 12]} />
      </mesh>
    </group>
  );
}

/** Guitarra/baixo num suporte: corpo extrudado + braço + mão. */
function GuitarOnStand({ position, color, bass = false, rotY = 0 }: { position: Vec3; color: string; bass?: boolean; rotY?: number }) {
  const geom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.22);
    s.bezierCurveTo(0.2, -0.24, 0.22, -0.05, 0.13, 0.02);
    s.bezierCurveTo(0.1, 0.05, 0.13, 0.13, 0.17, 0.18);
    s.bezierCurveTo(0.14, 0.24, 0.06, 0.2, 0.04, 0.14);
    s.lineTo(-0.04, 0.14);
    s.bezierCurveTo(-0.07, 0.24, -0.18, 0.22, -0.15, 0.12);
    s.bezierCurveTo(-0.12, 0.06, -0.1, 0.04, -0.13, 0.0);
    s.bezierCurveTo(-0.22, -0.08, -0.2, -0.24, 0, -0.22);
    return new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 3 });
  }, []);
  const body = useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }), [color]);
  const neck = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(woodTexture('claro'), 0.2, 1), color: '#e0b980', roughness: 0.5 }), []);
  const len = bass ? 0.86 : 0.68;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* suporte */}
      <mesh material={metal} position={[0, 0.2, -0.06]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
      </mesh>
      <mesh material={metal} position={[0, 0.03, 0.02]}>
        <boxGeometry args={[0.32, 0.02, 0.2]} />
      </mesh>
      <group position={[0, 0.3, 0]} rotation={[-0.12, 0, 0]}>
        <mesh geometry={geom} material={body} castShadow />
        <mesh material={neck} position={[0, 0.14 + len / 2, 0.03]}>
          <boxGeometry args={[bass ? 0.05 : 0.045, len, 0.025]} />
        </mesh>
        <mesh material={tolex} position={[0, 0.16 + len, 0.03]}>
          <boxGeometry args={[0.08, 0.17, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}

/** Feixe de luz "volumétrico" barato: cone aditivo com degradê. */
function Beam({ from, to, color }: { from: Vec3; to: Vec3; color: string }) {
  const { geom, quat, mid, len } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const g = new THREE.CylinderGeometry(0.06, 0.9, len, 24, 1, true);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    return { geom: g, quat, mid: a.clone().lerp(b, 0.5), len };
  }, [from, to]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uColor: { value: new THREE.Color(color) }, uLen: { value: len } },
      vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uColor; varying float vY; varying vec3 vN; varying vec3 vV;
        void main(){ float rim = pow(abs(dot(vN, vV)), 1.6); float a = vY * vY * 0.11 * rim;
        gl_FragColor = vec4(uColor * a, a); }`,
    }),
    [color, len]
  );
  return <mesh geometry={geom} material={mat} position={mid} quaternion={quat} />;
}

export function Stage() {
  const q = useQuality();
  const setView = useExperience((s) => s.setView);
  const view = useExperience((s) => s.view);
  const { x0, x1, z0, z1, h } = STAGE;
  const w = x1 - x0, d = z1 - z0, cz = (z0 + z1) / 2;
  const deck = useMemo(() => new THREE.MeshStandardMaterial({ map: tiled(woodTexture('escuro'), 3, 1.5), roughness: 0.6 }), []);
  const banner = useMemo(() => new THREE.MeshStandardMaterial({ map: bannerTexture(), roughness: 0.9 }), []);
  const stageClick = useInteractive('Palco', () => setView('palco'), view === 'salao');

  const truss: { x: number; color: string; aim: Vec3 }[] = [
    { x: -4.2, color: '#ffb066', aim: [-3.1, 0.6, -6.6] },
    { x: -1.4, color: '#c8382e', aim: [0.4, 0.6, -7.4] },
    { x: 1.4, color: '#ffd9a0', aim: [-0.6, 0.6, -6.6] },
    { x: 4.2, color: '#c8382e', aim: [2.8, 0.6, -6.9] },
  ];

  return (
    <group>
      {/* tablado */}
      <group {...stageClick}>
        <mesh material={deck} position={[0, h / 2, cz]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
        </mesh>
        <mesh material={brass} position={[0, h - 0.02, z1 + 0.005]}>
          <boxGeometry args={[w, 0.03, 0.02]} />
        </mesh>
      </group>
      {/* degraus laterais */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={deck} position={[s * (w / 2 - 0.45), h / 4, z1 + 0.25]} receiveShadow>
          <boxGeometry args={[0.8, h / 2, 0.5]} />
        </mesh>
      ))}

      {/* banner no fundo */}
      <mesh material={banner} position={[0, 2.85, z0 + 0.03]}>
        <planeGeometry args={[6.4, 3.2]} />
      </mesh>

      {/* backline */}
      <group position={[0, h, 0]}>
        <Amp position={[-2.2, 0, -8.55]} size={[0.8, 1.3, 0.38]} />
        <Amp position={[-2.2, 1.3, -8.55]} size={[0.8, 0.32, 0.3]} />
        <Amp position={[2.0, 0, -8.55]} size={[0.75, 0.62, 0.34]} />
        <Amp position={[3.1, 0, -8.5]} size={[0.62, 1.1, 0.42]} rotY={-0.2} />
        {/* caixas de retorno (monitores) */}
        {[-2.2, 2.0].map((x) => (
          <mesh key={x} material={tolex} position={[x, 0.18, -5.7]} rotation={[-0.5, 0, 0]} castShadow>
            <boxGeometry args={[0.6, 0.32, 0.4]} />
          </mesh>
        ))}
        <MicStand position={[-1.6, 0, -6.0]} rotY={0.1} />
        <MicStand position={[1.5, 0, -6.1]} rotY={-0.1} />
        <GuitarOnStand position={[-4.6, 0, -7.2]} color="#8e1c1c" bass rotY={0.4} />
        <GuitarOnStand position={[4.3, 0, -7.4]} color="#c2862f" rotY={-0.4} />
        <GuitarOnStand position={[4.85, 0, -6.6]} color="#151414" rotY={-0.6} />

        <Drums position={[0.4, 0, -7.6]} />
        <Keyboard3D position={[-3.15, 0, -6.45]} rotationY={0.18} />
      </group>

      {/* caixas de som (PA) nas laterais */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 5.9, 0, -4.6]}>
          <mesh material={tolex} position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.6, 1.8, 0.55]} />
          </mesh>
          <mesh material={grille} position={[0, 0.9, 0.28]}>
            <planeGeometry args={[0.5, 1.6]} />
          </mesh>
        </group>
      ))}

      {/* treliça e holofotes */}
      <mesh material={metal} position={[0, 4.05, -5.4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 11, 10]} />
      </mesh>
      {truss.map((t, i) => (
        <group key={t.x}>
          <mesh material={metal} position={[t.x, 3.9, -5.4]} rotation={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.13, 0.3, 16]} />
          </mesh>
          <AimedSpot position={[t.x, 3.85, -5.35]} target={t.aim} color={t.color} intensity={260} angle={0.42} penumbra={0.65} distance={12} shadow={i === 1} />
          {q.post && <Beam from={[t.x, 3.85, -5.35]} to={t.aim} color={t.color} />}
        </group>
      ))}
      {/* contraluz quente no banner */}
      <AimedSpot position={[0, 0.7, -6.2]} target={[0, 3.2, -9]} color="#ff9a4a" intensity={45} angle={0.7} penumbra={1} distance={6} />
    </group>
  );
}
