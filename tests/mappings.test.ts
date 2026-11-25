import { describe, expect, it } from 'vitest';
import {
  DRUM_KEYS, DRUM_LABEL, KEYBOARD_HIGH, KEYBOARD_LOW, KEY_TO_SEMITONE,
  drumLegend, isBlackKey, keyToMidi, keyboardLayout, noteName,
} from '../src/instruments/mappings';

describe('bateria', () => {
  it('toda tecla leva a uma peça existente', () => {
    for (const piece of Object.values(DRUM_KEYS)) expect(DRUM_LABEL[piece]).toBeTruthy();
  });
  it('toda peça tem ao menos uma tecla', () => {
    const pieces = new Set(drumLegend().map((l) => l.piece));
    expect(pieces.size).toBe(Object.keys(DRUM_LABEL).length);
  });
});

describe('teclado', () => {
  it('A é Dó na oitava escolhida (C4 = 60)', () => {
    expect(keyToMidi('a', 4)).toBe(60);
    expect(keyToMidi('A', 3)).toBe(48);
    expect(keyToMidi('k', 4)).toBe(72);
    expect(keyToMidi('q', 4)).toBeNull();
  });
  it('teclas pretas do computador caem em notas pretas', () => {
    for (const k of ['w', 'e', 't', 'y', 'u', 'o', 'p']) expect(isBlackKey(keyToMidi(k, 4)!)).toBe(true);
    for (const k of ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']) expect(isBlackKey(keyToMidi(k, 4)!)).toBe(false);
  });
  it('não há duas teclas brancas do computador na mesma nota', () => {
    const whites = Object.entries(KEY_TO_SEMITONE).filter(([k]) => 'asdfghjklç'.includes(k)).map(([, s]) => s);
    expect(new Set(whites).size).toBe(whites.length);
  });
  it('layout 3D: 25 teclas, 15 brancas, pretas entre brancas', () => {
    const l = keyboardLayout();
    expect(l).toHaveLength(KEYBOARD_HIGH - KEYBOARD_LOW + 1);
    expect(l.filter((k) => !k.black)).toHaveLength(15);
    for (const k of l.filter((k) => k.black)) expect(k.x % 1).toBeCloseTo(0.5);
  });
  it('nomes das notas em português', () => {
    expect(noteName(60)).toBe('Dó4');
    expect(noteName(69)).toBe('Lá4');
  });
});
