# Iron Crazy — memorial

Site memorial da banda. A foto principal vira **arte ASCII colorida em tempo real**
(WebGL2): cada célula da grade vira uma letra escolhida pela luminosidade, as bordas
usam `/ \ | _` (detecção de Sobel) e a cor vem da própria foto. A imagem "se monta"
letra por letra ao abrir, o cursor funciona como uma lente que embaralha e amplia,
e as músicas (quando houver áudio) fazem a imagem pulsar.

## Rodar localmente

O site usa módulos JS, então precisa de um servidor (abrir o arquivo direto não funciona):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Editar o conteúdo

Tudo fica em **`js/config.js`**: nome, anos, história, linha do tempo, integrantes,
músicas e galeria. Troque os textos entre `[colchetes]`.

- Fotos em `assets/fotos/`, vídeos em `assets/videos/`, músicas em `assets/audio/`.
- `hero.src` aceita foto (`.jpg`, `.png`, `.webp`) ou vídeo (`.mp4`, `.webm`): vídeo também vira ASCII ao vivo.
- Integrante sem foto (`photo: null`) mostra um retrato provisório gerado.
- Reduza as fotos antes de subir (por volta de 1200–1600 px no lado maior).

Para testar outra imagem sem editar nada: no topo do site, abra **[+] ajustes →
testar outra foto ou vídeo**, ou arraste um arquivo para a tela. O arquivo não sai
do seu navegador.

## Arquivos

| arquivo | o que faz |
|---|---|
| `js/ascii-engine.js` | motor ASCII (shaders WebGL2, atlas de glifos, revelação, lente do cursor) |
| `js/main.js` | monta a página, controles, cartões, áudio reativo |
| `js/code-panel.js` | painel que "digita" o código do motor abaixo da abertura |
| `js/placeholders.js` | retratos provisórios |
| `js/config.js` | **o conteúdo do memorial** |

## Publicar

É um site estático: funciona no GitHub Pages, Netlify, Vercel ou Cloudflare Pages
sem build. No GitHub Pages: Settings → Pages → Deploy from branch.
