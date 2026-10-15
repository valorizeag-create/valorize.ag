import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { init } from '../main.js';

const html = readFileSync('index.html', 'utf8');

// Monta a página no jsdom com IntersectionObserver e matchMedia falsos.
function setup({ reducedMotion = false, belowFold = false } = {}) {
  const win = new JSDOM(html).window;
  const doc = win.document;
  const observers = [];
  win.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; this.targets = []; observers.push(this); }
    observe(el) { this.targets.push(el); }
    unobserve(el) { this.targets = this.targets.filter((t) => t !== el); }
    disconnect() { this.targets = []; }
  };
  win.matchMedia = (q) => ({ matches: reducedMotion && q.includes('prefers-reduced-motion'), media: q });
  if (belowFold) win.HTMLElement.prototype.getBoundingClientRect = () => ({ top: 5000 });
  init(doc, win);
  return { win, doc, observers };
}

const toggles = (doc) => [...doc.querySelectorAll('.service__toggle')];
const panel = (doc, b) => doc.getElementById(b.getAttribute('aria-controls'));
const icon = (b) => b.querySelector('.service__icon').textContent;

test('troca no-js por js', () => {
  const { doc } = setup();
  assert.ok(doc.documentElement.classList.contains('js'));
  assert.ok(!doc.documentElement.classList.contains('no-js'));
});

test('após init, todos os serviços começam fechados', () => {
  const { doc } = setup();
  toggles(doc).forEach((b) => {
    assert.equal(b.getAttribute('aria-expanded'), 'false');
    assert.equal(panel(doc, b).hidden, true);
    assert.equal(icon(b), '+');
  });
});

test('tocar abre um e fecha o anterior; tocar no aberto fecha', () => {
  const { doc } = setup();
  const [a, , c] = toggles(doc);
  a.click();
  c.click();
  assert.equal(panel(doc, a).hidden, true);
  assert.equal(a.getAttribute('aria-expanded'), 'false');
  assert.equal(panel(doc, c).hidden, false);
  assert.equal(c.getAttribute('aria-expanded'), 'true');
  assert.equal(icon(c), '–');
  c.click();
  assert.equal(panel(doc, c).hidden, true);
  assert.equal(icon(c), '+');
});

test('progresso acompanha a rolagem', () => {
  const { win, doc } = setup();
  const root = doc.documentElement;
  Object.defineProperty(root, 'scrollHeight', { value: 2000, configurable: true });
  Object.defineProperty(root, 'clientHeight', { value: 1000, configurable: true });
  root.scrollTop = 500;
  win.dispatchEvent(new win.Event('scroll'));
  assert.equal(doc.querySelector('[data-progress]').style.width, '50%');
});

test('reveal: abaixo da dobra fica pendente e é liberado ao entrar na tela', () => {
  const { doc, observers } = setup({ belowFold: true });
  const pending = [...doc.querySelectorAll('.is-pending')];
  assert.equal(pending.length, doc.querySelectorAll('[data-reveal]').length);
  const io = observers[0];
  io.cb([{ isIntersecting: true, target: pending[0] }]);
  assert.ok(!pending[0].classList.contains('is-pending'));
  assert.ok(!io.targets.includes(pending[0]));
});

test('reveal: acima da dobra não fica pendente', () => {
  const { doc } = setup();
  assert.equal(doc.querySelectorAll('.is-pending').length, 0);
});

test('reduzir movimento ligado: as animações de aparecer continuam (decisão da Valorize)', () => {
  const { doc } = setup({ reducedMotion: true, belowFold: true });
  assert.equal(doc.querySelectorAll('.is-pending').length, doc.querySelectorAll('[data-reveal]').length);
});

test('abrir um serviço não faz a lista pular: o botão tocado fica no lugar', () => {
  const { win, doc } = setup();
  const [a, , c] = toggles(doc);
  a.click();
  const tops = [500, 200]; // antes e depois da troca: o item fechado acima encolheu
  c.getBoundingClientRect = () => ({ top: tops.shift() ?? 200 });
  const calls = [];
  win.scrollBy = (x, y) => calls.push([x, y]);
  c.click();
  assert.deepEqual(calls, [[0, -300]]);
});

test('abrir um serviço atualiza a barra de progresso', () => {
  const { doc } = setup();
  const bar = doc.querySelector('[data-progress]');
  bar.style.width = '37%';
  toggles(doc)[0].click();
  assert.equal(bar.style.width, '0%');
});

test('depoimentos: com JS a faixa é duplicada para rodar em loop, cópias escondidas do leitor de tela', () => {
  const { doc } = setup();
  const track = doc.querySelector('.testimonials__track');
  const items = [...track.children];
  assert.equal(items.length, 10);
  assert.ok(doc.querySelector('.testimonials').classList.contains('is-marquee'));
  items.slice(0, 5).forEach((li) => assert.equal(li.getAttribute('aria-hidden'), null));
  items.slice(5).forEach((li) => {
    assert.equal(li.getAttribute('aria-hidden'), 'true');
    li.querySelectorAll('img').forEach((img) => assert.equal(img.getAttribute('alt'), ''));
  });
});
