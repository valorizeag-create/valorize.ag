import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('index.html', 'utf8');
const doc = new JSDOM(html).window.document;
const body = doc.body.textContent.replace(/\s+/g, ' ');
const text = (sel) => doc.querySelector(sel).textContent.replace(/\s+/g, ' ').trim();

const WA = 'https://wa.me/556294780968?text=Ol%C3%A1!%20Vim%20pelo%20Instagram%20e%20quero%20entender%20como%20a%20Valorize%20pode%20ajudar%20o%20meu%20neg%C3%B3cio.';

test('h1 do topo', () => assert.equal(text('h1'), 'Transformando marcas em histórias de sucesso.'));

test('subtítulo do topo', () =>
  assert.match(body, /Do planejamento à execução, somos o parceiro que entende o seu negócio e constrói com você uma marca forte, bem posicionada e lembrada\./));

test('7 serviços na ordem do spec', () =>
  assert.deepEqual(
    [...doc.querySelectorAll('.service__name')].map((e) => e.textContent.trim()),
    ['Planejamento estratégico de comunicação', 'Gestão de redes sociais', 'Artes e criativos', 'Produção de conteúdo e gravações', 'Tráfego pago', 'Branding e identidade visual', 'Sites e landing pages'],
  ));

test('5 dores, a primeira é "Não sei por onde começar"', () => {
  const t = [...doc.querySelectorAll('.pain__title')].map((e) => e.textContent.trim());
  assert.equal(t.length, 5);
  assert.equal(t[0], 'Não sei por onde começar');
});

test('os três botões de WhatsApp usam o link com a mensagem', () => {
  const wa = [...doc.querySelectorAll('a[href^="https://wa.me/"]')].map((a) => a.getAttribute('href'));
  assert.equal(wa.length, 3);
  wa.forEach((h) => assert.equal(h, WA));
  assert.equal(new URL(WA).searchParams.get('text'), 'Olá! Vim pelo Instagram e quero entender como a Valorize pode ajudar o meu negócio.');
});

test('instagram e e-mail', () => {
  assert.ok(doc.querySelector('a[href="https://instagram.com/valorize.ag"]'));
  assert.ok(doc.querySelector('a[href="mailto:valorize.ag@gmail.com"]'));
});

test('clientes oculto e contato numerado 004', () => {
  assert.ok(doc.querySelector('#clientes').hidden);
  assert.match(doc.querySelector('#contato').textContent, /004 — Contato/);
});

test('sem JS, todas as descrições de serviço estão visíveis', () => {
  const panels = doc.querySelectorAll('.service__panel');
  assert.equal(panels.length, 7);
  panels.forEach((p) => assert.equal(p.hidden, false));
});

test('sem copy de promessa do design antigo', () =>
  assert.doesNotMatch(body, /relatórios mensais de crescimento|Transformamos audiência em contato/));

test('sem runtime do Claude Design', () => assert.doesNotMatch(html, /support\.js|x-dc|\{\{/));

test('metadados', () => {
  const meta = (name) => doc.querySelector(`meta[name="${name}"]`)?.content;
  assert.equal(doc.title, 'Valorize | Agência de marketing');
  assert.equal(meta('description'), 'Do planejamento à execução: estratégia, redes sociais, criativos, gravações e tráfego pago para pequenas e médias empresas. Fale com a Valorize no WhatsApp.');
  assert.equal(doc.querySelector('meta[property="og:image"]')?.content, 'assets/og-image.png');
  assert.equal(doc.documentElement.lang, 'pt-BR');
});

test('fallback de overflow para iOS < 16 (Instagram in-app)', () => {
  const css = readFileSync('styles.css', 'utf8');
  assert.match(css, /body \{[^}]*overflow-x: hidden;[^}]*overflow-x: clip;/);
});

test('botão do cabeçalho abre o WhatsApp direto', () =>
  assert.equal(doc.querySelector('.topbar .btn-pill').getAttribute('href'), WA));
