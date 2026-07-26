// ==========================================
// FEATURED PROJECTS CAROUSEL (homepage only)
//
// Reads the shared PROJECTS / ICONS globals
// defined in projects/script.js (loaded right
// before this file) — no data duplication.
//
// Desktop: 3 cards per view. Tablet: 2.
// Mobile (≤720px): 1 card per view.
// Autoplay + arrows + dots + swipe, all
// operating on "pages" of `perView` cards.
// ==========================================
(function initProjectsCarousel() {
  const section = document.getElementById('projects-carousel');
  if (!section) return; // this page has no featured-projects widget
  if (typeof PROJECTS === 'undefined' || typeof ICONS === 'undefined') return;

  const track = document.getElementById('projects-track');
  const dotsEl = document.getElementById('projects-dots');
  const prevBtn = document.getElementById('projects-prev');
  const nextBtn = document.getElementById('projects-next');
  const emptyEl = document.getElementById('projects-empty');
  const viewport = track ? track.parentElement : null;

  if (!track || !dotsEl) return;

  // No projects yet — show the empty state, hide the carousel.
  if (!PROJECTS.length) {
    section.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cardsPerView() {
    const w = window.innerWidth;
    if (w <= 720) return 1;
    if (w <= 1080) return 2;
    return 3;
  }

  let perView = cardsPerView();
  let page = 0;
  let timer = null;

  function totalPages() {
    return Math.max(1, Math.ceil(PROJECTS.length / perView));
  }

  function cardMarkup(p) {
    return `
      <article class="project-card" data-id="${p.id}" tabindex="0" role="link" aria-label="Open ${p.title}">
        <div class="project-card-surface">
          <div class="project-card-thumb" style="--thumb-a:${p.thumbA};--thumb-b:${p.thumbB}">
            ${p.featured ? '<span class="project-card-featured">Featured</span>' : ''}
            <span class="project-card-icon">${ICONS[p.icon] || ''}</span>
          </div>
          <div class="project-card-body">
            <div class="project-card-meta">${p.category} · ${p.date}</div>
            <h3 class="project-card-title">${p.title}</h3>
            <p class="project-card-tagline">${p.tagline}</p>
            <div class="project-card-tags">${p.tags.slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
          </div>
        </div>
      </article>
    `;
  }

  function openProject(id) {
    window.location.href = `projects/#${id}`;
  }

  function renderCards() {
    track.style.setProperty('--per-view', perView);
    track.innerHTML = PROJECTS.map(cardMarkup).join('');

    track.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => openProject(card.dataset.id));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProject(card.dataset.id);
        }
      });
    });
  }

  function renderDots() {
    dotsEl.innerHTML = '';
    const tp = totalPages();
    if (tp < 2) return; // nothing to page through
    for (let i = 0; i < tp; i++) {
      const dot = document.createElement('span');
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'button');
      dot.setAttribute('tabindex', '0');
      dot.setAttribute('aria-label', `Show project page ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i); }
      });
      dotsEl.appendChild(dot);
    }
    updateDots();
  }

  function updateDots() {
    [...dotsEl.children].forEach((d, i) => d.classList.toggle('active', i === page));
  }

  function updatePosition() {
    track.style.transform = `translateX(-${page * 100}%)`;
  }

  function goTo(i) {
    const tp = totalPages();
    page = (i + tp) % tp;
    updatePosition();
    updateDots();
    restart();
  }

  function next() { goTo(page + 1); }
  function prev() { goTo(page - 1); }

  function restart() {
    clearInterval(timer);
    if (reduceMotion || totalPages() < 2) return;
    timer = setInterval(next, 6000);
  }

  function handleResize() {
    const newPerView = cardsPerView();
    if (newPerView === perView) return;
    perView = newPerView;
    page = 0;
    renderCards();
    renderDots();
    updatePosition();
    restart();
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  // Pause autoplay while the user is interacting.
  section.addEventListener('mouseenter', () => clearInterval(timer));
  section.addEventListener('mouseleave', restart);
  section.addEventListener('focusin', () => clearInterval(timer));
  section.addEventListener('focusout', restart);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 150);
  });

  // Swipe support for touch devices.
  let touchStartX = null;
  if (viewport) {
    viewport.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      clearInterval(timer);
    }, { passive: true });
    viewport.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
      else restart();
      touchStartX = null;
    });
  }

  renderCards();
  renderDots();
  updatePosition();
  restart();
})();