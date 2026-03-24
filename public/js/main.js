/* ================================================================
   4DAYVELOPMENT — main.js
   Orchestrateur ES6 modules · Sans bundler
   ================================================================ */

import { initBar, initProgress, initNav, initSmoothScroll, initFloatingCTA, initPageTransition } from './modules/navigation.js';
import { initCursor, initGlow, initMagnetic, initScramble, initReveal, initCounters } from './modules/animations.js';
import { initContactForm, initBudgetChips, initToasts, initExit } from './modules/form.js';
import { initLang } from './modules/i18n.js';
import { checkMotion, initTheme, initFAQ } from './modules/ui.js';
import { initThreeUniverse } from './modules/three-bg.js';
import { initConsent } from './modules/consent.js';

async function init() {
  // Priorité haute — bloquant le rendu si absent
  checkMotion();
  initTheme();
  await initLang();       // async : applique la langue sauvegardée avant le premier paint
  initBar();
  initProgress();
  initPageTransition();
  initNav();
  initGlow();
  initReveal();
  initCounters();
  initFAQ();
  initSmoothScroll();
  initFloatingCTA();
  initToasts();
  initExit();
  initBudgetChips();
  initContactForm();

  // Deferred : n'impacte pas le LCP
  setTimeout(() => {
    initCursor();
    initMagnetic();
    initScramble();
  }, 150);

  // Three.js : attend que la lib CDN soit chargée
  setTimeout(initThreeUniverse, 300);

  // RGPD : bannière après 1s si pas de consentement enregistré
  initConsent();

  console.log('%c4DAYVELOPMENT', 'color:#f2b13b;font-size:22px;font-weight:900;font-family:Syne,sans-serif;');
  console.log('%cMasterclass 2026 · Maximum Conversion', 'color:#DA5426;font-size:12px;');
}

// Les modules ES6 sont différés par défaut (équivalent defer)
// Le DOM est garanti prêt à l'exécution de ce top-level
init();
