/* ============================================================
   animations.js — Scroll reveal + microinterakciók
   IntersectionObserver alapú deklaratív megjelenés:
   minden [data-reveal] elem fade-up animációval jelenik meg.
   ============================================================ */

(function () {
  'use strict';

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupReveal() {
    // Csak a még nem inicializált elemeket vegyük fel (idempotens),
    // hogy a JSON hidratálás utáni második hullám se duplikálja a megfigyelést
    const items = document.querySelectorAll('[data-reveal]:not([data-reveal-init])');
    if (!items.length) return;
    items.forEach((el) => el.setAttribute('data-reveal-init', ''));

    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((el, i) => {
      // Stagger index ha a parent kéri
      const parent = el.parentElement;
      if (parent && parent.hasAttribute('data-stagger')) {
        el.style.setProperty('--index', String(i));
        el.setAttribute('data-reveal-stagger', '');
      }
      io.observe(el);
    });
  }

  function setupMobileCtaVisibility() {
    const stickyCta = document.querySelector('.mobile-cta');
    if (!stickyCta) return;

    // A sticky CTA a lap "húsában" jelenik meg, de elrejtjük ott, ahol
    // már van saját, kiemelt foglalás-CTA vagy elérhetőség: a hero
    // (saját CTA), a kapcsolat és a lábléc felett.
    const targets = ['hero', 'contact', 'footer-mount']
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (!targets.length) return;

    // Halmaz-alapú követés: több, egymástól távoli célnál is helyes
    // (az entries csak a változott elemeket tartalmazza).
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        });
        stickyCta.classList.toggle('is-hidden', visible.size > 0);
      },
      { threshold: 0.05 }
    );
    targets.forEach((t) => io.observe(t));
  }

  document.addEventListener('components:ready', () => {
    setupReveal();
    setupMobileCtaVisibility();
  });
  // Másodlagos hullám: amikor a JSON-vezérelt tartalom (services, pricing)
  // elkészül, a frissen beillesztett [data-reveal] csomópontokat is figyelni kell
  document.addEventListener('content:hydrated', setupReveal);
})();
