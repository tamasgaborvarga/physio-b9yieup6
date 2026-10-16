/* ============================================================
   components.js — Komponens-readiness orchestrator
   A komponensek inline-olva élnek az index.html-ben (file://
   protokoll alatt is működjön), így itt nincs fetch — csak
   1) Lucide ikonok inicializálása,
   2) `components:ready` esemény diszpetcselése a downstream
      moduloknak (navigation, animations, gallery, main).
   ============================================================ */

(function () {
  'use strict';

  function init() {
    // Lucide a defer scriptek sorrendje miatt itt már elérhető
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    document.dispatchEvent(new CustomEvent('components:ready'));
  }

  // Mindig várjunk a DOMContentLoaded-ra: így biztosan minden defer
  // script (navigation, animations, gallery, main) regisztrálta a
  // `components:ready` listener-jét, mielőtt diszpetcselünk.
  // (defer scriptek 'interactive' readyState-ben futnak, a többi
  //  modul listener-je csak ezután regisztrál.)
  if (document.readyState === 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }
})();
