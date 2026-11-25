// SceneManager: monta fachada, salão, palco e parede de memórias numa única cena
// contínua (a câmera atravessa a porta de verdade).

import type { Acervo } from '../data/acervo';
import { Exterior } from './Exterior';
import { MemoryWall } from './MemoryWall';
import { Pub } from './Pub';
import { Stage } from './Stage';

export function World({ acervo }: { acervo: Acervo }) {
  return (
    <group>
      <Exterior />
      <Pub />
      <Stage />
      <MemoryWall acervo={acervo} />
    </group>
  );
}
