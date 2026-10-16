import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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

test('os quatro botões de WhatsApp usam o link com a mensagem', () => {
  const wa = [...doc.querySelectorAll('a[href^="https://wa.me/"]:not(.service__cta)')].map((a) => a.getAttribute('href'));
  assert.equal(wa.length, 4);
  wa.forEach((h) => assert.equal(h, WA));
  assert.equal(new URL(WA).searchParams.get('text'), 'Olá! Vim pelo Instagram e quero entender como a Valorize pode ajudar o meu negócio.');
});

test('instagram e e-mail', () => {
  assert.ok(doc.querySelector('a[href="https://instagram.com/valorize.ag"]'));
  assert.ok(doc.querySelector('a[href="mailto:valorize.ag@gmail.com"]'));
});

test('depoimentos visíveis e contato numerado 005', () => {
  assert.equal(doc.querySelector('#clientes').hidden, false);
  assert.match(doc.querySelector('#clientes').textContent, /004 — Quem confia na Valorize/);
  assert.match(doc.querySelector('#contato').textContent, /005 — Contato/);
});

const DEPOIMENTOS = [
  ['Marcas Autoral', 'A Valorize trouxe mais estratégia e consistência para nossa comunicação digital.'],
  ['Tayná Lima Carvalho', 'Hoje temos conteúdos mais estratégicos e alinhados ao nosso posicionamento.'],
  ['Atlas Parafusos', 'A Valorize nos ajuda a modernizar nossa comunicação sem perder nossa essência.'],
  ['Plantax Agro S/A', 'Uma parceria que fortalece nossa presença digital e valoriza nossa marca.'],
  ['Climatiza Goiás', 'Mais organização, estratégia e profissionalismo na nossa comunicação.'],
];

test('5 depoimentos com nome e frase exatos, na ordem', () => {
  const cards = [...doc.querySelectorAll('.testimonial:not([aria-hidden])')];
  assert.deepEqual(
    cards.map((c) => [c.querySelector('.testimonial__name').textContent.trim(), c.querySelector('.testimonial__quote').textContent.trim()]),
    DEPOIMENTOS.map(([n, q]) => [n, `“${q}”`]),
  );
});

test('cada depoimento tem logo com alt ou iniciais', () => {
  doc.querySelectorAll('.testimonial').forEach((c) => {
    const img = c.querySelector('img.testimonial__logo');
    const initials = c.querySelector('.testimonial__initials');
    assert.ok(img || initials, c.textContent);
    if (img) {
      assert.ok(existsSync(img.getAttribute('src')), img.getAttribute('src'));
      assert.ok(img.alt.length > 0);
    }
  });
});

test('contato rápido no topo: WhatsApp, Instagram e e-mail', () => {
  const links = [...doc.querySelectorAll('#topo .quick-contact a')];
  assert.deepEqual(links.map((a) => a.getAttribute('href')), [WA, 'https://instagram.com/valorize.ag', 'mailto:valorize.ag@gmail.com']);
  links.forEach((a) => assert.ok(a.textContent.trim().length > 0));
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
  assert.equal(doc.querySelector('meta[property="og:image"]')?.content, 'https://valorizeag.vercel.app/assets/og-image.png');
  assert.equal(doc.querySelector('meta[property="og:url"]')?.content, 'https://valorizeag.vercel.app/');
  assert.equal(doc.querySelector('link[rel="canonical"]')?.href, 'https://valorizeag.vercel.app/');
  assert.equal(doc.documentElement.lang, 'pt-BR');
});

test('fallback de overflow para iOS < 16 (Instagram in-app)', () => {
  const css = readFileSync('styles.css', 'utf8');
  assert.match(css, /body \{[^}]*overflow-x: hidden;[^}]*overflow-x: clip;/);
});

test('botão do cabeçalho abre o WhatsApp direto', () =>
  assert.equal(doc.querySelector('.topbar .btn-pill').getAttribute('href'), WA));

test('reduzir movimento não desliga faixa, selo nem reveal (decisão da Valorize)', () => {
  const css = readFileSync('styles.css', 'utf8');
  assert.doesNotMatch(css, /prefers-reduced-motion/);
});

test('contato rápido tem o rótulo "Fale direto com a gente" e WhatsApp em destaque', () => {
  assert.equal(text('#topo .quick-contact__label'), 'Fale direto com a gente');
  const links = [...doc.querySelectorAll('#topo .quick-contact a')];
  assert.deepEqual(links.map((a) => a.textContent.trim()), ['WhatsApp', 'Instagram', 'E-mail']);
  assert.ok(links[0].classList.contains('contact-btn--accent'));
});

test('cada serviço tem botão "Quero saber sobre este serviço" com mensagem própria no WhatsApp', () => {
  const services = [...doc.querySelectorAll('.service')];
  assert.equal(services.length, 7);
  services.forEach((s) => {
    const name = s.querySelector('.service__name').textContent.trim();
    const cta = s.querySelector('.service__panel a.service__cta');
    assert.ok(cta, name);
    assert.equal(cta.textContent.trim(), 'Quero saber sobre este serviço');
    const url = new URL(cta.getAttribute('href'));
    assert.equal(url.origin + url.pathname, 'https://wa.me/556294780968');
    assert.equal(url.searchParams.get('text'), `Olá! Quero saber sobre ${name}.`);
  });
});
