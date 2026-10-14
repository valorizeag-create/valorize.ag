# Landing page Valorize (link da bio) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicável localmente: uma página estática única (HTML/CSS/JS puro) que reproduz o design `Valorize Link na Bio v2` com a copy aprovada.

**Architecture:** Três arquivos de página (`index.html`, `styles.css`, `main.js`) sem framework e sem o runtime `support.js` do Claude Design. Os estilos inline do design viram classes em `styles.css`; a lógica do componente (`DCLogic`) vira JS puro em `main.js`. As imagens do design são redimensionadas e convertidas para WebP uma única vez por um script Node.

**Tech Stack:** HTML5, CSS, JavaScript (ES2020, sem build). Dev only: Node 24 (`node:test`), `jsdom` (testes de DOM), `sharp` (otimização de imagens).

**Spec:** `docs/2026-10-14-landing-page-valorize-design.md`

**Design de referência:** `C:\Users\Joaov\Downloads\Landing page Valorize.zip` → arquivo `Valorize Link na Bio v2.dc.html` + `assets/`.

## Global Constraints

- Toda a copy visível vem **literalmente** da seção 4 do spec (acentos, pontuação e maiúsculas incluídos). Nada de texto novo.
- Visual segue o design v2: fonte `"Helvetica Neue",Helvetica,Arial,sans-serif`; cores `#f5f5f5` (fundo), `#1b1b1b` (texto/botões), `#213140` (azul escuro), `#65d9ff` (azul destaque), `#3a4652` (texto secundário), `#8a949e` (números), `#d6d9dc`/`#e1e4e7` (linhas); coluna de conteúdo `max-width:560px`, padding lateral `24px`.
- Rótulos de seção no formato do design: `001 — O que fazemos`, `002 — Como pensamos`, `003 — Onde podemos ajudar`, `004 — Quem confia na Valorize`, `00X — Contato` (o spec usa "·" só como notação; decisão do plano: travessão do design).
- Link WhatsApp (os dois botões): `https://wa.me/556294780968?text=Ol%C3%A1!%20Vim%20pelo%20Instagram%20e%20quero%20entender%20como%20a%20Valorize%20pode%20ajudar%20o%20meu%20neg%C3%B3cio.` — número **pendente de confirmação** (spec §7.1); ele aparece só nesses dois `href` e no texto `(62) 9478-0968`.
- Instagram: `https://instagram.com/valorize.ag` · E-mail: `mailto:valorize.ag@gmail.com`.
- Seção 004 (clientes) existe no HTML com o atributo `hidden`; enquanto oculta, o Contato tem o rótulo `004 — Contato`.
- Sem dependências em tempo de execução: a página publicada são `index.html`, `styles.css`, `main.js` e `assets/`.
- Funciona sem JavaScript: todo o conteúdo (inclusive as descrições dos serviços) fica visível se `main.js` não rodar.
- Peso total de `assets/` ≤ 500 KB.

## Review Focus

1. **JavaScript desligado ou com erro** → página inteira legível, descrições dos 7 serviços visíveis, nada preso com `opacity:0`. (teste na Task 3)
2. **`prefers-reduced-motion: reduce`** → faixa parada, selo parado, sem animação de aparecer ao rolar. (teste na Task 3)
3. **Celular estreito (320 px)** → sem rolagem horizontal; fitas decorativas cortadas, não empurrando a página. (verificação na Task 4)
4. **Mensagem pronta do WhatsApp** → os acentos chegam corretos ("Olá", "negócio"); os dois botões usam o mesmo link. (teste na Task 2)
5. **4G lento** → imagens leves (≤ 500 KB no total), fitas com `loading="lazy"` na de baixo e dimensões declaradas para não pular layout. (teste na Task 1)

---

## File Structure

```
link bio/
├─ index.html                 # marcação + toda a copy
├─ styles.css                 # estilos (tokens em :root, seções, animações)
├─ main.js                    # sanfona de serviços, barra de progresso, reveal
├─ assets/                    # imagens otimizadas (geradas pela Task 1)
├─ design/                    # zip extraído, só referência (gitignored)
├─ scripts/optimize-images.mjs
├─ tests/
│  ├─ assets.test.mjs
│  ├─ page.test.mjs           # copy, links, estrutura (HTML estático)
│  └─ behavior.test.mjs       # main.js no jsdom
├─ package.json
└─ .gitignore                 # node_modules/, design/, .superpowers/
```

---

### Task 1: Projeto e imagens otimizadas

**Files:**
- Create: `.gitignore`, `package.json`, `scripts/optimize-images.mjs`, `tests/assets.test.mjs`
- Create (gerados): `assets/logo-h-dark.webp`, `assets/mark-dark.webp`, `assets/seal-dark.webp`, `assets/ribbon-loop.webp`, `assets/ribbon-bottom.webp`, `assets/og-image.png`

**Interfaces:**
- Produces: os seis arquivos acima, usados pelas Tasks 2 e 4 com estes nomes exatos. Larguras geradas: logo 600, mark 120, seal 280, ribbon-loop 900, ribbon-bottom 1300. `og-image.png` 1200×630.
- Produces: scripts npm `test` = `node --test tests/` e `images` = `node scripts/optimize-images.mjs`.

- [ ] **Step 1: Inicializar o projeto**

```bash
git init
mkdir design && tar -xf "C:/Users/Joaov/Downloads/Landing page Valorize.zip" -C design
npm init -y
npm i -D sharp jsdom
```
`.gitignore`: `node_modules/`, `design/`, `.superpowers/`. Em `package.json`, definir os scripts `test` e `images` acima e `"type": "module"`.

- [ ] **Step 2: Escrever o teste que falha** — `tests/assets.test.mjs`

```js
test('assets otimizados existem', () => {
  for (const f of ['logo-h-dark.webp','mark-dark.webp','seal-dark.webp','ribbon-loop.webp','ribbon-bottom.webp','og-image.png'])
    assert.ok(existsSync(`assets/${f}`), f);
});
test('assets somam no máximo 500 KB', () => {
  const total = readdirSync('assets').reduce((s, f) => s + statSync(`assets/${f}`).size, 0);
  assert.ok(total <= 500 * 1024, `total ${total}`);
});
test('og-image tem 1200x630', async () => {
  const { width, height } = await sharp('assets/og-image.png').metadata();
  assert.deepEqual([width, height], [1200, 630]);
});
```

- [ ] **Step 3: Rodar e ver falhar** — `npm test` → FAIL (arquivos não existem).

- [ ] **Step 4: Implementar `scripts/optimize-images.mjs`**

Lê de `design/assets/*-dark.png` e `ribbon-*.png`, redimensiona para as larguras do bloco Interfaces e grava WebP (`quality: 80`) em `assets/`. `og-image.png`: fundo `#65d9ff` 1200×630 com `seal-dark` (420 px) centralizado, via `sharp.composite`. Não usar `idv.png` nem as versões `-light`.

- [ ] **Step 5: Gerar e testar** — `npm run images && npm test` → PASS. Se passar de 500 KB, baixar a `quality` das fitas para 70.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json scripts tests assets
git commit -m "chore: estrutura do projeto e imagens otimizadas"
```

---

### Task 2: Página com toda a copy (HTML + CSS)

**Files:**
- Create: `index.html`, `styles.css`, `tests/page.test.mjs`

**Interfaces:**
- Consumes: arquivos de `assets/` da Task 1.
- Produces (usados pelo `main.js` da Task 3):
  - `<html class="no-js">`; a Task 3 troca para `js`.
  - Barra de progresso: `<div class="progress__bar" data-progress></div>`.
  - Cada serviço: `<button class="service__toggle" aria-expanded="true" aria-controls="svc-N">` com `<span class="service__icon">–</span>` e painel `<p id="svc-N" class="service__panel">` (N = 1..7). No HTML todos começam **abertos** (funciona sem JS).
  - Elementos que aparecem ao rolar: atributo `data-reveal`.
  - Seção de clientes: `<section id="clientes" hidden>`.

- [ ] **Step 1: Escrever os testes que falham** — `tests/page.test.mjs` (carrega `index.html` com `new JSDOM(html)`, sem executar scripts)

```js
const WA = 'https://wa.me/556294780968?text=Ol%C3%A1!%20Vim%20pelo%20Instagram%20e%20quero%20entender%20como%20a%20Valorize%20pode%20ajudar%20o%20meu%20neg%C3%B3cio.';

test('h1 do topo', () => assert.equal(text('h1'), 'Transformando marcas em histórias de sucesso.'));
test('subtítulo do topo', () => assert.match(body, /Do planejamento à execução, somos o parceiro que entende o seu negócio e constrói com você uma marca forte, bem posicionada e lembrada\./));
test('7 serviços na ordem do spec', () => assert.deepEqual(
  [...doc.querySelectorAll('.service__name')].map(e => e.textContent.trim()),
  ['Planejamento estratégico de comunicação','Gestão de redes sociais','Artes e criativos','Produção de conteúdo e gravações','Tráfego pago','Branding e identidade visual','Sites e landing pages']));
test('5 dores, a primeira é "Não sei por onde começar"', () => {
  const t = [...doc.querySelectorAll('.pain__title')].map(e => e.textContent.trim());
  assert.equal(t.length, 5); assert.equal(t[0], 'Não sei por onde começar');
});
test('os dois botões de WhatsApp usam o link com a mensagem', () => {
  const wa = [...doc.querySelectorAll('a[href^="https://wa.me/"]')].map(a => a.href);
  assert.equal(wa.length, 2); wa.forEach(h => assert.equal(h, WA));
  assert.equal(decodeURIComponent(new URL(WA).searchParams.get('text')),
    'Olá! Vim pelo Instagram e quero entender como a Valorize pode ajudar o meu negócio.');
});
test('instagram e e-mail', () => {
  assert.ok(doc.querySelector('a[href="https://instagram.com/valorize.ag"]'));
  assert.ok(doc.querySelector('a[href="mailto:valorize.ag@gmail.com"]'));
});
test('clientes oculto e contato numerado 004', () => {
  assert.ok(doc.querySelector('#clientes').hidden);
  assert.match(doc.querySelector('#contato').textContent, /004 — Contato/);
});
test('sem JS, todas as descrições de serviço estão visíveis', () =>
  doc.querySelectorAll('.service__panel').forEach(p => assert.equal(p.hidden, false)));
test('sem copy de promessa do design antigo', () => {
  assert.doesNotMatch(body, /relatórios mensais de crescimento|Transformamos audiência em contato/);
});
test('sem runtime do Claude Design', () => assert.doesNotMatch(html, /support\.js|x-dc|\{\{/));
```

(Os títulos e textos restantes da seção 4 do spec — dores, "Como pensamos", manifesto, contato, rodapé — entram no HTML literalmente; os testes acima cobrem os pontos que mudaram em relação ao design.)

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL (`index.html` não existe).

- [ ] **Step 3: Escrever `index.html`**

Seções na ordem do spec §4: cabeçalho fixo → `#topo` → faixa → `#servicos` (001) → Como pensamos (002) → Onde podemos ajudar (003) → Manifesto → `#clientes` (004, `hidden`; título "Marcas que caminham com a gente." e uma `<div class="clients__logos">` vazia) → `#contato`. Estrutura e hierarquia copiadas de `design/Valorize Link na Bio v2.dc.html`, trocando os textos pelos do spec. Específicos:
- Faixa: o HTML contém as 8 palavras **duas vezes** seguidas (`aria-hidden="true"` na segunda cópia) para o loop de `translateX(-50%)`; palavras de índice ímpar em itálico `#65d9ff`.
- Selo do manifesto: `<img class="seal" src="assets/seal-dark.webp" alt="Valorize AG." width="140" height="135">`.
- Fitas: `ribbon-loop.webp` com `fetchpriority="low"`, `ribbon-bottom.webp` com `loading="lazy"`; ambas `alt=""` e `width`/`height` declarados.
- Texto de apoio do Contato (spec §4.9) entre o título e os cartões.
- `<script type="module" src="main.js"></script>` no fim do `<head>` (módulo, porque `main.js` exporta `init`; módulos já são adiados).

- [ ] **Step 4: Escrever `styles.css`**

Cores do bloco Global Constraints como variáveis em `:root`. Converter os estilos inline do design em classes, com os mesmos valores. `body{overflow-x:clip}` e o wrapper com `overflow:clip` para as fitas não criarem rolagem horizontal. Animações `vMarquee` (32s) e `vSpin` (18s) aplicadas em `.marquee__track` e `.seal`, desligadas dentro de `@media (prefers-reduced-motion: reduce)`. Estilo de reveal **só** sob `.js [data-reveal].is-pending { opacity:0; transform:translateY(24px) }` com a transição do design (`.7s`).

- [ ] **Step 5: Rodar os testes** — `npm test` → PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css tests/page.test.mjs
git commit -m "feat: página com a copy aprovada"
```

---

### Task 3: Interações (`main.js`)

**Files:**
- Create: `main.js`, `tests/behavior.test.mjs`

**Interfaces:**
- Consumes: hooks de marcação da Task 2 (`.no-js`, `[data-progress]`, `.service__toggle`/`.service__panel`/`.service__icon`, `[data-reveal]`).
- Produces: `export function init(doc = document, win = window): void` — chamada automaticamente quando carregado no navegador; os testes a chamam com o `window` do jsdom.

- [ ] **Step 1: Escrever os testes que falham** — `tests/behavior.test.mjs` (jsdom com `index.html`, `IntersectionObserver` e `matchMedia` falsos no `window`, depois `init(doc, win)`)

```js
test('troca no-js por js', () => assert.ok(doc.documentElement.classList.contains('js')));
test('após init, todos os serviços começam fechados', () =>
  toggles().forEach(b => { assert.equal(b.getAttribute('aria-expanded'), 'false'); assert.equal(panel(b).hidden, true); assert.equal(icon(b), '+'); }));
test('tocar abre um e fecha o anterior', () => {
  toggles()[0].click(); toggles()[2].click();
  assert.equal(panel(toggles()[0]).hidden, true);
  assert.equal(panel(toggles()[2]).hidden, false); assert.equal(icon(toggles()[2]), '–');
});
test('tocar no aberto fecha', () => { toggles()[2].click(); assert.equal(panel(toggles()[2]).hidden, true); });
test('progresso acompanha a rolagem', () => {
  setScroll({ scrollTop: 500, scrollHeight: 2000, clientHeight: 1000 }); win.dispatchEvent(new win.Event('scroll'));
  assert.equal(doc.querySelector('[data-progress]').style.width, '50%');
});
test('reduced motion: nada fica pendente de reveal', () => {
  // init em um novo jsdom com matchMedia('(prefers-reduced-motion: reduce)').matches = true
  assert.equal(doc2.querySelectorAll('.is-pending').length, 0);
});
test('reveal: elemento abaixo da dobra fica pendente e é liberado ao entrar na tela', () => {
  // getBoundingClientRect().top > innerHeight → recebe .is-pending; disparar o callback do IO falso → perde .is-pending
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npm test` → FAIL (`main.js` não existe).

- [ ] **Step 3: Implementar `init` em `main.js`**

Comportamento do `Component` do design, em JS puro: sanfona (um aberto por vez; atualiza `aria-expanded`, `hidden` e ícone `+`/`–`); barra de progresso (`scrollTop / (scrollHeight - clientHeight)`, listener `passive`); reveal com `IntersectionObserver` (`threshold: 0.15`) só para elementos abaixo da dobra e só se `prefers-reduced-motion` não for `reduce`. No fim do arquivo: `if (typeof window !== 'undefined') init();` — no Node (testes) `window` não existe, então só a chamada explícita do teste roda.

- [ ] **Step 4: Rodar os testes** — `npm test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add main.js tests/behavior.test.mjs
git commit -m "feat: sanfona de serviços, barra de progresso e reveal"
```

---

### Task 4: Metadados e verificação no navegador

**Files:**
- Modify: `index.html` (`<head>`)
- Modify: `tests/page.test.mjs`
- Create: `.claude/launch.json`

**Interfaces:**
- Consumes: `assets/og-image.png` (Task 1), página das Tasks 2–3.

- [ ] **Step 1: Teste que falha** — em `tests/page.test.mjs`:

```js
test('metadados', () => {
  assert.equal(doc.title, 'Valorize | Agência de marketing');
  assert.equal(meta('description'), 'Do planejamento à execução: estratégia, redes sociais, criativos, gravações e tráfego pago para pequenas e médias empresas. Fale com a Valorize no WhatsApp.');
  assert.equal(doc.querySelector('meta[property="og:image"]').content, 'assets/og-image.png');
  assert.equal(doc.documentElement.lang, 'pt-BR');
});
```

- [ ] **Step 2: Ver falhar** — `npm test` → FAIL.

- [ ] **Step 3: Implementar** — `<html lang="pt-BR">`, `<title>`, `meta description`, `og:title` (= título), `og:description` (= descrição), `og:image`, `og:type=website`, `theme-color #f5f5f5`, favicon `assets/mark-dark.webp`. (Quando houver domínio, `og:image` passa a URL absoluta — fora do escopo deste plano.)

- [ ] **Step 4: Testes** — `npm test` → PASS.

- [ ] **Step 5: Verificação visual** — `.claude/launch.json` com `npx serve -l 5173 .` (porta 5173) e abrir no painel do navegador. Conferir:
  - largura 375 e 320: sem rolagem horizontal (`document.documentElement.scrollWidth === innerWidth`), fitas cortadas como no design;
  - lado a lado com `design/Valorize Link na Bio v2.dc.html`: espaçamentos, tamanhos e cores batem;
  - tocar em serviços, botão "Falar conosco" rola até Contato, barra de progresso avança;
  - modo escuro do sistema não altera a página (design é só claro);
  - clicar no botão de WhatsApp abre `wa.me` com a mensagem pronta.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/page.test.mjs .claude/launch.json
git commit -m "feat: metadados e configuração de preview"
```

---

## Fora deste plano

- Confirmar o número do WhatsApp (spec §7.1) e trocar nos dois `href` + texto + teste `WA`.
- Ativar a seção 004: remover `hidden`, inserir logos, renomear Contato para `005 — Contato` e ajustar o teste.
- Hospedagem e domínio.
