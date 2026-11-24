const nav = document.querySelector('.nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
// Night sky — generated star field
// ==========================================
function initSky() {
  const field = document.querySelector('.sky-stars');
  if (!field) return;

  const count = window.innerWidth < 700 ? 70 : 135;
  const frag = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const star = document.createElement('span');
    star.className = 'sky-star';
    star.style.setProperty('--x', `${(Math.random() * 100).toFixed(2)}%`);
    star.style.setProperty('--y', `${(Math.random() * 100).toFixed(2)}%`);
    star.style.setProperty('--s', `${(Math.random() * 1.5 + 0.5).toFixed(2)}px`);
    star.style.setProperty('--o', (Math.random() * 0.55 + 0.25).toFixed(2));
    star.style.setProperty('--d', `${(Math.random() * 8 + 4).toFixed(2)}s`);
    star.style.setProperty('--delay', `${(-Math.random() * 12).toFixed(2)}s`);
    if (Math.random() > 0.88) star.classList.add('is-bright');
    frag.appendChild(star);
  }

  field.appendChild(frag);
}

initSky();

// ==========================================
// Flowchart pinned stage (homepage only)
// ==========================================
const track = document.getElementById('track');
const stageEl = document.getElementById('stage');
const flowLayer = document.getElementById('flow-layer');
const flowRail = document.getElementById('flow-rail');
const boxes = [...document.querySelectorAll('.node-box')];
const stageNarrow = window.matchMedia('(max-width: 900px)');

const flowPaths = flowLayer ? {
  inTrack: flowLayer.querySelector('.flow-track-in'),
  outTrack: flowLayer.querySelector('.flow-track-out'),
  nextTrack: flowLayer.querySelector('.flow-track-next'),
  inProgress: flowLayer.querySelector('.flow-progress-in'),
  outProgress: flowLayer.querySelector('.flow-progress-out'),
  nextProgress: flowLayer.querySelector('.flow-progress-next'),
  inPulse: flowLayer.querySelector('.flow-pulse-in'),
  outPulse: flowLayer.querySelector('.flow-pulse-out'),
  inPort: flowLayer.querySelector('.flow-port-in'),
  outPort: flowLayer.querySelector('.flow-port-out'),
  nextPort: flowLayer.querySelector('.flow-port-next'),
} : null;

let railFill = null;
const railSteps = [];

function stageEnabled() {
  return !!(track && stageEl && boxes.length) && !stageNarrow.matches;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function smoothstep(a, b, v) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function flowSide(index) {
  return index % 2 === 0 ? 1 : -1;
}

function buildFlowRail() {
  if (!flowRail || !boxes.length || flowRail.childElementCount) return;

  const trackLine = document.createElement('span');
  trackLine.className = 'flow-rail-track';
  trackLine.setAttribute('aria-hidden', 'true');
  railFill = document.createElement('span');
  railFill.className = 'flow-rail-fill';
  trackLine.appendChild(railFill);

  const list = document.createElement('ol');
  list.className = 'flow-rail-steps';

  boxes.forEach((box, index) => {
    const label = box.dataset.stepLabel || `Step ${index + 1}`;
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'flow-step';
    button.dataset.target = box.id;
    button.setAttribute('aria-label', `Go to ${label}`);

    const dot = document.createElement('span');
    dot.className = 'flow-step-dot';
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'flow-step-label';
    text.textContent = label;

    button.append(dot, text);
    button.addEventListener('click', () => {
      if (!scrollToBox(box.id)) {
        const target = document.getElementById(box.id);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });

    item.appendChild(button);
    list.appendChild(item);
    railSteps.push(button);
  });

  flowRail.append(trackLine, list);
}

function updateFlowRail(progress, index, count) {
  if (!railSteps.length) return;

  railSteps.forEach((step, i) => {
    const active = i === index;
    step.classList.toggle('is-active', active);
    step.classList.toggle('is-complete', i < index);
    if (active) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
  });

  if (railFill) {
    const local = clamp(progress - index, 0, 1);
    const fillProgress = index + clamp((local - 0.2) / 0.3, 0, 1);
    const percent = clamp(fillProgress / Math.max(count - 1, 1), 0, 1) * 100;
    railFill.style.width = `${percent}%`;
  }
}

function setFlowPath(path, d) {
  if (!path) return 0;
  if (path.dataset.d !== d) {
    path.dataset.d = d;
    path.setAttribute('d', d);
    path._flowLength = path.getTotalLength();
  }
  return path._flowLength || 0;
}

function cardPort(index, motion, edge, stageRect) {
  const box = boxes[index];
  if (!box) return null;

  const w = box.offsetWidth || 0;
  const h = box.offsetHeight || 0;
  if (!w || !h) return null;

  const side = edge === 'out' ? flowSide(index + 1) : flowSide(index);
  const localX = side * (w / 2);
  const localY = edge === 'out' ? -h * 0.18 : h * 0.18;
  const rad = (motion.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: stageRect.width / 2 + motion.tx + motion.scale * (localX * cos - localY * sin),
    y: stageRect.height / 2 + motion.ty + motion.scale * (localX * sin + localY * cos),
    side,
    width: w,
    height: h,
  };
}

function flowLaneX(side, stageRect) {
  const inset = clamp(stageRect.width * 0.042, 22, 64);
  return side > 0 ? stageRect.width - inset : inset;
}

function makeIncomingPath(port, stageRect) {
  if (!port) return '';
  const laneX = flowLaneX(port.side, stageRect);
  const startY = Math.max(stageRect.height + 140, port.y + 280);
  const span = Math.max(160, startY - port.y);
  const c1y = port.y + span * 0.55;
  const c2x = laneX + (port.x - laneX) * 0.55;
  return `M ${laneX.toFixed(1)} ${startY.toFixed(1)} C ${laneX.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${port.y.toFixed(1)}, ${port.x.toFixed(1)} ${port.y.toFixed(1)}`;
}

function makeOutgoingPath(port, stageRect) {
  if (!port) return '';
  const laneX = flowLaneX(port.side, stageRect);
  const endY = Math.min(-140, port.y - 280);
  const span = Math.max(160, port.y - endY);
  const c1x = laneX + (port.x - laneX) * 0.55;
  const c2y = port.y - span * 0.55;
  return `M ${port.x.toFixed(1)} ${port.y.toFixed(1)} C ${c1x.toFixed(1)} ${port.y.toFixed(1)}, ${laneX.toFixed(1)} ${c2y.toFixed(1)}, ${laneX.toFixed(1)} ${endY.toFixed(1)}`;
}

function placeDot(dot, point, opacity) {
  if (!dot) return;
  if (!point || opacity <= 0.01) {
    dot.style.opacity = '0';
    return;
  }
  dot.setAttribute('cx', point.x.toFixed(1));
  dot.setAttribute('cy', point.y.toFixed(1));
  dot.style.opacity = `${clamp(opacity, 0, 1)}`;
}

function updateFlowPaths(index, local, count, motions) {
  if (!flowPaths || !stageEl || !boxes[index]) return;

  const stageRect = stageEl.getBoundingClientRect();
  if (stageRect.width < 2 || stageRect.height < 2) return;

  const hasNext = index < count - 1;
  const currentPortIn = cardPort(index, motions[index], 'in', stageRect);
  const currentPortOut = hasNext ? cardPort(index, motions[index], 'out', stageRect) : null;
  const nextPortIn = hasNext ? cardPort(index + 1, motions[index + 1], 'in', stageRect) : null;

  const inD = makeIncomingPath(currentPortIn, stageRect);
  const outD = makeOutgoingPath(currentPortOut, stageRect);
  const nextD = makeIncomingPath(nextPortIn, stageRect);

  setFlowPath(flowPaths.inTrack, inD);
  setFlowPath(flowPaths.outTrack, outD);
  setFlowPath(flowPaths.nextTrack, nextD);

  const inLength = setFlowPath(flowPaths.inProgress, inD);
  const outLength = setFlowPath(flowPaths.outProgress, outD);
  const nextLength = setFlowPath(flowPaths.nextProgress, nextD);

  const historyOpacity = index === count - 1 ? 1 : 1 - smoothstep(0.22, 0.48, local);
  const outDraw = hasNext ? smoothstep(0.2, 0.66, local) : 0;
  const outOpacity = hasNext ? 1 - smoothstep(0.58, 0.84, local) : 0;
  const nextVisible = hasNext ? smoothstep(0.18, 0.3, local) : 0;

  if (flowPaths.inProgress) {
    flowPaths.inProgress.style.strokeDasharray = `${inLength}`;
    flowPaths.inProgress.style.strokeDashoffset = '0';
    flowPaths.inProgress.style.opacity = `${historyOpacity}`;
  }

  if (flowPaths.outProgress) {
    flowPaths.outProgress.style.strokeDasharray = `${outLength}`;
    flowPaths.outProgress.style.strokeDashoffset = `${outLength * (1 - outDraw)}`;
    flowPaths.outProgress.style.opacity = `${outDraw > 0.001 ? outOpacity : 0}`;
  }

  if (flowPaths.nextProgress) {
    flowPaths.nextProgress.style.strokeDasharray = `${nextLength}`;
    flowPaths.nextProgress.style.strokeDashoffset = '0';
    flowPaths.nextProgress.style.opacity = `${nextVisible}`;
  }

  if (flowPaths.inTrack) flowPaths.inTrack.style.opacity = `${historyOpacity}`;
  if (flowPaths.outTrack) flowPaths.outTrack.style.opacity = hasNext ? '1' : '0';
  if (flowPaths.nextTrack) flowPaths.nextTrack.style.opacity = nextVisible > 0.02 ? '1' : '0';

  let outHead = null;
  if (outLength && outDraw > 0.002) {
    outHead = flowPaths.outProgress.getPointAtLength(outLength * clamp(outDraw, 0, 1));
  }
  placeDot(flowPaths.outPulse, outHead, hasNext ? outOpacity : 0);
  placeDot(flowPaths.outPort, currentPortOut, hasNext ? 1 - smoothstep(0.55, 0.9, local) : 0);

  let inHead = null;
  if (nextLength && nextVisible > 0.01) {
    const travel = smoothstep(0.18, 0.78, local);
    inHead = flowPaths.nextProgress.getPointAtLength(nextLength * clamp(travel, 0, 1));
  }
  const inHeadOnStage = inHead && inHead.y < stageRect.height + 12 && inHead.y > -12;
  placeDot(flowPaths.inPulse, inHead, inHeadOnStage ? nextVisible : 0);
  placeDot(flowPaths.nextPort, nextPortIn, nextVisible && nextPortIn && nextPortIn.y < stageRect.height + 8 ? 1 : 0);

  placeDot(flowPaths.inPort, currentPortIn, historyOpacity);
}

function renderStage() {
  if (!track || !boxes.length) return;

  if (!stageEnabled()) {
    boxes.forEach((box) => {
      box.style.opacity = '';
      box.style.transform = '';
      box.style.pointerEvents = '';
    });
    if (stageEl) stageEl.classList.remove('is-flowing');
    if (flowPaths) {
      [flowPaths.inProgress, flowPaths.outProgress, flowPaths.nextProgress].forEach((path) => {
        if (path) path.style.opacity = '0';
      });
      [flowPaths.inPulse, flowPaths.outPulse, flowPaths.inPort, flowPaths.outPort, flowPaths.nextPort].forEach((dot) => {
        if (dot) dot.style.opacity = '0';
      });
    }
    return;
  }

  const count = boxes.length;
  const vh = window.innerHeight;
  const total = track.offsetHeight - vh;
  const scrolled = clamp(-track.getBoundingClientRect().top, 0, Math.max(total, 0));
  const progress = total > 0 ? (scrolled / total) * count : 0;
  const index = clamp(Math.floor(progress), 0, count - 1);
  const local = clamp(progress - index, 0, 1);

  const travelY = reduceMotion ? 0 : Math.round(vh * 0.72);
  const travelX = reduceMotion ? 0 : clamp(stageEl.clientWidth * 0.03, 18, 44);
  const motions = [];

  boxes.forEach((box, i) => {
    if (reduceMotion) {
      const showNext = i === index + 1 && local >= 0.5;
      const showCurrent = i === index && (i === count - 1 || local < 0.5);
      const visible = showNext || showCurrent;
      box.style.opacity = visible ? '1' : '0';
      box.style.transform = 'translate3d(0, 0, 0) scale(1)';
      box.style.pointerEvents = visible ? 'auto' : 'none';
      motions[i] = { opacity: visible ? 1 : 0, tx: 0, ty: 0, scale: 1, rotate: 0 };
      return;
    }

    let motion;

    if (i === index && i === count - 1) {
      motion = { opacity: 1, tx: 0, ty: 0, scale: 1, rotate: 0 };
    } else if (i === index) {
      const move = smoothstep(0.22, 0.84, local);
      const fade = smoothstep(0.24, 0.48, local);
      motion = {
        opacity: 1 - fade,
        tx: flowSide(index + 1) * travelX * move,
        ty: -travelY * move,
        scale: 1 - 0.06 * move,
        rotate: flowSide(index + 1) * 0.8 * move,
      };
      box.style.pointerEvents = local < 0.34 ? 'auto' : 'none';
    } else if (i === index + 1) {
      const move = smoothstep(0.2, 0.72, local);
      const fade = smoothstep(0.3, 0.5, local);
      motion = {
        opacity: fade,
        tx: flowSide(i) * travelX * (1 - move),
        ty: travelY * (1 - move),
        scale: 0.9 + 0.1 * move,
        rotate: flowSide(i) * 0.8 * (1 - move),
      };
      box.style.pointerEvents = local > 0.5 ? 'auto' : 'none';
    } else if (i < index) {
      motion = {
        opacity: 0,
        tx: -flowSide(i) * travelX * 1.4,
        ty: -travelY * 1.4,
        scale: 0.9,
        rotate: 0,
      };
      box.style.pointerEvents = 'none';
    } else {
      motion = {
        opacity: 0,
        tx: flowSide(i) * travelX * 1.4,
        ty: travelY * 1.4,
        scale: 0.9,
        rotate: 0,
      };
      box.style.pointerEvents = 'none';
    }

    motions[i] = motion;
    box.style.opacity = `${motion.opacity}`;
    box.style.transform = `translate3d(${motion.tx}px, ${motion.ty}px, 0) scale(${motion.scale}) rotate(${motion.rotate}deg)`;
  });

  const visualIndex = local >= 0.5 && index < count - 1 ? index + 1 : index;
  const flowing = !reduceMotion && index < count - 1 && local > 0.22 && local < 0.86;

  updateFlowPaths(index, local, count, motions);
  if (stageEl) stageEl.classList.toggle('is-flowing', flowing);
  updateFlowRail(progress, visualIndex, count);

  // Nav active state follows the pinned box (the old observer can't —
  // stacked absolute boxes share one viewport rect).
  const activeId = boxes[visualIndex] ? boxes[visualIndex].id : null;
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
  buildFlowRail();
  track.style.height = `${boxes.length * 100}vh`;
  document.addEventListener('scroll', onStageScroll, { passive: true });
  window.addEventListener('resize', debounce(renderStage, 150));
  if (typeof stageNarrow.addEventListener === 'function') {
    stageNarrow.addEventListener('change', renderStage);
  }
  renderStage();
}

// Nav / in-page anchor jumps land mid-dwell inside the track.
function scrollToBox(id, behavior) {
  const index = boxes.findIndex((box) => box.id === id);
  if (index < 0 || !track) return false;
  if (!stageEnabled()) return false; // let the browser do the native jump
  const total = track.offsetHeight - window.innerHeight;
  const trackTop = track.getBoundingClientRect().top + window.scrollY;
  const targetScroll = trackTop + (total * (index + 0.2)) / boxes.length;
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
  const rect = track.getBoundingClientRect();
  return rect.top <= 0 && rect.bottom >= window.innerHeight;
}

function pageStep(dir) {
  const index = currentStageIndex();
  const next = index + dir;
  if (index < 0 || next < 0 || next >= boxes.length) return false;
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
  const index = currentStageIndex();
  if (index + dir < 0 || index + dir >= boxes.length) return; // let native scroll leave the track
  e.preventDefault();
  pageLockUntil = now + 1000;
  pageStep(dir);
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (!stageHasFocus()) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (performance.now() < pageLockUntil) { e.preventDefault(); return; }
  const dir = e.key === 'ArrowDown' ? 1 : -1;
  const index = currentStageIndex();
  if (index + dir < 0 || index + dir >= boxes.length) return;
  e.preventDefault();
  pageLockUntil = performance.now() + 1000;
  pageStep(dir);
});

function routeDeepLink() {
  if (!location.hash) return;
  const id = decodeURIComponent(location.hash.slice(1));
  if (boxes.some((box) => box.id === id)) scrollToBox(id, reduceMotion ? 'auto' : 'smooth');
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
