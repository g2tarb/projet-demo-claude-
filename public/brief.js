/**
 * BRIEF WIZARD — 4dayvelopment
 * Step machine · Validation · Recap · Submit
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════ */

const TOTAL_STEPS = 14; // 0 → 14

/* Per-step validator. Returns null if valid, else an error string. */
const validators = {
  0: () => null, // Welcome — always valid
  1: () => {
    const v = val('q-prenom').trim();
    if (v.length < 2) return 'Votre prénom doit contenir au moins 2 caractères.';
    if (v.length > 50) return 'Prénom trop long (max 50 caractères).';
    if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(v)) return 'Prénom invalide — lettres uniquement.';
    return null;
  },
  2: () => {
    const v = val('q-email').trim();
    if (!v) return 'L\'email est obligatoire.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Adresse email invalide (ex: nom@domaine.fr).';
    return null;
  },
  3: () => {
    // Optional — only validate format if filled
    const v = val('q-tel').trim();
    if (!v) return null;
    const clean = v.replace(/[\s\-\.]/g, '');
    if (!/^(\+?\d{7,15})$/.test(clean)) return 'Numéro invalide (ex: +33 6 12 34 56 78).';
    return null;
  },
  4: () => {
    const v = val('q-societe').trim();
    if (v.length < 2) return 'Indiquez votre entreprise ou votre nom.';
    if (v.length > 100) return 'Nom trop long (max 100 caractères).';
    return null;
  },
  5: () => {
    const v = val('q-type');
    if (!v) return 'Sélectionnez un type de site.';
    return null;
  },
  6: () => {
    const v = val('q-secteur');
    if (!v) return 'Sélectionnez votre secteur d\'activité.';
    return null;
  },
  7: () => {
    const checked = document.querySelectorAll('#checks-pages input:checked');
    if (checked.length === 0) return 'Sélectionnez au moins une page.';
    return null;
  },
  8: () => {
    const v = val('q-style');
    if (!v) return 'Choisissez un style visuel.';
    return null;
  },
  9: () => {
    const checked = document.querySelectorAll('[name="contenu"]:checked');
    if (checked.length === 0) return 'Indiquez ce que vous avez déjà (ou "Rien pour l\'instant").';
    return null;
  },
  10: () => {
    const v = val('q-budget');
    if (!v) return 'Sélectionnez une tranche de budget.';
    return null;
  },
  11: () => {
    const v = val('q-delai');
    if (!v) return 'Choisissez un délai.';
    return null;
  },
  12: () => null, // Optional textarea
  13: () => null, // Recap — validated by submit
};

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */

let current = 0;
let isAnimating = false;

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function getStep(n) {
  return document.querySelector(`.step[data-step="${n}"]`);
}

function setError(stepNum, msg) {
  const errId = errIdForStep(stepNum);
  if (!errId) return;
  const el = document.getElementById(errId);
  if (el) el.textContent = msg || '';
}

function errIdForStep(n) {
  const map = {
    1: 'err-prenom', 2: 'err-email', 3: 'err-tel',
    4: 'err-societe', 5: 'err-type', 6: 'err-secteur',
    7: 'err-pages', 8: 'err-style', 9: 'err-contenu',
    10: 'err-budget', 11: 'err-delai', 12: 'err-plus',
    13: 'err-recap',
  };
  return map[n] || null;
}

function shakeStep(n) {
  const step = getStep(n);
  if (!step) return;
  step.classList.remove('shake');
  void step.offsetWidth; // reflow
  step.classList.add('shake');
  step.addEventListener('animationend', () => step.classList.remove('shake'), { once: true });
}

/* ═══════════════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════════════ */

function goTo(target, direction = 'forward') {
  if (isAnimating) return;
  if (target < 0 || target > TOTAL_STEPS) return;

  const from = getStep(current);
  const to   = getStep(target);
  if (!from || !to) return;

  isAnimating = true;

  // Exit current
  from.classList.remove('active');
  from.classList.add(direction === 'forward' ? 'exit-up' : 'enter-down');

  // Prepare next
  to.style.position = 'absolute';
  to.style.opacity  = '0';
  to.classList.remove('exit-up', 'enter-down');

  setTimeout(() => {
    from.classList.remove('exit-up', 'enter-down');
    from.style.position = '';

    to.style.position = '';
    to.style.opacity  = '';
    to.classList.add('active');

    current = target;
    updateUI();
    focusStep(current);
    isAnimating = false;
  }, 380);
}

function tryNext() {
  const err = validators[current] ? validators[current]() : null;

  if (err) {
    setError(current, err);
    shakeStep(current);
    // Reset relevant input on critical error (step 1–4 text inputs)
    if ([1, 2, 4].includes(current)) {
      const inputMap = { 1: 'q-prenom', 2: 'q-email', 4: 'q-societe' };
      const inputEl = document.getElementById(inputMap[current]);
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }
    return;
  }

  setError(current, '');

  if (current === 12) {
    buildRecap();
    goTo(13, 'forward');
    return;
  }

  if (current === 13) {
    submitBrief();
    return;
  }

  goTo(current + 1, 'forward');
}

function tryPrev() {
  if (current <= 0) return;
  setError(current, '');
  goTo(current - 1, 'backward');
}

function trySkip() {
  setError(current, '');
  goTo(current + 1, 'forward');
}

/* ═══════════════════════════════════════════════════════
   UI UPDATE
═══════════════════════════════════════════════════════ */

function updateUI() {
  // Progress bar (steps 1–12 are "real" steps)
  const progress = current === 0 ? 0
    : current >= 13 ? 100
    : Math.round((current / 12) * 100);

  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.width = progress + '%';

  // Label
  const label = document.getElementById('progress-label');
  if (label) {
    if (current === 0 || current >= 13) {
      label.textContent = '';
    } else {
      label.textContent = `${current} / 12`;
    }
  }

  // Prev button
  const btnPrev = document.getElementById('btn-prev');
  if (btnPrev) {
    btnPrev.disabled = current <= 0 || current >= 14;
  }

  // Dots
  renderDots();
}

function renderDots() {
  const wrap = document.getElementById('step-dots');
  if (!wrap) return;
  wrap.innerHTML = '';

  if (current === 0 || current >= 13) return;

  for (let i = 1; i <= 12; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    if (i < current) dot.classList.add('done');
    if (i === current) dot.classList.add('current');
    wrap.appendChild(dot);
  }
}

function focusStep(n) {
  // Auto-focus first input in the step
  const step = getStep(n);
  if (!step) return;
  const input = step.querySelector('input[type="text"], input[type="email"], input[type="tel"], textarea');
  if (input) {
    setTimeout(() => input.focus(), 350);
  }
}

/* ═══════════════════════════════════════════════════════
   CHOICE CARDS
═══════════════════════════════════════════════════════ */

function initCards(containerId, hiddenId, actionsId) {
  const container = document.getElementById(containerId);
  const hidden    = document.getElementById(hiddenId);
  const actions   = document.getElementById(actionsId);
  if (!container) return;

  container.querySelectorAll('.choice-card, .style-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.choice-card, .style-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (hidden) hidden.value = card.dataset.value;
      if (actions) actions.classList.remove('hidden');
      setError(current, '');

      // Auto-advance after short delay for card selections (not style)
      if (containerId !== 'cards-style') {
        setTimeout(() => tryNext(), 400);
      }
    });
  });
}

function initTags(containerId, hiddenId, actionsId) {
  const container = document.getElementById(containerId);
  const hidden    = document.getElementById(hiddenId);
  const actions   = document.getElementById(actionsId);
  if (!container) return;

  container.querySelectorAll('.tag-btn').forEach(tag => {
    tag.addEventListener('click', () => {
      // Single selection for sector
      container.querySelectorAll('.tag-btn').forEach(t => t.classList.remove('selected'));
      tag.classList.add('selected');
      if (hidden) hidden.value = tag.dataset.value;
      if (actions) actions.classList.remove('hidden');
      setError(current, '');

      setTimeout(() => tryNext(), 400);
    });
  });
}

/* ═══════════════════════════════════════════════════════
   RECAP
═══════════════════════════════════════════════════════ */

function getPages() {
  return [...document.querySelectorAll('#checks-pages input:checked')]
    .map(i => i.value);
}

function getContenu() {
  return [...document.querySelectorAll('[name="contenu"]:checked')]
    .map(i => i.value);
}

function buildRecap() {
  const grid = document.getElementById('recap-grid');
  if (!grid) return;

  const pages   = getPages();
  const contenu = getContenu();

  const items = [
    { label: 'Prénom',       value: val('q-prenom')  },
    { label: 'Email',        value: val('q-email')   },
    { label: 'Téléphone',    value: val('q-tel') || '—' },
    { label: 'Entreprise',   value: val('q-societe') },
    { label: 'Type de site', value: val('q-type')    },
    { label: 'Secteur',      value: val('q-secteur') },
    { label: 'Pages',        value: pages,  badges: true, full: true },
    { label: 'Style visuel', value: val('q-style')   },
    { label: 'Contenu',      value: contenu, badges: true, full: true },
    { label: 'Budget',       value: val('q-budget')  },
    { label: 'Délai',        value: val('q-delai')   },
    { label: 'Infos supp.',  value: val('q-plus') || '—', full: true },
  ];

  grid.innerHTML = items.map(item => {
    let valueHTML;
    if (item.badges && Array.isArray(item.value)) {
      valueHTML = item.value.length
        ? item.value.map(v => `<span class="badge">${esc(v)}</span>`).join('')
        : '<span style="color:var(--c-muted)">—</span>';
    } else {
      valueHTML = esc(String(item.value));
    }
    return `
      <div class="recap-item${item.full ? ' full' : ''}">
        <div class="recap-label">${esc(item.label)}</div>
        <div class="recap-value">${valueHTML}</div>
      </div>
    `;
  }).join('');
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ═══════════════════════════════════════════════════════
   SUBMIT
═══════════════════════════════════════════════════════ */

async function submitBrief() {
  const btn    = document.getElementById('btn-submit-brief');
  const txtEl  = document.getElementById('submit-text');
  const loader = document.getElementById('submit-loader');

  if (!btn) return;

  btn.disabled = true;
  if (txtEl)  txtEl.hidden  = true;
  if (loader) loader.hidden = false;

  const payload = {
    name:    val('q-prenom'),
    email:   val('q-email'),
    phone:   val('q-tel'),
    societe: val('q-societe'),
    type:    val('q-type'),
    secteur: val('q-secteur'),
    pages:   getPages().join(', '),
    style:   val('q-style'),
    contenu: getContenu().join(', '),
    budget:  val('q-budget'),
    delai:   val('q-delai'),
    plus:    val('q-plus'),
    subject: `[Brief] ${val('q-type')} — ${val('q-prenom')}`,
    message: buildTextMessage(),
    service: val('q-type'),
  };

  try {
    const res = await fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // Show success step
      document.getElementById('success-prenom').textContent = val('q-prenom');
      document.getElementById('success-email').textContent  = val('q-email');
      goTo(14, 'forward');
      updateUI();
    } else {
      const errMsg = data.message || 'Erreur lors de l\'envoi. Réessayez.';
      setError(13, errMsg);
      shakeStep(13);
      btn.disabled = false;
      if (txtEl)  txtEl.hidden  = false;
      if (loader) loader.hidden = true;
    }
  } catch (e) {
    setError(13, 'Erreur réseau. Vérifiez votre connexion et réessayez.');
    shakeStep(13);
    btn.disabled = false;
    if (txtEl)  txtEl.hidden  = false;
    if (loader) loader.hidden = true;
  }
}

function buildTextMessage() {
  return [
    `Brief projet web — ${val('q-prenom')} (${val('q-societe')})`,
    `Type : ${val('q-type')}`,
    `Secteur : ${val('q-secteur')}`,
    `Pages : ${getPages().join(', ')}`,
    `Style : ${val('q-style')}`,
    `Contenu : ${getContenu().join(', ')}`,
    `Budget : ${val('q-budget')}`,
    `Délai : ${val('q-delai')}`,
    val('q-plus') ? `Infos : ${val('q-plus')}` : '',
  ].filter(Boolean).join('\n');
}

/* ═══════════════════════════════════════════════════════
   KEYBOARD
═══════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
  // Enter on text inputs → next
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    const tag = document.activeElement?.tagName;
    if (tag === 'TEXTAREA') return; // Let shift+enter work
    if (tag === 'BUTTON') return;   // Let the button handle its own click
    e.preventDefault();
    tryNext();
  }

  // Ctrl+Enter on textarea → next
  if (e.key === 'Enter' && e.ctrlKey) {
    const tag = document.activeElement?.tagName;
    if (tag === 'TEXTAREA') {
      e.preventDefault();
      tryNext();
    }
  }
});

/* ═══════════════════════════════════════════════════════
   CHAR COUNT (textarea step 12)
═══════════════════════════════════════════════════════ */

const textarea = document.getElementById('q-plus');
const charCountEl = document.getElementById('char-count');
if (textarea && charCountEl) {
  textarea.addEventListener('input', () => {
    charCountEl.textContent = textarea.value.length;
  });
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */

function init() {
  // Wire "next" buttons
  document.querySelectorAll('[data-action="next"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      tryNext();
    });
  });

  // Wire "skip" buttons
  document.querySelectorAll('[data-action="skip"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      trySkip();
    });
  });

  // Prev button
  document.getElementById('btn-prev')?.addEventListener('click', tryPrev);

  // Edit button (recap → go back to step 1)
  document.getElementById('btn-edit')?.addEventListener('click', () => {
    goTo(1, 'backward');
  });

  // Submit button
  document.getElementById('btn-submit-brief')?.addEventListener('click', e => {
    e.preventDefault();
    submitBrief();
  });

  // Choice cards
  initCards('cards-type',   'q-type',   'actions-type');
  initCards('cards-budget', 'q-budget', 'actions-budget');
  initCards('cards-delai',  'q-delai',  'actions-delai');
  initCards('cards-style',  'q-style',  'actions-style');

  // Tag buttons (secteur)
  initTags('tags-secteur', 'q-secteur', 'actions-secteur');

  // Clear errors on input change
  document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      const errEl = input.closest('.step')?.querySelector('.input-error');
      if (errEl) errEl.textContent = '';
    });
  });

  // Initial UI state
  updateUI();
}

document.addEventListener('DOMContentLoaded', init);
