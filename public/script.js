/* ================================================================
   4DAYVELOPMENT — MASTERCLASS 2026
   Advanced Interactions · Three.js Universe · Max Conversion
   ================================================================ */

(function () {
  'use strict';

  /* ── UTILS ──────────────────────────────────────────────── */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const raf = requestAnimationFrame;
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ── 1. ANNOUNCEMENT BAR ──────────────────────────────── */
  function initBar() {
    const bar = $('#announcement-bar');
    if (!bar || sessionStorage.getItem('bar-off')) { bar && bar.remove(); return; }
    document.body.classList.add('bar-visible');
    on($('.bar-close', bar), 'click', () => {
      bar.style.cssText += 'transform:translateY(-100%);opacity:0;transition:all .3s ease;';
      setTimeout(() => { bar.remove(); document.body.classList.remove('bar-visible'); }, 300);
      sessionStorage.setItem('bar-off', '1');
    });
  }

  /* ── 2. SCROLL PROGRESS ───────────────────────────────── */
  function initProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);
    on(window, 'scroll', () => {
      const pct = window.scrollY / (document.body.scrollHeight - innerHeight) * 100;
      bar.style.width = Math.min(pct, 100) + '%';
    }, { passive: true });
  }

  /* ── 3. NAVBAR ────────────────────────────────────────── */
  function initNav() {
    const nav = $('#navbar');
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

    // Hamburger + overlay
    const ham = $('#hamburger');
    const menu = $('#mobile-menu');

    // Créer l'overlay backdrop du menu mobile
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

    // CTA bounce
    const cta = $('.nav-cta');
    if (cta) setInterval(() => {
      cta.classList.add('bounce');
      on(cta, 'animationend', () => cta.classList.remove('bounce'), { once: true });
    }, 6000);
  }

  /* ── 4. CUSTOM CURSOR ─────────────────────────────────── */
  function initCursor() {
    if (matchMedia('(max-width: 768px)').matches) return;
    const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = -200, my = -200, rx = -200, ry = -200, hover = false;

    on(document, 'mousemove', e => { mx = e.clientX; my = e.clientY; });
    on(document, 'mouseover', e => {
      if (e.target.closest('a,button,[class*="card"],[class*="btn"]') && !hover) {
        ring.classList.add('hover'); hover = true;
      }
    });
    on(document, 'mouseout', e => {
      if (e.target.closest('a,button,[class*="card"],[class*="btn"]') && hover) {
        ring.classList.remove('hover'); hover = false;
      }
    });
    on(document, 'mousedown', () => ring.classList.add('click'));
    on(document, 'mouseup',   () => ring.classList.remove('click'));

    function tick() {
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      raf(tick);
    }
    raf(tick);
  }


  /* ── 6. THREE.JS UNIVERSE BACKGROUND ─────────────────── */
  function initThreeUniverse() {
    if (typeof THREE === 'undefined') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Détection appareil bas de gamme (< 4 cœurs ou mobile)
    const isMobile  = matchMedia('(max-width: 768px)').matches;
    const isLowEnd  = (navigator.hardwareConcurrency || 4) <= 2 || isMobile;

    const canvas = document.createElement('canvas');
    canvas.id = 'three-bg';
    canvas.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      z-index:0;pointer-events:none;
      opacity:0;transition:opacity 2.5s ease;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1); // toujours 1 — le plus gros gain de perf
    renderer.setSize(innerWidth, innerHeight);
    camera.position.z = 380;

    // ── STAR FIELD ──────────────────────────────────────
    const starCount = isLowEnd ? 400 : 1200;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      sPos[i*3]   = (Math.random() - 0.5) * 3200;
      sPos[i*3+1] = (Math.random() - 0.5) * 3200;
      sPos[i*3+2] = (Math.random() - 0.5) * 3200;
    }
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const starPts = new THREE.Points(sGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 1.0, transparent: true, opacity: 0.5, sizeAttenuation: true,
    }));
    scene.add(starPts);

    // ── BRAND NEBULA ────────────────────────────────────
    const nebCount = isLowEnd ? 120 : 400;
    const nGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(nebCount * 3);
    const nCol = new Float32Array(nebCount * 3);
    const palette = [
      new THREE.Color('#DA5426'), new THREE.Color('#f2b13b'),
      new THREE.Color('#884083'), new THREE.Color('#e07040'),
    ];
    for (let i = 0; i < nebCount; i++) {
      const r = 300 + Math.random() * 550;
      const θ = Math.random() * Math.PI * 2;
      const φ = Math.acos(2 * Math.random() - 1);
      nPos[i*3]   = r * Math.sin(φ) * Math.cos(θ);
      nPos[i*3+1] = r * Math.sin(φ) * Math.sin(θ);
      nPos[i*3+2] = (Math.random() - 0.5) * 380;
      const c = palette[Math.floor(Math.random() * palette.length)];
      nCol[i*3] = c.r; nCol[i*3+1] = c.g; nCol[i*3+2] = c.b;
    }
    nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3));
    nGeo.setAttribute('color',    new THREE.BufferAttribute(nCol, 3));
    const nebMat = new THREE.PointsMaterial({
      size: 3.5, vertexColors: true, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const nebula = new THREE.Points(nGeo, nebMat);
    scene.add(nebula);

    // ── NEURAL NODES ────────────────────────────────────
    const nCount = isLowEnd ? 30 : 60; // réduit : 110→60/30
    const nodeGeo = new THREE.BufferGeometry();
    const nodePos = new Float32Array(nCount * 3);
    const nodeVel = [];
    for (let i = 0; i < nCount; i++) {
      nodePos[i*3]   = (Math.random() - 0.5) * 850;
      nodePos[i*3+1] = (Math.random() - 0.5) * 560;
      nodePos[i*3+2] = (Math.random() - 0.5) * 200;
      nodeVel.push({
        x: (Math.random() - 0.5) * 0.28,
        y: (Math.random() - 0.5) * 0.28,
        z: (Math.random() - 0.5) * 0.08,
      });
    }
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0xf2b13b, size: 3.5, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodes);

    // ── CONNECTIONS (buffer réutilisé — zéro allocation) ─
    const MAX_LINES = nCount * nCount; // max théorique
    const linePosArr = new Float32Array(MAX_LINES * 6); // 2 points × xyz
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePosArr, 3));
    const lineMat = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      color: 0xf2b13b, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(lineMat);
    const maxDist = 155;

    function rebuildLines() {
      const pos = nodeGeo.attributes.position.array;
      let count = 0;
      for (let i = 0; i < nCount; i++) {
        for (let j = i + 1; j < nCount; j++) {
          const ax=pos[i*3],ay=pos[i*3+1],az=pos[i*3+2];
          const bx=pos[j*3],by=pos[j*3+1],bz=pos[j*3+2];
          const dx=ax-bx, dy=ay-by, dz=az-bz;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < maxDist * maxDist) {
            const base = count * 6;
            linePosArr[base]   = ax; linePosArr[base+1] = ay; linePosArr[base+2] = az;
            linePosArr[base+3] = bx; linePosArr[base+4] = by; linePosArr[base+5] = bz;
            count++;
          }
        }
      }
      lineGeo.setDrawRange(0, count * 2);
      lineGeo.attributes.position.needsUpdate = true;
    }

    // ── MOUSE PARALLAX ───────────────────────────────────
    let mx = 0, my = 0;
    on(document, 'mousemove', e => {
      mx = (e.clientX / innerWidth  - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    });

    on(window, 'resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    }, { passive: true });

    // ── PAUSE QUAND ONGLET CACHÉ ─────────────────────────
    let paused = false;
    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused) raf(animate);
    });

    // ── FPS CAP à 30 ─────────────────────────────────────
    const FPS_INTERVAL = 1000 / 30;
    let lastTime = 0;
    let frame = 0, lineTimer = 0;

    function animate(now = 0) {
      if (paused) return;
      raf(animate);

      const elapsed = now - lastTime;
      if (elapsed < FPS_INTERVAL) return; // saute la frame si trop tôt
      lastTime = now - (elapsed % FPS_INTERVAL);

      frame++;
      const t = frame * 0.006; // ×2 car 30fps au lieu de 60

      // Animate nodes
      const pos = nodeGeo.attributes.position.array;
      for (let i = 0; i < nCount; i++) {
        pos[i*3]   += nodeVel[i].x;
        pos[i*3+1] += nodeVel[i].y;
        pos[i*3+2] += nodeVel[i].z;
        if (Math.abs(pos[i*3])   > 440) nodeVel[i].x *= -1;
        if (Math.abs(pos[i*3+1]) > 295) nodeVel[i].y *= -1;
        if (Math.abs(pos[i*3+2]) > 115) nodeVel[i].z *= -1;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      // Rebuild lines toutes les 20 frames (au lieu de 5)
      if (++lineTimer % 20 === 0) rebuildLines();

      // Rotations
      starPts.rotation.y  = t * 0.035;
      starPts.rotation.x  = t * 0.015;
      nebula.rotation.y   = t * 0.055;
      nebula.rotation.z   = t * 0.025;
      nodes.rotation.y    = t * 0.012;

      // Mouse parallax
      camera.position.x += (mx * 28 - camera.position.x) * 0.02;
      camera.position.y += (-my * 18 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      // Pulsing
      nebMat.opacity  = 0.22 + Math.sin(t * 0.9) * 0.08;
      nodeMat.opacity = 0.55 + Math.sin(t * 1.3) * 0.2;

      // Color cycling — orange → amber → purple → orange
      const cycle  = (Math.sin(t * 0.4) + 1) / 2;
      const phase2 = (Math.sin(t * 0.4 - Math.PI * 2/3) + 1) / 2;
      const r = 0xDA/255 * (1 - phase2) + 0xf2/255 * phase2 * (1 - cycle) + 0x88/255 * cycle;
      const g = 0x54/255 * (1 - phase2) + 0xb1/255 * phase2 * (1 - cycle) + 0x40/255 * cycle;
      const b = 0x26/255 * (1 - phase2) + 0x3b/255 * phase2 * (1 - cycle) + 0x83/255 * cycle;
      nodeMat.color.setRGB(r, g, b);
      lineMat.material.color.setRGB(r, g, b);

      renderer.render(scene, camera);
    }

    raf(animate);
    setTimeout(() => { canvas.style.opacity = '1'; }, 400);
  }

  /* ── 7. SCROLL REVEAL ─────────────────────────────────── */
  function initReveal() {
    const els = $$('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.querySelectorAll('.reveal:not(.visible)')];
        const idx = siblings.indexOf(el);
        const delay = el.dataset.delay || idx * 80;
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('visible');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── 8. COUNTER ANIMATION ─────────────────────────────── */
  function initCounters() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el  = entry.target;
        const end = parseFloat(el.dataset.target);
        const suf = el.dataset.suffix || '';
        const dur = 1800;
        const t0  = performance.now();
        function step(now) {
          const p = Math.min((now - t0) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = (Number.isInteger(end) ? Math.round(e * end) : (e * end).toFixed(0)) + suf;
          if (p < 1) raf(step);
        }
        raf(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    $$('[data-target]').forEach(el => io.observe(el));
  }

  /* ── 9. MAGNETIC BUTTONS ──────────────────────────────── */
  function initMagnetic() {
    if (matchMedia('(max-width: 768px)').matches) return;
    $$('.magnetic').forEach(btn => {
      on(btn, 'mousemove', e => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        btn.style.transform = `translate(${(e.clientX - cx) * 0.22}px, ${(e.clientY - cy) * 0.22}px)`;
        const x = ((e.clientX - r.left) / r.width)  * 100;
        const y = ((e.clientY - r.top)  / r.height) * 100;
        btn.style.setProperty('--mx', x + '%');
        btn.style.setProperty('--my', y + '%');
      });
      on(btn, 'mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ── 10. TEXT SCRAMBLE ────────────────────────────────── */
  function initScramble() {
    if (matchMedia('(max-width: 768px)').matches) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%';
    $$('.section-title').forEach(el => {
      const orig = el.textContent.trim();
      let frame, iv;
      on(el, 'mouseenter', () => {
        clearInterval(iv);
        frame = 0;
        iv = setInterval(() => {
          el.textContent = orig.split('').map((c, i) =>
            c === ' ' ? ' ' : c === '\n' ? '\n' : i < frame ? orig[i] : chars[Math.floor(Math.random() * chars.length)]
          ).join('');
          if (++frame > orig.length) { el.textContent = orig; clearInterval(iv); }
        }, 32);
      });
      on(el, 'mouseleave', () => { clearInterval(iv); el.textContent = orig; });
    });
  }

  /* ── 11. FLOATING CTA ─────────────────────────────────── */
  function initFloatingCTA() {
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

  /* ── 12. SOCIAL PROOF TOASTS (chargés depuis l'API) ───── */
  function initToasts() {
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
      .catch(() => {}); // silencieux si pas de serveur
  }

  /* ── 13. FAQ ACCORDION ────────────────────────────────── */
  function initFAQ() {
    $$('.faq-item').forEach(item => {
      const btn = $('.faq-question', item);
      on(btn, 'click', () => {
        const isOpen = item.classList.contains('open');
        $$('.faq-item.open').forEach(o => o.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── 14. EXIT INTENT ──────────────────────────────────── */
  function initExit() {
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
    on($('#exit-backdrop'), 'click', () => overlay.classList.remove('show'));
    on(document, 'keydown', e => { if (e.key === 'Escape') overlay.classList.remove('show'); });
  }

  /* ── 15. SMOOTH SCROLL ────────────────────────────────── */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(a => {
      on(a, 'click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ── 16. CURSOR GLOW FOLLOWER (subtle) ────────────────── */
  function initGlow() {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position:fixed;width:350px;height:350px;
      background:radial-gradient(circle,rgba(218,84,38,0.06) 0%,transparent 70%);
      border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);
      transition:left .6s cubic-bezier(.23,1,.32,1),top .6s cubic-bezier(.23,1,.32,1);
      z-index:0;
    `;
    document.body.appendChild(glow);
    on(document, 'mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }

  /* ── 17. PERFORMANCE: REDUCED MOTION ─────────────────── */
  function checkMotion() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const s = document.createElement('style');
      s.textContent = '*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;}';
      document.head.appendChild(s);
    }
  }

  /* ── INIT ─────────────────────────────────────────────── */
  function init() {
    checkMotion();
    initBar();
    initProgress();
    initNav();
    initGlow();
    initReveal();
    initCounters();
    initFAQ();
    initSmoothScroll();
    initFloatingCTA();
    initToasts();
    initExit();

    // Deferred for perf
    setTimeout(() => {
      initCursor();
      initMagnetic();
      initScramble();
    }, 150);

    // Three.js after THREE is loaded
    setTimeout(initThreeUniverse, 300);

    // Formulaire Node.js
    initContactForm();

    console.log('%c4DAYVELOPMENT', 'color:#f2b13b;font-size:22px;font-weight:900;font-family:Syne,sans-serif;');
    console.log('%cMasterclass 2026 · Maximum Conversion', 'color:#DA5426;font-size:12px;');
  }

  /* ── FORMULAIRE CONTACT → API Node.js ────────────────── */
  function initContactForm() {
    const form     = $('#contact-form');
    if (!form) return;

    const btnText   = $('#btn-text');
    const btnLoader = $('#btn-loader');
    const btnSubmit = $('#btn-submit');
    const feedback  = $('#form-feedback');

    // Budget chips
    $$('.budget-chip').forEach(chip => {
      on(chip, 'click', () => {
        $$('.budget-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        $('#f-budget').value = chip.dataset.value;
      });
    });

    // Validation temps réel
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

    ['f-name','f-email','f-message'].forEach(id => {
      const el = document.getElementById(id);
      if (el) on(el, 'blur', () => validateField(el));
      if (el) on(el, 'input', () => { if (el.classList.contains('error')) validateField(el); });
    });

    // Soumission
    on(form, 'submit', async (e) => {
      e.preventDefault();

      // Validate all required fields
      const fields = ['f-name','f-email','f-message'].map(id => document.getElementById(id));
      const valid = fields.every(f => validateField(f));
      if (!valid) return;

      // Loading state
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
      } catch (err) {
        feedback.className   = 'form-feedback error visible';
        feedback.textContent = '❌ Erreur réseau. Vérifiez votre connexion et réessayez.';
      } finally {
        btnSubmit.disabled = false;
        btnText.hidden     = false;
        btnLoader.hidden   = true;
      }
    });
  }

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', init);
  } else {
    init();
  }

})();
