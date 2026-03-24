/* ── i18n : async fetch depuis /locales/{lang}.json ── */
import { $, $$, on } from './utils.js';

const cache = {};

async function loadTranslations(lang) {
  if (cache[lang]) return cache[lang];
  const res = await fetch(`/locales/${lang}.json`);
  if (!res.ok) throw new Error(`i18n: impossible de charger ${lang}.json`);
  cache[lang] = await res.json();
  return cache[lang];
}

export async function applyLang(lang) {
  const t = await loadTranslations(lang);

  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  $$('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  const btn = $('#lang-toggle');
  if (btn) btn.innerHTML = lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
}

export async function initLang() {
  const btn = $('#lang-toggle');
  if (!btn) return;

  let lang = localStorage.getItem('lang') || 'fr';

  // Précharger les deux locales en arrière-plan dès le démarrage
  loadTranslations('fr').catch(() => {});
  loadTranslations('en').catch(() => {});

  if (lang === 'en') await applyLang('en');

  on(btn, 'click', async () => {
    lang = lang === 'fr' ? 'en' : 'fr';
    await applyLang(lang);
  });
}
