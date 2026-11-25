# Iron Crazy Band — memorial interativo · 2010–2026

> Uma banda de amigos. Dezesseis anos de histórias. Uma noite que nunca termina.

Um pub de rock em 3D, no navegador, dedicado à amizade e à trajetória da Iron Crazy Band.
O visitante chega pela rua à noite, a porta se abre, ele entra no salão, sobe ao palco e **toca**.

Esta é a **primeira entrega vertical** do blueprint (seção 21): tela inicial, fachada,
entrada cinematográfica, salão, palco, câmera funcional, bateria e teclado tocáveis,
navegação, configurações de áudio e gráficos, e estrutura pronta para crescer.

## O que já funciona

| Área | O que faz |
|---|---|
| **Tela inicial** | Escolha entre entrar com som ou sem som (o navegador exige um gesto para liberar o áudio). A partir da 2ª visita, oferece "pular introdução". |
| **Fachada + entrada** | Rua à noite, letreiro com lâmpadas, arandelas, poste. A câmera caminha até a porta, que se abre, e atravessa para o salão. Dá para pular a cena. |
| **Salão** | Tijolo, madeira, couro, metal e luz âmbar; balcão com garrafas, mesas com velas, luminárias pendentes. |
| **Palco** | Banner com asas, backline, retornos, pedestais, guitarras e baixo nos suportes, treliça com holofotes e feixes de luz. |
| **Bateria** 🥁 | 8 peças tocáveis (bumbo, caixa, chimbal, 2 tons, surdo, ataque, condução) por clique, toque, teclado do computador ou bateria MIDI (General MIDI). Cada golpe anima a peça e pulsa a luz. |
| **Teclado** 🎹 | 25 teclas tocáveis, polifônico, com glissando ao arrastar. Timbres piano, órgão e sintetizador; oitavas; teclado do computador; teclado MIDI. |
| **Parede de memórias** | TV de tubo que exibe as fotos do acervo em **ASCII colorido em tempo real** (o mesmo motor do modo clássico), foto emoldurada, cartaz da linha do tempo clicável e molduras identificadas para as fotos que ainda faltam. |
| **HUD** | Cabeçalho discreto (marca, período, volume, configurações, modo clássico), dica contextual, botão voltar (Esc) e atalhos: Salão, Palco, Memórias, História, Banda, Mapa. |
| **Painéis** | História (texto de apresentação + linha do tempo), Camarim (6 integrantes), Mapa do pub e Configurações. |
| **Configurações** | Volume, som ambiente, 4 níveis de qualidade, sensibilidade do mouse, reduzir movimento, tela cheia. Preferências ficam salvas no navegador. |
| **Modo clássico** | `/classico/`: página sem 3D, acessível e leve, com a abertura em ASCII. Lê o **mesmo acervo**. |

Ao focar um instrumento, a luz dele se intensifica, a câmera se aproxima sem atravessar
objetos, o som ambiente abaixa e os controles aparecem. Esc volta ao enquadramento anterior.

## Rodar

Requer Node 20+.

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:5173
npm run build      # gera dist/ (site estático)
npm run preview    # serve o dist/ em http://localhost:4173
npm test           # testes (Vitest)
npm run typecheck  # checagem de tipos
```

## Editar o conteúdo

Todo o conteúdo fica em **`public/acervo.json`**: textos, linha do tempo, integrantes,
músicas e galeria. O pub 3D e o modo clássico leem o mesmo arquivo.

- Fotos em `public/acervo/fotos/`, vídeos em `public/acervo/videos/`, áudio em `public/acervo/audio/`.
- Caminhos no JSON são relativos a `public/` (ex.: `"acervo/fotos/palco-01.jpg"`).
- Textos entre `[colchetes]` são espaços reservados, aparecem em itálico e não devem ser
  inventados. Preencha com informação real.
- Integrante sem foto (`"photo": null`) aparece com a inicial, nunca com um rosto gerado.

## Publicar

É um site estático (`dist/`). Cloudflare Pages ou Vercel: comando `npm run build`, pasta `dist`.
O `base: './'` do Vite permite publicar também em subpasta (GitHub Pages).

## Documentação

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md): camadas, sistemas, estrutura de pastas e decisões.
- [`docs/LICENCAS.md`](docs/LICENCAS.md): dependências, fontes e licenças.
- [`docs/supabase-schema.sql`](docs/supabase-schema.sql): esquema do banco para a fase com painel administrativo.
- [`docs/ROADMAP.md`](docs/ROADMAP.md): o que está feito e o que vem a seguir, conforme o blueprint.
