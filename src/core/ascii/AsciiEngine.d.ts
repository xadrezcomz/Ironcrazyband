// Tipos do motor ASCII (o código é JS puro para ser compartilhado com o modo clássico,
// que roda sem build). Fonte: public/classico/js/ascii-engine.js — os dois arquivos
// precisam ser idênticos (há um teste que confere).

export interface AsciiOptions {
  cellHeight: number;
  mode: 'color' | 'mono' | 'ouro' | 'sepia';
  edges: boolean;
  edgeThreshold: number;
  exposure: number;
  gamma: number;
  saturation: number;
  fit: 'auto' | 'cover' | 'contain';
  focus: [number, number];
  align: [number, number];
  reveal: number;
  stars: number;
  pulse: number;
  cellBackground: number;
  background: [number, number, number];
  mouseRadius: number;
  fontFamily: string;
}

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export const DEFAULTS: AsciiOptions;

export class AsciiEngine {
  constructor(canvas: HTMLCanvasElement, opts?: Partial<AsciiOptions>);
  canvas: HTMLCanvasElement;
  opts: AsciiOptions;
  dpr: number;
  letters: number;
  countLetters?: boolean;
  set(opts: Partial<AsciiOptions>): void;
  setSource(el: Source): void;
  setMouse(x: number, y: number, inside: boolean): void;
  resize(wCss?: number, hCss?: number): void;
  buildAtlas(): void;
  render(time?: number): boolean;
  renderInto(source: Source, target: HTMLCanvasElement, time: number, reveal?: number): boolean;
  readonly grid: { cols: number; rows: number };
}
