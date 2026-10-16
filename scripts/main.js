/* ============================================================
   main.js — Orchestrator
   - Adat-hidratálás: a services/pricing JSON inline-ból
     (<script type="application/json">) olvasódik, így file://
     alatt is működik.
   - Cross-cutting initek (footer évszám).
   ============================================================ */

(function () {
  'use strict';

  function readInlineJSON(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (err) {
      console.warn('[main] JSON parse hiba:', id, err);
      return null;
    }
  }

  /* Service-card illusztráció (a kártya tetején, teljes szélességben).
     Saját vonalrajzok (tools/illustrations.mjs → scripts/illustrations.js),
     a korábbi, netről letöltött fotók helyett. Díszítő elem → aria-hidden. */
  function serviceArt(id) {
    const svg = (window.PM_ILLUSTRATIONS || {})[id];
    return svg ? `<div class="service-art" aria-hidden="true">${svg}</div>` : '';
  }

  function hydrateServices(items) {
    const grid = document.querySelector('[data-services-grid]');
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = items.map((s, i) => `
      <article class="service-card${s.featured ? ' is-featured' : ''}" data-reveal data-reveal-stagger style="--index:${i}; --stagger:60ms">
        <span class="service-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        ${serviceArt(s.id)}
        <div class="service-body">
          <h3 class="service-title">${s.title}</h3>
          <p class="service-desc">${s.description}</p>
        </div>
      </article>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function hydratePricing(items) {
    const list = document.querySelector('[data-pricing-list]');
    if (!list || !Array.isArray(items)) return;
    list.innerHTML = items.map((p) => {
      const featuredClass = p.featured ? ' is-featured' : '';
      const badge = p.featured && p.badge
        ? `<span class="price-badge">★ ${p.badge}</span>`
        : '';
      const amount = Array.isArray(p.priceLines)
        ? `<div class="price-amount price-amount-stack">${p.priceLines.map((l) => `
            <div>${l.price}<span class="unit">${l.unit || 'Ft'}</span></div>
          `).join('')}</div>`
        : `<div class="price-amount">${p.price}<span class="unit">${p.unit || 'Ft'}</span></div>`;
      return `
        <li class="price-row${featuredClass}">
          <div>
            ${badge}
            <div class="price-name">${p.name}</div>
            ${p.meta ? `<div class="price-meta">${p.meta}</div>` : ''}
          </div>
          ${amount}
        </li>
      `;
    }).join('');
  }

  function setFooterYear() {
    const y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    setFooterYear();
    hydrateServices(readInlineJSON('services-data'));
    hydratePricing(readInlineJSON('pricing-data'));
    // Második hullám: az új DOM csomópontokon is működjön a reveal
    document.dispatchEvent(new CustomEvent('content:hydrated'));
  }

  document.addEventListener('components:ready', init);
})();
