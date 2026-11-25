// Pontos de vista da câmera. Cada um tem posição e alvo fixos, escolhidos para
// que a câmera nunca atravesse paredes ou objetos ao se aproximar.
// Coordenadas: chão em y=0; o salão vai de x=-7 a 7 e de z=-9 (fundo, palco) a z=8 (porta).

export type ViewId = 'fachada' | 'salao' | 'palco' | 'bateria' | 'teclado' | 'parede';

export type Vec3 = [number, number, number];

export interface ViewDef {
  label: string;
  position: Vec3;
  target: Vec3;
  /** para onde "voltar" (Esc) leva */
  parent?: ViewId;
  /** dica mostrada no rodapé quando esta vista está ativa */
  hint: string;
  /** quanto o mouse pode mover a câmera (paralaxe) */
  parallax: number;
}

export const VIEWS: Record<ViewId, ViewDef> = {
  fachada: {
    label: 'Fachada',
    position: [0, 1.65, 17],
    target: [0, 2.5, 8],
    hint: 'Entre no pub',
    parallax: 0.25,
  },
  salao: {
    label: 'Salão',
    position: [0, 2.3, 6.2],
    target: [0, 1.4, -6],
    hint: 'Clique no palco, na bateria, no teclado ou na parede de memórias',
    parallax: 0.35,
  },
  palco: {
    label: 'Palco',
    position: [0, 2.2, 0.8],
    target: [0, 1.35, -7.2],
    parent: 'salao',
    hint: 'Escolha um instrumento para tocar',
    parallax: 0.25,
  },
  bateria: {
    label: 'Bateria',
    position: [0.35, 2.55, -4.85],
    target: [0.35, 1.05, -7.55],
    parent: 'palco',
    hint: 'Clique nas peças ou use o teclado do computador',
    parallax: 0.06,
  },
  teclado: {
    label: 'Teclado',
    position: [-3.0, 2.35, -5.0],
    target: [-3.15, 1.35, -6.45],
    parent: 'palco',
    hint: 'Toque com o mouse, toque na tela ou use as teclas A a Ç',
    parallax: 0.04,
  },
  parede: {
    label: 'Parede de memórias',
    position: [3.2, 1.95, 0],
    target: [6.9, 1.85, 0],
    parent: 'salao',
    hint: 'Clique no cartaz para ver a linha do tempo',
    parallax: 0.12,
  },
};

/** Vistas oferecidas no mapa e nos atalhos (a fachada é a entrada). */
export const MAP_ORDER: ViewId[] = ['fachada', 'salao', 'palco', 'bateria', 'teclado', 'parede'];

export const isInstrumentView = (v: ViewId) => v === 'bateria' || v === 'teclado';
