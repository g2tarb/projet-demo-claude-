/* ── Forms : contact form, budget chips, toasts, exit intent ── */
import { $, $$, on, raf } from './utils.js';

export function initBudgetChips() {
  $$('.budget-chip').forEach(chip => {
    on(chip, 'click', () => {
      $$('.budget-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const budgetInput = $('#f-budget');
      if (budgetInput) budgetInput.value = chip.dataset.value;
      if (chip.dataset.value === 'Moins de 1 000€') {
        window.location.href = '/essentiel.html';
      } else if (chip.dataset.value === '5 000€ et plus') {
        window.location.href = '/lead.html';
      }
    });
  });
}

export function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const btnText   = $('#btn-text');
  const btnLoader = $('#btn-loader');
  const btnSubmit = $('#btn-submit');
  const feedback  = $('#form-feedback');

  function validateField(input) {
    const err = document.getElementById('err-' + input.name);
    if (!err) return true;
    if (input.required && !input.value.trim()) {
      input.classList.add('error');
      err.textContent = 'Ce champ est requis.';
      return false;
    }
    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      input.classList.add('error');
      err.textContent = 'Email invalide.';
      return false;
    }
    input.classList.remove('error');
    err.textContent = '';
    return true;
  }

  ['f-name', 'f-email', 'f-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) on(el, 'blur',  () => validateField(el));
    if (el) on(el, 'input', () => { if (el.classList.contains('error')) validateField(el); });
  });

  on(form, 'submit', async e => {
    e.preventDefault();
    const fields = ['f-name', 'f-email', 'f-message'].map(id => document.getElementById(id));
    const valid  = fields.every(f => validateField(f));
    if (!valid) return;

    btnSubmit.disabled = true;
    btnText.hidden     = true;
    btnLoader.hidden   = false;
    feedback.className = 'form-feedback';
    feedback.textContent = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    $('#f-name').value.trim(),
          email:   $('#f-email').value.trim(),
          phone:   $('#f-phone').value.trim(),
          service: $('#f-service').value,
          budget:  $('#f-budget').value,
          message: $('#f-message').value.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        feedback.className   = 'form-feedback success visible';
        feedback.textContent = '✅ ' + data.message;
        form.reset();
        $$('.budget-chip').forEach(c => c.classList.remove('active'));
      } else {
        const msg = data.errors ? data.errors.join(' ') : data.message;
        feedback.className   = 'form-feedback error visible';
        feedback.textContent = '❌ ' + msg;
      }
    } catch {
      feedback.className   = 'form-feedback error visible';
      feedback.textContent = '❌ Erreur réseau. Vérifiez votre connexion et réessayez.';
    } finally {
      btnSubmit.disabled = false;
      btnText.hidden     = false;
      btnLoader.hidden   = true;
    }
  });
}

export function initToasts() {
  if (matchMedia('(max-width: 768px)').matches) return;
  const container = $('#toast-container');
  if (!container) return;

  fetch('/api/toasts')
    .then(r => r.json())
    .then(data => {
      let idx = 0;
      function show() {
        const d = data[idx++ % data.length];
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `
          <div class="toast-av">${d.emoji}</div>
          <div class="toast-body">
            <div class="toast-name">${d.name}</div>
            <div class="toast-detail">${d.detail}</div>
          </div>
          <div class="toast-time">${d.time}</div>
        `;
        container.appendChild(t);
        raf(() => raf(() => t.classList.add('show')));
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 5500);
      }
      setTimeout(() => { show(); setInterval(show, 9000); }, 5000);
    })
    .catch(() => {});
}

export function initExit() {
  if (sessionStorage.getItem('exit-shown')) return;
  const overlay = $('#exit-overlay');
  if (!overlay) return;
  let triggered = false;
  on(document, 'mouseleave', e => {
    if (!triggered && e.clientY <= 0) {
      triggered = true;
      overlay.classList.add('show');
      sessionStorage.setItem('exit-shown', '1');
    }
  });
  const close = () => overlay.classList.remove('show');
  on($('#exit-backdrop'),   'click',   close);
  on($('#exit-close-btn'),  'click',   close);
  on($('#exit-cta-btn'),    'click',   close);
  on(document, 'keydown', e => { if (e.key === 'Escape') close(); });
}
