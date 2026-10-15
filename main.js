// Interações da página: sanfona de serviços, barra de progresso e aparecer ao rolar.
// Sem JS a página funciona inteira: serviços abertos e nada escondido.

export function init(doc = document, win = window) {
  const root = doc.documentElement;
  root.classList.replace('no-js', 'js');

  const updateProgress = setupProgress(doc, win);
  setupServices(doc, win, updateProgress);
  setupReveal(doc, win);
  setupTestimonials(doc);
}

// Depoimentos rodando em loop: duplica os cartões (cópias escondidas do leitor de tela)
// para a faixa andar até -50% e recomeçar sem emenda. Sem JS, a faixa só desliza no dedo.
function setupTestimonials(doc) {
  const wrap = doc.querySelector('.testimonials');
  const track = wrap?.querySelector('.testimonials__track');
  if (!track) return;
  [...track.children].forEach((li) => {
    const copy = li.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach((img) => img.setAttribute('alt', ''));
    track.append(copy);
  });
  wrap.classList.add('is-marquee');
}

function setupServices(doc, win, onChange) {
  const toggles = [...doc.querySelectorAll('.service__toggle')];
  const setOpen = (btn, open) => {
    btn.setAttribute('aria-expanded', String(open));
    doc.getElementById(btn.getAttribute('aria-controls')).hidden = !open;
    btn.querySelector('.service__icon').textContent = open ? '–' : '+';
  };

  toggles.forEach((btn) => {
    setOpen(btn, false);
    btn.addEventListener('click', () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      const before = btn.getBoundingClientRect().top;
      toggles.forEach((other) => setOpen(other, false));
      if (willOpen) setOpen(btn, true);
      // Se um item aberto acima fechou, compensa a rolagem para o botão tocado não sair do dedo.
      const shift = btn.getBoundingClientRect().top - before;
      if (shift) win.scrollBy(0, shift);
      onChange();
    });
  });
}

function setupProgress(doc, win) {
  const bar = doc.querySelector('[data-progress]');
  if (!bar) return () => {};
  const root = doc.documentElement;
  const update = () => {
    const max = root.scrollHeight - root.clientHeight;
    const ratio = max > 0 ? Math.min(1, root.scrollTop / max) : 0;
    bar.style.width = `${+(ratio * 100).toFixed(1)}%`;
  };
  win.addEventListener('scroll', update, { passive: true });
  update();
  return update;
}

function setupReveal(doc, win) {
  if (!('IntersectionObserver' in win)) return;

  const io = new win.IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.remove('is-pending');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });

  doc.querySelectorAll('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top < win.innerHeight) return;
    el.classList.add('is-pending');
    io.observe(el);
  });
}

if (typeof window !== 'undefined') init();
