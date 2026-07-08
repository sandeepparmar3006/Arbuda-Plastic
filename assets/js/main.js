(function () {
  'use strict';

  var yearEl = document.getElementById('footYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.getElementById('logoLink').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  var scrollBtn = document.getElementById('scrollTopBtn');
  scrollBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  var menuToggle = document.getElementById('menuToggle');
  var mobileNav  = document.getElementById('mobileNav');

  menuToggle.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!mobileNav.contains(e.target) && e.target !== menuToggle) {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  var siteHeader = document.getElementById('site-header');

  function onScrollUI() {
    var scrollY = window.scrollY;
    scrollBtn.classList.toggle('show', scrollY > 320);
    siteHeader.classList.toggle('scrolled', scrollY > 10);
  }
  window.addEventListener('scroll', onScrollUI, { passive: true });
  onScrollUI();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

}());

/* ============================================================
   SCROLL-VIDEO SCRUB SCRIPT
============================================================ */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var section  = document.getElementById('scroll-video-hero');
  var video    = document.getElementById('svhVideo');
  var progress = document.getElementById('svhProgress');
  var content  = document.getElementById('svhContent');

  if (!section || !video) return;

  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        content.classList.add('is-visible');
        revealObs.disconnect();
      }
    });
  }, { threshold: 0.1 });
  revealObs.observe(section);

  var videoReady    = false;
  var videoDuration = 0;
  var pendingSeek   = null;

  function unlockAndPrepare() {
    if (videoReady) return;
    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(function () {
        video.pause();
        video.currentTime = 0;
        videoReady = true;
        videoDuration = video.duration || 0;
        if (pendingSeek !== null) { video.currentTime = pendingSeek; pendingSeek = null; }
      }).catch(function () {
        videoReady = true;
        videoDuration = video.duration || 0;
      });
    } else {
      video.pause();
      videoReady = true;
      videoDuration = video.duration || 0;
    }
  }

  function onMeta() { videoDuration = video.duration || 0; unlockAndPrepare(); }

  if (video.readyState >= 1) { onMeta(); }
  else { video.addEventListener('loadedmetadata', onMeta, { passive: true, once: true }); }

  video.addEventListener('canplaythrough', function () {
    if (!videoReady) unlockAndPrepare();
  }, { passive: true, once: true });

  var ticking = false;

  function scrub() {
    ticking = false;
    var rect       = section.getBoundingClientRect();
    var sectionH   = section.offsetHeight;
    var viewH      = window.innerHeight;
    var scrolled   = -rect.top;
    var scrollable = sectionH - viewH;
    var pct = Math.max(0, Math.min(1, scrolled / scrollable));

    if (progress) progress.style.transform = 'scaleX(' + pct.toFixed(4) + ')';

    if (videoDuration > 0) {
      var target = pct * videoDuration;
      var delta  = Math.abs(video.currentTime - target);
      if (delta > 0.02) {
        if (videoReady) { video.currentTime = target; }
        else { pendingSeek = target; }
      }
    }
  }

  function onScroll() {
    if (!ticking) { requestAnimationFrame(scrub); ticking = true; }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  scrub();

}());

/* ============================================================
   PRODUCT MARQUEE  (auto-scroll + hover pause + manual scroll/drag)
============================================================ */
(function () {
  'use strict';

  var viewport = document.getElementById('bandViewport');
  var track    = document.getElementById('bandTrack');
  if (!viewport || !track) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Typeset each card as a catalog entry: mono material chip + real SKU index */
  var originals = Array.prototype.slice.call(track.children);
  var total = originals.length;
  originals.forEach(function (card, i) {
    var origin = card.querySelector('.sku-origin');
    if (!origin) return;
    var isPvc = /PVC/i.test(origin.textContent);
    var idx = String(i + 1).padStart(2, '0') + ' / ' + total;
    var meta = document.createElement('div');
    meta.className = 'card-meta';
    var matSpan = document.createElement('span');
    matSpan.className = 'mat ' + (isPvc ? 'mat-pvc' : 'mat-eva');
    matSpan.textContent = isPvc ? 'PVC' : 'EVA';
    var idxSpan = document.createElement('span');
    idxSpan.className = 'sku-idx';
    idxSpan.textContent = idx;
    meta.appendChild(matSpan);
    meta.appendChild(idxSpan);
    origin.replaceWith(meta);
  });

  /* Clone cards once for a seamless loop (original set + copy) */
  var halfWidth = 0;
  function buildLoop() {
    var cards = Array.prototype.slice.call(track.children);
    cards.forEach(function (c) {
      var clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      track.appendChild(clone);
    });
    halfWidth = track.scrollWidth / 2;
  }
  buildLoop();
  window.addEventListener('resize', function () { halfWidth = track.scrollWidth / 2; }, { passive: true });

  /* Keep scrollLeft inside [0, halfWidth) so the loop is seamless */
  function normalize() {
    if (halfWidth <= 0) return;
    if (viewport.scrollLeft >= halfWidth) viewport.scrollLeft -= halfWidth;
    else if (viewport.scrollLeft < 0) viewport.scrollLeft += halfWidth;
  }

  /* ── Auto-scroll loop ── */
  var SPEED = 0.9;          /* px per frame (~54px/s at 60fps) */
  var paused = false;
  var rafId = null;
  var lastTs = 0;

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    var dt = ts - lastTs;
    lastTs = ts;
    if (!paused) {
      viewport.scrollLeft += SPEED * (dt / 16.67);
      normalize();
    }
    rafId = requestAnimationFrame(tick);
  }
  if (!reduce) rafId = requestAnimationFrame(tick);

  /* ── Hover pause (desktop) ── */
  viewport.addEventListener('mouseenter', function () { paused = true; });
  viewport.addEventListener('mouseleave', function () { if (!dragging) paused = false; });

  /* ── Manual wheel / touch scroll pause, resume after idle ── */
  var idleTimer = null;
  function pauseTemporarily() {
    paused = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (!hovering()) paused = false;
    }, 1500);
  }
  function hovering() { return viewport.matches(':hover'); }

  viewport.addEventListener('wheel', function (e) {
    /* translate vertical wheel into horizontal scroll for trackpads/mice */
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      viewport.scrollLeft += e.deltaY;
      e.preventDefault();
    }
    normalize();
    pauseTemporarily();
  }, { passive: false });

  viewport.addEventListener('scroll', normalize, { passive: true });
  viewport.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  viewport.addEventListener('touchend', pauseTemporarily, { passive: true });

  /* ── Pointer drag to scroll ── */
  var dragging = false, startX = 0, startScroll = 0;

  viewport.addEventListener('pointerdown', function (e) {
    dragging = true;
    paused = true;
    startX = e.clientX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    viewport.scrollLeft = startScroll - (e.clientX - startX);
    normalize();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    pauseTemporarily();
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  /* Suppress accidental link clicks after a drag */
  viewport.addEventListener('click', function (e) {
    if (Math.abs(viewport.scrollLeft - startScroll) > 5 && e.target.closest('a')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  /* Keyboard focus pauses (a11y) */
  viewport.addEventListener('focusin', function () { paused = true; });
  viewport.addEventListener('focusout', function () { if (!hovering()) paused = false; });

}());
