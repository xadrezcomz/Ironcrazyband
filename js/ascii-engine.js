// ascii-engine.js
// Renderizador ASCII em tempo real (WebGL2).
// Cada célula da grade vira um caractere: a luminosidade escolhe a "densidade"
// do glifo, o gradiente (Sobel) desenha as bordas com / \ | _ e a cor vem da
// própria foto ou vídeo. Tudo roda na GPU, a 60 fps.

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// passo 1: reduz a imagem para uma textura do tamanho da grade (1 texel = 1 letra)
const CELL_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uSrc;
uniform vec2  uGrid;       // colunas, linhas
uniform vec2  uGridPx;     // tamanho da grade em pixels
uniform vec4  uFit;        // escala.xy, deslocamento.xy
uniform vec2  uMouse;      // posição do mouse (uv da grade)
uniform float uMouseOn;
uniform float uMouseR;
out vec4 o;

vec3 sampleSrc(vec2 uv) {
  uv = uv * uFit.xy + uFit.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec3(0.0);
  // bordas da foto se dissolvem no escuro, sem moldura dura
  vec2 e = smoothstep(vec2(0.0), vec2(0.06), uv) * smoothstep(vec2(0.0), vec2(0.06), 1.0 - uv);
  return texture(uSrc, vec2(uv.x, 1.0 - uv.y)).rgb * e.x * e.y;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  vec2 p = (cell + 0.5) / uGrid;

  // lente: o cursor amplia a memória que está embaixo dele
  vec2 d = (p - uMouse) * uGridPx;
  float f = exp(-dot(d, d) / (uMouseR * uMouseR)) * uMouseOn;
  vec2 off = (p - uMouse) * f * 0.35;

  vec3 acc = vec3(0.0);
  for (int j = 0; j < 3; j++)
    for (int i = 0; i < 3; i++)
      acc += sampleSrc((cell + (vec2(i, j) + 0.5) / 3.0) / uGrid - off);
  acc /= 9.0;
  o = vec4(acc, dot(acc, vec3(0.2126, 0.7152, 0.0722)));
}`;

// passo 2: desenha as letras na tela
const GLYPH_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uCells;
uniform sampler2D uAtlas;
uniform vec2  uGrid;
uniform vec2  uCellPx;
uniform vec2  uOrigin;
uniform float uGlyphCount;
uniform float uRampLen;
uniform float uEdgeStart;
uniform float uStarStart;
uniform float uTime;
uniform float uReveal;
uniform float uEdge;
uniform float uExposure;
uniform float uGamma;
uniform float uSat;
uniform float uPulse;
uniform float uStars;
uniform int   uMode;
uniform vec3  uTint;
uniform vec3  uBg;
uniform vec2  uMouse;
uniform float uMouseR;
uniform float uMouseOn;
uniform int   uDebug;
uniform float uCellBg;
out vec4 o;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float lum(ivec2 c) {
  c = clamp(c, ivec2(0), ivec2(uGrid) - 1);
  return texelFetch(uCells, c, 0).a;
}
float glyph(float idx, vec2 local) {
  return texture(uAtlas, vec2((idx + local.x) / uGlyphCount, 1.0 - local.y)).r;
}

void main() {
  vec2 px = gl_FragCoord.xy - uOrigin;
  vec2 cell = floor(px / uCellPx);
  if (px.x < 0.0 || px.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) {
    o = vec4(uBg, 1.0);
    return;
  }
  vec2 local = fract(px / uCellPx);
  ivec2 ic = ivec2(cell);
  vec4 c = texelFetch(uCells, ic, 0);
  if (uDebug == 1) { o = vec4(c.rgb, 1.0); return; }

  float l = pow(clamp(c.a * uExposure, 0.0, 1.0), uGamma);
  l = clamp(l * (1.0 + uPulse * 0.7) + uPulse * 0.03, 0.0, 1.0);

  // revelação: cada letra chega na sua vez, de cima para baixo, embaralhada
  float rnd = hash(cell);
  float order = mix(rnd, 1.0 - cell.y / uGrid.y, 0.55);
  const float W = 0.18;
  float s = clamp((uReveal * (1.0 + W) - order) / W, 0.0, 1.0);

  vec2 cc = (cell + 0.5) * uCellPx + uOrigin;
  float mf = uMouseOn * smoothstep(1.0, 0.0, length(cc - uMouse) / uMouseR);

  float gi = floor(l * (uRampLen - 0.001));
  bool edge = false;
  if (uEdge < 5.0 && l > 0.1) {
    float tl = lum(ic + ivec2(-1, 1)), t = lum(ic + ivec2(0, 1)), tr = lum(ic + ivec2(1, 1));
    float lf = lum(ic + ivec2(-1, 0)),                             rt = lum(ic + ivec2(1, 0));
    float bl = lum(ic + ivec2(-1,-1)), b = lum(ic + ivec2(0,-1)), br = lum(ic + ivec2(1,-1));
    float gx = (tr + 2.0 * rt + br) - (tl + 2.0 * lf + bl);
    float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
    if (length(vec2(gx, gy)) > uEdge) {
      float a = mod(atan(gy, gx), 3.14159265);
      gi = uEdgeStart + mod(floor(a / 0.78539816 + 0.5), 4.0);   // | \\ _ /
      edge = true;
    }
  }

  bool revealing = s > 0.0 && s < 1.0;
  bool scramble = revealing || hash(cell + floor(uTime * 20.0)) < mf * 0.55;
  if (scramble) gi = 1.0 + floor(hash(cell * 1.3 + floor(uTime * 24.0)) * (uRampLen - 1.0));

  vec3 col;
  if (uMode == 0) {
    col = c.rgb;
    float y = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = clamp(mix(vec3(y), col, uSat), 0.0, 1.0);
    float mx = max(max(col.r, col.g), col.b);
    vec3 vivid = col / max(mx, 1e-3);
    col = mix(col, vivid, 0.5) * (0.55 + 0.75 * l);
  } else {
    col = uTint * (0.35 + 0.85 * l);
  }
  if (edge) col *= 1.15;
  if (revealing) col = mix(col, vec3(1.0), 0.55 * (1.0 - s));
  col = mix(col, vec3(1.0), mf * 0.3);

  float vis = s > 0.0 ? 1.0 : 0.0;

  // céu estrelado nas áreas vazias
  if (l < 0.05 && uStars > 0.0 && !scramble) {
    float st = hash(cell * 0.731 + 17.0);
    if (st > 0.985) {
      float tw = 0.5 + 0.5 * sin(uTime * (1.0 + st * 3.0) + st * 60.0);
      gi = uStarStart + mod(floor(st * 1000.0), 3.0);
      col = vec3(0.55, 0.62, 0.85) * (0.2 + 0.8 * tw) * uStars;
    }
  }

  float a = glyph(gi, local);
  o = vec4(uBg + c.rgb * uCellBg * vis + col * a * vis, 1.0);
}`;

const RAMP_CANDIDATES =
  " .'`^\",:;Il!i><~+-?][}{1)(tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const EDGE_GLYPHS = ['|', '\\', '_', '/'];
const STAR_GLYPHS = ['+', '*', '.'];

const TINTS = {
  color: [1, 1, 1],
  mono: [0.55, 0.95, 0.7],
  ouro: [1.0, 0.76, 0.4],
  sepia: [0.92, 0.8, 0.64],
};

export const DEFAULTS = {
  cellHeight: 13,       // altura da letra em px CSS
  mode: 'color',        // color | mono | ouro | sepia
  edges: true,
  edgeThreshold: 1.6,
  exposure: 1.15,
  gamma: 1.0,
  saturation: 1.5,
  fit: 'auto',          // auto | cover | contain
  focus: [0.5, 0.5],    // ponto de foco ao recortar (0..1)
  align: [0.5, 0.5],    // posição da imagem quando ela cabe inteira (contain)
  reveal: 1,
  stars: 1,
  pulse: 0,
  cellBackground: 0.07, // quanto da cor original aparece atrás de cada letra
  background: [0.016, 0.02, 0.03],
  mouseRadius: 140,     // px CSS
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

export class AsciiEngine {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.opts = { ...DEFAULTS, ...opts };
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 indisponível');
    this.gl = gl;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.mouse = { x: -1e4, y: -1e4, on: 0, target: 0 };
    this.textures = new WeakMap();
    this.letters = 0;
    this._frame = 0;
    this._grid = { cols: 0, rows: 0 };

    this.cellProg = this._program(VERT, CELL_FRAG);
    this.glyphProg = this._program(VERT, GLYPH_FRAG);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.cellTex = this._tex(gl.NEAREST);
    this.fbo = gl.createFramebuffer();
    this.atlasTex = this._tex(gl.NEAREST);
    this.buildAtlas();
  }

  // ---------- configuração ----------

  set(opts) {
    const rebuild = 'cellHeight' in opts || 'fontFamily' in opts;
    Object.assign(this.opts, opts);
    if (rebuild) this.buildAtlas();
  }

  setSource(el) {
    this.source = el;
    this.dynamic = el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement;
  }

  setMouse(xCss, yCss, inside) {
    this.mouse.x = xCss * this.dpr;
    this.mouse.y = this.canvas.height - yCss * this.dpr;
    this.mouse.target = inside ? 1 : 0;
  }

  resize(wCss, hCss) {
    const w = Math.max(1, Math.round((wCss ?? this.canvas.clientWidth) * this.dpr));
    const h = Math.max(1, Math.round((hCss ?? this.canvas.clientHeight) * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  // ---------- atlas de glifos ----------
  // As letras são desenhadas numa faixa de textura, ordenadas pela quantidade
  // de "tinta" que cada uma usa — assim a rampa de densidade é medida, não chutada.

  buildAtlas() {
    const gl = this.gl;
    const ch = Math.max(6, Math.round(this.opts.cellHeight * this.dpr));
    const fontPx = Math.round(ch * 0.86);
    const font = `500 ${fontPx}px ${this.opts.fontFamily}`;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = font;
    const cw = Math.max(3, Math.round(ctx.measureText('M').width));

    const draw = (glyphs) => {
      c.width = cw * glyphs.length;
      c.height = ch;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#fff';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      glyphs.forEach((g, i) => ctx.fillText(g, i * cw + cw / 2, ch / 2 + fontPx * 0.04));
    };

    const candidates = [...new Set(RAMP_CANDIDATES)];
    draw(candidates);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const cover = candidates.map((g, i) => {
      let sum = 0;
      for (let y = 0; y < ch; y++)
        for (let x = i * cw; x < (i + 1) * cw; x++) sum += data[(y * c.width + x) * 4];
      return { g, sum };
    });
    cover.sort((a, b) => a.sum - b.sum);
    // escolhe ~24 glifos com degraus de tinta iguais, do espaço ao mais denso
    const max = cover[cover.length - 1].sum || 1;
    const ramp = [];
    const STEPS = 24;
    for (let k = 0; k < STEPS; k++) {
      const target = (k / (STEPS - 1)) * max;
      let best = cover[0];
      for (const o of cover) if (Math.abs(o.sum - target) < Math.abs(best.sum - target)) best = o;
      if (!ramp.includes(best.g)) ramp.push(best.g);
    }
    const glyphs = [...ramp, ...EDGE_GLYPHS, ...STAR_GLYPHS];
    draw(glyphs);

    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);

    this.atlas = {
      cw, ch,
      count: glyphs.length,
      rampLen: ramp.length,
      edgeStart: ramp.length,
      starStart: ramp.length + EDGE_GLYPHS.length,
    };
  }

  // ---------- render ----------

  render(time = performance.now() / 1000) {
    const gl = this.gl;
    const src = this.source;
    if (!src || !this._sourceReady(src)) return false;

    const W = this.canvas.width, H = this.canvas.height;
    const { cw, ch } = this.atlas;
    const cols = Math.max(1, Math.floor(W / cw));
    const rows = Math.max(1, Math.floor(H / ch));
    if (cols !== this._grid.cols || rows !== this._grid.rows) {
      this._grid = { cols, rows };
      gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.cellTex, 0);
      this._pixels = new Uint8Array(cols * rows * 4);
    }
    const origin = [Math.floor((W - cols * cw) / 2), Math.floor((H - rows * ch) / 2)];

    // suaviza a entrada/saída do cursor
    this.mouse.on += (this.mouse.target - this.mouse.on) * 0.12;

    const srcTex = this._uploadSource(src);
    const [sw, sh] = this._sourceSize(src);
    const fit = this._fit(sw / sh, (cols * cw) / (rows * ch));
    const o = this.opts;

    // passo 1
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(this.cellProg.p);
    const U1 = this.cellProg.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(U1('uSrc'), 0);
    gl.uniform2f(U1('uGrid'), cols, rows);
    gl.uniform2f(U1('uGridPx'), cols * cw, rows * ch);
    gl.uniform4f(U1('uFit'), ...fit);
    gl.uniform2f(U1('uMouse'), (this.mouse.x - origin[0]) / (cols * cw), (this.mouse.y - origin[1]) / (rows * ch));
    gl.uniform1f(U1('uMouseOn'), this.mouse.on);
    gl.uniform1f(U1('uMouseR'), o.mouseRadius * this.dpr * 0.8);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (this.countLetters && this._frame++ % 30 === 0) this._count(cols, rows);

    // passo 2
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.glyphProg.p);
    const U = this.glyphProg.u;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.cellTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTex);
    gl.uniform1i(U('uCells'), 0);
    gl.uniform1i(U('uAtlas'), 1);
    gl.uniform2f(U('uGrid'), cols, rows);
    gl.uniform2f(U('uCellPx'), cw, ch);
    gl.uniform2f(U('uOrigin'), origin[0], origin[1]);
    gl.uniform1f(U('uGlyphCount'), this.atlas.count);
    gl.uniform1f(U('uRampLen'), this.atlas.rampLen);
    gl.uniform1f(U('uEdgeStart'), this.atlas.edgeStart);
    gl.uniform1f(U('uStarStart'), this.atlas.starStart);
    gl.uniform1f(U('uTime'), time);
    gl.uniform1f(U('uReveal'), o.reveal);
    gl.uniform1f(U('uEdge'), o.edges ? o.edgeThreshold : 99);
    gl.uniform1f(U('uExposure'), o.exposure);
    gl.uniform1f(U('uGamma'), o.gamma);
    gl.uniform1f(U('uSat'), o.saturation);
    gl.uniform1f(U('uPulse'), o.pulse);
    gl.uniform1f(U('uStars'), o.stars);
    gl.uniform1i(U('uMode'), o.mode === 'color' ? 0 : 1);
    gl.uniform3f(U('uTint'), ...(TINTS[o.mode] || TINTS.color));
    gl.uniform3f(U('uBg'), ...o.background);
    gl.uniform2f(U('uMouse'), this.mouse.x, this.mouse.y);
    gl.uniform1f(U('uMouseR'), o.mouseRadius * this.dpr);
    gl.uniform1f(U('uMouseOn'), this.mouse.on);
    gl.uniform1i(U('uDebug'), this.debug ? 1 : 0);
    gl.uniform1f(U('uCellBg'), o.cellBackground);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  // Desenha um quadro desta engine dentro de outro canvas 2D (para cartões e galeria).
  renderInto(source, target, time, reveal = 1) {
    this.setSource(source);
    this.opts.reveal = reveal;
    if (this.canvas.width !== target.width || this.canvas.height !== target.height) {
      this.canvas.width = target.width;
      this.canvas.height = target.height;
    }
    if (!this.render(time)) return false;
    const ctx = target.getContext('2d');
    ctx.drawImage(this.canvas, 0, 0);
    return true;
  }

  get grid() { return this._grid; }

  // ---------- internos ----------

  _count(cols, rows) {
    const gl = this.gl;
    gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, this._pixels);
    const thr = 255 * Math.pow(1 / this.atlas.rampLen, 1 / this.opts.gamma) / this.opts.exposure;
    let n = 0;
    for (let i = 3; i < this._pixels.length; i += 4) if (this._pixels[i] > thr) n++;
    this.letters = Math.round(n * Math.min(1, this.opts.reveal));
  }

  _fit(srcAspect, dstAspect) {
    let mode = this.opts.fit;
    if (mode === 'auto') {
      const ratio = srcAspect > dstAspect ? srcAspect / dstAspect : dstAspect / srcAspect;
      mode = ratio > 1.7 ? 'contain' : 'cover';
    }
    let sx = 1, sy = 1;
    if (mode === 'cover') {
      if (srcAspect > dstAspect) sx = dstAspect / srcAspect; else sy = srcAspect / dstAspect;
    } else {
      if (srcAspect > dstAspect) sy = srcAspect / dstAspect; else sx = dstAspect / srcAspect;
    }
    const [fx, fy] = mode === 'cover' ? this.opts.focus : this.opts.align;
    const ox = (1 - sx) * fx;
    const oy = (1 - sy) * (1 - fy);
    return [sx, sy, ox, oy];
  }

  _sourceReady(src) {
    if (src instanceof HTMLVideoElement) return src.readyState >= 2;
    if (src instanceof HTMLImageElement) return src.complete && src.naturalWidth > 0;
    return true;
  }

  _sourceSize(src) {
    if (src instanceof HTMLVideoElement) return [src.videoWidth, src.videoHeight];
    if (src instanceof HTMLImageElement) return [src.naturalWidth, src.naturalHeight];
    return [src.width, src.height];
  }

  _uploadSource(src) {
    const gl = this.gl;
    let t = this.textures.get(src);
    const fresh = !t;
    if (fresh) {
      t = this._tex(gl.LINEAR);
      this.textures.set(src, t);
    }
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (fresh || this.dynamic) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    return t;
  }

  _tex(filter) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  _program(vs, fs) {
    const gl = this.gl;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const cache = {};
    return { p, u: (n) => (n in cache ? cache[n] : (cache[n] = gl.getUniformLocation(p, n))) };
  }
}
