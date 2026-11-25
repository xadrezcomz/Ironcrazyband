// Holofote que mira um ponto: em three.js o alvo do SpotLight precisa estar na cena
// para que a direção acompanhe o grupo em que a luz está.

import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { useQuality } from '../core/quality';

type Vec3 = [number, number, number];

interface Props {
  position: Vec3;
  target: Vec3;
  color?: THREE.ColorRepresentation;
  intensity?: number;
  angle?: number;
  penumbra?: number;
  distance?: number;
  /** só projeta sombra nos níveis de qualidade com sombras */
  shadow?: boolean;
  lightRef?: RefObject<THREE.SpotLight | null>;
}

export function AimedSpot({ position, target, shadow = false, lightRef, ...props }: Props) {
  const own = useRef<THREE.SpotLight>(null);
  const ref = lightRef ?? own;
  const obj = useMemo(() => new THREE.Object3D(), []);
  const q = useQuality();
  useLayoutEffect(() => {
    if (ref.current) ref.current.target = obj;
  }, [obj, ref]);
  const cast = shadow && q.shadows;
  return (
    <>
      <spotLight
        ref={ref}
        position={position}
        decay={2}
        castShadow={cast}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        {...props}
      />
      <primitive object={obj} position={target} />
    </>
  );
}
