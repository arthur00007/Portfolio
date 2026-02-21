/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO — SCRIPT.JS
   Awwwards-level cinematic developer portfolio
   Author: DEV · 2026
   All vanilla JS — no libraries, no frameworks
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILITY: Wait for DOM ready
   ───────────────────────────────────────────────────────────── */
function onReady(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Custom Cursor
   — Dual-layer cursor with magnetic hover effects
   — Gracefully disabled on touch devices
   ───────────────────────────────────────────────────────────── */
function initCursor() {
  const cursor    = document.getElementById('cursor');
  const trail     = document.getElementById('cursorTrail');
  if (!cursor || !trail) return;

  // Disable on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mouseX = -100;
  let mouseY = -100;
  let trailX = -100;
  let trailY = -100;
  let animFrame;

  // Track raw mouse position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth trail loop using requestAnimationFrame
  function renderCursor() {
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';

    // Lerp trail toward mouse
    trailX += (mouseX - trailX) * 0.12;
    trailY += (mouseY - trailY) * 0.12;

    trail.style.left = trailX + 'px';
    trail.style.top  = trailY + 'px';

    animFrame = requestAnimationFrame(renderCursor);
  }

  renderCursor();

  // Hover state on interactive elements
  const hoverTargets = document.querySelectorAll('a, button, [data-hover], .skill-card, .project-card, .philosophy__card');

  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  // Click effect
  document.addEventListener('mousedown', () => cursor.classList.add('cursor--click'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('cursor--click'));

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    trail.style.opacity  = '0';
  });

  document.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    trail.style.opacity  = '0.4';
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Navbar
   — Scroll-triggered style transformation
   — Active link highlight based on scroll position
   — Mobile menu toggle
   ───────────────────────────────────────────────────────────── */
function initNav() {
  const nav         = document.getElementById('nav');
  const menuToggle  = document.getElementById('menuToggle');
  const mobileMenu  = document.getElementById('mobileMenu');
  const navLinks    = document.querySelectorAll('.nav__link');
  const mobileLinks = document.querySelectorAll('.mobile-menu__link');

  if (!nav) return;

  // ── Scroll transformation ────────────────────────────────
  function updateNavOnScroll() {
    if (window.scrollY > 60) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', updateNavOnScroll, { passive: true });
  updateNavOnScroll();

  // ── Active section tracking ──────────────────────────────
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    let currentId = '';
    const scrollMid = window.scrollY + window.innerHeight * 0.35;

    sections.forEach((sec) => {
      if (sec.offsetTop <= scrollMid) {
        currentId = sec.id;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ── Mobile menu toggle ───────────────────────────────────
  function openMenu() {
    mobileMenu.classList.add('is-open');
    menuToggle.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menuToggle.addEventListener('click', () => {
    if (mobileMenu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  // Close on outside click
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Hero Particle Canvas
   — WebGL-free, high-performance particle system using Canvas 2D
   — Particles connect to mouse and each other via proximity lines
   ───────────────────────────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  let mouseX = -9999;
  let mouseY = -9999;
  let particles = [];
  let animFrame;

  const CONFIG = {
    count:        60,        // particle count (will scale down on mobile)
    maxDist:      140,       // max connection distance
    mouseDist:    180,       // mouse interaction radius
    minSize:      1,
    maxSize:      2.5,
    speed:        0.35,
    color:        '123, 94, 167',
    mouseColor:   '6, 182, 212',
  };

  // Particle factory
  function createParticle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
      r:  CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize),
      opacity: 0.2 + Math.random() * 0.5,
    };
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function initParticleList() {
    const isMobile = window.innerWidth < 768;
    const count    = isMobile ? Math.floor(CONFIG.count * 0.5) : CONFIG.count;
    particles      = Array.from({ length: count }, createParticle);
  }

  function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update positions
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0)  p.x = W;
      if (p.x > W)  p.x = 0;
      if (p.y < 0)  p.y = H;
      if (p.y > H)  p.y = 0;

      // Mouse attraction (subtle)
      const dx = mouseX - p.x;
      const dy = mouseY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseDist) {
        const force = (1 - dist / CONFIG.mouseDist) * 0.003;
        p.vx += dx * force;
        p.vy += dy * force;
      }

      // Speed limit
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > CONFIG.speed * 2) {
        p.vx = (p.vx / speed) * CONFIG.speed * 2;
        p.vy = (p.vy / speed) * CONFIG.speed * 2;
      }
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dist = getDistance(particles[i], particles[j]);
        if (dist < CONFIG.maxDist) {
          const alpha = (1 - dist / CONFIG.maxDist) * 0.25;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Mouse connections
      const mouseDist = getDistance(particles[i], { x: mouseX, y: mouseY });
      if (mouseDist < CONFIG.mouseDist) {
        const alpha = (1 - mouseDist / CONFIG.mouseDist) * 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = `rgba(${CONFIG.mouseColor}, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Draw particles
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.color}, ${p.opacity})`;
      ctx.fill();
    });

    animFrame = requestAnimationFrame(draw);
  }

  // Mouse tracking (relative to hero section)
  const hero = document.getElementById('hero');
  document.addEventListener('mousemove', (e) => {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  document.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
  });

  // Initialize
  resize();
  initParticleList();
  draw();

  // Responsive resize
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(animFrame);
    resize();
    initParticleList();
    draw();
  });
  resizeObserver.observe(canvas);
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Hero Typing Animation
   — Multi-phrase typewriter with erase and retype cycle
   — Respects prefers-reduced-motion
   ───────────────────────────────────────────────────────────── */
function initTyping() {
  const el = document.getElementById('typingText');
  if (!el) return;

  const PHRASES = [
    'Frontend Developer',
    'Open Source Contributor',
    'Linux User',
    'Anime + Gaming Enthusiast',
    'Vanilla JS Advocate',
  ];

  const SPEED_TYPE  = 75;   // ms per character
  const SPEED_ERASE = 35;   // ms per erase
  const PAUSE_AFTER = 2200; // ms pause after full phrase
  const PAUSE_NEXT  = 400;  // ms pause before next phrase

  // Skip animation for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = PHRASES[0];
    return;
  }

  let phraseIndex   = 0;
  let charIndex     = 0;
  let isErasing     = false;
  let timeoutHandle;

  function tick() {
    const currentPhrase = PHRASES[phraseIndex];

    if (!isErasing) {
      // Typing
      charIndex++;
      el.textContent = currentPhrase.slice(0, charIndex);

      if (charIndex === currentPhrase.length) {
        // Phrase complete — pause then start erasing
        isErasing = true;
        timeoutHandle = setTimeout(tick, PAUSE_AFTER);
        return;
      }

      // Slight natural variance in typing speed
      const jitter = (Math.random() - 0.5) * 30;
      timeoutHandle = setTimeout(tick, SPEED_TYPE + jitter);
    } else {
      // Erasing
      charIndex--;
      el.textContent = currentPhrase.slice(0, charIndex);

      if (charIndex === 0) {
        // Move to next phrase
        isErasing    = false;
        phraseIndex  = (phraseIndex + 1) % PHRASES.length;
        timeoutHandle = setTimeout(tick, PAUSE_NEXT);
        return;
      }

      timeoutHandle = setTimeout(tick, SPEED_ERASE);
    }
  }

  // Start with a delay to let hero entrance animation settle
  timeoutHandle = setTimeout(tick, 1600);
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Scroll-Triggered Reveal
   — IntersectionObserver for performance
   — Staggered delay support via data-delay attribute
   ───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
  if (!elements.length) return;

  // Immediately reveal all if reduced motion is preferred
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || 0, 10);
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold:  0.12,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Skill Meters
   — Animates the meter fill bars when cards scroll into view
   ───────────────────────────────────────────────────────────── */
function initSkillMeters() {
  const meters = document.querySelectorAll('.skill-card__meter-fill');
  if (!meters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    meters.forEach((m) => {
      m.style.width = m.dataset.width + '%';
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fill    = entry.target;
          const card    = fill.closest('.skill-card');
          const delay   = parseInt(card?.dataset.delay || 0, 10);

          setTimeout(() => {
            fill.style.width = fill.dataset.width + '%';
          }, delay + 300);

          observer.unobserve(fill);
        }
      });
    },
    { threshold: 0.5 }
  );

  meters.forEach((m) => {
    m.style.width = '0%';
    observer.observe(m);
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Radar Chart
   — Draws a pentagon radar chart on <canvas> using Canvas 2D
   — Animated on scroll into view
   ───────────────────────────────────────────────────────────── */
function initRadar() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const CX   = canvas.width  / 2;
  const CY   = canvas.height / 2;
  const R    = Math.min(CX, CY) * 0.78;

  // Skill values (0–1 scale) matching HTML card order: HTML, CSS, JS, Python, C
  const SKILLS = [0.95, 0.90, 0.88, 0.82, 0.75];
  const SIDES  = SKILLS.length;
  const RINGS  = 4;

  // Reduce animation if preference set
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let progress     = reduced ? 1 : 0;
  let animFrame;
  let hasStarted   = false;

  // Convert polar to cartesian
  function toXY(ring, index, scale = 1) {
    const angle = (Math.PI * 2 * index) / SIDES - Math.PI / 2;
    const r     = ring * R * scale;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  }

  function drawRadar(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Background rings ────────────────────────────────
    for (let ring = 1; ring <= RINGS; ring++) {
      const frac = ring / RINGS;
      ctx.beginPath();
      for (let i = 0; i < SIDES; i++) {
        const p = toXY(frac, i);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else         ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(123, 94, 167, 0.12)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Ring fill (innermost only)
      if (ring === 1) {
        ctx.fillStyle = 'rgba(123, 94, 167, 0.04)';
        ctx.fill();
      }
    }

    // ── Axis lines ──────────────────────────────────────
    for (let i = 0; i < SIDES; i++) {
      const outer = toXY(1, i);
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(outer.x, outer.y);
      ctx.strokeStyle = 'rgba(123, 94, 167, 0.12)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // ── Skill area (animated) ────────────────────────────
    // Create gradient fill
    const gradient = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    gradient.addColorStop(0, 'rgba(167, 139, 250, 0.3)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.08)');

    ctx.beginPath();
    for (let i = 0; i < SIDES; i++) {
      const val = SKILLS[i] * t;       // animated scale 0→1
      const p   = toXY(val, i);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else         ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle   = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // ── Skill dot nodes ─────────────────────────────────
    for (let i = 0; i < SIDES; i++) {
      const val = SKILLS[i] * t;
      const p   = toXY(val, i);

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#a78bfa';
      ctx.fill();
    }
  }

  function animate() {
    if (progress < 1) {
      progress = Math.min(1, progress + 0.025);
      drawRadar(easeOutExpo(progress));
      animFrame = requestAnimationFrame(animate);
    } else {
      drawRadar(1);
    }
  }

  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  // Start animation when canvas enters viewport
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !hasStarted) {
        hasStarted = true;
        animate();
        observer.unobserve(canvas);
      }
    },
    { threshold: 0.4 }
  );

  if (reduced) {
    drawRadar(1);
  } else {
    observer.observe(canvas);
  }
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Radar Labels Positioning
   — Positions CSS radar labels around the canvas via polar math
   ───────────────────────────────────────────────────────────── */
function initRadarLabels() {
  const wrap   = document.querySelector('.skills__radar-wrap');
  const labels = document.querySelectorAll('.radar-label');
  if (!wrap || !labels.length) return;

  const SKILLS    = ['HTML', 'CSS', 'JS', 'Python', 'C'];
  const SIDES     = SKILLS.length;
  const PADDING   = 24; // px from pentagon edge to label
  const SIZE      = wrap.offsetWidth;
  const CX        = SIZE / 2;
  const CY        = SIZE / 2;
  const R         = Math.min(CX, CY) * 0.78 + PADDING;

  labels.forEach((label, i) => {
    const angle = (Math.PI * 2 * i) / SIDES - Math.PI / 2;
    const x     = CX + R * Math.cos(angle);
    const y     = CY + R * Math.sin(angle);

    label.style.position  = 'absolute';
    label.style.left      = x + 'px';
    label.style.top       = y + 'px';
    label.style.transform = 'translate(-50%, -50%)';
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Project Cards — 3D Tilt Effect
   — Subtle mouse-tracked perspective tilt on hover
   ───────────────────────────────────────────────────────────── */
function initProjectTilt() {
  const cards = document.querySelectorAll('.project-card__inner');
  if (!cards.length) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const MAX_TILT = 6; // degrees

  cards.forEach((card) => {
    let animFrame;

    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(animFrame);

      animFrame = requestAnimationFrame(() => {
        const rect   = card.getBoundingClientRect();
        const relX   = (e.clientX - rect.left) / rect.width  - 0.5;
        const relY   = (e.clientY - rect.top)  / rect.height - 0.5;
        const tiltX  = -relY * MAX_TILT;
        const tiltY  =  relX * MAX_TILT;

        card.style.transform = `
          translateY(-8px)
          rotateX(${tiltX}deg)
          rotateY(${tiltY}deg)
        `;
      });
    });

    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(animFrame);
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s, box-shadow 0.4s';

      // Reset transition override after animation
      setTimeout(() => {
        card.style.transition = '';
      }, 600);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Contact Form Validation
   — Full client-side validation with real-time feedback
   — Animated success state on valid submission
   — No backend required
   ───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const success   = document.getElementById('formSuccess');
  if (!form) return;

  const fields = {
    name:    document.getElementById('inputName'),
    email:   document.getElementById('inputEmail'),
    message: document.getElementById('inputMessage'),
  };

  // ── Validation rules ─────────────────────────────────────
  const validators = {
    name: (val) => {
      if (!val.trim())          return 'Codename required.';
      if (val.trim().length < 2) return 'Must be at least 2 characters.';
      return null;
    },
    email: (val) => {
      if (!val.trim()) return 'Signal frequency required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Invalid frequency format.';
      return null;
    },
    message: (val) => {
      if (!val.trim())           return 'Transmission cannot be empty.';
      if (val.trim().length < 10) return 'Transmission too short (min 10 chars).';
      return null;
    },
  };

  // ── Field state helpers ──────────────────────────────────
  function setError(fieldKey, message) {
    const wrapper  = fields[fieldKey].closest('.form-field');
    const errorEl  = wrapper.querySelector('.form-field__error');
    wrapper.classList.add('has-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldKey) {
    const wrapper = fields[fieldKey].closest('.form-field');
    const errorEl = wrapper.querySelector('.form-field__error');
    wrapper.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
  }

  // ── Real-time validation on blur/input ───────────────────
  Object.keys(fields).forEach((key) => {
    const input = fields[key];

    input.addEventListener('blur', () => {
      const error = validators[key](input.value);
      if (error) setError(key, error);
      else       clearError(key);
    });

    input.addEventListener('input', () => {
      // Clear error on typing to give responsive feedback
      if (input.closest('.form-field').classList.contains('has-error')) {
        const error = validators[key](input.value);
        if (!error) clearError(key);
      }
    });
  });

  // ── Form submission ──────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all fields
    let isValid = true;

    Object.keys(fields).forEach((key) => {
      const error = validators[key](fields[key].value);
      if (error) {
        setError(key, error);
        isValid = false;
      } else {
        clearError(key);
      }
    });

    if (!isValid) {
      // Shake the submit button on failure
      submitBtn.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-8px)' },
          { transform: 'translateX(8px)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(6px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 400, easing: 'ease' }
      );
      return;
    }

    // ── Submit to Netlify Forms via fetch (AJAX) ─────────
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    const formData = new FormData(form);

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    })
      .then(() => {
        submitBtn.classList.remove('is-loading');

        // Hide form, show success
        form.style.opacity    = '0';
        form.style.transition = 'opacity 0.3s';

        setTimeout(() => {
          form.style.display = 'none';
          success.removeAttribute('aria-hidden');
          success.classList.add('is-visible');
        }, 300);
      })
      .catch(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        // Show inline error if transmission fails
        let errEl = form.querySelector('.form-submit-error');
        if (!errEl) {
          errEl = document.createElement('p');
          errEl.className  = 'form-submit-error';
          errEl.style.cssText = 'color:var(--col-error);font-family:var(--font-mono);font-size:0.72rem;text-align:center;margin-top:8px;letter-spacing:0.05em;';
          submitBtn.insertAdjacentElement('afterend', errEl);
        }
        errEl.textContent = 'TRANSMISSION FAILED · PLEASE RETRY';
      });
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Smooth Scroll
   — Enhances anchor link clicks for smooth scrolling
   — Accounts for fixed navbar height
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  const NAV_HEIGHT = 70;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Parallax Orbs
   — Subtle mouse-driven parallax on hero background orbs
   ───────────────────────────────────────────────────────────── */
function initParallax() {
  const orb1 = document.querySelector('.hero__orb--1');
  const orb2 = document.querySelector('.hero__orb--2');
  const orb3 = document.querySelector('.hero__orb--3');

  if (!orb1 || !orb2 || !orb3) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let targetX = 0;
  let targetY = 0;
  let curX    = 0;
  let curY    = 0;

  document.addEventListener('mousemove', (e) => {
    const rx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ry = (e.clientY / window.innerHeight - 0.5) * 2;
    targetX  = rx;
    targetY  = ry;
  });

  function animateOrbs() {
    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;

    orb1.style.transform = `translate(${curX * 20}px, ${curY * 20}px)`;
    orb2.style.transform = `translate(${-curX * 15}px, ${-curY * 15}px)`;
    orb3.style.transform = `translate(${curX * 30}px, ${curY * 30}px)`;

    requestAnimationFrame(animateOrbs);
  }

  animateOrbs();
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Section Progress Indicator
   — Animates a subtle page progress line in the navbar
   ───────────────────────────────────────────────────────────── */
function initProgressIndicator() {
  // Create progress bar element
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    width: 0%;
    background: linear-gradient(90deg, #7b5ea7, #a78bfa, #06b6d4);
    z-index: 101;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width  = `${progress}%`;
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Identity Philosophy Cards Keyboard Support
   — Makes hover-reveal cards accessible via keyboard focus
   ───────────────────────────────────────────────────────────── */
function initPhilosophyCards() {
  const cards = document.querySelectorAll('.philosophy__card');

  cards.forEach((card) => {
    // Make focusable
    card.setAttribute('tabindex', '0');

    card.addEventListener('focus', () => card.classList.add('keyboard-focus'));
    card.addEventListener('blur',  () => card.classList.remove('keyboard-focus'));
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Count-Up Stat Animation
   — For dossier or any numeric values
   — Triggered on scroll into view
   ───────────────────────────────────────────────────────────── */
function initCountUp() {
  // Not used in current markup but available for extension
  // Placeholder for future stat counters
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Intersection-based section class toggling
   — Adds .in-view class to sections for CSS targeting
   ───────────────────────────────────────────────────────────── */
function initSectionObserver() {
  const sections = document.querySelectorAll('section[id]');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    },
    {
      threshold: 0.2,
    }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Noise Texture Overlay
   — Generates an animated SVG noise texture for depth on hero
   — Pure JS canvas approach, very lightweight
   ───────────────────────────────────────────────────────────── */
function initNoiseOverlay() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = `
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 160px 160px;
    animation: noiseShift 0.5s steps(1) infinite;
  `;

  // Add animation keyframes dynamically
  if (!document.getElementById('noise-style')) {
    const style  = document.createElement('style');
    style.id     = 'noise-style';
    style.textContent = `
      @keyframes noiseShift {
        0%  { background-position: 0 0; }
        20% { background-position: -40px 20px; }
        40% { background-position: 20px -30px; }
        60% { background-position: -20px 40px; }
        80% { background-position: 30px -10px; }
      }
    `;
    document.head.appendChild(style);
  }

  hero.appendChild(overlay);
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Glitch Text Effect on Hero Name
   — Subtle CSS-class-based glitch applied randomly
   ───────────────────────────────────────────────────────────── */
function initGlitchEffect() {
  const nameLines = document.querySelectorAll('.hero__name-line');
  if (!nameLines.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Add glitch CSS if not already injected
  if (!document.getElementById('glitch-style')) {
    const style      = document.createElement('style');
    style.id         = 'glitch-style';
    style.textContent = `
      .glitch {
        animation: glitchPop 0.3s steps(2) forwards;
      }
      @keyframes glitchPop {
        0%   { clip-path: inset(40% 0 50% 0); transform: translate(-4px, 0) skewX(-2deg); }
        20%  { clip-path: inset(10% 0 85% 0); transform: translate(4px, 0) skewX(1deg); }
        40%  { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 0); }
        60%  { clip-path: inset(20% 0 60% 0); transform: translate(2px, 0) skewX(-1deg); }
        80%  { clip-path: inset(80% 0 5%  0); transform: translate(-4px, 0); }
        100% { clip-path: inset(0% 0 0% 0);   transform: translate(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Trigger random glitch on accent line every 6–12s
  const accentLine = nameLines[1];
  if (!accentLine) return;

  function triggerGlitch() {
    accentLine.classList.add('glitch');
    setTimeout(() => accentLine.classList.remove('glitch'), 350);
    // Schedule next glitch
    const nextDelay = 6000 + Math.random() * 6000;
    setTimeout(triggerGlitch, nextDelay);
  }

  // Start after hero animation settles
  setTimeout(triggerGlitch, 4000);
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Terminal Typing Effect in Contact Header
   — Animates the terminal title on scroll into view
   ───────────────────────────────────────────────────────────── */
function initTerminalEffect() {
  const terminal = document.querySelector('.terminal');
  if (!terminal) return;

  const statusEl = terminal.querySelector('.terminal__status');
  if (!statusEl) return;

  const messages = ['● ACTIVE', '● STANDBY', '● ACTIVE'];
  let i = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        // Cycle terminal status text
        const interval = setInterval(() => {
          i = (i + 1) % messages.length;
          statusEl.textContent = messages[i];
          if (i === messages.length - 1) clearInterval(interval);
        }, 500);

        observer.unobserve(terminal);
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(terminal);
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Footer Year
   — Ensures the copyright year is always current
   ───────────────────────────────────────────────────────────── */
function initFooterYear() {
  const copy = document.querySelector('.footer__copy');
  if (!copy) return;

  const year = new Date().getFullYear();
  copy.textContent = `© ${year} · Crafted with precision`;
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Performance — Pause animations when tab is hidden
   — Reduces CPU/GPU load when user switches tabs
   ───────────────────────────────────────────────────────────── */
function initVisibilityOptimization() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.style.setProperty('--anim-play', 'paused');
    } else {
      document.body.style.setProperty('--anim-play', 'running');
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Hero scroll fade
   — Fades hero content slightly as user scrolls down
   ───────────────────────────────────────────────────────────── */
function initHeroScrollFade() {
  const heroContent = document.querySelector('.hero__content');
  const heroScroll  = document.querySelector('.hero__scroll');
  if (!heroContent) return;

  window.addEventListener('scroll', () => {
    const progress = Math.min(window.scrollY / window.innerHeight, 1);
    const opacity  = 1 - progress * 1.4;
    const translate = progress * 40;

    if (opacity >= 0) {
      heroContent.style.opacity   = opacity;
      heroContent.style.transform = `translateY(${translate}px)`;
    }

    if (heroScroll) {
      heroScroll.style.opacity = Math.max(0, 1 - progress * 3);
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   MODULE: Keyboard accessibility
   — Skip-link support
   — Focus trap in mobile menu
   ───────────────────────────────────────────────────────────── */
function initA11y() {
  // Skip link (if added to HTML)
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const main = document.querySelector('main');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus();
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════════
   INITIALIZATION
   — Boot order matters: cursor → nav → hero → sections
   ═══════════════════════════════════════════════════════════════ */
onReady(function () {
  // Core UI
  initCursor();
  initNav();
  initSmoothScroll();
  initProgressIndicator();

  // Hero scene
  initNoiseOverlay();
  initParticles();
  initTyping();
  initParallax();
  initGlitchEffect();
  initHeroScrollFade();

  // Content sections
  initScrollReveal();
  initSkillMeters();
  initRadar();
  initRadarLabels();
  initPhilosophyCards();
  initProjectTilt();

  // Contact
  initContactForm();
  initTerminalEffect();

  // Utility
  initSectionObserver();
  initFooterYear();
  initVisibilityOptimization();
  initA11y();
});

/* ─────────────────────────────────────────────────────────────
   RESIZE: Re-run layout-sensitive logic on resize
   — Debounced to avoid excessive recalculation
   ───────────────────────────────────────────────────────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initRadarLabels();
    initRadar();
  }, 250);
}, { passive: true });
