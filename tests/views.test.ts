import { describe, expect, it } from 'vitest';
import { MAP_ORDER, VIEWS, type ViewId } from '../src/core/views';

const ROOM = { x0: -7, x1: 7, z0: -9, z1: 8, h: 4.6 };

describe('pontos de vista da câmera', () => {
  it('todo "voltar" aponta para uma vista existente, sem ciclos', () => {
    for (const id of Object.keys(VIEWS) as ViewId[]) {
      const seen = new Set<ViewId>();
      let cur: ViewId | undefined = id;
      while (cur) {
        expect(seen.has(cur)).toBe(false);
        seen.add(cur);
        cur = VIEWS[cur].parent;
        if (cur) expect(VIEWS[cur]).toBeDefined();
      }
    }
  });
  it('câmeras internas ficam dentro do salão e abaixo do teto', () => {
    for (const id of MAP_ORDER.filter((v) => v !== 'fachada')) {
      const [x, y, z] = VIEWS[id].position;
      expect(x).toBeGreaterThan(ROOM.x0);
      expect(x).toBeLessThan(ROOM.x1);
      expect(z).toBeGreaterThan(ROOM.z0);
      expect(z).toBeLessThan(ROOM.z1);
      expect(y).toBeLessThan(ROOM.h - 0.3);
    }
  });
  it('a fachada fica do lado de fora', () => {
    expect(VIEWS.fachada.position[2]).toBeGreaterThan(ROOM.z1);
  });
});
