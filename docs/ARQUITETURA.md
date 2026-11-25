# Arquitetura

## Visão geral

```
três modos de visita ──► estado global (Zustand) ──► motor 3D (R3F) · motor musical (Tone.js) · acervo
   imersivo  = pub 3D (/)                               │                    │                  │
   clássico  = página sem 3D (/classico/)               ▼                    ▼                  ▼
   documentário = (próxima fase)                   cena contínua      Web Audio, baixa     public/acervo.json
                                                   fachada→salão→palco    latência         (depois: Supabase)
```

Os modos compartilham o **mesmo acervo** (`public/acervo.json`). O modo clássico é estático
(sem build) e lê o JSON em tempo de execução, assim como o pub 3D.

## Pilha

| Camada | Escolha |
|---|---|
| Front-end | React 19 + TypeScript + Vite |
| 3D | three.js + React Three Fiber + Drei · WebGL 2 |
| Pós-produção | @react-three/postprocessing (bloom, vinheta, N8AO no nível cinematográfico) |
| Animação | GSAP (câmera, porta) |
| Áudio | Tone.js sobre Web Audio API, carregado sob demanda |
| Estado | Zustand (com `persist` para preferências) |
| Testes | Vitest (unidade) + Playwright (verificação visual manual) |

## Estrutura

```
public/
  acervo.json              conteúdo único do memorial
  acervo/{fotos,videos,audio}
  classico/                modo clássico (HTML/CSS/JS puros)
src/
  core/
    AudioEngine.ts         contexto de áudio, bus, bateria e teclado sintetizados
    CameraRig.tsx          CameraManager: vistas, entrada cinematográfica, paralaxe
    views.ts               pontos de vista (posição, alvo, "voltar", dica)
    interaction.ts         InteractionManager: hover, cursor, rótulo, ação
    quality.ts             PerformanceManager: 4 níveis de qualidade
    textures.ts            texturas procedurais (tijolo, madeira, banner, letreiro, cartaz)
    events.ts              barramento leve áudio → animação (sem re-render)
    ascii/AsciiEngine.js   motor ASCII WebGL2 (idêntico ao do modo clássico)
  scenes/                  SceneManager: Exterior, Pub, Stage, MemoryWall, Effects, World
  instruments/             Drums, Keyboard3D, mapeamentos, execução, teclas, MIDI
  ui/                      IntroScreen, Hud, InstrumentPanel, Panels
  stores/useExperience.ts  estado global
  data/acervo.ts           tipos e carregamento do acervo
tests/                     Vitest
docs/
```

## Sistemas

- **Camera Manager** (`CameraRig.tsx` + `views.ts`): cada vista tem posição e alvo fixos,
  escolhidos para que nenhum trajeto atravesse paredes ou objetos (há teste garantindo
  que as câmeras internas ficam dentro do salão). Transições com GSAP; duração proporcional
  à distância; "reduzir movimento" troca por cortes secos. A entrada é uma timeline:
  rua → porta (que se abre) → salão.
- **Interaction Manager** (`interaction.ts`): todo objeto clicável passa por `useInteractive`,
  que define hover, cursor, rótulo contextual e ação. Nada parece clicável sem ser.
- **Audio Engine** (`AudioEngine.ts`): o Tone.js só é baixado quando o visitante ativa o som.
  Contexto `interactive` com `lookAhead: 0` (menor latência). Bus: instrumentos → compressor
  → reverb. Som ambiente (ruído rosa filtrado) que abaixa quando um instrumento está em foco.
- **Instrumentos**: `play.ts` é o ponto único que dispara som + evento de animação. Teclado
  do computador (`useInstrumentKeys`) e MIDI (`connectMidi`) só ficam ativos no instrumento em foco.
- **Performance Manager** (`quality.ts`): Econômico (sem pós-produção nem sombras,
  resolução reduzida), Médio (bloom), Alto (sombras suaves), Cinematográfico (+ oclusão de
  ambiente). O `PerformanceMonitor` reduz a resolução automaticamente se o FPS cair.
  O nível inicial é escolhido pelo aparelho e fica salvo.
- **Asset Loader**: as texturas são procedurais (sem download); a foto do acervo carrega
  via `useTexture` com Suspense, e a tela inicial mostra o progresso.

## Decisões

- **Uma cena contínua** em vez de cenas separadas: a câmera atravessa a porta de verdade,
  sem tela de carregamento entre fachada e salão.
- **Texturas e modelos procedurais** nesta fase: nada de modelos ou rostos inventados. Quando
  houver fotos/digitalizações reais dos instrumentos e do lugar (fotogrametria, GLB com
  Draco/KTX2), eles substituem as peças geométricas uma a uma.
- **Piano sintetizado (FM)**: o blueprint pede amostras reais quando disponíveis. Basta trocar
  o `PolySynth` por um `Tone.Sampler` apontando para gravações licenciadas.
- **Sem Supabase ainda**: o formato do `acervo.json` segue o esquema em
  `docs/supabase-schema.sql`; a troca é só reescrever `loadAcervo()`.
- **Fallback**: sem WebGL 2, a página oferece o modo clássico.
