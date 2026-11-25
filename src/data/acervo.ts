// Acervo compartilhado: o mesmo public/acervo.json alimenta o pub 3D e o modo clássico.
// Hoje é um arquivo estático; o formato já segue as tabelas de docs/supabase-schema.sql
// para que a troca por Supabase seja só trocar `loadAcervo`.

export interface Integrante {
  nome: string;
  papel: string;
  nota?: string;
  photo: string | null;
}
export interface Marco {
  ano: string;
  titulo: string;
  texto: string;
}
export interface Musica {
  titulo: string;
  nota: string;
  audio: string | null;
}
export interface ItemGaleria {
  src: string;
  type: 'image' | 'video';
  legenda: string;
}
export interface Acervo {
  banda: string;
  selo: string;
  anos: string;
  epigrafe: string;
  instagram: string;
  hero: { src: string; focus?: [number, number] };
  chamada: string;
  historia: string[];
  linhaDoTempo: Marco[];
  integrantes: Integrante[];
  musicas: Musica[];
  galeria: ItemGaleria[];
  homenagem: string;
}

/** Caminho de mídia do acervo → URL relativa ao site. */
export const media = (p: string) => (/^(https?:|blob:|data:)/.test(p) ? p : `./${p}`);

/** Marca texto que ainda é um espaço reservado ("[...]"). */
export const isPlaceholder = (s: string) => /\[[^\]]+\]/.test(s);

let promise: Promise<Acervo> | null = null;

export function loadAcervo(): Promise<Acervo> {
  // versão em arquivo único (scripts/build-standalone.mjs): o acervo vem embutido na página
  const embedded = (globalThis as { __ACERVO__?: Acervo }).__ACERVO__;
  if (embedded) return (promise ??= Promise.resolve(embedded));
  promise ??= fetch('./acervo.json').then((r) => {
    if (!r.ok) throw new Error(`acervo.json: ${r.status}`);
    return r.json() as Promise<Acervo>;
  });
  return promise;
}
