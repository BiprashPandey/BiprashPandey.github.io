const nav = document.querySelector('.nav');

const themeButtons = document.querySelectorAll('.theme-toggle');

function updateThemeButtons() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  themeButtons.forEach((button) => {
    button.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    button.setAttribute('aria-pressed', String(isDark));
  });
}

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    updateThemeButtons();
  });
});

updateThemeButtons();

function updateNav() {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ==========================================
// Flowchart pinned stage (homepage only)
// ==========================================
const track = document.getElementById('track');
const boxes = [...document.querySelectorAll('.node-box')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stageNarrow = window.matchMedia('(max-width: 900px)');

function stageEnabled() {
  return !!(track && boxes.length) && !stageNarrow.matches;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function remap(v, i0, i1, o0, o1) { return clamp((v - i0) / (i1 - i0), 0, 1) * (o1 - o0) + o0; }

function renderStage() {
  if (!track || !boxes.length) return;
  if (!stageEnabled()) {
    // Mobile/static fallback: clear any inline stage styles.
    boxes.forEach((box) => {
      box.style.opacity = '';
      box.style.transform = '';
      box.style.pointerEvents = '';
    });
    return;
  }
  const n = boxes.length;
  const vh = window.innerHeight;
  const total = track.offsetHeight - vh;
  const scrolled = clamp(-track.getBoundingClientRect().top, 0, Math.max(total, 0));
  const p = total > 0 ? (scrolled / total) * n : 0;
  const idx = clamp(Math.floor(p), 0, n - 1);
  const local = clamp(p - idx, 0, 1);

  const travel = reduceMotion ? 0 : Math.round(window.innerHeight * 0.35);

  boxes.forEach((box, i) => {
    const lineOut = box.querySelector('.link-line.out');
    const lineIn = box.querySelector('.link-line.in');
    const dotOut = box.querySelector('.link-dot:not(.in)');
    const dotIn = box.querySelector('.link-dot.in');
    const setOut = (f) => {
      if (lineOut) {
        lineOut.style.setProperty('--fill', `${f * 100}%`);
        if (dotOut) dotOut.style.setProperty('--dot-opacity', f > 0.85 ? 1 : 0);
      }
    };
    const setIn = (f) => {
      if (lineIn) {
        lineIn.style.setProperty('--fill-in', `${f * 100}%`);
        if (dotIn) dotIn.style.setProperty('--dot-opacity-in', f > 0.95 ? 1 : 0);
      }
    };

    if (i < idx) {
      box.style.opacity = 0;
      box.style.transform = `translateY(${-travel}px) scale(.94)`;
      box.style.pointerEvents = 'none';
      setOut(1); setIn(1);
    } else if (i === idx) {
      if (i === boxes.length - 1) {
        // Last box is the end of the page — it stays centered,
        // never exits, no matter how far down you scroll.
        box.style.opacity = 1;
        box.style.transform = 'translateY(0px) scale(1)';
        box.style.pointerEvents = 'auto';
        setOut(0); setIn(1);
      } else {
        // Current box: climbs away across the whole scroll range.
        // Scrolling back up reverses this — it settles back down to mid.
        const fade = remap(local, 0.25, 0.75, 0, 1);
        box.style.opacity = 1 - fade;
        box.style.transform = `translateY(${local * -travel}px) scale(${1 - local * 0.06})`;
        box.style.pointerEvents = local < 0.5 ? 'auto' : 'none';
        setOut(local);
        setIn(idx > 0 ? 1 : 0);
      }
    } else if (i === idx + 1) {
      // Next box: rises from below into mid across the whole range.
      const fade = remap(local, 0.25, 0.75, 0, 1);
      box.style.opacity = fade;
      box.style.transform = `translateY(${(1 - local) * travel}px) scale(${0.94 + local * 0.06})`;
      box.style.pointerEvents = local > 0.5 ? 'auto' : 'none';
      setOut(0); setIn(fade);
    } else {
      box.style.opacity = 0;
      box.style.transform = `translateY(${travel}px) scale(.94)`;
      box.style.pointerEvents = 'none';
      setOut(0); setIn(0);
    }
  });

  // Nav active state follows the pinned box (the old observer can't —
  // stacked absolute boxes share one viewport rect).
  const activeId = boxes[idx] ? boxes[idx].id : null;
  document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.classList.toggle('active', `#${activeId}` === link.hash);
  });
}

let stageQueued = false;
function onStageScroll() {
  if (reduceMotion) { renderStage(); return; }
  if (stageQueued) return;
  stageQueued = true;
  requestAnimationFrame(() => { stageQueued = false; renderStage(); });
}

if (track && boxes.length) {
  const n = boxes.length;
  track.style.height = `${n * 100}vh`;
  document.addEventListener('scroll', onStageScroll, { passive: true });
  window.addEventListener('resize', debounce(renderStage, 150));
  if (typeof stageNarrow.addEventListener === 'function') {
    stageNarrow.addEventListener('change', renderStage);
  }
  renderStage();
}

// Nav / in-page anchor jumps land mid-dwell inside the track.
function scrollToBox(id, behavior) {
  const idx = boxes.findIndex((b) => b.id === id);
  if (idx < 0 || !track) return false;
  if (!stageEnabled()) return false; // let the browser do the native jump
  const total = track.offsetHeight - window.innerHeight;
  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  const targetScroll = trackTop + (total * (idx + 0.2)) / boxes.length;
  window.scrollTo({ top: targetScroll, behavior: behavior || (reduceMotion ? 'auto' : 'smooth') });
  return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    if (scrollToBox(decodeURIComponent(href.slice(1)))) e.preventDefault();
  });
});

// Discrete paging: one wheel notch (or arrow press) moves exactly one box
// while the pinned stage owns the viewport. Native scrolling takes over
// above the first box and below the last one.
let pageLockUntil = 0;

function currentStageIndex() {
  if (!stageEnabled()) return -1;
  const total = track.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  const scrolled = clamp(-track.getBoundingClientRect().top, 0, total);
  return clamp(Math.floor((scrolled / total) * boxes.length), 0, boxes.length - 1);
}

function stageHasFocus() {
  if (!stageEnabled()) return false;
  const r = track.getBoundingClientRect();
  return r.top <= 0 && r.bottom >= window.innerHeight;
}

function pageStep(dir) {
  const idx = currentStageIndex();
  const next = idx + dir;
  if (idx < 0 || next < 0 || next >= boxes.length) return false;
  scrollToBox(boxes[next].id);
  return true;
}

document.addEventListener('wheel', (e) => {
  if (!stageHasFocus() || e.ctrlKey) return; // pinch-zoom untouched
  // Normalize line-mode deltas (classic mouse notch) to px for thresholding.
  const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
  if (Math.abs(dy) < 30) return; // trackpad micro-drift scrolls natively
  const dir = dy > 0 ? 1 : -1;
  const now = performance.now();
  if (now < pageLockUntil) { e.preventDefault(); return; }
  const idx = currentStageIndex();
  if (idx + dir < 0 || idx + dir >= boxes.length) return; // let native scroll leave the track
  e.preventDefault();
  pageLockUntil = now + 900;
  pageStep(dir);
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (!stageHasFocus()) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (performance.now() < pageLockUntil) { e.preventDefault(); return; }
  const dir = e.key === 'ArrowDown' ? 1 : -1;
  const idx = currentStageIndex();
  if (idx + dir < 0 || idx + dir >= boxes.length) return;
  e.preventDefault();
  pageLockUntil = performance.now() + 900;
  pageStep(dir);
});

function routeDeepLink() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  if (boxes.some((b) => b.id === id)) scrollToBox(id, reduceMotion ? 'auto' : 'smooth');
}
window.addEventListener('hashchange', routeDeepLink);
window.addEventListener('load', routeDeepLink);

// Scroll-spy for normal-flow sections only — pinned .node-boxes share one
// viewport rect, so their active state is driven by renderStage() instead.
const sections = document.querySelectorAll('section[id]:not(.node-box), header[id]:not(.node-box)');
const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
if ('IntersectionObserver' in window && navLinks.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach((section) => sectionObserver.observe(section));
}

const preview = document.getElementById('photo-preview');
if (preview) {
  fetch('gallery/photos/manifest.json')
    .then((response) => {
      if (!response.ok) throw new Error('Photo manifest unavailable');
      return response.json();
    })
    .then((photos) => {
      photos.slice(0, 3).forEach((photo, index) => {
        const link = document.createElement('a');
        link.href = 'gallery/';
        link.setAttribute('aria-label', 'Open photography gallery');
        const image = document.createElement('img');
        image.src = `gallery/photos/${encodeURIComponent(photo)}`;
        image.alt = `Photography by Biprash Pandey ${index + 1}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        link.appendChild(image);
        preview.appendChild(link);
      });
    })
    .catch(() => preview.closest('.photo-strip').hidden = true);
}