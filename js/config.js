// config.js — todo o conteúdo do memorial fica aqui.
// Textos entre [colchetes] ainda precisam ser preenchidos com informações reais.
// Fotos: assets/fotos/   Vídeos: assets/videos/   Músicas: assets/audio/

export const CONFIG = {
  banda: 'Iron Crazy Band',
  selo: 'Est. 2010 · Rock · Friendship · Memories',
  anos: '2010 — 2026',
  epigrafe: 'The Night Never Ends — a noite nunca termina.',
  instagram: '@ironcrazy',

  // Imagem ou vídeo principal (vira ASCII em tempo real).
  // Aceita .jpg .png .webp .mp4 .webm
  hero: {
    src: 'assets/fotos/palco-01.jpg',
    focus: [0.55, 0.35],   // ponto de interesse (x, y) de 0 a 1, usado no recorte
  },

  // Texto de apresentação (blueprint, seção 15)
  chamada: 'Desde 2010, o rock é a nossa desculpa para estar juntos.',
  historia: [
    'Tudo começou em 2010, de maneira despretensiosa. Uma brincadeira entre amigos, alguns instrumentos e uma comemoração de aniversário. O que era para ser apenas um momento de diversão acabou se transformando em uma história que atravessou dezesseis anos.',
    'Entre guitarras, contrabaixo, bateria, teclados, violões e vozes, a Iron Crazy Band encontrou no rock e nos grandes clássicos do passado uma maneira de celebrar a amizade.',
    'Mais do que tocar músicas, a banda proporcionou encontros, risadas e momentos inesquecíveis. Cada apresentação se tornou uma lembrança, cada fotografia guardou um pedaço dessa história e cada música ajudou a construir algo que foi muito além do palco.',
    'Este memorial nasceu para preservar tudo isso. Um lugar onde os instrumentos continuam montados, as luzes permanecem acesas e as memórias encontram uma nova maneira de existir. Porque algumas histórias merecem continuar tocando.',
  ],

  // Divisões provisórias do blueprint (seção 06). Não inventar eventos:
  // preencha os detalhes conforme o acervo for catalogado.
  linhaDoTempo: [
    { ano: '2010', titulo: 'O nascimento', texto: 'A banda nasce em uma comemoração de aniversário. [Data, lugar e quem estava.]' },
    { ano: '2011–2015', titulo: 'Os primeiros anos', texto: '[Primeiras apresentações, repertório, histórias.]' },
    { ano: '2016–2020', titulo: 'Continuidade', texto: '[Shows, formações, momentos marcantes.]' },
    { ano: '2021–2025', titulo: 'Novos capítulos', texto: '[O que mudou, quem chegou, o que ficou.]' },
    { ano: '2026', titulo: 'Dezesseis anos', texto: 'A celebração de dezesseis anos de histórias.' },
  ],

  // Integrantes (blueprint, seção 05). photo: caminho da foto real.
  // Sem foto, aparece uma silhueta neutra — nunca um rosto gerado.
  integrantes: [
    { nome: 'Edy', papel: 'Vocal, guitarra, teclado e violão', photo: null },
    { nome: 'Fhellipe', papel: 'Vocal e contrabaixo', nota: 'Seu aniversário deu origem à banda.', photo: null },
    { nome: 'Alessandro', papel: 'Bateria', photo: null },
    { nome: 'Messias', papel: 'Vocal e violão', photo: null },
    { nome: 'Diego Lorenzo', papel: 'Guitarra', photo: null },
    { nome: 'Carlão', papel: 'Guitarra e vocal', nota: 'Participação especial · banda Velho Biker.', photo: null },
  ],

  // audio: caminho do arquivo (opcional). Ao tocar, o ASCII do topo pulsa com a música.
  // Só publique gravações de músicas de terceiros com autorização/licença.
  musicas: [
    { titulo: '[Música do repertório]', nota: 'Iron Crazy Live', audio: null },
    { titulo: '[Música do repertório]', nota: 'Favoritas da banda', audio: null },
    { titulo: '[Música do repertório]', nota: 'Raridades', audio: null },
  ],

  // type: 'image' ou 'video'
  galeria: [
    { src: 'assets/fotos/palco-01.jpg', type: 'image', legenda: '[Legenda: show, lugar, data]' },
  ],

  // Mensagem final (blueprint, seção 20) — não é uma despedida.
  homenagem:
    'Começou como uma brincadeira. Transformou-se em dezesseis anos de histórias. E algumas histórias nunca deixam de tocar.',
};
