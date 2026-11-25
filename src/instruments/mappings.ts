// Mapeamentos puros (sem áudio nem 3D) — fáceis de testar.

export type DrumPiece = 'bumbo' | 'caixa' | 'chimbal' | 'tom1' | 'tom2' | 'surdo' | 'ataque' | 'conducao';

export const DRUM_LABEL: Record<DrumPiece, string> = {
  bumbo: 'Bumbo',
  caixa: 'Caixa',
  chimbal: 'Chimbal',
  tom1: 'Tom 1',
  tom2: 'Tom 2',
  surdo: 'Surdo',
  ataque: 'Prato de ataque',
  conducao: 'Prato de condução',
};

/** tecla do computador → peça da bateria (use `event.key` em minúsculas; espaço = ' ') */
export const DRUM_KEYS: Record<string, DrumPiece> = {
  ' ': 'bumbo',
  b: 'bumbo',
  f: 'caixa',
  j: 'caixa',
  d: 'chimbal',
  g: 'tom1',
  h: 'tom2',
  k: 'surdo',
  e: 'ataque',
  i: 'conducao',
};

/** Legenda das teclas, agrupada por peça, para mostrar na interface. */
export function drumLegend(): { piece: DrumPiece; keys: string[] }[] {
  const by = new Map<DrumPiece, string[]>();
  for (const [k, p] of Object.entries(DRUM_KEYS)) {
    by.set(p, [...(by.get(p) ?? []), k === ' ' ? 'espaço' : k.toUpperCase()]);
  }
  return [...by.entries()].map(([piece, keys]) => ({ piece, keys }));
}

/** Teclado musical no computador: fileira A S D F... = teclas brancas, W E T Y U... = pretas. */
export const KEY_TO_SEMITONE: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, 'ç': 16, ';': 16,
};

export const MIN_OCTAVE = 1;
export const MAX_OCTAVE = 6;

/** Nota MIDI da tecla do computador na oitava atual (C da oitava 4 = 60). */
export function keyToMidi(key: string, octave: number): number | null {
  const s = KEY_TO_SEMITONE[key.toLowerCase()];
  return s === undefined ? null : (octave + 1) * 12 + s;
}

/** Faixa das teclas do teclado 3D: C3 (48) a C5 (72), 25 teclas. */
export const KEYBOARD_LOW = 48;
export const KEYBOARD_HIGH = 72;

const BLACK = new Set([1, 3, 6, 8, 10]);
export const isBlackKey = (midi: number) => BLACK.has(((midi % 12) + 12) % 12);

export interface KeyLayout {
  midi: number;
  black: boolean;
  /** posição horizontal em "larguras de tecla branca" a partir da primeira */
  x: number;
}

/** Posição de cada tecla no teclado 3D. */
export function keyboardLayout(low = KEYBOARD_LOW, high = KEYBOARD_HIGH): KeyLayout[] {
  const out: KeyLayout[] = [];
  let white = 0;
  for (let m = low; m <= high; m++) {
    if (isBlackKey(m)) out.push({ midi: m, black: true, x: white - 0.5 });
    else out.push({ midi: m, black: false, x: white++ });
  }
  return out;
}

const NAMES = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
export const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
