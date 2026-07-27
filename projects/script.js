// ==========================================
// Project data + browse/detail view logic
//
// This file is shared: it's loaded on the
// standalone /projects/ page (full browse +
// detail views) AND on the homepage (which
// only needs the PROJECTS/ICONS data — see
// projects/projects.js for the homepage
// carousel that reads them). All DOM lookups
// below are guarded so this is safe on pages
// that don't have the grid/detail markup.
//
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
    id: 'pulchowk-campus-network',
    title: 'Simulation and Analysis of the Pulchowk Campus Network',
    tagline: 'Cisco Packet Tracer simulation of the campus network — dual-ISP edge, OSPF backbone, VLAN segmentation, centralized services.',
    category: 'Networks',
    thumbA: '#103449', thumbB: '#0a2030',
    icon: 'web',
    date: 'July 2026',
    stat: '★ 0',
    featured: true,
    tags: ['Cisco Packet Tracer', 'Network Simulation', 'Network Design'],
    description: "A fully functioning simulation of the Pulchowk Campus (Institute of Engineering) network, built in Cisco Packet Tracer. The project reproduces the campus's dual-ISP internet edge, firewall, three-switch OSPF backbone, VLAN-segmented departments and hostels, and centralized DHCP/DNS/login services — then critically evaluates the design and proposes concrete improvements", 
    highlights: [
      'Dual-ISP internet edge with a firewall for redundancy and failover',
      'Three-switch OSPF backbone linking every campus block',
      'VLAN-segmented departments and hostels for traffic isolation',
      'Centralized DHCP/DNS/login services, plus proposed security and resiliency improvements'
    ],
    github: 'https://github.com/BiprashPandey/Simulation-and-Analysis-of-the-Pulchowk-Campus-Network',
    demo: '',
    report: 'https://cdn.jsdelivr.net/gh/BiprashPandey/Simulation-and-Analysis-of-the-Pulchowk-Campus-Network@main/report.pdf',
    image: 'https://github.com/BiprashPandey/Simulation-and-Analysis-of-the-Pulchowk-Campus-Network/blob/main/topology.png?raw=true',
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

// Converts a YouTube/Vimeo watch/share URL into its embeddable form.
// Returns null if the URL isn't a recognized video link or couldn't be parsed —
// callers should fall back to a plain outbound link in that case.
function toVideoEmbedUrl(url) {
  let u;
  try { u = new URL(url); } catch { return null; }

  if (/(^|\.)youtu\.be$/i.test(u.hostname)) {
    const id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (/(^|\.)youtube\.com$/i.test(u.hostname)) {
    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith('/embed/')) return url; // already an embed URL
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/')[2];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  }
  if (/(^|\.)vimeo\.com$/i.test(u.hostname)) {
    const id = u.pathname.split('/').filter(Boolean)[0];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}


// ==========================================
// Grid view
// ==========================================
const gridEl = document.getElementById('projects-grid-yt');
const filterEl = document.getElementById('filter-row');
let activeFilter = 'All';

function renderFilters() {
  if (!filterEl) return; // no filter row on this page (e.g. homepage)
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
  if (!gridEl) return; // no browse grid on this page (e.g. homepage)
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
  if (!listEl || !headingEl) return;
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
  if (!el) return;
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
  if (!viewGrid || !viewDetail) return; // no detail view on this page (e.g. homepage)

  const hasDemo = !!p.demo;
  const hasReport = !!p.report;
  const hasImage = !!p.image;
  const videoEmbedUrl = hasDemo ? toVideoEmbedUrl(p.demo) : null;

  // ---- Hero banner: four interchangeable states in the same box —
  // a playable video embed (recognized YouTube/Vimeo demo link), a
  // representative image (e.g. a topology diagram, via `image`), the
  // report PDF itself, or a plain icon+link as the last resort.
  const bannerEl = document.getElementById('detail-banner');
  const bannerMedia = document.getElementById('detail-banner-media');
  const bannerVideo = document.getElementById('detail-banner-video');
  const bannerVideoIframe = document.getElementById('detail-banner-video-iframe');
  const bannerVideoTag = document.getElementById('detail-banner-video-tag');
  const bannerImage = document.getElementById('detail-banner-image');
  const bannerImageImg = document.getElementById('detail-banner-image-img');
  const bannerImageTag = document.getElementById('detail-banner-image-tag');
  const bannerImageOpen = document.getElementById('detail-banner-image-open');
  const bannerReport = document.getElementById('detail-banner-report');
  const bannerReportIframe = document.getElementById('detail-banner-report-iframe');
  const bannerReportTag = document.getElementById('detail-banner-report-tag');
  const bannerReportOpen = document.getElementById('detail-banner-report-open');

  bannerEl.style.setProperty('--thumb-a', p.thumbA);
  bannerEl.style.setProperty('--thumb-b', p.thumbB);

  function setBannerState(state) {
    if (bannerMedia) bannerMedia.hidden = state !== 'media';
    if (bannerVideo) bannerVideo.hidden = state !== 'video';
    if (bannerImage) bannerImage.hidden = state !== 'image';
    if (bannerReport) bannerReport.hidden = state !== 'report';
    if (state !== 'video' && bannerVideoIframe) bannerVideoIframe.src = '';
    if (state !== 'image' && bannerImageImg) bannerImageImg.src = '';
    if (state !== 'report' && bannerReportIframe) bannerReportIframe.src = '';
  }

  let heroState;
  if (videoEmbedUrl) {
    // Demo is a recognized video link — play it right in the banner.
    heroState = 'video';
    setBannerState('video');
    bannerVideoIframe.src = videoEmbedUrl;
    if (bannerVideoTag) bannerVideoTag.textContent = p.category;
  } else if (hasDemo) {
    // Demo exists but isn't a video we know how to embed — icon + outbound link.
    heroState = 'media';
    setBannerState('media');
    document.getElementById('detail-banner-icon').innerHTML = ICONS[p.icon];
    document.getElementById('detail-banner-tag').textContent = p.category;
    const playBtn = document.getElementById('detail-banner-play');
    playBtn.href = p.demo;
  } else if (hasImage) {
    // No demo, but a representative image (e.g. topology diagram) exists.
    heroState = 'image';
    setBannerState('image');
    bannerImageImg.src = p.image;
    bannerImageImg.alt = `${p.title} — diagram`;
    if (bannerImageTag) bannerImageTag.textContent = p.category;
    if (bannerImageOpen) bannerImageOpen.href = p.image;
  } else if (hasReport) {
    // No demo or image — the report PDF becomes the hero instead of an empty icon.
    heroState = 'report';
    setBannerState('report');
    bannerReportIframe.src = p.report;
    if (bannerReportTag) bannerReportTag.textContent = p.category;
    if (bannerReportOpen) bannerReportOpen.href = p.report;
  } else {
    // Nothing to show — fall back to the plain icon banner, with the
    // play button pointing at the source instead.
    heroState = 'media';
    setBannerState('media');
    document.getElementById('detail-banner-icon').innerHTML = ICONS[p.icon];
    document.getElementById('detail-banner-tag').textContent = p.category;
    const playBtn = document.getElementById('detail-banner-play');
    playBtn.href = p.github;
  }

  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-category').textContent = p.category;
  document.getElementById('detail-date').textContent = p.date;
  document.getElementById('detail-stat').textContent = p.stat;

  document.getElementById('detail-github').href = p.github;

  // Action buttons: Source is always shown. Report and Live-demo are each
  // conditional on the project having that field, and whichever CTA is
  // "real" (demo if present, otherwise report) gets the primary/highlighted
  // styling and sits last (rightmost) in the row; a missing one is fully
  // removed rather than just visually hidden.
  const actionsEl = document.querySelector('.detail-actions');
  const demoBtn = document.getElementById('detail-demo');
  const reportBtn = document.getElementById('detail-report');

  if (hasDemo) {
    demoBtn.href = p.demo;
    demoBtn.hidden = false;
    demoBtn.style.display = '';
    const demoLabel = demoBtn.querySelector('span');
    if (demoLabel) demoLabel.textContent = videoEmbedUrl ? 'Watch demo' : 'Live demo';
  } else {
    demoBtn.hidden = true;
    demoBtn.style.display = 'none';
  }

  // The lower, in-page report viewer is only used when a demo already
  // occupies the hero slot above — otherwise the report is already shown
  // there, and duplicating it further down the page would be redundant.
  const reportBlock = document.getElementById('detail-report-block');
  const reportFrame = document.getElementById('detail-report-iframe');
  const reportLink = document.getElementById('detail-report-openlink');
  const showReportBelow = hasReport && heroState !== 'report';

  if (reportBtn) {
    if (hasReport) {
      reportBtn.hidden = false;
      reportBtn.style.display = '';
      reportBtn.href = p.report;
    } else {
      reportBtn.hidden = true;
      reportBtn.style.display = 'none';
    }
  }
  if (reportBlock && reportFrame && reportLink) {
    if (showReportBelow) {
      reportBlock.hidden = false;
      reportLink.href = p.report;
      reportFrame.src = p.report;
    } else {
      reportBlock.hidden = true;
      reportFrame.src = '';
    }
  }

  // The report button takes the primary/highlighted look only when the
  // report is actually the hero (i.e. nothing else — video/image — beat it
  // to that slot); otherwise it stays a plain secondary button.
  const reportIsHero = heroState === 'report';
  if (reportBtn) {
    reportBtn.classList.toggle('btn-primary', reportIsHero);
    reportBtn.classList.toggle('btn-secondary', !reportIsHero);
  }
  demoBtn.classList.toggle('btn-primary', hasDemo);
  demoBtn.classList.toggle('btn-secondary', !hasDemo);

  // Reorder: Source, Report, Demo — a hidden one just leaves no gap.
  if (actionsEl && reportBtn) {
    actionsEl.appendChild(document.getElementById('detail-github'));
    actionsEl.appendChild(reportBtn);
    actionsEl.appendChild(demoBtn);
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
  if (!viewGrid || !viewDetail) return; // no grid/detail views on this page (e.g. homepage)
  viewDetail.hidden = true;
  viewGrid.hidden = false;
}

function route() {
  if (!viewGrid && !viewDetail) return; // this page has no project browse/detail views at all
  const id = decodeURIComponent(location.hash.replace('#', ''));
  if (id && byId(id)) showDetail(id);
  else showGrid();
}

const detailBackBtn = document.getElementById('detail-back');
if (detailBackBtn) detailBackBtn.addEventListener('click', () => { location.hash = ''; });

window.addEventListener('hashchange', route);

// ==========================================
// Comment form (local only — see note in UI)
// ==========================================
(function initCommentForm() {
  const input = document.getElementById('comment-input');
  const actions = document.getElementById('comment-actions');
  const cancelBtn = document.getElementById('comment-cancel');
  const submitBtn = document.getElementById('comment-submit');
  if (!input || !actions || !cancelBtn || !submitBtn) return; // no comment form on this page

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