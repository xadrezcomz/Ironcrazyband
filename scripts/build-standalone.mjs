// Gera duas páginas HTML autocontidas, que abrem com dois cliques (sem servidor):
//   dist-standalone/iron-crazy-pub-3d.html     pub 3D (código, estilos, foto e acervo embutidos)
//   dist-standalone/iron-crazy-classico.html   modo clássico com a abertura em ASCII
// Uso: npm run build:standalone
// As fontes vêm do Google Fonts quando há internet; sem internet, usa fontes do sistema.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'dist-standalone');
const PUB = 'iron-crazy-pub-3d.html';
const CLASSIC = 'iron-crazy-classico.html';
const MAX_EMBED = 15 * 1024 * 1024; // vídeos/áudios maiores ficam de fora (o arquivo ficaria enorme)

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

/** Troca caminhos de mídia do acervo por data URLs. */
function embedMedia(p) {
  if (!p || /^(https?:|data:|blob:)/.test(p)) return p;
  const file = join(root, 'public', p);
  if (!existsSync(file)) {
    console.warn(`  ! não encontrado: ${p}`);
    return null;
  }
  if (statSync(file).size > MAX_EMBED) {
    console.warn(`  ! grande demais para embutir (${(statSync(file).size / 1e6).toFixed(1)} MB): ${p}`);
    return null;
  }
  const mime = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
}

function embeddedAcervo() {
  const a = JSON.parse(readFileSync(join(root, 'public/acervo.json'), 'utf8'));
  return {
    ...a,
    hero: { ...a.hero, src: embedMedia(a.hero.src) },
    integrantes: a.integrantes.map((m) => ({ ...m, photo: embedMedia(m.photo) })),
    musicas: a.musicas.map((m) => ({ ...m, audio: embedMedia(m.audio) })),
    galeria: a.galeria.map((g) => ({ ...g, src: embedMedia(g.src) })).filter((g) => g.src),
  };
}

/** JSON seguro para ir dentro de <script>. */
const inlineJson = (v) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const acervo = embeddedAcervo();
const acervoScript = `<script>window.__ACERVO__=${inlineJson(acervo)};</script>`;

// ------------------------------------------------------------------ pub 3D
console.log('→ pub 3D');
process.env.VITE_CLASSIC_URL = `./${CLASSIC}`;
await build({
  root,
  configFile: false,
  base: './',
  publicDir: false,
  logLevel: 'warn',
  plugins: [react(), viteSingleFile()],
  build: { outDir: join(out, 'tmp'), emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 10000 },
});
let pub = readFileSync(join(out, 'tmp/index.html'), 'utf8');
pub = pub.replace('<script type="module"', `${acervoScript}\n<script type="module"`);
writeFileSync(join(out, PUB), pub);
rmSync(join(out, 'tmp'), { recursive: true, force: true });

// ------------------------------------------------------------------ modo clássico
// Os módulos são pequenos e sem nomes repetidos: são unidos num único <script type="module">.
console.log('→ modo clássico');
const dir = join(root, 'public/classico');
const order = ['ascii-engine.js', 'code-panel.js', 'placeholders.js', 'config.js', 'main.js'];
const bundle = order
  .map((f) => {
    const src = readFileSync(join(dir, 'js', f), 'utf8')
      .replace(/^import .*;\s*$/gm, '')
      .replace(/^export (?=(const|let|class|function|async function) )/gm, '');
    return `// ---- ${f}\n${src}`;
  })
  .join('\n');
const engineSrc = readFileSync(join(dir, 'js/ascii-engine.js'), 'utf8');
const css = readFileSync(join(dir, 'css/style.css'), 'utf8');

let classic = readFileSync(join(dir, 'index.html'), 'utf8');
classic = classic
  .replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/main.js"></script>', '')
  .replaceAll('href="../"', `href="./${PUB}"`)
  .replace(
    '</body>',
    () => `${acervoScript}\n<script>window.__ENGINE_SRC__=${inlineJson(engineSrc)};</script>\n<script type="module">\n${bundle.replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`
  );
if (classic.includes('src="js/') || classic.includes('href="css/')) throw new Error('modo clássico ainda referencia arquivos externos');
writeFileSync(join(out, CLASSIC), classic);

for (const f of [PUB, CLASSIC]) console.log(`  ${f}  ${(statSync(join(out, f)).size / 1e6).toFixed(2)} MB`);
