// config.js — todo o conteúdo do memorial fica aqui.
// Troque os textos entre [colchetes] e aponte as fotos para arquivos em assets/.
// Fotos: assets/fotos/   Vídeos: assets/videos/   Músicas: assets/audio/

export const CONFIG = {
  banda: 'Iron Crazy',
  anos: '[ano de início] — [ano de fim]',
  epigrafe: 'O som acabou. A memória, não.',
  instagram: '@ironcrazy',

  // Imagem ou vídeo principal (vira ASCII em tempo real).
  // Aceita .jpg .png .webp .mp4 .webm
  hero: {
    src: 'assets/fotos/palco-01.jpg',
    focus: [0.55, 0.35],   // ponto de interesse (x, y) de 0 a 1, usado no recorte
  },

  historia: [
    '[Conte aqui como a banda começou: quem chamou quem, o primeiro ensaio, de onde veio o nome Iron Crazy.]',
    '[Um segundo parágrafo com o que a banda significou para vocês, os shows marcantes, as histórias de bastidor.]',
  ],

  linhaDoTempo: [
    { ano: '[ano]', titulo: 'O primeiro ensaio', texto: '[Onde foi, quem estava, qual música tocaram primeiro.]' },
    { ano: '[ano]', titulo: 'Primeiro show', texto: '[O lugar, o público, o que deu errado e o que deu muito certo.]' },
    { ano: '[ano]', titulo: 'O banner', texto: '[A história do banner com as asas que aparece atrás do palco.]' },
    { ano: '[ano]', titulo: 'O último show', texto: '[Como foi a despedida.]' },
  ],

  // photo: caminho da foto. Se ficar null, aparece um retrato gerado.
  integrantes: [
    { nome: '[Nome]', papel: '[instrumento]', anos: '[anos]', photo: null },
    { nome: '[Nome]', papel: '[instrumento]', anos: '[anos]', photo: null },
    { nome: '[Nome]', papel: '[instrumento]', anos: '[anos]', photo: null },
    { nome: '[Nome]', papel: '[instrumento]', anos: '[anos]', photo: null },
  ],

  // audio: caminho do arquivo (opcional). Ao tocar, o ASCII do topo pulsa com a música.
  musicas: [
    { titulo: '[Música 1]', nota: 'autoral', audio: null },
    { titulo: '[Música 2]', nota: 'cover', audio: null },
    { titulo: '[Música 3]', nota: 'ao vivo', audio: null },
  ],

  // type: 'image' ou 'video'
  galeria: [
    { src: 'assets/fotos/palco-01.jpg', type: 'image', legenda: '[Legenda: show, lugar, data]' },
  ],

  homenagem:
    '[Uma mensagem final: para quem a banda é dedicada, um agradecimento a quem esteve nos shows.]',
};
