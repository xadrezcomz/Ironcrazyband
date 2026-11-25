// code-panel.js — painel "editor" que digita o próprio código do motor ASCII.

const KEYWORDS = new Set(
  ('const let var function return if else for while class new this import export from of in ' +
   'async await try catch throw true false null uniform vec2 vec3 vec4 float int ivec2 void bool ' +
   'out precision highp sampler2D texture texelFetch mix clamp floor fract pow length smoothstep').split(' ')
);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function highlight(line) {
  const re = /(\/\/.*$)|(`[^`]*`?|'[^']*'|"[^"]*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g;
  let out = '', last = 0, m;
  while ((m = re.exec(line))) {
    out += esc(line.slice(last, m.index));
    const [tok, com, str, num, fn, word] = m;
    if (com) out += `<span class="t-com">${esc(tok)}</span>`;
    else if (str) out += `<span class="t-str">${esc(tok)}</span>`;
    else if (num) out += `<span class="t-num">${tok}</span>`;
    else if (fn) out += `<span class="${KEYWORDS.has(fn) ? 't-kw' : 't-fn'}">${tok}</span>`;
    else if (KEYWORDS.has(word)) out += `<span class="t-kw">${tok}</span>`;
    else out += esc(tok);
    last = m.index + tok.length;
  }
  return out + esc(line.slice(last));
}

export async function startCodePanel(root, url, { rows = 14, cps = 70, reduced = false } = {}) {
  const body = root.querySelector('.code-body');
  let src;
  try {
    src = window.__ENGINE_SRC__ ?? (await (await fetch(url)).text());
  } catch {
    root.hidden = true;
    return;
  }
  const lines = src.split('\n');
  const html = lines.map(highlight);
  let cur = Math.floor(Math.random() * Math.max(1, lines.length - rows)), typed = 0;

  function paint() {
    const start = Math.max(0, cur - rows + 4);
    let out = '';
    for (let i = start; i < start + rows && i < lines.length; i++) {
      const n = `<span class="ln">${i + 1}</span>`;
      if (i < cur) out += `<div class="row">${n}${html[i] || ' '}</div>`;
      else if (i === cur) {
        const partial = highlight(lines[i].slice(0, typed));
        out += `<div class="row cur">${n}${partial}<span class="caret"></span></div>`;
      } else out += `<div class="row"><span class="ln">${i + 1}</span></div>`;
    }
    body.innerHTML = out;
  }

  if (reduced) {
    typed = lines[cur].length;
    paint();
    return;
  }

  let acc = 0, prev = performance.now();
  function tick(now) {
    acc += ((now - prev) / 1000) * cps;
    prev = now;
    const steps = Math.floor(acc);
    if (steps > 0) {
      acc -= steps;
      typed += steps;
      // linhas em branco passam rápido; ao fim do arquivo, recomeça
      while (typed >= lines[cur].length) {
        typed -= lines[cur].length;
        cur = (cur + 1) % lines.length;
        if (cur === 0) typed = 0;
        if (lines[cur].trim()) break;
      }
      if (root.isConnected && !document.hidden) paint();
    }
    requestAnimationFrame(tick);
  }
  paint();
  requestAnimationFrame(tick);
}
