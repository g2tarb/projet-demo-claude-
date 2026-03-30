/* ── Navigation : bar, progress, navbar, smooth scroll, floating CTA ── */
import { $, $$, on } from './utils.js';

export function initPageTransition() {
  const overlay = $('#page-transition');
  if (!overlay) return;

  // Sélectionne tous les liens vers les formes externes
  const formLinks = $$('a[href="/essentiel.html"], a[href="/lead.html"]');

  formLinks.forEach(link => {
    on(link, 'click', e => {
      e.preventDefault();
      const target = link.getAttribute('href');
      overlay.style.pointerEvents = 'all';
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = target; }, 460);
    });
  });
}

export function initBar() {
  const bar = $('#announcement-bar');
  if (!bar || sessionStorage.getItem('bar-off')) { bar && bar.remove(); return; }
  document.body.classList.add('bar-visible');
  on($('.bar-close'), 'click', () => {
    bar.style.cssText += 'transform:translateY(-100%);opacity:0;transition:all .3s ease;';
    setTimeout(() => { bar.remove(); document.body.classList.remove('bar-visible'); }, 300);
    sessionStorage.setItem('bar-off', '1');
  });
}

export function initProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);
  on(window, 'scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

export function initNav() {
  const nav = $('#navbar');
  if (!nav) return;
  let lastY = 0;
  on(window, 'scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 60);
    if (y > 350) {
      nav.style.transform = y > lastY + 5 ? 'translateY(-110%)' : 'translateY(0)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    nav.style.transition = 'transform .4s cubic-bezier(0.4,0,0.2,1), all .4s cubic-bezier(0.4,0,0.2,1)';
    lastY = y;
  }, { passive: true });

  const ham = $('#hamburger');
  const menu = $('#mobile-menu');
  if (!ham || !menu) return;

  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  function openMenu() {
    ham.classList.add('open');
    menu.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    ham.classList.remove('open');
    menu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  on(ham, 'click', () => menu.classList.contains('open') ? closeMenu() : openMenu());
  $$('.mobile-menu a').forEach(a => on(a, 'click', closeMenu));
  on(overlay, 'click', closeMenu);
  on(document, 'keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const cta = $('.nav-cta');
  if (cta) setInterval(() => {
    cta.classList.add('bounce');
    on(cta, 'animationend', () => cta.classList.remove('bounce'), { once: true });
  }, 6000);
}

export function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    on(a, 'click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

export function initFloatingCTA() {
  const main = $('#fcta-main');
  const menu = $('#fcta-menu');
  if (!main || !menu) return;
  let open = false;
  on(main, 'click', () => {
    open = !open;
    menu.classList.toggle('open', open);
    main.style.transform = open ? 'scale(1.1) rotate(135deg)' : '';
  });
  on(document, 'click', e => {
    if (!e.target.closest('#floating-cta')) {
      open = false; menu.classList.remove('open'); main.style.transform = '';
    }
  });
}
