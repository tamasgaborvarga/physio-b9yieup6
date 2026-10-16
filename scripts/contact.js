/* ============================================================
   contact.js — Kapcsolat szekció viselkedés
   1) Kapcsolatfelvételi űrlap: kliensoldali validáció + küldés.
      - Ha van data-endpoint (Web3Forms / Formspree / saját backend):
        fetch POST. Web3Forms esetén a data-access-key is kötelező
        (https://web3forms.com — ingyenes access key e-mailben).
      - Ha nincs endpoint (statikus hoszting): mailto: levéllé áll össze.
      - Honeypot (company mező) spam-szűrés.
   2) Google Maps click-to-load: a nehéz iframe (script + sütik) csak
      a látogató kattintására töltődik be (teljesítmény + GDPR).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 1) Kapcsolatfelvételi űrlap ---------- */
  function setupForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;

    const status = form.querySelector('[data-form-status]');
    const emailField = form.querySelector('[name="email"]');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setStatus = (msg, type) => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' is-' + type : '');
    };

    const markInvalid = (field, invalid) => {
      if (!field) return;
      field.classList.toggle('is-invalid', invalid);
      field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    };

    function validate() {
      let ok = true;
      let firstBad = null;
      const name = form.querySelector('[name="name"]');
      const consent = form.querySelector('[name="consent"]');

      if (name && !name.value.trim()) { markInvalid(name, true); ok = false; firstBad = firstBad || name; }
      else markInvalid(name, false);

      if (emailField && !EMAIL_RE.test(emailField.value.trim())) { markInvalid(emailField, true); ok = false; firstBad = firstBad || emailField; }
      else markInvalid(emailField, false);

      if (consent && !consent.checked) { markInvalid(consent, true); ok = false; firstBad = firstBad || consent; }
      else markInvalid(consent, false);

      if (firstBad) firstBad.focus();
      return ok;
    }

    function values() {
      const get = (n) => {
        const el = form.querySelector('[name="' + n + '"]');
        return el ? el.value.trim() : '';
      };
      return { name: get('name'), phone: get('phone'), email: get('email'), message: get('message'), company: get('company') };
    }

    function sendMailto(v) {
      const to = form.getAttribute('data-mailto') || '';
      const subject = 'Időpontkérés — ' + (v.name || 'weboldal');
      const body =
        'Név: ' + v.name + '\n' +
        'Telefon: ' + (v.phone || '—') + '\n' +
        'E-mail: ' + v.email + '\n\n' +
        'Üzenet:\n' + (v.message || '—');
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    }

    async function sendEndpoint(endpoint, v, accessKey) {
      const payload = { name: v.name, phone: v.phone, email: v.email, message: v.message };
      if (accessKey) {
        // Web3Forms formátum: access_key kötelező, a subject/from_name/replyto
        // az értesítő e-mailt teszi értelmezhetővé (web3forms.com).
        payload.access_key = accessKey;
        payload.subject = 'Időpontkérés — ' + (v.name || 'weboldal');
        payload.from_name = v.name || 'Physio & More weboldal';
        payload.replyto = v.email;
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.success === false)) throw new Error('HTTP ' + res.status);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = values();

      // Honeypot: ha ki van töltve, csendben "sikeres" (bot)
      if (v.company) { setStatus('Köszönöm az üzenetét!', 'ok'); form.reset(); return; }

      if (!validate()) {
        setStatus('Kérjük, töltse ki a kötelező mezőket (név, érvényes e-mail, hozzájárulás).', 'error');
        return;
      }

      const endpoint = (form.getAttribute('data-endpoint') || '').trim();
      const accessKey = (form.getAttribute('data-access-key') || '').trim();
      const submitBtn = form.querySelector('.form-submit');

      if (endpoint && accessKey) {
        // Valódi backend van beállítva (Web3Forms access key kitöltve)
        if (submitBtn) submitBtn.disabled = true;
        setStatus('Küldés folyamatban…', 'pending');
        try {
          await sendEndpoint(endpoint, v, accessKey);
          setStatus('Köszönöm! Az üzenete megérkezett, hamarosan válaszolok.', 'ok');
          form.reset();
        } catch (err) {
          setStatus('Sajnos nem sikerült elküldeni. Kérjük, hívjon telefonon vagy próbálja újra.', 'error');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      } else {
        // Backend nélkül: mailto: levéllé állítjuk össze
        sendMailto(v);
        setStatus('Megnyitottuk a levelezőjét a kész üzenettel — csak küldje el. Ha nem nyílt meg, hívjon minket telefonon.', 'ok');
      }
    });
  }

  /* ---------- 2) Térkép click-to-load ---------- */
  function setupMap() {
    const btn = document.querySelector('[data-map-load]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.map-wrap');
      const src = btn.getAttribute('data-src');
      const title = btn.getAttribute('data-title') || 'Térkép';
      if (!wrap || !src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.style.border = '0';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      iframe.title = title;
      wrap.innerHTML = '';
      wrap.appendChild(iframe);
    });
  }

  document.addEventListener('components:ready', () => {
    setupForm();
    setupMap();
  });
})();
