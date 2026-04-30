/* =========================================================
   PATTE EN PLUME — Interactions
   - IntersectionObserver pour les reveals au scroll
   - Header sticky (état "scrolled")
   - Menu burger
   - Année auto dans le footer
   - Smooth scroll : déjà géré en CSS via scroll-behavior
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Reveal au scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Header au scroll ---------- */
  const header = document.querySelector('.site-header');
  let lastScroll = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (y > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    lastScroll = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu burger ---------- */
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('primary-menu');

  if (burger && menu) {
    const closeMenu = () => {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    const openMenu = () => {
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };

    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu() : openMenu();
    });

    // Fermer le menu en cliquant sur un lien
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Échap pour fermer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        burger.focus();
      }
    });

    // Fermer si on agrandit la fenêtre au-delà du breakpoint mobile/tablette
    const mq = window.matchMedia('(min-width: 1100px)');
    mq.addEventListener('change', (e) => { if (e.matches) closeMenu(); });
  }

  /* ---------- Année dans le footer ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
