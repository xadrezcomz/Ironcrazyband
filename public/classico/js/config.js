// config.js — o conteúdo vem do acervo compartilhado (public/acervo.json),
// o mesmo usado pelo pub 3D. Edite lá, não aqui.

const ROOT = new URL('../', new URL('./', location.href)); // raiz do site (um nível acima de /classico/)
const media = (p) => (!p || /^(https?:|blob:|data:)/.test(p) ? p : new URL(p, ROOT).href);

// na versão em arquivo único o acervo vem embutido na página
const acervo = window.__ACERVO__ ?? (await (await fetch(new URL('acervo.json', ROOT))).json());

export const CONFIG = {
  ...acervo,
  hero: { ...acervo.hero, src: media(acervo.hero.src) },
  integrantes: acervo.integrantes.map((m) => ({ ...m, photo: media(m.photo) })),
  musicas: acervo.musicas.map((m) => ({ ...m, audio: media(m.audio) })),
  galeria: acervo.galeria.map((g) => ({ ...g, src: media(g.src) })),
};
