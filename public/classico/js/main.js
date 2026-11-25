import { CONFIG } from './config.js';
import { AsciiEngine } from './ascii-engine.js';
import { startCodePanel } from './code-panel.js';
import { makePortrait } from './placeholders.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const isVideo = (src, type) => type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(src) || /^video\//.test(type || '');
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function loadMedia(src, type) {
  return new Promise((resolve, reject) => {
    if (isVideo(src, type)) {
      const v = document.createElement('video');
      Object.assign(v, { src, muted: true, loop: true, playsInline: true, autoplay: true, crossOrigin: 'anonymous' });
      v.addEventListener('loadeddata', () => { v.play().catch(() => {}); resolve(v); }, { once: true });
      v.addEventListener('error', reject, { once: true });
    } else {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }
  });
}

// ---------------------------------------------------------------- textos

function fillContent() {
  document.title = `${CONFIG.banda} — ${CONFIG.anos.replace(/\s/g, '')}`;
  $('#selo').textContent = CONFIG.selo;
  $('#chamada').textContent = CONFIG.chamada;
  document.querySelectorAll('[data-banda]').forEach((n) => (n.textContent = CONFIG.banda));
  $('#anos').textContent = CONFIG.anos;
  $('#epigrafe').textContent = CONFIG.epigrafe;
  $('#handle').textContent = CONFIG.instagram;
  $('#homenagem-texto').textContent = CONFIG.homenagem;

  const hist = $('#historia-texto');
  CONFIG.historia.forEach((p) => hist.append(el('p', null, p)));

  const tl = $('#timeline');
  CONFIG.linhaDoTempo.forEach((e) => {
    const li = el('li', 'reveal');
    li.append(el('span', 'tl-ano', e.ano), el('h3', null, e.titulo), el('p', null, e.texto));
    tl.append(li);
  });

  const list = $('#musicas-lista');
  CONFIG.musicas.forEach((m, i) => {
    const li = el('li', 'reveal');
    const btn = el('button', 'track');
    btn.type = 'button';
    btn.disabled = !m.audio;
    btn.innerHTML = `<span class="track-n">${String(i + 1).padStart(2, '0')}</span>`;
    btn.append(el('span', 'track-t', m.titulo), el('span', 'track-nota', m.audio ? m.nota : `${m.nota} · sem áudio ainda`));
    if (m.audio) btn.addEventListener('click', () => playTrack(m, btn));
    li.append(btn);
    list.append(li);
  });
}

// ---------------------------------------------------------------- hero

let hero;
const heroState = { reveal: 0, revealStart: 0, fpsT: 0, fpsN: 0, fps: 60, visible: true, t0: performance.now() };

async function setupHero() {
  const canvas = $('#hero-canvas');
  try {
    hero = new AsciiEngine(canvas, { focus: CONFIG.hero.focus || [0.5, 0.5], stars: 0.9 });
    hero.set({ align: [innerWidth > 900 ? 0.78 : 0.5, 0.5] });
  } catch (e) {
    console.warn(e);
    document.body.classList.add('no-webgl');
    $('#hero-fallback').src = CONFIG.hero.src;
    return;
  }
  hero.countLetters = true;
  const resize = () => {
    hero.dpr = Math.min(window.devicePixelRatio || 1, 2);
    hero.set({ cellHeight: currentCell(), align: [innerWidth > 900 ? 0.78 : 0.5, 0.5] });
    hero.resize();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  setHeroSource(await loadMedia(CONFIG.hero.src));

  const sec = $('#hero');
  sec.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    hero.setMouse(e.clientX - r.left, e.clientY - r.top, true);
  });
  sec.addEventListener('pointerleave', () => hero.mouse.target = 0);
  new IntersectionObserver(([en]) => (heroState.visible = en.isIntersecting)).observe(sec);

  setupControls();
  setupDrop(sec);
  requestAnimationFrame(loop);
}

function setHeroSource(src) {
  hero.setSource(src);
  heroState.revealStart = performance.now();
  heroState.reveal = reduced ? 1 : 0;
}

function currentCell() {
  const d = +$('#ctl-densidade').value;
  const base = innerWidth < 700 ? 5 : 6;
  return Math.round(base + ((100 - d) / 100) * 10);
}

function loop(now) {
  requestAnimationFrame(loop);
  heroState.fpsN++;
  if (now - heroState.fpsT > 500) {
    heroState.fps = Math.round((heroState.fpsN * 1000) / (now - heroState.fpsT));
    heroState.fpsT = now;
    heroState.fpsN = 0;
    const { cols, rows } = hero.grid;
    $('#hud-letras').textContent = hero.letters.toLocaleString('pt-BR');
    $('#hud-grade').textContent = `${cols}×${rows}`;
    document.querySelectorAll('.hud-fps').forEach((n) => (n.textContent = heroState.fps));
  }
  if (!heroState.visible || document.hidden) return;
  const t = (now - heroState.t0) / 1000;

  if (heroState.reveal < 1) heroState.reveal = Math.min(1, (now - heroState.revealStart) / 3600);
  hero.opts.reveal = easeInOut(heroState.reveal);
  hero.opts.pulse = audioLevel();
  hero.render(t);
  $('#hud-t').textContent = t.toFixed(2) + 's';
}

function setupControls() {
  $('#ctl-densidade').addEventListener('input', () => hero.set({ cellHeight: currentCell() }));
  document.querySelectorAll('[data-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-mode]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      hero.set({ mode: b.dataset.mode });
      $('#hud-modo').textContent = b.textContent.trim();
      gallery.forEach((g) => (g.done = false));
      galleryEngine?.set({ mode: b.dataset.mode });
    })
  );
  $('#ctl-bordas').addEventListener('change', (e) => hero.set({ edges: e.target.checked }));
  $('#ctl-replay').addEventListener('click', () => setHeroSource(hero.source));
  $('#ctl-arquivo').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) useLocalFile(f);
  });
}

async function useLocalFile(file) {
  const url = URL.createObjectURL(file);
  try {
    hero.set({ focus: [0.5, 0.5] });
    setHeroSource(await loadMedia(url, file.type));
  } catch {
    alert('Não consegui abrir esse arquivo. Tente JPG, PNG, WEBP ou MP4.');
  }
}

function setupDrop(target) {
  ['dragenter', 'dragover'].forEach((ev) =>
    target.addEventListener(ev, (e) => { e.preventDefault(); target.classList.add('dragging'); })
  );
  ['dragleave', 'drop'].forEach((ev) => target.addEventListener(ev, () => target.classList.remove('dragging')));
  target.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) useLocalFile(f);
  });
}

// ---------------------------------------------------------------- áudio

let audio, analyser, levels, smooth = 0;

function playTrack(m, btn) {
  if (!audio) {
    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    const ac = new AudioContext();
    analyser = ac.createAnalyser();
    analyser.fftSize = 512;
    levels = new Uint8Array(analyser.frequencyBinCount);
    ac.createMediaElementSource(audio).connect(analyser);
    analyser.connect(ac.destination);
    audio.addEventListener('ended', () => document.querySelectorAll('.track').forEach((b) => b.classList.remove('playing')));
    audio._ac = ac;
  }
  audio._ac.resume();
  const same = audio.dataset.src === m.audio;
  document.querySelectorAll('.track').forEach((b) => b.classList.remove('playing'));
  if (same && !audio.paused) return audio.pause();
  if (!same) {
    audio.src = m.audio;
    audio.dataset.src = m.audio;
  }
  audio.play();
  btn.classList.add('playing');
}

function audioLevel() {
  if (!analyser || audio.paused) return (smooth *= 0.9);
  analyser.getByteFrequencyData(levels);
  let s = 0;
  for (let i = 0; i < 40; i++) s += levels[i];
  const v = Math.max(0, s / (40 * 255) - 0.25) * 1.6;
  smooth += (v - smooth) * (v > smooth ? 0.5 : 0.08);
  return smooth;
}

// ---------------------------------------------------------------- cartões (integrantes + galeria)

let galleryEngine;
const gallery = [];

function setupCards() {
  try {
    galleryEngine = new AsciiEngine(document.createElement('canvas'), { cellHeight: 9, stars: 0, fit: 'cover' });
  } catch {
    galleryEngine = null;
  }

  const grid = $('#integrantes-grid');
  CONFIG.integrantes.forEach((p, i) => {
    const fig = el('figure', 'card member reveal');
    const media = el('div', 'card-media');
    fig.append(media);
    const cap = el('figcaption');
    cap.append(el('strong', null, p.nome), el('span', null, p.papel));
    if (p.nota) cap.append(el('em', null, p.nota));
    fig.append(cap);
    grid.append(fig);
    addCard(media, p.photo, 'image', p.photo ? null : makePortrait(i));
  });

  const gal = $('#galeria-grid');
  CONFIG.galeria.forEach((g) => {
    const fig = el('figure', 'card shot reveal');
    const media = el('div', 'card-media');
    fig.append(media, el('figcaption', null, g.legenda));
    gal.append(fig);
    addCard(media, g.src, g.type);
    fig.addEventListener('click', () => openLightbox(g));
  });

  if (!galleryEngine) return;
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      const item = gallery.find((g) => g.media === en.target);
      if (item) item.inView = en.isIntersecting;
      if (item && en.isIntersecting && item.start == null) item.start = performance.now();
    });
  }, { threshold: 0.25 });
  gallery.forEach((g) => io.observe(g.media));
  addEventListener('resize', () => gallery.forEach((g) => (g.done = false)));
  requestAnimationFrame(cardLoop);
}

async function addCard(media, src, type, generated) {
  const canvas = el('canvas', 'ascii');
  let photo;
  if (generated) {
    photo = el('img');
    photo.src = generated.toDataURL('image/jpeg', 0.85);
    photo.alt = 'foto ainda não adicionada';
  } else if (isVideo(src, type)) {
    photo = Object.assign(el('video'), { src, muted: true, loop: true, playsInline: true, preload: 'metadata' });
    media.addEventListener('pointerenter', () => photo.play().catch(() => {}));
    media.addEventListener('pointerleave', () => photo.pause());
  } else {
    photo = el('img');
    photo.src = src;
    photo.alt = '';
    photo.loading = 'lazy';
  }
  media.append(photo, canvas);
  const item = { media, canvas, source: generated || null, done: false, start: null, inView: false };
  gallery.push(item);
  if (!generated) {
    try { item.source = await loadMedia(src, type); } catch { /* fica só a foto */ }
    if (item.source instanceof HTMLVideoElement) item.source.pause();
  }
}

function cardLoop(now) {
  requestAnimationFrame(cardLoop);
  const t = now / 1000;
  for (const g of gallery) {
    if (!g.source || g.start == null || g.done) continue;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(g.media.clientWidth * dpr), h = Math.round(g.media.clientHeight * dpr);
    if (!w || !h) continue;
    if (g.canvas.width !== w || g.canvas.height !== h) Object.assign(g.canvas, { width: w, height: h });
    galleryEngine.dpr = dpr;
    if (galleryEngine.atlas.ch !== Math.round(9 * dpr)) galleryEngine.buildAtlas();
    const p = reduced ? 1 : Math.min(1, (now - g.start) / 2200);
    if (galleryEngine.renderInto(g.source, g.canvas, t, easeInOut(p)) && p >= 1) g.done = true;
  }
}

// ---------------------------------------------------------------- lightbox

function openLightbox(g) {
  const box = $('#lightbox');
  const slot = $('.lb-media', box);
  slot.innerHTML = '';
  const m = isVideo(g.src, g.type)
    ? Object.assign(el('video'), { src: g.src, controls: true, autoplay: true, playsInline: true })
    : Object.assign(el('img'), { src: g.src, alt: g.legenda });
  slot.append(m);
  $('.lb-cap', box).textContent = g.legenda;
  box.showModal();
}

// ---------------------------------------------------------------- scroll reveal

function setupReveal() {
  const io = new IntersectionObserver((ents) =>
    ents.forEach((en) => en.isIntersecting && (en.target.classList.add('in'), io.unobserve(en.target))),
    { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}

// ---------------------------------------------------------------- início

async function init() {
  fillContent();
  // espera a fonte monoespaçada para medir as letras corretamente
  await Promise.race([document.fonts.load('500 16px "JetBrains Mono"'), new Promise((r) => setTimeout(r, 1500))]);
  await setupHero();
  setupCards();
  setupReveal();
  startCodePanel($('#code-panel'), 'js/ascii-engine.js', { reduced });
  $('#lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox' || e.target.closest('.lb-close')) {
      $('#lightbox video')?.pause();
      $('#lightbox').close();
    }
  });
}

init();
