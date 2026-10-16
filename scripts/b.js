/* b.js — B változat: menü, sávszín, rajzok, megjelenés, számláló */
(function () {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* illusztrációk a lapokba */
  const ILL = window.PM_ILLUSTRATIONS || {};
  document.querySelectorAll('[data-il]').forEach((el) => {
    const svg = ILL[el.dataset.il];
    if (svg) { el.innerHTML = svg; el.setAttribute('aria-hidden', 'true'); }
  });

  /* teljes képernyős menü */
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  const label = btn && btn.querySelector('.b-menu-l');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Bezárás' : 'Menü';
    menu.toggleAttribute('inert', !open);
    if (open) setTimeout(() => menu.querySelector('a').focus({ preventScroll: true }), reduce ? 0 : 350);
  }
  if (btn && menu) {
    menu.setAttribute('inert', '');
    btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
  }

  /* sáv: a borító fölött átlátszó, grafit fejezet fölött sötét */
  const bar = document.querySelector('[data-bar]');
  const cover = document.querySelector('.b-cover');
  const darks = [...document.querySelectorAll('.b-night')];
  function paintBar() {
    if (!bar) return;
    const y = bar.offsetHeight / 2;
    const coverDark = cover && getComputedStyle(cover).backgroundColor !== getComputedStyle(document.body).backgroundColor;
    const overCover = coverDark && cover.getBoundingClientRect().bottom > y + 1;
    const overDark = darks.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
    bar.classList.toggle('at-top', !!overCover);
    bar.classList.toggle('on-dark', !overCover && overDark);
  }
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paintBar(); }); }, { passive: true });
  addEventListener('resize', paintBar);
  paintBar();

  /* számláló (10+, 12) — egyszer, láthatóvá váláskor */
  function count(el) {
    const to = +el.dataset.count, suffix = el.textContent.replace(/[0-9]/g, '');
    if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* megjelenés görgetésre */
  const items = document.querySelectorAll('[data-rv]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-count]').forEach(count);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
