/* ── STARS INTERACTIVE ── */
function initStars(canvasId, numStars = 180) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const MOUSE_RADIUS = 140;
  const REPEL_FORCE  = 6;
  const ATTRACT_FORCE = 5;
  const NUM_PURPLE = Math.floor(numStars * 0.3); // 30% violettes

  let mouse = { x: -9999, y: -9999 };
  let W, H, stars;

  function createStar(purple) {
    const size = purple ? Math.random() * 2 + 1 : Math.random() * 2.5 + 0.5;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      ox: 0, oy: 0,
      size,
      purple,
      baseOpacity: Math.random() * 0.6 + 0.2,
      opacity: 0,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      vy: Math.random() * 0.4 + 0.1,
    };
  }

  function resize() {
    const section = canvas.parentElement;
    W = canvas.width  = section.offsetWidth;
    H = canvas.height = section.offsetHeight;
    stars = [
      ...Array.from({ length: numStars - NUM_PURPLE }, () => createStar(false)),
      ...Array.from({ length: NUM_PURPLE },            () => createStar(true)),
    ];
    stars.forEach(s => { s.y = Math.random() * H; s.opacity = s.baseOpacity; });
  }

  window.addEventListener('resize', resize);
  resize();

  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.twinkle += s.twinkleSpeed;
      s.opacity = s.baseOpacity * (0.6 + 0.4 * Math.sin(s.twinkle));

      s.y += s.vy;
      if (s.y > H + 10) { s.y = -10; s.x = Math.random() * W; s.ox = 0; s.oy = 0; }

      const dx = (s.x + s.ox) - mouse.x;
      const dy = (s.y + s.oy) - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS && dist > 0) {
        if (s.purple) {
          // Attraction : se rapproche de la souris
          const force = (1 - dist / MOUSE_RADIUS) * ATTRACT_FORCE;
          s.ox -= (dx / dist) * force;
          s.oy -= (dy / dist) * force;
        } else {
          // Répulsion : s'éloigne de la souris
          const force = (1 - dist / MOUSE_RADIUS) * REPEL_FORCE;
          s.ox += (dx / dist) * force;
          s.oy += (dy / dist) * force;
        }
      }

      s.ox *= 0.92; s.oy *= 0.92;

      const px = s.x + s.ox;
      const py = s.y + s.oy;

      ctx.save();
      ctx.globalAlpha = s.opacity;
      ctx.translate(px, py);

      if (s.purple) {
        // Étoile violette avec halo violet
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size * 4);
        grd.addColorStop(0, 'rgba(167,139,250,0.9)');
        grd.addColorStop(1, 'rgba(124,58,237,0)');
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, s.size, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
      } else {
        // Étoile blanche
        const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, s.size * 3);
        grd.addColorStop(0, 'rgba(200,180,255,0.8)');
        grd.addColorStop(1, 'rgba(200,180,255,0)');
        ctx.beginPath();
        ctx.arc(0, 0, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, s.size, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }

      ctx.restore();
    });
    requestAnimationFrame(draw);
  }

  draw();
}

initStars('stars-canvas', 180);
initStars('stars-canvas-cta', 140);

/* ── CURSOR GLOW ── */
const glow = document.createElement('div');
glow.classList.add('cursor-glow');
document.body.appendChild(glow);

document.addEventListener('mousemove', (e) => {
  glow.style.left = e.clientX + 'px';
  glow.style.top  = e.clientY + 'px';
});

/* ── NAV SHRINK ON SCROLL ── */
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

/* ── SCROLL REVEAL ── */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger delay based on sibling index
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = (idx * 80) + 'ms';
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => observer.observe(el));

/* ── COUNTER ANIMATION ── */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value = target * ease;
    el.textContent = (Number.isInteger(target) ? Math.round(value) : value.toFixed(0)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

const statEls = document.querySelectorAll('[data-target]');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statEls.forEach(el => statObserver.observe(el));

/* ── NAV CTA BOUNCE ── */
const navCta = document.querySelector('.nav-cta');

setInterval(() => {
  navCta.classList.add('bounce');
  navCta.addEventListener('animationend', () => {
    navCta.classList.remove('bounce');
  }, { once: true });
}, 5000);

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
