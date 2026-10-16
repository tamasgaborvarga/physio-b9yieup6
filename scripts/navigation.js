/* ============================================================
   navigation.js — Sticky nav viselkedés + mobil panel
   - Scroll küszöbnél nav opacitás váltás
   - Mobil hamburger panel megnyitás/zárás (a11y)
   - Smooth scroll a navigációs linkekről, focus management
   ============================================================ */

(function () {
  'use strict';

  const SCROLL_THRESHOLD = 16;

  function setupNavbarScroll() {
    const bar = document.querySelector('.nav-bar');
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY || window.pageYOffset;
      bar.classList.toggle('is-scrolled', y > SCROLL_THRESHOLD);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  function setupMobilePanel() {
    const burger = document.querySelector('[data-nav-toggle]');
    const panel  = document.querySelector('.mobile-panel');
    if (!burger || !panel) return;

    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocus = null;

    const focusables = () => Array.from(panel.querySelectorAll(FOCUSABLE))
      .filter((el) => el.offsetParent !== null);

    // Burger ikon csere (menu ↔ x) — a Lucide az <i>-t <svg>-re cseréli,
    // ezért újra kell renderelni az ikont váltás után.
    const setBurgerIcon = (name) => {
      burger.innerHTML = '<i data-lucide="' + name + '" class="w-5 h-5"></i>';
      if (window.lucide) window.lucide.createIcons();
    };

    const open = () => {
      lastFocus = document.activeElement;
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Menü bezárása');
      setBurgerIcon('x');
      document.body.classList.add('no-scroll');
      const first = focusables()[0];
      if (first) first.focus();
    };
    const close = () => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Menü megnyitása');
      setBurgerIcon('menu');
      document.body.classList.remove('no-scroll');
      // Visszaadjuk a fókuszt a kiváltó elemre — a11y best practice
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    };
    const toggle = () => panel.classList.contains('is-open') ? close() : open();

    // Focus trap: a Tab-ot a paneltagok közé szorítjuk
    function trapTab(e) {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    burger.addEventListener('click', toggle);
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else trapTab(e);
    });
  }

  // ScrollSpy: az éppen látott szekcióhoz tartozó nav-linket kiemeli.
  // Egyoldalas oldalon segít a tájékozódásban (melyik résznél járok).
  function setupScrollSpy() {
    const links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    // href → link map, és a megfigyelendő szekciók
    const map = new Map();
    const sections = [];
    links.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) { map.set(sec, link); sections.push(sec); }
    });
    if (!sections.length) return;

    const setActive = (link) => {
      links.forEach((l) => {
        const on = l === link;
        l.classList.toggle('is-active', on);
        if (on) l.setAttribute('aria-current', 'true');
        else l.removeAttribute('aria-current');
      });
    };

    // A viewport felső harmadában lévő szekció számít aktívnak.
    const io = new IntersectionObserver((entries) => {
      // A legfelső, épp metsző szekciót választjuk
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) {
        const link = map.get(visible[0].target);
        if (link) setActive(link);
      }
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((s) => io.observe(s));
  }

  function setupSmoothNavLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move focus for a11y after the scroll settles
        setTimeout(() => target.setAttribute('tabindex', '-1'), 0);
        setTimeout(() => target.focus({ preventScroll: true }), 700);
      });
    });
  }

  document.addEventListener('components:ready', () => {
    setupNavbarScroll();
    setupMobilePanel();
    setupSmoothNavLinks();
    setupScrollSpy();
  });
})();
