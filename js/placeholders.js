// placeholders.js — retratos gerados enquanto as fotos reais não chegam.

const HUES = [28, 356, 38, 8, 20, 345]; // âmbar e vermelho, como luz de palco de pub

export function makePortrait(index, label = '') {
  const w = 480, h = 600;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const hue = HUES[index % HUES.length];

  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, w, h);

  // luz de palco atrás da silhueta
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.42, w * 0.75);
  g.addColorStop(0, `hsla(${hue}, 90%, 62%, 1)`);
  g.addColorStop(0.45, `hsla(${hue + 6}, 75%, 32%, 0.55)`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // feixe de cima
  ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(0, 0, 0, h);
  beam.addColorStop(0, `hsla(${hue + 8}, 90%, 72%, 0.35)`);
  beam.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(w * 0.42, 0);
  ctx.lineTo(w * 0.58, 0);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // silhueta (cabeça e ombros)
  ctx.fillStyle = '#030304';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.4, w * 0.15, h * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h);
  ctx.bezierCurveTo(w * 0.08, h * 0.7, w * 0.3, h * 0.62, w * 0.5, h * 0.62);
  ctx.bezierCurveTo(w * 0.7, h * 0.62, w * 0.92, h * 0.7, w * 0.94, h);
  ctx.fill();
  ctx.fillRect(w * 0.43, h * 0.5, w * 0.14, h * 0.14);

  if (label) {
    ctx.fillStyle = `hsla(${hue}, 60%, 85%, 0.9)`;
    ctx.font = '600 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, w * 0.5, h * 0.88);
  }
  return c;
}
