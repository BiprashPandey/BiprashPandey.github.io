// ==========================================
// Project data
// EDIT ME — keep titles/taglines here in sync
// with the slides array in the homepage's
// script.js (the hero "Latest Transmission" widget).
// ==========================================
const ICONS = {
  ml: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.6"/></svg>',
  cv: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/></svg>',
  web: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.6"/><path d="M2.5 12h19M12 2.5c2.6 2.7 4 6 4 9.5s-1.4 6.8-4 9.5c-2.6-2.7-4-6-4-9.5s1.4-6.8 4-9.5z" stroke="currentColor" stroke-width="1.6"/></svg>'
};

const PROJECTS = [
  {
    id: 'ocean-current-anomaly-detector',
    title: 'Ocean Current Anomaly Detector',
    tagline: 'LSTM-based model flagging irregular current patterns from buoy sensor data.',
    category: 'Machine Learning',
    thumbA: '#103449', thumbB: '#0a2030',
    icon: 'ml',
    date: 'Jun 2026',
    stat: '★ 18',
    featured: true,
    tags: ['PyTorch', 'Time Series', 'LSTM', 'Pandas'],
    description: 'A sequence model trained on multi-year buoy telemetry (temperature, salinity, current speed) to flag anomalous readings in near real time. Built as an exploration of applying deep sequence models to noisy, irregularly-sampled sensor data rather than clean benchmark datasets.',
    highlights: [
      'Custom data pipeline handling missing / irregular sensor timestamps',
      'Stacked LSTM with attention pooling, trained on rolling windows',
      'Anomaly threshold tuned against a held-out labelled event set',
      'Lightweight inference service for streaming new readings'
    ],
    github: 'https://github.com/biprashpandey',
    demo: ''
  },
  {
    id: 'devanagari-ocr',
    title: 'Handwritten Devanagari OCR',
    tagline: 'CNN pipeline for recognizing handwritten Nepali script, trained from scratch.',
    category: 'Computer Vision',
    thumbA: '#123a2f', thumbB: '#0b2420',
    icon: 'cv',
    date: 'Feb 2026',
    stat: '★ 26',
    featured: true,
    tags: ['CNN', 'OpenCV', 'Python', 'NumPy'],
    description: 'An end-to-end optical character recognition system for handwritten Devanagari script, built and trained from scratch rather than fine-tuned from an existing model. Covers everything from stroke-level preprocessing to a custom convolutional classifier.',
    highlights: [
      'Custom-labelled dataset of handwritten Devanagari characters',
      'Preprocessing pipeline: deskew, normalize stroke width, segment glyphs',
      'CNN classifier reaching high accuracy on held-out handwriting samples',
      'Simple web demo for testing live handwriting input'
    ],
    github: 'https://github.com/biprashpandey',
    demo: ''
  },
  {
    id: 'campus-bus-tracker',
    title: 'Campus Bus Tracker',
    tagline: 'Real-time GPS tracking web app for Pulchowk Campus shuttle routes.',
    category: 'Web Systems',
    thumbA: '#3a2f16', thumbB: '#24190c',
    icon: 'web',
    date: 'Nov 2025',
    stat: '★ 9',
    featured: false,
    tags: ['React', 'Node.js', 'WebSocket', 'MongoDB'],
    description: 'A live shuttle-tracking web app for campus routes — drivers broadcast location from a lightweight companion page, and students see live positions and ETAs on a map without refreshing.',
    highlights: [
      'WebSocket layer for sub-second location broadcasts',
      'Route ETA estimation from historical trip timing',
      'Responsive map UI built for one-handed use on the go',
      'Simple driver-side page requiring no app install'
    ],
    github: 'https://github.com/biprashpandey',
    demo: ''
  }
];

const byId = id => PROJECTS.find(p => p.id === id);

// ==========================================
// Grid view
// ==========================================
const gridEl = document.getElementById('projects-grid-yt');
const filterEl = document.getElementById('filter-row');
let activeFilter = 'All';

function renderFilters() {
  const cats = ['All', ...new Set(PROJECTS.map(p => p.category))];
  filterEl.innerHTML = cats.map(c =>
    `<span class="filter-chip${c === activeFilter ? ' active' : ''}" data-cat="${c}">${c}</span>`
  ).join('');
  filterEl.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.cat;
      renderFilters();
      renderGrid();
    });
  });
}

function renderGrid() {
  const list = activeFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.category === activeFilter);
  gridEl.innerHTML = list.map((p, i) => `
    <article class="yt-card" data-id="${p.id}" style="--i:${i}">
      <div class="yt-thumb" style="--thumb-a:${p.thumbA};--thumb-b:${p.thumbB}">
        ${p.featured ? '<span class="yt-thumb-featured">Featured</span>' : ''}
        <span class="yt-thumb-icon">${ICONS[p.icon]}</span>
        <span class="yt-thumb-badge">${p.tags[0]}</span>
      </div>
      <div class="yt-card-body">
        <div class="yt-card-avatar">BP</div>
        <div class="yt-card-info">
          <h3 class="yt-card-title">${p.title}</h3>
          <div class="yt-card-meta">${p.category} · ${p.date}</div>
          <div class="yt-card-tagline">${p.tagline}</div>
        </div>
      </div>
    </article>
  `).join('');

  gridEl.querySelectorAll('.yt-card').forEach(card => {
    card.addEventListener('click', () => { location.hash = card.dataset.id; });
  });
}

// ==========================================
// Detail view
// ==========================================
const viewGrid = document.getElementById('view-grid');
const viewDetail = document.getElementById('view-detail');

const seedComments = {
  'ocean-current-anomaly-detector': [
    { name: 'Anisha R.', time: '3d ago', text: 'Would love a write-up on how you handled the missing buoy readings.' }
  ],
  'devanagari-ocr': [
    { name: 'Suman K.', time: '1w ago', text: 'Tried this on my own handwriting and it held up surprisingly well!' }
  ],
  'campus-bus-tracker': []
};

function loadStoredComments(id) {
  try { return JSON.parse(localStorage.getItem('proj-comments-' + id) || '[]'); }
  catch { return []; }
}
function saveStoredComments(id, list) {
  localStorage.setItem('proj-comments-' + id, JSON.stringify(list));
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderComments(id) {
  const listEl = document.getElementById('comments-list');
  const headingEl = document.getElementById('comments-heading');
  const stored = loadStoredComments(id);
  const all = [...stored, ...(seedComments[id] || [])];
  headingEl.textContent = `Comments (${all.length})`;
  listEl.innerHTML = all.map(c => `
    <div class="comment-item">
      <div class="comment-avatar-sm">${initials(c.name)}</div>
      <div class="comment-body">
        <div class="comment-head">
          <span class="comment-name">${c.name}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <p class="comment-text"></p>
      </div>
    </div>
  `).join('');
  // set text via textContent to avoid HTML injection from user-submitted comments
  listEl.querySelectorAll('.comment-text').forEach((el, i) => { el.textContent = all[i].text; });
}

function renderUpNext(currentId) {
  const others = PROJECTS.filter(p => p.id !== currentId);
  const el = document.getElementById('up-next-list');
  el.innerHTML = others.map(p => `
    <div class="up-next-item" data-id="${p.id}">
      <div class="up-next-thumb" style="--thumb-a:${p.thumbA};--thumb-b:${p.thumbB}">${ICONS[p.icon]}</div>
      <div class="up-next-info">
        <div class="up-next-title">${p.title}</div>
        <div class="up-next-meta">${p.category} · ${p.date}</div>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('.up-next-item').forEach(item => {
    item.addEventListener('click', () => { location.hash = item.dataset.id; });
  });
}

function showDetail(id) {
  const p = byId(id);
  if (!p) return;

  document.getElementById('detail-banner').style.setProperty('--thumb-a', p.thumbA);
  document.getElementById('detail-banner').style.setProperty('--thumb-b', p.thumbB);
  document.getElementById('detail-banner-icon').innerHTML = ICONS[p.icon];
  document.getElementById('detail-banner-tag').textContent = p.category;

  const playBtn = document.getElementById('detail-banner-play');
  playBtn.href = p.demo || p.github;

  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-category').textContent = p.category;
  document.getElementById('detail-date').textContent = p.date;
  document.getElementById('detail-stat').textContent = p.stat;

  document.getElementById('detail-github').href = p.github;
  const demoBtn = document.getElementById('detail-demo');
  if (p.demo) {
    demoBtn.href = p.demo;
    demoBtn.hidden = false;
  } else {
    demoBtn.hidden = true;
  }

  document.getElementById('detail-tags').innerHTML =
    p.tags.map(t => `<span class="skill-tag level-mid">${t}</span>`).join('');

  document.getElementById('detail-description').textContent = p.description;
  document.getElementById('detail-highlights').innerHTML =
    p.highlights.map(h => `<li>${h}</li>`).join('');

  renderUpNext(id);
  renderComments(id);

  document.getElementById('comment-input').value = '';
  document.getElementById('comment-actions').hidden = true;

  viewGrid.hidden = true;
  viewDetail.hidden = false;
  window.scrollTo(0, 0);
}

function showGrid() {
  viewDetail.hidden = true;
  viewGrid.hidden = false;
}

function route() {
  const id = decodeURIComponent(location.hash.replace('#', ''));
  if (id && byId(id)) showDetail(id);
  else showGrid();
}

document.getElementById('detail-back').addEventListener('click', () => { location.hash = ''; });

window.addEventListener('hashchange', route);

// ==========================================
// Comment form (local only — see note in UI)
// ==========================================
(function initCommentForm() {
  const input = document.getElementById('comment-input');
  const actions = document.getElementById('comment-actions');
  const cancelBtn = document.getElementById('comment-cancel');
  const submitBtn = document.getElementById('comment-submit');

  input.addEventListener('focus', () => { actions.hidden = false; });
  cancelBtn.addEventListener('click', () => { input.value = ''; actions.hidden = true; input.blur(); });

  submitBtn.addEventListener('click', () => {
    const id = decodeURIComponent(location.hash.replace('#', ''));
    const text = input.value.trim();
    if (!text || !byId(id)) return;

    const stored = loadStoredComments(id);
    stored.unshift({ name: 'You', time: 'Just now', text });
    saveStoredComments(id, stored);

    input.value = '';
    actions.hidden = true;
    renderComments(id);
  });
})();

// ==========================================
// Init
// ==========================================
renderFilters();
renderGrid();
route();