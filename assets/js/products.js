(function () {
  'use strict';

  var yearEl = document.getElementById('footYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function encodePath(raw) {
    if (raw.startsWith('http')) return raw;
    return raw.split('/').map(encodeURIComponent).join('/');
  }

  /* nav shadow */
  var siteHeader = document.getElementById('site-header');
  window.addEventListener('scroll', function () {
    siteHeader.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  /* mobile nav */
  var menuToggle = document.getElementById('menuToggle');
  var mobileNav  = document.getElementById('mobileNav');
  menuToggle.addEventListener('click', function () {
    var open = mobileNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
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

  /* state */
  var allProducts   = [];
  var activeFilter  = 'all';
  var activeProduct = null;
  var activePhoto   = 0;

  /* DOM */
  var grid          = document.getElementById('productGrid');
  var emptyState    = document.getElementById('emptyState');
  var filterBtns    = document.querySelectorAll('.filter-btn');
  var backdrop      = document.getElementById('modalBackdrop');
  var galleryMain   = document.getElementById('galleryMain');
  var galleryThumbs = document.getElementById('galleryThumbs');
  var galleryPrev   = document.getElementById('galleryPrev');
  var galleryNext   = document.getElementById('galleryNext');
  var modalName     = document.getElementById('modalProductName');
  var modalBadge    = document.getElementById('modalBadge');
  var modalSizes    = document.getElementById('modalSizes');
  var modalCount    = document.getElementById('modalPhotoCount');
  var modalWA       = document.getElementById('modalWhatsApp');
  var modalClose    = document.getElementById('modalClose');

  /* load — inline data works on file:// and HTTP alike */
  try {
    allProducts = JSON.parse(document.getElementById('products-data').textContent);
    renderGrid();
  } catch (e) {
    emptyState.textContent = 'Unable to load products. Please refresh or contact us directly.';
    emptyState.classList.add('visible');
  }

  /* render grid */
  function renderGrid() {
    Array.from(grid.querySelectorAll('.product-card')).forEach(function (c) { c.remove(); });
    var visible = 0;

    allProducts.forEach(function (p, idx) {
      var show = activeFilter === 'all' ||
                 p.material === activeFilter ||
                 (p.type && p.type.indexOf(activeFilter) !== -1);
      var card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', p.name + ', ' + p.material + ' footwear');
      if (!show) { card.hidden = true; } else { visible++; }

      var thumb = document.createElement('div');
      thumb.className = 'card-thumb';
      var img = document.createElement('img');
      img.src     = encodePath(p.thumbnail);
      img.alt     = p.name;
      img.width   = 300;
      img.height  = 300;
      img.loading = idx < 8 ? 'eager' : 'lazy';
      thumb.appendChild(img);

      var body = document.createElement('div');
      body.className = 'card-body';
      var nameEl = document.createElement('p');
      nameEl.className = 'card-name';
      nameEl.textContent = p.name;
      var meta = document.createElement('div');
      meta.className = 'card-meta';
      var badge = document.createElement('span');
      badge.className = 'badge badge-' + p.material.toLowerCase();
      badge.textContent = p.material;
      meta.appendChild(badge);
      if (p.sizes && p.sizes.length) {
        var sz = document.createElement('span');
        sz.className = 'card-sizes';
        sz.textContent = p.sizes.slice(0, 3).join(', ') + (p.sizes.length > 3 ? '...' : '');
        meta.appendChild(sz);
      }
      body.appendChild(nameEl);
      body.appendChild(meta);
      card.appendChild(thumb);
      card.appendChild(body);

      (function (product) {
        function open() { openModal(product); }
        card.addEventListener('click', open);
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
        });
      }(p));

      grid.appendChild(card);
    });

    emptyState.classList.toggle('visible', visible === 0);
  }

  /* filter */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeFilter = btn.dataset.filter;
      filterBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderGrid();
    });
  });

  /* open modal */
  function openModal(p) {
    activeProduct = p;
    activePhoto   = 0;

    modalName.textContent = p.name;
    modalBadge.textContent = '';
    var badge = document.createElement('span');
    badge.className = 'badge badge-' + p.material.toLowerCase();
    badge.textContent = p.material + ' Footwear';
    modalBadge.appendChild(badge);

    modalSizes.innerHTML = '';
    if (p.sizes && p.sizes.length) {
      p.sizes.forEach(function (s) {
        var chip = document.createElement('span');
        chip.className = 'size-chip';
        chip.textContent = s;
        modalSizes.appendChild(chip);
      });
    } else {
      var noSz = document.createElement('p');
      noSz.className = 'no-sizes';
      noSz.textContent = 'Contact us for size availability.';
      modalSizes.appendChild(noSz);
    }

    var n = (p.photos && p.photos.length) ? p.photos.length : 0;
    modalCount.textContent = n ? n + ' photo' + (n !== 1 ? 's' : '') : '';

    var msg = encodeURIComponent('Hi, I am interested in the ' + p.name + ' (' + p.material + ') footwear. Please share pricing and MOQ details.');
    modalWA.href = 'https://wa.me/919821351511?text=' + msg;

    buildGallery();

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modalClose.focus(); }, 60);
  }

  /* build gallery (on open) */
  function buildGallery() {
    var photos = (activeProduct && activeProduct.photos) ? activeProduct.photos : [];
    galleryThumbs.innerHTML = '';

    if (!photos.length) {
      galleryMain.src = encodePath(activeProduct.thumbnail);
      galleryMain.alt = activeProduct.name;
      galleryPrev.disabled = true;
      galleryNext.disabled = true;
      return;
    }

    photos.forEach(function (src, i) {
      var t = document.createElement('div');
      t.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
      t.setAttribute('role', 'listitem');
      t.setAttribute('tabindex', '0');
      t.setAttribute('aria-label', 'Photo ' + (i + 1));
      var ti = document.createElement('img');
      ti.src = src; ti.alt = ''; ti.width = 52; ti.height = 52; ti.loading = 'lazy';
      t.appendChild(ti);
      (function (index) {
        t.addEventListener('click', function () { setPhoto(index); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPhoto(index); }
        });
      }(i));
      galleryThumbs.appendChild(t);
    });

    setPhoto(0);
  }

  function setPhoto(idx) {
    var photos = (activeProduct && activeProduct.photos) ? activeProduct.photos : [];
    if (!photos.length) return;
    activePhoto = idx;
    galleryMain.src = photos[idx];
    galleryMain.alt = activeProduct.name + ', photo ' + (idx + 1) + ' of ' + photos.length;
    galleryPrev.disabled = idx === 0;
    galleryNext.disabled = idx === photos.length - 1;
    Array.from(galleryThumbs.querySelectorAll('.gallery-thumb')).forEach(function (t, i) {
      t.classList.toggle('active', i === idx);
    });
    var active = galleryThumbs.children[idx];
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  galleryPrev.addEventListener('click', function () {
    if (activePhoto > 0) setPhoto(activePhoto - 1);
  });
  galleryNext.addEventListener('click', function () {
    if (activeProduct && activePhoto < activeProduct.photos.length - 1) setPhoto(activePhoto + 1);
  });

  /* close modal */
  function closeModal() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeProduct = null;
  }

  modalClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });

  document.addEventListener('keydown', function (e) {
    if (!backdrop.classList.contains('open')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'ArrowLeft' && activePhoto > 0) { e.preventDefault(); setPhoto(activePhoto - 1); }
    if (e.key === 'ArrowRight' && activeProduct && activePhoto < activeProduct.photos.length - 1) { e.preventDefault(); setPhoto(activePhoto + 1); }
  });

  /* focus trap */
  document.getElementById('modalPanel').addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var els = Array.from(this.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')).filter(function (el) { return !el.hidden; });
    if (!els.length) return;
    if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
  });

}());
