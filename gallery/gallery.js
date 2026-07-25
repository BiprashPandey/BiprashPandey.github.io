/* ==========================================
   gallery.js — Photo gallery grid + lightbox
   Reads gallery/photos/manifest.json (a plain JSON array of
   filenames). Regenerate it with generate-manifest.py whenever
   photos are added to or removed from /gallery/photos.

   Lazy loading: every <img> starts with no src (just data-src).
   An IntersectionObserver only assigns the real src once a tile
   is about to scroll into view, on top of the native loading="lazy"
   hint — so a folder with hundreds of photos never gets fetched
   all at once.
========================================== */
(function () {
  const grid = document.getElementById('gallery-grid');
  const emptyMsg = document.getElementById('gallery-empty');
  if (!grid) return;

  const MANIFEST_URL = 'photos/manifest.json';
  const PHOTOS_DIR = 'photos/';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCount = document.getElementById('lightbox-count');
  const btnClose = document.getElementById('lightbox-close');
  const btnPrev = document.getElementById('lightbox-prev');
  const btnNext = document.getElementById('lightbox-next');

  let photos = [];
  let activeIndex = 0;

  function openLightbox(i) {
    activeIndex = i;
    updateLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateLightbox() {
    lightboxImg.classList.remove('is-loaded');
    lightboxImg.onload = () => lightboxImg.classList.add('is-loaded');
    lightboxImg.src = PHOTOS_DIR + encodeURIComponent(photos[activeIndex]);
    lightboxImg.alt = `Photo ${activeIndex + 1}`;
    lightboxCount.textContent = `${activeIndex + 1} / ${photos.length}`;
  }

  function step(delta) {
    activeIndex = (activeIndex + delta + photos.length) % photos.length;
    updateLightbox();
  }

  if (btnClose) btnClose.addEventListener('click', closeLightbox);
  if (btnPrev) btnPrev.addEventListener('click', () => step(-1));
  if (btnNext) btnNext.addEventListener('click', () => step(1));
  if (lightbox) {
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  }
  document.addEventListener('keydown', e => {
    if (!lightbox || !lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  const lazyObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          img.src = img.dataset.src;
          lazyObserver.unobserve(img);
        });
      }, { rootMargin: '200px 0px' })
    : null;

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  function buildGrid() {
    const frag = document.createDocumentFragment();

    photos.forEach((file, i) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'gallery-item reveal';
      item.setAttribute('aria-label', `Open photo ${i + 1}`);

      const img = document.createElement('img');
      img.className = 'gallery-img';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `Photo ${i + 1}`;
      img.dataset.src = PHOTOS_DIR + encodeURIComponent(file);
      img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });

      if (lazyObserver) {
        lazyObserver.observe(img);
      } else {
        img.src = img.dataset.src;
      }

      item.appendChild(img);
      item.addEventListener('click', () => openLightbox(i));
      frag.appendChild(item);
    });

    grid.appendChild(frag);
    grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  fetch(MANIFEST_URL)
    .then(res => { if (!res.ok) throw new Error('missing manifest'); return res.json(); })
    .then(list => {
      if (!Array.isArray(list) || list.length === 0) throw new Error('empty manifest');
      photos = list;
      buildGrid();
    })
    .catch(() => {
      if (emptyMsg) emptyMsg.hidden = false;
    });
})();