import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Acervo } from '../src/data/acervo';

const acervo = JSON.parse(readFileSync(new URL('../public/acervo.json', import.meta.url), 'utf8')) as Acervo;

describe('acervo compartilhado', () => {
  it('tem os seis integrantes do blueprint', () => {
    expect(acervo.integrantes.map((m) => m.nome)).toEqual(['Edy', 'Fhellipe', 'Alessandro', 'Messias', 'Diego Lorenzo', 'Carlão']);
  });
  it('período 2010–2026', () => {
    expect(acervo.anos).toMatch(/2010\s*—\s*2026/);
  });
  it('não se apresenta como despedida definitiva', () => {
    const texto = JSON.stringify(acervo).toLowerCase();
    for (const proibido of ['despedida', 'último show', 'fim da banda', 'em memória']) expect(texto).not.toContain(proibido);
  });
  it('não usa fotos geradas para integrantes (só arquivos do acervo ou nada)', () => {
    for (const m of acervo.integrantes) if (m.photo) expect(m.photo).toMatch(/^acervo\//);
  });
});

describe('motor ASCII', () => {
  it('a cópia usada pelo pub 3D é idêntica à do modo clássico', () => {
    const a = readFileSync(new URL('../src/core/ascii/AsciiEngine.js', import.meta.url), 'utf8');
    const b = readFileSync(new URL('../public/classico/js/ascii-engine.js', import.meta.url), 'utf8');
    expect(a).toBe(b);
  });
});
