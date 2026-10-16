/* ============================================================
   gallery.js — Galéria viselkedés
   - Lightbox-szerű egyszerű nagyítás (egér + billentyűzet)
   - Lazy load fallback
   ============================================================ */

(function () {
  'use strict';

  function ensureLazyImages(scope) {
    scope.querySelectorAll('img').forEach((img) => {
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
  }

  function setupLightbox() {
    const grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    let overlay = null;
    let lastFocus = null;

    function open(src, alt) {
      lastFocus = document.activeElement;
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', alt || 'Galéria nagyítás');
      overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Bezárás">&times;</button>
        <img src="${src}" alt="${alt || ''}" />
      `;
      document.body.appendChild(overlay);
      document.body.classList.add('no-scroll');
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        const closeBtn = overlay.querySelector('.lightbox-close');
        if (closeBtn) closeBtn.focus();
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('lightbox-close')) close();
      });
      document.addEventListener('keydown', onKey);
    }
    function close() {
      if (!overlay) return;
      overlay.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => { overlay && overlay.remove(); overlay = null; }, 250);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    // A fotós csempék billentyűzetről is nyithatók (a placeholderek nem)
    grid.querySelectorAll('.masonry-item').forEach((item) => {
      const img = item.querySelector('img');
      if (!img) return;
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', (img.alt || 'Fotó') + ' — nagyítás');
    });

    const activate = (item) => {
      const img = item && item.querySelector('img');
      if (!img) return;
      open(img.currentSrc || img.src, img.alt);
    };
    grid.addEventListener('click', (e) => {
      activate(e.target.closest('.masonry-item'));
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.masonry-item');
      if (!item) return;
      e.preventDefault();
      activate(item);
    });
  }

  document.addEventListener('components:ready', () => {
    const gallery = document.getElementById('gallery');
    if (gallery) ensureLazyImages(gallery);
    setupLightbox();
  });
})();
