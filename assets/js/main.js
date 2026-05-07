/* =========================================================
   PATTE EN PLUME — Interactions premium
   100% vanilla, aucune dépendance, IIFE unique.
   - Loader d'intro
   - Reveal scroll enrichi (data-reveal variants + stagger)
   - Header sticky + auto-hide intelligent
   - Scroll progress bar
   - Smooth scroll au click d'ancre (avec offset header)
   - Curseur custom + magnetic (desktop only)
   - Hero parallax 3D souris (desktop only)
   - Cards 3D tilt (desktop only)
   - Témoignages deck cycling
   - Split words (titres animés)
   - View Transitions API (progressive enhancement)
   - Ripple buttons
   - Ambient cursor glow (Contact)
   - Burger menu, année footer (existants, préservés)
   ========================================================= */
(function () {
  'use strict';

  /* ===================== HELPERS ===================== */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineCursor = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Throttle via requestAnimationFrame (déduplique les events scroll/move)
  function rafThrottle(fn) {
    let pending = false;
    let lastArgs;
    return function (...args) {
      lastArgs = args;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        fn.apply(this, lastArgs);
      });
    };
  }

  /* ===================== SPLIT WORDS ===================== */
  // Transforme le textContent d'un .split-words en spans .word, en respectant le HTML inline (em, strong, span.accent).
  function splitWords(el) {
    if (!el || el.dataset.split === '1') return;
    el.dataset.split = '1';
    const stagger = parseInt(el.dataset.staggerWords || '60', 10);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    let wordIndex = 0;
    nodes.forEach(node => {
      const parent = node.parentNode;
      if (!parent) return;
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      const parts = text.split(/(\s+)/);
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          span.style.setProperty('--word-delay', (wordIndex * stagger) + 'ms');
          wordIndex++;
          frag.appendChild(span);
        }
      });
      parent.replaceChild(frag, node);
    });
  }

  /* ===================== LOADER ===================== */
  function boot() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    if (reduce) {
      document.body.classList.add('is-loaded');
      loader.parentNode && loader.parentNode.removeChild(loader);
      return;
    }
    // Au DOMContentLoaded (déjà passé en defer), on attend le load + petit délai pour laisser respirer
    const finish = () => {
      requestAnimationFrame(() => {
        document.body.classList.add('is-loaded');
        // Cleanup après transition
        setTimeout(() => {
          loader && loader.parentNode && loader.parentNode.removeChild(loader);
        }, 800);
      });
    };
    if (document.readyState === 'complete') {
      setTimeout(finish, 350);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 200), { once: true });
      // Fallback sécurité : 2s max
      setTimeout(finish, 2000);
    }
  }
  boot();

  /* ===================== SPLIT WORDS APPLY ===================== */
  try {
    document.querySelectorAll('.split-words').forEach(el => {
      try { splitWords(el); } catch (e) { console.warn('splitWords failed', el, e); }
    });
  } catch (e) { console.warn('splitWords global error', e); }

  /* ===================== REVEAL SCROLL ENRICHI ===================== */
  const revealEls = document.querySelectorAll('.reveal');

  // Préparer les enfants stagger
  document.querySelectorAll('[data-stagger-children]').forEach(parent => {
    const stagger = parseInt(parent.dataset.staggerChildren || '80', 10);
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty('--child-delay', (i * stagger) + 'ms');
    });
  });

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.dataset.staggerChildren) {
            Array.from(entry.target.children).forEach(child => child.classList.add('is-visible'));
          }
          io.unobserve(entry.target);
        }
      });
    }, {
      // Déclenchement quand l'élément est bien dans la zone visible.
      // rootMargin négatif top et bottom = on attend que l'élément soit "en zone"
      // (pas juste au bord du viewport) avant de le révéler.
      threshold: 0.1,
      rootMargin: '-10% 0px -15% 0px'
    });

    revealEls.forEach(el => io.observe(el));
  }

  /* ===================== HEADER STICKY + AUTO-HIDE ===================== */
  const header = document.querySelector('.site-header');
  let lastScroll = 0;
  let scrollDirAccum = 0;
  let menuOpenForceShow = false;

  const onHeaderScroll = rafThrottle(() => {
    const y = window.scrollY;
    const delta = y - lastScroll;

    if (header) {
      // scrolled state
      if (y > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');

      // Auto-hide intelligent (sauf si menu ouvert ou top de page)
      if (!menuOpenForceShow && y > 200) {
        scrollDirAccum += delta;
        if (delta > 0 && scrollDirAccum > 80) {
          header.classList.add('is-hidden');
          scrollDirAccum = 80;
        } else if (delta < 0) {
          header.classList.remove('is-hidden');
          if (scrollDirAccum > 0) scrollDirAccum = 0;
          if (scrollDirAccum < -40) scrollDirAccum = -40;
        }
      } else {
        header.classList.remove('is-hidden');
        scrollDirAccum = 0;
      }
    }

    lastScroll = y;
  });

  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ===================== SCROLL PROGRESS BAR ===================== */
  const progressEl = document.querySelector('.scroll-progress');
  if (progressEl && !reduce) {
    const onProgress = rafThrottle(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      document.documentElement.style.setProperty('--scroll-progress', ratio.toString());
    });
    window.addEventListener('scroll', onProgress, { passive: true });
    window.addEventListener('resize', onProgress, { passive: true });
    onProgress();
  }

  /* ===================== SMOOTH SCROLL AU CLIC D'ANCRE ===================== */
  // Override les liens #ancre pour un scroll lerp doux avec offset header
  function smoothScrollTo(targetY, duration = 900) {
    if (reduce) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      return;
    }
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 4) return;
    const startTime = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    function step(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      const y = startY + distance * ease(t);
      window.scrollTo(0, y);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const id = href.slice(1);
    if (id === 'top') {
      e.preventDefault();
      smoothScrollTo(0);
      history.replaceState(null, '', window.location.pathname);
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const headerH = header ? header.offsetHeight : 80;
    const rect = target.getBoundingClientRect();
    const y = window.scrollY + rect.top - headerH + 1;
    smoothScrollTo(y);
    // Mettre à jour le hash sans saut
    history.replaceState(null, '', '#' + id);
  });

  /* ===================== BURGER MENU ===================== */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('primary-menu');

  if (burger && menu) {
    const closeMenu = () => {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
      menuOpenForceShow = false;
    };
    const openMenu = () => {
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      menuOpenForceShow = true;
      header && header.classList.remove('is-hidden');
    };

    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        burger.focus();
      }
    });

    const mq = window.matchMedia('(min-width: 1100px)');
    mq.addEventListener('change', (e) => { if (e.matches) closeMenu(); });
  }

  /* ===================== ANNÉE FOOTER ===================== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===================== TRAIL DE PATTES + MAGNETIC SUBTIL ===================== */
  if (fineCursor && !reduce) {
    // Markup SVG d'une patte (pour le spawn)
    const PAW_SVG = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="22" rx="7" ry="6"/><ellipse cx="7" cy="13" rx="3" ry="3.5"/><ellipse cx="13" cy="7" rx="3" ry="4"/><ellipse cx="19" cy="7" rx="3" ry="4"/><ellipse cx="25" cy="13" rx="3" ry="3.5"/></svg>';

    let lastSpawnX = -9999, lastSpawnY = -9999;
    let lastSpawnTime = 0;

    function spawnPaw(x, y) {
      const p = document.createElement('span');
      p.className = 'cursor-spawn';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      // Rotation aléatoire entre -45 et +45 deg pour le naturel
      const r = Math.round((Math.random() - 0.5) * 90);
      p.style.setProperty('--r', r + 'deg');
      p.innerHTML = PAW_SVG;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 540);
    }

    window.addEventListener('pointermove', (e) => {
      const dist = Math.hypot(e.clientX - lastSpawnX, e.clientY - lastSpawnY);
      const now = performance.now();
      if (dist > 128 && now - lastSpawnTime > 160) {
        spawnPaw(e.clientX, e.clientY);
        lastSpawnX = e.clientX;
        lastSpawnY = e.clientY;
        lastSpawnTime = now;
      }
    }, { passive: true });

    // Magnetic effect sur les boutons (mouvement TRÈS subtil)
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const strength = 0.08;
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        btn.style.setProperty('--mx', clamp(dx, -4, 4) + 'px');
        btn.style.setProperty('--my', clamp(dy, -4, 4) + 'px');
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ===================== HERO PARALLAX 3D SOURIS ===================== */
  if (fineCursor && !reduce) {
    const hero = document.querySelector('.hero');
    const heroVisual = document.querySelector('.hero-visual');
    const heroPhoto = document.querySelector('.hero-photo');
    const heroDecor = document.querySelectorAll('.hero-decor svg, .hero-decor .hero-orb');
    const heroBlobs = document.querySelectorAll('.hero-blob');

    if (hero && heroVisual) {
      let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
      let active = false;

      hero.addEventListener('pointerenter', () => { active = true; });
      hero.addEventListener('pointerleave', () => { active = false; targetX = 0; targetY = 0; });
      hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 .. 0.5
        targetY = (e.clientY - rect.top) / rect.height - 0.5;
      });

      function loop() {
        currentX = lerp(currentX, targetX, 0.08);
        currentY = lerp(currentY, targetY, 0.08);

        // Photo (subtil)
        if (heroPhoto) {
          heroPhoto.style.setProperty('--tilt-x', (currentY * -4) + 'deg');
          heroPhoto.style.setProperty('--tilt-y', (currentX * 6) + 'deg');
        }

        // Blobs (plus marqué, sens inverse)
        heroBlobs.forEach((blob, i) => {
          const intensity = 14 + i * 4;
          blob.style.transform = `translate(${currentX * -intensity}px, ${currentY * -intensity}px)`;
        });

        // Décor pattes/plumes (parallax léger)
        heroDecor.forEach((el, i) => {
          const factor = 6 + (i % 3) * 4;
          el.style.setProperty('--px', (currentX * factor) + 'px');
          // L'animation float utilise --px en translate, on injecte la valeur
          if (el.classList.contains('hero-orb')) {
            el.style.transform = `translate(${currentX * factor * 1.5}px, ${currentY * factor * 1.5}px)`;
          }
        });

        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

      // Trigger draw des pattes après un petit délai
      setTimeout(() => hero.classList.add('is-drawn'), 600);
    }
  } else {
    // Si pas de pointer fin : trigger draw quand même
    const hero = document.querySelector('.hero');
    if (hero) setTimeout(() => hero.classList.add('is-drawn'), 600);
  }

  /* ===================== CARDS 3D TILT (data-tilt) ===================== */
  if (fineCursor && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const max = 6;
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;  // 0..1
        const py = (e.clientY - rect.top) / rect.height;
        const tiltY = (px - 0.5) * 2 * max;
        const tiltX = -(py - 0.5) * 2 * max;
        card.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');
        // Pour le glow
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

  /* ===================== POURQUOI PHOTO PARALLAX SCROLL ===================== */
  if (!reduce) {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (parallaxEls.length) {
      const onParallax = rafThrottle(() => {
        const vh = window.innerHeight;
        parallaxEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > vh) return;
          const factor = parseFloat(el.dataset.parallax || '0.1');
          const center = rect.top + rect.height / 2;
          const offset = (center - vh / 2) * factor * -1;
          el.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
        });
      });
      window.addEventListener('scroll', onParallax, { passive: true });
      window.addEventListener('resize', onParallax, { passive: true });
      onParallax();
    }
  }

  /* ===================== RIPPLE BUTTONS ===================== */
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (reduce) return;
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height) * 1.4;
      ripple.style.width = size + 'px';
      ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);
    });
  });

  /* ===================== AMBIENT CURSOR GLOW (CONTACT) ===================== */
  const contactSection = document.querySelector('.contact');
  const ambientGlow = contactSection ? contactSection.querySelector('.ambient-cursor-glow') : null;
  if (contactSection && ambientGlow && !reduce) {
    const onContactMove = rafThrottle((e) => {
      const rect = contactSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      ambientGlow.style.setProperty('--glow-x', x + '%');
      ambientGlow.style.setProperty('--glow-y', y + '%');
    });
    contactSection.addEventListener('pointermove', onContactMove);
  }

  /* ===================== SCROLL INDICATOR FADE ===================== */
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator && !reduce) {
    const onScrollIndicator = rafThrottle(() => {
      const ratio = clamp(window.scrollY / 300, 0, 1);
      scrollIndicator.style.opacity = (1 - ratio).toString();
    });
    window.addEventListener('scroll', onScrollIndicator, { passive: true });
  }

})();
