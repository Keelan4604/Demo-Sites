/* ============================================
   EcoPro USA — Homepage Scripts
   ============================================ */

(function () {
  'use strict';

  /* ---------- Header scroll effect ---------- */
  const header = document.getElementById('site-header');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = y;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('main-nav');

  toggle.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu on link click
  nav.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;
    sections.forEach(function (section) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- Scroll reveal ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    var reveals = document.querySelectorAll('.reveal');
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Show all immediately
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ---------- Hero background slider ---------- */
  var heroSlides = document.querySelectorAll('.hero-slide');
  var currentSlide = 0;

  if (heroSlides.length > 1 && !reduceMotion) {
    setInterval(function () {
      heroSlides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % heroSlides.length;
      heroSlides[currentSlide].classList.add('active');
    }, 5000);
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('.stat-number');
  var countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    counters.forEach(function (counter) {
      var target = parseInt(counter.getAttribute('data-target'), 10);
      var prefix = counter.getAttribute('data-prefix') || '';
      var suffix = counter.getAttribute('data-suffix') || '';
      var duration = 2000;
      var start = 0;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(eased * target);
        counter.textContent = prefix + current.toLocaleString() + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counter.textContent = prefix + target.toLocaleString() + suffix;
        }
      }

      if (reduceMotion) {
        counter.textContent = prefix + target.toLocaleString() + suffix;
      } else {
        requestAnimationFrame(step);
      }
    });
  }

  // Trigger counters when hero stats are visible
  var statsEl = document.querySelector('.hero-stats');
  if (statsEl) {
    var statsObserver = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          animateCounters();
          statsObserver.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    statsObserver.observe(statsEl);
  }

  /* ---------- Testimonials slider ---------- */
  var track = document.querySelector('.testimonials-track');
  var cards = document.querySelectorAll('.testimonial-card');
  var dotsContainer = document.getElementById('slider-dots');
  var prevBtn = document.querySelector('.slider-prev');
  var nextBtn = document.querySelector('.slider-next');
  var currentTestimonial = 0;
  var totalTestimonials = cards.length;

  // Build dots
  for (var i = 0; i < totalTestimonials; i++) {
    var dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    dot.setAttribute('data-index', i);
    dotsContainer.appendChild(dot);
  }

  var dots = dotsContainer.querySelectorAll('.slider-dot');

  function goToSlide(index) {
    currentTestimonial = index;
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    dots.forEach(function (d, idx) {
      d.classList.toggle('active', idx === index);
    });
  }

  prevBtn.addEventListener('click', function () {
    goToSlide(currentTestimonial === 0 ? totalTestimonials - 1 : currentTestimonial - 1);
  });

  nextBtn.addEventListener('click', function () {
    goToSlide((currentTestimonial + 1) % totalTestimonials);
  });

  dotsContainer.addEventListener('click', function (e) {
    if (e.target.classList.contains('slider-dot')) {
      goToSlide(parseInt(e.target.getAttribute('data-index'), 10));
    }
  });

  // Auto-advance testimonials
  if (!reduceMotion) {
    setInterval(function () {
      goToSlide((currentTestimonial + 1) % totalTestimonials);
    }, 7000);
  }

  /* ---------- Smooth scroll for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  });

})();
