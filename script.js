(function () {
  'use strict';

  /* ==================== ELEMENTS ==================== */
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  var backToTop = document.getElementById('backToTop');
  var navbar = document.getElementById('navbar');
  var contactForm = document.getElementById('contactForm');
  var sections = document.querySelectorAll('section[id], header[id]');
  var navItems = document.querySelectorAll('.nav-link');

  var videoModal = document.getElementById('videoModal');
  var modalVideo = document.getElementById('modalVideo');
  var videoWrapper = modalVideo ? modalVideo.parentElement : null;
  var modalTitle = document.getElementById('modalTitle');
  var modalDesc = document.getElementById('modalDesc');

  var posterModal = document.getElementById('posterModal');
  var posterStage = document.getElementById('posterStage');
  var posterModalTitle = document.getElementById('posterModalTitle');
  var posterModalDesc = document.getElementById('posterModalDesc');

  var lastFocused = null;

  /* ==================== MOBILE NAV ==================== */
  function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  }
  function closeMobileMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
  }
  if (hamburger) hamburger.addEventListener('click', toggleMobileMenu);
  navItems.forEach(function (item) { item.addEventListener('click', closeMobileMenu); });

  /* ==================== SCROLL EFFECTS ==================== */
  function handleScroll() {
    var scrollY = window.scrollY;

    if (scrollY > 400) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');

    if (scrollY > 50) navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
    else navbar.style.boxShadow = 'none';

    var current = '';
    sections.forEach(function (section) {
      var sectionTop = section.offsetTop - 100;
      if (scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navItems.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  }
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  backToTop.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
      }
    });
  });

  /* ==================== REVEAL ON SCROLL ==================== */
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('visible'); });
  }

  /* ==================== FILTERS ==================== */
  function setupFilters(barId, gridId) {
    var bar = document.getElementById(barId);
    var grid = document.getElementById(gridId);
    if (!bar || !grid) return;
    bar.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        bar.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        grid.querySelectorAll('[data-category]').forEach(function (card) {
          var show = filter === 'all' || card.getAttribute('data-category') === filter;
          card.classList.toggle('hide', !show);
        });
      });
    });
  }
  setupFilters('videoFilters', 'videosGrid');
  setupFilters('posterFilters', 'postersGrid');

  /* ==================== MODAL HELPERS ==================== */
  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  function openVideoModal(btn) {
    modalTitle.textContent = btn.getAttribute('data-title') || 'Video';
    modalDesc.textContent = btn.getAttribute('data-desc') || '';
    resetVideoModal(); /* reset, refit on loadedmetadata */
    modalVideo.src = btn.getAttribute('data-video') || '';
    openModal(videoModal);
    modalVideo.play().catch(function () { /* autoplay blocked — user presses play */ });
  }

  function resetVideoModal() {
    if (videoWrapper) videoWrapper.style.cssText = '';
    var content = videoModal ? videoModal.querySelector('.modal-content') : null;
    if (content) content.style.width = '';
  }

  /* Size the modal AND the video wrapper to the clip's real aspect ratio so
     the whole UI hugs the video with no black bars or empty side gaps */
  function fitVideoWrapper() {
    if (!videoWrapper || !modalVideo) return;
    var vw = modalVideo.videoWidth, vh = modalVideo.videoHeight;
    if (!vw || !vh) return;
    var availW = Math.min(960, window.innerWidth - 48) - 6; /* modal padding + content border */
    var availH = window.innerHeight * 0.92 - 170;          /* modal max-height minus title/desc */
    var ratio = vw / vh;
    var w = availW;
    var h = w / ratio;
    if (h > availH) { h = availH; w = h * ratio; }
    w = Math.round(w); h = Math.round(h);
    videoWrapper.style.width = w + 'px';
    videoWrapper.style.height = h + 'px';
    videoWrapper.style.aspectRatio = vw + ' / ' + vh;
    var content = videoModal.querySelector('.modal-content');
    if (content) content.style.width = (w + 6) + 'px'; /* +6 for the 3px borders */
  }
  function openPosterModal(card) {
    var series = card.getAttribute('data-series');
    if (series && series.trim()) {
      showCarousel(card, series.split(',').map(function (s) { return s.trim(); }));
    } else {
      hideCarousel();
      var poster = card.querySelector('.poster');
      posterStage.innerHTML = '';
      if (poster) posterStage.appendChild(poster.cloneNode(true));
    }
    posterModalTitle.textContent = card.getAttribute('data-title') || 'Poster';
    posterModalDesc.textContent = card.getAttribute('data-desc') || '';
    openModal(posterModal);
  }

  /* ==================== POSTER CAROUSEL ==================== */
  var carousel = document.getElementById('posterCarousel');
  var carTrack = document.getElementById('carTrack');
  var carDots = document.getElementById('carDots');
  var carPrev = document.getElementById('carPrev');
  var carNext = document.getElementById('carNext');
  var carIndex = 0;
  var carTotal = 0;
  var touchStartX = null;

  function showCarousel(card, images) {
    posterStage.innerHTML = '';
    posterStage.style.setProperty('display', 'none', 'important');
    carousel.hidden = false;
    carTrack.innerHTML = '';
    carDots.innerHTML = '';
    carTotal = images.length;
    carIndex = 0;
    carTrack.style.width = (carTotal * 100) + '%';

    images.forEach(function (src, i) {
      var slide = document.createElement('div');
      slide.className = 'car-slide';
      slide.style.flex = '0 0 ' + (100 / carTotal) + '%';
      var img = document.createElement('img');
      img.src = src;
      img.alt = (card.getAttribute('data-title') || 'Poster') + ' — design ' + (i + 1);
      slide.appendChild(img);
      carTrack.appendChild(slide);

      var dot = document.createElement('button');
      dot.className = 'car-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'View design ' + (i + 1));
      dot.addEventListener('click', () => setCarIndex(i));
      carDots.appendChild(dot);
    });

    updateCarousel();
  }

  function hideCarousel() {
    carousel.hidden = true;
    posterStage.style.removeProperty('display');
    carTrack.innerHTML = '';
    carDots.innerHTML = '';
    carTotal = 0;
  }

  function setCarIndex(i) {
    carIndex = Math.max(0, Math.min(i, carTotal - 1));
    updateCarousel();
  }

  function updateCarousel() {
    var step = carTotal > 0 ? (100 / carTotal) : 100;
    carTrack.style.transform = 'translateX(' + (-carIndex * step) + '%)';
    carDots.querySelectorAll('.car-dot').forEach(function (dot, i) {
      dot.classList.toggle('active', i === carIndex);
    });
    carPrev.disabled = carIndex === 0;
    carNext.disabled = carIndex === carTotal - 1;
  }

  carPrev.addEventListener('click', function () { setCarIndex(carIndex - 1); });
  carNext.addEventListener('click', function () { setCarIndex(carIndex + 1); });

  /* swipe support */
  carTrack.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  carTrack.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 45) setCarIndex(carIndex + (dx < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });

  /* close buttons + backdrops */
  document.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      var modal = el.closest('.modal');
      if (modal) closeModal(modal);
    });
  });
  document.addEventListener('keydown', function (e) {
    var open = document.querySelector('.modal.open');
    if (!open) return;
    if (e.key === 'Escape') {
      closeModal(open);
    } else if (e.key === 'ArrowLeft' && open === posterModal && !carousel.hidden) {
      e.preventDefault();
      setCarIndex(carIndex - 1);
    } else if (e.key === 'ArrowRight' && open === posterModal && !carousel.hidden) {
      e.preventDefault();
      setCarIndex(carIndex + 1);
    } else if (e.key === 'Tab') {
      var focusables = open.querySelectorAll('button, [href], video[controls], input, textarea, select');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* video cards */
  document.querySelectorAll('.video-thumb').forEach(function (btn) {
    btn.addEventListener('click', function () { openVideoModal(btn); });
  });

  /* poster cards (click + keyboard) */
  document.querySelectorAll('.poster-card').forEach(function (card) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', function () { openPosterModal(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPosterModal(card);
      }
    });
  });

  /* stop video playback when its modal closes */
  if (videoModal) {
    var videoObserver = new MutationObserver(function () {
      if (!videoModal.classList.contains('open') && modalVideo.src) {
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.load();
        resetVideoModal();
      }
    });
    videoObserver.observe(videoModal, { attributes: true, attributeFilter: ['class'] });
  }

  /* refit the video wrapper when the clip metadata loads and on viewport resizes */
  if (modalVideo) modalVideo.addEventListener('loadedmetadata', fitVideoWrapper);
  window.addEventListener('resize', function () {
    if (videoModal.classList.contains('open')) fitVideoWrapper();
  });

  /* ==================== CONTACT FORM ==================== */
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      fetch(contactForm.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(contactForm)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(function () {
          btn.textContent = 'Message Sent!';
          btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
          btn.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)';
          setTimeout(function () {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.boxShadow = '';
            btn.disabled = false;
            contactForm.reset();
          }, 3000);
        })
        .catch(function () {
          btn.textContent = 'Failed - try again';
          btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          setTimeout(function () {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.disabled = false;
          }, 3000);
        });
    });
  }

  /* ==================== DOODLE BACKGROUND ==================== */
  var doodleLayer = document.getElementById('doodleLayer');
  var DOODLE_PATHS = [
    'M50 8 L61 38 L93 38 L67 58 L77 90 L50 70 L23 90 L33 58 L7 38 L39 38 Z',
    'M50 88 C20 66 10 42 24 28 C36 16 50 24 50 34 C50 24 64 16 76 28 C90 42 80 66 50 88 Z',
    'M8 60 C20 30 35 90 50 55 C65 20 80 80 92 45',
    'M25 70 C12 70 10 52 24 50 C24 36 44 30 52 42 C60 30 80 36 80 52 C92 54 90 70 78 70 Z',
    '<circle cx="50" cy="50" r="17"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M21 21 L29 29 M79 79 L71 71 M79 21 L71 29 M21 79 L29 71"/>',
    'M58 8 L34 48 L48 48 L42 92 L70 44 L54 44 Z',
    '<circle cx="34" cy="72" r="9"/><circle cx="72" cy="62" r="9"/><path d="M43 72 V22 L81 12 V56"/>',
    '<circle cx="50" cy="50" r="34"/><circle cx="38" cy="42" r="3.5" fill="currentColor" stroke="none"/><circle cx="62" cy="42" r="3.5" fill="currentColor" stroke="none"/><path d="M36 62 C42 73 58 73 64 62"/>',
    'M16 54 C30 46 44 60 60 48 L76 40 M62 34 L80 42 L60 58',
    '<circle cx="50" cy="28" r="10"/><circle cx="72" cy="50" r="10"/><circle cx="50" cy="72" r="10"/><circle cx="28" cy="50" r="10"/><circle cx="50" cy="50" r="7" fill="currentColor" stroke="none"/>',
    'M50 12 L82 40 L50 88 L18 40 Z M18 40 L82 40 M50 12 L50 88',
    'M50 14 L56 44 L86 50 L56 56 L50 86 L44 56 L14 50 L44 44 Z',
    'M18 70 L24 34 L40 54 L50 26 L60 54 L76 34 L82 70 Z M18 70 H82',
    'M24 52 L44 74 L82 28'
  ];
  var DOODLE_LAYOUT = [
    { t: 6,  l: 5,  s: 64, d: 15, dl: 0,  dp: 0.5 },
    { t: 16, l: 84, s: 54, d: 19, dl: 2,  dp: 0.8 },
    { t: 30, l: 12, s: 90, d: 22, dl: 4,  dp: 0.6 },
    { t: 44, l: 90, s: 70, d: 16, dl: 1,  dp: 1.1 },
    { t: 58, l: 4,  s: 58, d: 20, dl: 6,  dp: 0.7 },
    { t: 70, l: 88, s: 84, d: 24, dl: 3,  dp: 0.9 },
    { t: 82, l: 15, s: 60, d: 17, dl: 5,  dp: 0.5 },
    { t: 90, l: 70, s: 66, d: 21, dl: 7,  dp: 1.2 },
    { t: 24, l: 46, s: 46, d: 18, dl: 8,  dp: 0.4 },
    { t: 52, l: 55, s: 52, d: 23, dl: 9,  dp: 0.6 },
    { t: 12, l: 34, s: 44, d: 20, dl: 10, dp: 0.8 },
    { t: 64, l: 40, s: 48, d: 15, dl: 11, dp: 0.5 },
    { t: 36, l: 68, s: 56, d: 25, dl: 12, dp: 0.7 },
    { t: 78, l: 48, s: 62, d: 19, dl: 13, dp: 0.9 }
  ];
  var DOODLE_COLORS = ['#4d8bff', '#a06bff', '#2fbf9b', '#ff6b5e', '#ffc94d'];

  if (doodleLayer) {
    DOODLE_LAYOUT.forEach(function (o, i) {
      var wrap = document.createElement('span');
      wrap.className = 'doodle-wrap';
      wrap.style.top = o.t + '%';
      wrap.style.left = o.l + '%';
      wrap.dataset.topPct = o.t;
      wrap.dataset.depth = o.dp;

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'doodle');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('width', o.s);
      svg.setAttribute('height', o.s);
      svg.style.color = DOODLE_COLORS[i % DOODLE_COLORS.length];
      svg.style.setProperty('--dur', o.d + 's');
      svg.style.setProperty('--delay', o.dl + 's');
      svg.innerHTML = DOODLE_PATHS[i % DOODLE_PATHS.length];

      wrap.appendChild(svg);
      doodleLayer.appendChild(wrap);
    });

    /* gentle mouse parallax so the doodles feel movable */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      document.addEventListener('mousemove', function (e) {
        var x = e.clientX / window.innerWidth - 0.5;
        var y = e.clientY / window.innerHeight - 0.5;
        doodleLayer.querySelectorAll('.doodle-wrap').forEach(function (w) {
          var depth = parseFloat(w.dataset.depth) || 0.5;
          w.style.transform = 'translate3d(' + (x * depth * 42) + 'px,' + (y * depth * 42) + 'px,0)';
        });
      });
    }

    /* scroll: background objects drift downward and recycle offscreen */
    function placeWrap(w, scrollY) {
      var pct = parseFloat(w.dataset.topPct);
      var depth = parseFloat(w.dataset.depth) || 0.5;
      var vh = window.innerHeight;
      var range = vh + 280;
      var travel = scrollY * 0.12 * depth;
      var y = ((pct / 100 * vh + travel + 280) % range) - 280;
      w.style.top = y + 'px';
    }
    function applyScroll() {
      var sy = window.scrollY;
      doodleLayer.querySelectorAll('.doodle-wrap').forEach(function (w) { placeWrap(w, sy); });
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { applyScroll(); ticking = false; });
        ticking = true;
      }
    });
    window.addEventListener('resize', applyScroll);

    /* extra randomly scattered doodles */
    for (var d = 0; d < 14; d++) {
      var wr = document.createElement('span');
      wr.className = 'doodle-wrap';
      var dTop = Math.random() * 92 + 2;
      wr.style.top = dTop + '%';
      wr.style.left = (Math.random() * 92 + 2) + '%';
      wr.dataset.topPct = dTop.toFixed(1);
      wr.dataset.depth = (Math.random() * 0.8 + 0.3).toFixed(2);

      var sd = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sd.setAttribute('class', 'doodle');
      sd.setAttribute('viewBox', '0 0 100 100');
      var ss = Math.floor(Math.random() * 40) + 28;
      sd.setAttribute('width', ss);
      sd.setAttribute('height', ss);
      sd.style.color = DOODLE_COLORS[d % DOODLE_COLORS.length];
      sd.style.setProperty('--dur', (Math.random() * 12 + 12) + 's');
      sd.style.setProperty('--delay', (Math.random() * 10).toFixed(1) + 's');
      sd.innerHTML = DOODLE_PATHS[Math.floor(Math.random() * DOODLE_PATHS.length)];

      wr.appendChild(sd);
      doodleLayer.appendChild(wr);
    }

    /* colorful circles: drifting confetti + falling color rain */
    var C_COLORS = ['#4d8bff', '#a06bff', '#2fbf9b', '#ff6b5e', '#ffc94d', '#e879f9', '#22d3ee', '#f472b6'];
    var TOTAL_CIRCLES = 70;
    for (var i = 0; i < TOTAL_CIRCLES; i++) {
      var isRain = i % 3 === 0;
      var cw = document.createElement('span');
      cw.className = 'doodle-wrap';
      cw.dataset.depth = (Math.random() * 0.9 + 0.2).toFixed(2);
      cw.style.left = (Math.random() * 98) + '%';
      cw.dataset.topPct = isRain ? '-6' : (Math.random() * 96).toFixed(1);
      cw.style.top = cw.dataset.topPct + '%';

      var c = document.createElement('span');
      c.className = 'c ' + (isRain ? 'c-rain' : 'c-float');
      var cs = isRain ? Math.floor(Math.random() * 12) + 5 : Math.floor(Math.random() * 28) + 9;
      c.style.width = cs + 'px';
      c.style.height = cs + 'px';
      c.style.background = C_COLORS[i % C_COLORS.length];
      c.style.opacity = (Math.random() * 0.45 + 0.35).toFixed(2);
      c.style.setProperty('--dur', (isRain ? Math.random() * 8 + 6 : Math.random() * 14 + 8).toFixed(1) + 's');
      c.style.setProperty('--delay', (Math.random() * 12).toFixed(1) + 's');
      if (!isRain && Math.random() > 0.55) c.classList.add('soft');

      cw.appendChild(c);
      doodleLayer.appendChild(cw);
    }

    applyScroll();
  }
})();
