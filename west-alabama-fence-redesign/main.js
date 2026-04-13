/* ============================================================
   WEST ALABAMA FENCE — main.js v2
   Stack: Lenis smooth scroll + GSAP + ScrollTrigger
   ============================================================ */

// ── Wait for DOM ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ═══════════════════════════════════════════════
  // 1. LENIS SMOOTH SCROLL
  // ═══════════════════════════════════════════════
  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
  });

  gsap.registerPlugin(ScrollTrigger);

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Smooth-scroll anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80, duration: 1.2 });
      // Close mobile menu if open
      if (mobileOverlay.classList.contains('open')) closeMobileMenu();
    });
  });

  // ═══════════════════════════════════════════════
  // 2. STICKY HEADER
  // ═══════════════════════════════════════════════
  const header = document.getElementById('header');

  lenis.on('scroll', ({ scroll }) => {
    header.classList.toggle('scrolled', scroll > 80);
  });

  // ═══════════════════════════════════════════════
  // 3. MOBILE MENU
  // ═══════════════════════════════════════════════
  const hamburger = document.getElementById('hamburger');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileLinks = mobileOverlay.querySelectorAll('.mobile-link');

  function openMobileMenu() {
    mobileOverlay.classList.add('open');
    hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
    lenis.stop();

    if (!prefersReduced) {
      gsap.fromTo(mobileLinks,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.45, ease: 'power2.out', delay: 0.05 }
      );
    }
  }

  function closeMobileMenu() {
    mobileOverlay.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
    lenis.start();
  }

  hamburger.addEventListener('click', () => {
    if (mobileOverlay.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  // ═══════════════════════════════════════════════
  // 4. HERO ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════
  if (!prefersReduced) {
    const heroTl = gsap.timeline({ delay: 0.15 });

    heroTl
      .to('.hero-eyebrow', {
        opacity: 1, duration: 0.6, ease: 'power2.out',
      })
      .to('.hero-line', {
        y: '0%',
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
      }, '-=0.3')
      .to('.hero-sub', {
        opacity: 1, duration: 0.7, ease: 'power2.out',
      }, '-=0.4')
      .to('.hero-actions', {
        opacity: 1, duration: 0.7, ease: 'power2.out',
      }, '-=0.4')
      .to('.hero-photo-frame', {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power3.out',
      }, 0.5)
      .to('.hero-strip', {
        opacity: 1, duration: 0.8, ease: 'power2.out',
      }, '-=0.5');

    // Start photo frame slightly off-screen
    gsap.set('.hero-photo-frame', { x: 40 });
  } else {
    // No animation: reveal everything immediately
    gsap.set(['.hero-eyebrow', '.hero-sub', '.hero-actions', '.hero-strip', '.hero-photo-frame'], { opacity: 1 });
    gsap.set('.hero-line', { y: '0%' });
  }

  // ═══════════════════════════════════════════════
  // 5. SCROLL REVEAL — general .reveal-up elements
  // ═══════════════════════════════════════════════
  if (!prefersReduced) {
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      });
    });

    // Services cards stagger
    gsap.utils.toArray('.svc-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            once: true,
          },
          delay: (i % 2) * 0.1,
        }
      );
    });
  } else {
    gsap.set('.reveal-up', { opacity: 1, y: 0 });
    gsap.set('.svc-card', { opacity: 1, y: 0 });
  }

  // ═══════════════════════════════════════════════
  // 6. NUMBERS COUNTER
  // ═══════════════════════════════════════════════
  document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isDecimal = target % 1 !== 0;
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 2.2,
          ease: 'power2.out',
          onUpdate() {
            el.textContent = (isDecimal ? counter.val.toFixed(1) : Math.round(counter.val)) + suffix;
          },
          onComplete() {
            el.textContent = (isDecimal ? target.toFixed(1) : target) + suffix;
          },
        });
      },
    });
  });

  // ═══════════════════════════════════════════════
  // 7. HORIZONTAL GALLERY — GSAP ScrollTrigger pin
  // ═══════════════════════════════════════════════
  const gallerySection = document.querySelector('.gallery-section');
  const galleryOverflow = document.querySelector('.gallery-overflow');
  const galleryTrack = document.querySelector('.gallery-track');

  const mm = gsap.matchMedia();

  mm.add('(min-width: 769px)', () => {
    if (!gallerySection || !galleryTrack) return;

    // We need total scroll distance = track width - overflow width
    const getScrollAmount = () => -(galleryTrack.scrollWidth - galleryOverflow.clientWidth);

    const pinTween = gsap.to(galleryTrack, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: gallerySection,
        start: 'top top',
        end: () => `+=${Math.abs(getScrollAmount())}`,
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      pinTween.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === gallerySection) t.kill();
      });
      gsap.set(galleryTrack, { x: 0 });
    };
  });

  // ═══════════════════════════════════════════════
  // 8. PROCESS LINE DRAW
  // ═══════════════════════════════════════════════
  if (!prefersReduced) {
    const connectors = document.querySelectorAll('.process-connector');
    if (connectors.length) {
      gsap.to(connectors, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.9,
        stagger: 0.4,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '.process-steps',
          start: 'top 70%',
          once: true,
        },
      });
    }
  } else {
    gsap.set('.process-connector', { scaleX: 1, scaleY: 1 });
  }

  // ═══════════════════════════════════════════════
  // 9. MAGNETIC CTA BUTTON
  // ═══════════════════════════════════════════════
  const magnetWrap = document.querySelector('.magnetic-wrap');
  const magnetBtn  = document.querySelector('.magnetic-btn');

  if (magnetWrap && magnetBtn && !prefersReduced) {
    magnetWrap.addEventListener('mousemove', (e) => {
      const rect = magnetBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      gsap.to(magnetBtn, {
        x: dx * 0.3,
        y: dy * 0.3,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    magnetWrap.addEventListener('mouseleave', () => {
      gsap.to(magnetBtn, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)',
      });
    });
  }

  // ═══════════════════════════════════════════════
  // 10. CONTACT FORM — Formspree
  // ═══════════════════════════════════════════════
  const form = document.getElementById('contact-form');
  if (form) {
    // Floating label for select
    const selectEl = form.querySelector('select');
    if (selectEl) {
      selectEl.addEventListener('change', () => {
        selectEl.closest('.ff-select').classList.toggle('filled', selectEl.value !== '');
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.form-submit');
      const btnSpan   = submitBtn.querySelector('span');
      const origText  = btnSpan.textContent;

      btnSpan.textContent = 'Sending…';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          btnSpan.textContent = 'Sent! We\'ll be in touch.';
          submitBtn.style.background = '#2D6A4F';
          submitBtn.style.opacity = '1';
          form.reset();
          if (selectEl) selectEl.closest('.ff-select').classList.remove('filled');
        } else {
          throw new Error('Server error');
        }
      } catch {
        btnSpan.textContent = 'Something went wrong — call us!';
        submitBtn.style.background = '#9B3922';
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
      }

      // Reset button after 4s
      setTimeout(() => {
        btnSpan.textContent = origText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 4000);
    });
  }

}); // end DOMContentLoaded
