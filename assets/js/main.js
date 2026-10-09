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
