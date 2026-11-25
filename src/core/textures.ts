// Texturas procedurais desenhadas em canvas: dispensam downloads até existirem
// fotos/digitalizações reais do lugar e dos instrumentos.

import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

/** Cópia que compartilha a imagem, com repetição própria. */
export function tiled(tex: THREE.Texture, rx: number, ry: number) {
  const t = tex.clone();
  t.repeat.set(rx, ry);
  t.needsUpdate = true;
  return t;
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, r: () => number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export const brickTexture = () =>
  make('brick', 512, 512, (ctx, w, h) => {
    const r = rng(7);
    ctx.fillStyle = '#3b2e26';
    ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, bh = h / rows, bw = w / cols, m = 5;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * bw * 0.5;
      for (let x = -1; x <= cols; x++) {
        const tone = 70 + r() * 45;
        const red = tone + 40 + r() * 20;
        ctx.fillStyle = `rgb(${red | 0},${(tone * 0.5) | 0},${(tone * 0.38) | 0})`;
        ctx.fillRect(x * bw + off + m / 2, y * bh + m / 2, bw - m, bh - m);
        // manchas de fuligem e desgaste
        for (let s = 0; s < 6; s++) {
          ctx.fillStyle = `rgba(20,12,8,${r() * 0.18})`;
          ctx.beginPath();
          ctx.arc(x * bw + off + r() * bw, y * bh + r() * bh, 4 + r() * 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    grain(ctx, w, h, 28, r);
  });

export const woodTexture = (tone: 'claro' | 'escuro' = 'claro') =>
  make(`wood-${tone}`, 512, 512, (ctx, w, h) => {
    const r = rng(tone === 'claro' ? 3 : 11);
    const base = tone === 'claro' ? [92, 60, 36] : [52, 33, 22];
    const planks = 6, pw = w / planks;
    for (let p = 0; p < planks; p++) {
      const k = 0.85 + r() * 0.3;
      ctx.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
      ctx.fillRect(p * pw, 0, pw, h);
      for (let g = 0; g < 26; g++) {
        ctx.strokeStyle = `rgba(25,14,8,${0.08 + r() * 0.18})`;
        ctx.lineWidth = 0.6 + r() * 1.6;
        ctx.beginPath();
        const x0 = p * pw + r() * pw;
        ctx.moveTo(x0, 0);
        for (let y = 0; y <= h; y += 32) ctx.lineTo(x0 + Math.sin(y * 0.02 + g) * 3 + (r() - 0.5) * 2, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(10,6,4,0.7)';
      ctx.fillRect(p * pw, 0, 2, h);
      const cut = r() * h;
      ctx.fillRect(p * pw, cut, pw, 2);
    }
    grain(ctx, w, h, 16, r);
  });

export const asphaltTexture = () =>
  make('asphalt', 256, 256, (ctx, w, h) => {
    const r = rng(5);
    ctx.fillStyle = '#1b1a1a';
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 40, r);
  });

/** Banner de fundo do palco (inspirado no tema do banner real: asas e o nome). */
export const bannerTexture = () =>
  make('banner', 1024, 512, (ctx, w, h) => {
    const r = rng(21);
    ctx.fillStyle = '#0d0b0b';
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w / 2, h * 0.62, 20, w / 2, h * 0.62, w * 0.45);
    glow.addColorStop(0, 'rgba(160,45,30,0.55)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // asas
    for (const side of [-1, 1]) {
      for (let f = 0; f < 9; f++) {
        ctx.save();
        ctx.translate(w / 2 + side * 120, h * 0.58);
        ctx.rotate(side * (-0.15 - f * 0.17));
        const len = 330 - f * 22;
        const g = ctx.createLinearGradient(0, 0, side * len, 0);
        g.addColorStop(0, '#9a948c');
        g.addColorStop(1, '#3a3632');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse((side * len) / 2, 0, len / 2, 16 + f, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 150px Oswald, Impact, "Arial Narrow", sans-serif';
    const tg = ctx.createLinearGradient(0, 60, 0, 220);
    tg.addColorStop(0, '#e4d8be');
    tg.addColorStop(0.45, '#b23b2f');
    tg.addColorStop(1, '#772529');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#120c0a';
    ctx.lineWidth = 10;
    ctx.strokeText('IRON CRAZY', w / 2, 145);
    ctx.fillText('IRON CRAZY', w / 2, 145);
    ctx.font = '500 34px Oswald, Impact, sans-serif';
    ctx.fillStyle = '#c49a5c';
    ctx.fillText('B  A  N  D   ·   E S T .   2 0 1 0', w / 2, h - 52);

    // desgaste
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(13,11,11,${r() * 0.5})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  });

/** Letreiro da fachada. */
export const signTexture = () =>
  make('sign', 1024, 384, (ctx, w, h) => {
    ctx.fillStyle = '#2a0f10';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c49a5c';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#efe3c8';
    ctx.font = '700 128px Oswald, Impact, "Arial Narrow", sans-serif';
    ctx.fillText('IRON CRAZY BAND', w / 2, 150);
    ctx.fillStyle = '#c49a5c';
    ctx.font = '500 40px Oswald, Impact, sans-serif';
    ctx.fillText('EST. 2010', w / 2, 248);
    ctx.font = '400 30px "JetBrains Mono", monospace';
    ctx.fillStyle = '#d9c9a6';
    ctx.fillText('ROCK • FRIENDSHIP • MEMORIES', w / 2, 306);
  });

/** Cartaz da linha do tempo, gerado a partir do acervo. */
export function posterTexture(items: { ano: string; titulo: string }[]) {
  const key = 'poster:' + items.map((i) => i.ano + i.titulo).join('|');
  return make(key, 512, 768, (ctx, w, h) => {
    const r = rng(9);
    ctx.fillStyle = '#e4d8be';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#772529';
    ctx.fillRect(0, 0, w, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e4d8be';
    ctx.font = '700 64px Oswald, Impact, sans-serif';
    ctx.fillText('LINHA DO TEMPO', w / 2, 98);
    ctx.textAlign = 'left';
    items.forEach((it, i) => {
      const y = 220 + i * 104;
      ctx.fillStyle = '#772529';
      ctx.font = '700 40px Oswald, Impact, sans-serif';
      ctx.fillText(it.ano, 44, y);
      ctx.fillStyle = '#38261d';
      ctx.font = '500 30px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(it.titulo, 44, y + 40);
    });
    ctx.fillStyle = '#38261d';
    ctx.font = '400 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('clique para abrir', w / 2, h - 34);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(80,50,30,${r() * 0.12})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  });
}

/** Etiqueta simples (ex.: "foto em breve"). */
export function labelTexture(text: string, sub = '') {
  return make('label:' + text + sub, 512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#17120f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c49a5c';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e4d8be';
    ctx.font = '600 44px Oswald, Impact, sans-serif';
    ctx.fillText(text, w / 2, h / 2);
    if (sub) {
      ctx.fillStyle = '#9a958a';
      ctx.font = '400 22px "JetBrains Mono", monospace';
      ctx.fillText(sub, w / 2, h / 2 + 44);
    }
  });
}

/** Pele frontal do bumbo. */
export const kickHeadTexture = () =>
  make('kickhead', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e9e2d2';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#772529';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e9e2d2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 92px Oswald, Impact, sans-serif';
    ctx.fillText('IRON', w / 2, h / 2 - 44);
    ctx.fillText('CRAZY', w / 2, h / 2 + 52);
  });
