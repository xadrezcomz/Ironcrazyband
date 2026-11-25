// Barramento de eventos minúsculo: liga o áudio às animações 3D sem passar pelo React
// (cada nota não deve causar um re-render).

type Handler<T> = (payload: T) => void;

export class Emitter<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Set<Handler<Events[K]>> } = {};

  on<K extends keyof Events>(type: K, fn: Handler<Events[K]>): () => void {
    (this.handlers[type] ??= new Set()).add(fn);
    return () => this.handlers[type]?.delete(fn);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]) {
    this.handlers[type]?.forEach((fn) => fn(payload));
  }
}

import type { DrumPiece } from '../instruments/mappings';

export const bus = new Emitter<{
  drumHit: { piece: DrumPiece; velocity: number };
  noteOn: { midi: number; velocity: number };
  noteOff: { midi: number };
}>();
