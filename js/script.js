/* ============================================================
   Global Dental Care — Site Scripts
   Vanilla JS · No dependencies
   ============================================================ */
(function () {
  'use strict';

  /* -------------------------------------------------------- */
  /* 1. Helpers                                               */
  /* -------------------------------------------------------- */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initStickyHeader();
    initMobileNav();
    initSmoothScroll();
    initRevealOnScroll();
    initTestimonialSlider();
    initBackToTop();
    initContactForm();
    initYearStamp();
  }

  /* -------------------------------------------------------- */
  /* 2. Sticky header shadow on scroll                        */
  /* -------------------------------------------------------- */
  function initStickyHeader() {
    const header = $('#header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    on(window, 'scroll', onScroll, { passive: true });
  }

  /* -------------------------------------------------------- */
  /* 3. Mobile navigation                                     */
  /* -------------------------------------------------------- */
  function initMobileNav() {
    const hamburger = $('#hamburger');
    const nav       = $('#nav');
    const closeBtn  = $('#navClose');
    if (!hamburger || !nav) return;

    // Insert overlay element once
    let overlay = $('.nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-overlay';
      document.body.appendChild(overlay);
    }

    const open  = () => {
      nav.classList.add('is-open');
      overlay.classList.add('is-open');
      hamburger.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('body--locked');
    };
    const close = () => {
      nav.classList.remove('is-open');
      overlay.classList.remove('is-open');
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('body--locked');
    };
    const toggle = () => nav.classList.contains('is-open') ? close() : open();

    on(hamburger, 'click', toggle);
    on(closeBtn,  'click', close);

    // Overlay click closes — but only if user actually tapped the overlay,
    // not a child or a bubbled event from the drawer panel.
    on(overlay, 'click', (e) => {
      if (e.target === overlay) close();
    });

    // Close drawer on link click. Do NOT preventDefault — let the browser navigate.
    $$('.nav__link, .nav__cta', nav).forEach(link => {
      on(link, 'click', () => {
        if (window.innerWidth <= 960) close();
      });
    });

    // Close on Escape
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
    });

    // Reset state if user resizes back to desktop
    on(window, 'resize', () => {
      if (window.innerWidth > 960) close();
    });
  }

  /* -------------------------------------------------------- */
  /* 4. Smooth scroll for in-page anchors                     */
  /*    (CSS already does scroll-behavior: smooth, but we     */
  /*     offset the sticky header for accuracy)               */
  /* -------------------------------------------------------- */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      on(link, 'click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        const headerH = ($('#header')?.offsetHeight || 0) + 8;
        const y = target.getBoundingClientRect().top + window.scrollY - headerH;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* -------------------------------------------------------- */
  /* 5. Reveal-on-scroll via IntersectionObserver             */
  /* -------------------------------------------------------- */
  function initRevealOnScroll() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // tiny stagger for siblings
          const delay = entry.target.dataset.revealDelay
            || (Array.from(entry.target.parentElement?.children || []).indexOf(entry.target) * 60);
          entry.target.style.transitionDelay = Math.min(delay, 280) + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => io.observe(el));
  }

  /* -------------------------------------------------------- */
  /* 6. Testimonial slider                                    */
  /* -------------------------------------------------------- */
  function initTestimonialSlider() {
    const track = $('#sliderTrack');
    const prev  = $('#prevBtn');
    const next  = $('#nextBtn');
    const dots  = $('#sliderDots');
    if (!track) return;

    const slides = $$('.testimonial', track);
    if (!slides.length) return;

    // visiblePerView is computed from the rendered slide width
    const visiblePerView = () => {
      const trackW = track.clientWidth;
      const slideW = slides[0].getBoundingClientRect().width;
      const gap    = parseFloat(getComputedStyle(track).gap) || 0;
      return Math.max(1, Math.round((trackW + gap) / (slideW + gap)));
    };

    const totalGroups = () => Math.max(1, slides.length - visiblePerView() + 1);

    // Build dots
    const buildDots = () => {
      if (!dots) return;
      dots.innerHTML = '';
      const count = totalGroups();
      for (let i = 0; i < count; i++) {
        const d = document.createElement('button');
        d.className = 'slider__dot';
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Go to slide ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dots.appendChild(d);
      }
      updateDots();
    };

    const currentIndex = () => {
      const slideW = slides[0].getBoundingClientRect().width;
      const gap    = parseFloat(getComputedStyle(track).gap) || 0;
      return Math.round(track.scrollLeft / (slideW + gap));
    };

    const updateDots = () => {
      if (!dots) return;
      const idx = Math.min(currentIndex(), totalGroups() - 1);
      $$('.slider__dot', dots).forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };

    const goTo = (idx) => {
      const slideW = slides[0].getBoundingClientRect().width;
      const gap    = parseFloat(getComputedStyle(track).gap) || 0;
      track.scrollTo({ left: idx * (slideW + gap), behavior: 'smooth' });
    };

    on(prev, 'click', () => {
      const i = currentIndex();
      goTo(i <= 0 ? totalGroups() - 1 : i - 1);
    });
    on(next, 'click', () => {
      const i = currentIndex();
      goTo(i >= totalGroups() - 1 ? 0 : i + 1);
    });

    on(track, 'scroll', () => {
      window.requestAnimationFrame(updateDots);
    }, { passive: true });

    let resizeT;
    on(window, 'resize', () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(buildDots, 150);
    });

    // Auto-play (pause on hover / when tab hidden)
    let auto = setInterval(() => {
      if (document.hidden) return;
      const i = currentIndex();
      goTo(i >= totalGroups() - 1 ? 0 : i + 1);
    }, 6000);
    on(track, 'mouseenter', () => clearInterval(auto));
    on(track, 'mouseleave', () => {
      clearInterval(auto);
      auto = setInterval(() => {
        if (document.hidden) return;
        const i = currentIndex();
        goTo(i >= totalGroups() - 1 ? 0 : i + 1);
      }, 6000);
    });

    buildDots();
  }

  /* -------------------------------------------------------- */
  /* 7. Back to top                                           */
  /* -------------------------------------------------------- */
  function initBackToTop() {
    const btn = $('#backToTop');
    if (!btn) return;
    on(window, 'scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    on(btn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* -------------------------------------------------------- */
  /* 8. Contact form validation                               */
  /*    (Used by contact.html — safely no-ops on home page)   */
  /* -------------------------------------------------------- */
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    const showError = (field, msg) => {
      const wrap = field.closest('.form-field');
      if (!wrap) return;
      wrap.classList.add('has-error');
      const err = wrap.querySelector('.error');
      if (err) err.textContent = msg;
    };
    const clearError = (field) => {
      const wrap = field.closest('.form-field');
      if (wrap) wrap.classList.remove('has-error');
    };

    const validators = {
      name:    (v) => v.trim().length >= 2 || 'Please enter your name.',
      phone:   (v) => /^[+\d][\d\s-]{8,15}$/.test(v.trim()) || 'Enter a valid phone number.',
      email:   (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email.',
      service: (v) => v.trim() !== '' || 'Please pick a service.',
      date:    (v) => v.trim() !== '' || 'Choose a preferred date.',
      message: (v) => v.trim().length >= 5 || 'Tell us a bit more (min 5 chars).',
    };

    // Live clearing
    $$('input, select, textarea', form).forEach(field => {
      on(field, 'input', () => clearError(field));
      on(field, 'change', () => clearError(field));
    });

    on(form, 'submit', (e) => {
      e.preventDefault();
      let valid = true;

      Object.keys(validators).forEach(name => {
        const field = form.elements[name];
        if (!field) return;
        const result = validators[name](field.value);
        if (result !== true) {
          showError(field, result);
          valid = false;
        }
      });

      if (!valid) {
        const firstErr = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }

      // Success state — for now we just hand off to WhatsApp pre-filled
      const data = new FormData(form);
      const text =
        `Hi Global Dental Care, I'd like to book an appointment.%0A%0A` +
        `Name: ${encodeURIComponent(data.get('name') || '')}%0A` +
        `Phone: ${encodeURIComponent(data.get('phone') || '')}%0A` +
        `Service: ${encodeURIComponent(data.get('service') || '')}%0A` +
        `Preferred date: ${encodeURIComponent(data.get('date') || '')}%0A` +
        `Message: ${encodeURIComponent(data.get('message') || '')}`;

      const successEl = $('#formSuccess');
      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();

      // Open WhatsApp in a new tab so the patient confirms send
      window.open(`https://wa.me/918077645073?text=${text}`, '_blank', 'noopener');
    });
  }

  /* -------------------------------------------------------- */
  /* 9. Footer year                                           */
  /* -------------------------------------------------------- */
  function initYearStamp() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

})();
