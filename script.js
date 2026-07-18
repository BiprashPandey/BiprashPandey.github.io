<<<<<<< HEAD
/* ==========================================
   script.js — Ocean Portfolio
   The page IS the ocean: scroll = descend.
========================================== */

// Shared state so the scroll listener and the canvas loop
// (separate closures) can both read the current "depth".
const OceanState = { depth: 0, meters: 0, zoneName: 'Sunlight Zone' };

// ==========================================
// 1. DEPTH ZONES
// ==========================================
// Each stop defines the water colour (top/bottom of the visible
// column) and the real-world depth band it represents. Progress
// is 0 (surface) → 1 (bottom of the page).
const ZONES = [
  { at: 0.00, top: [46, 190, 205], bottom: [16, 110, 145], meters: 0,     name: 'Sunlight Zone' },
  { at: 0.16, top: [27, 140, 168], bottom: [14, 80, 112],  meters: 200,   name: 'Sunlight Zone' },
  { at: 0.38, top: [16, 86, 118],  bottom: [9, 50, 76],    meters: 1000,  name: 'Twilight Zone' },
  { at: 0.60, top: [9, 46, 72],    bottom: [5, 24, 42],    meters: 4000,  name: 'Midnight Zone' },
  { at: 0.80, top: [4, 18, 32],    bottom: [2, 9, 18],     meters: 6000,  name: 'Abyssal Zone' },
  { at: 1.00, top: [2, 7, 14],     bottom: [0, 2, 6],      meters: 11000, name: 'The Trench' }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(a, b, t) {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
}

function zoneAt(progress) {
  let i = 0;
  while (i < ZONES.length - 2 && progress > ZONES[i + 1].at) i++;
  const a = ZONES[i], b = ZONES[i + 1];
  const span = b.at - a.at || 1;
  const t = Math.min(1, Math.max(0, (progress - a.at) / span));
  return {
    top: lerpColor(a.top, b.top, t),
    bottom: lerpColor(a.bottom, b.bottom, t),
    meters: Math.round(lerp(a.meters, b.meters, t)),
    name: t < 0.5 ? a.name : b.name
  };
}

// Fish palettes shift with depth: bright reef colours up top,
// fading to cool blues, then to sparse bioluminescence below.
function paletteForDepth(progress) {
  if (progress < 0.18) {
    return { colors: ['#ff9142', '#ffd23d', '#4fc3f7', '#ff6b81', '#7ee787'], types: ['round', 'long'], glowChance: 0.02, density: 1 };
  }
  if (progress < 0.42) {
    return { colors: ['#5fa8c9', '#8fd8c9', '#7789c9', '#d9b97c', '#6fc9b0'], types: ['round', 'long'], glowChance: 0.18, density: 0.9 };
  }
  if (progress < 0.66) {
    return { colors: ['#2fb39e', '#3d6fd1', '#8a5fd1', '#38c6b0'], types: ['round', 'jelly'], glowChance: 0.55, density: 0.75 };
  }
  return { colors: ['#26e0c2', '#4d7cff', '#7f5fff'], types: ['jelly', 'round'], glowChance: 0.9, density: 0.5 };
}

// ==========================================
// 2. OCEAN CANVAS — sky, water, fish
// ==========================================
(function initOcean() {
  const canvas = document.getElementById('ocean-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, time = 0, particles, fish, stars;

  function isNight() { return !document.body.classList.contains('surface'); }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * 220,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createParticles() {
    particles = [];
    const count = Math.round((width * height) / 30000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.4,
        speed: Math.random() * 0.22 + 0.06,
        drift: Math.random() * 0.4 - 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createFish() {
    fish = [];
    const count = Math.max(6, Math.round((width * height) / 145000));
    for (let i = 0; i < count; i++) fish.push(makeFish());
  }

  function makeFish(edgeSpawn) {
    const p = paletteForDepth(OceanState.depth);
    const dir = Math.random() > 0.5 ? 1 : -1;
    const type = p.types[Math.random() < 0.7 ? 0 : (p.types.length > 1 ? 1 : 0)];
    const scale = (Math.random() * 0.7 + 0.55) * (type === 'jelly' ? 1.1 : 1);
    const color = p.colors[Math.floor(Math.random() * p.colors.length)];
    return {
      type,
      x: edgeSpawn ? (dir > 0 ? -50 : width + 50) : Math.random() * width,
      y: height * (0.12 + Math.random() * 0.82),
      vx: type === 'jelly' ? dir * (Math.random() * 0.12 + 0.03) : dir * (Math.random() * 0.55 + 0.35) * scale,
      dir,
      scale,
      color,
      tailPhase: Math.random() * Math.PI * 2,
      bobPhase: Math.random() * Math.PI * 2,
      glow: Math.random() < p.glowChance,
      visibility: Math.random()
    };
  }

  function waveY(x, t, amp, freq, phase, base) {
    return base + Math.sin(x * freq + t + phase) * amp + Math.sin(x * freq * 0.5 + t * 0.6) * amp * 0.4;
  }

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function drawSky(horizonY) {
    if (horizonY <= -40) return;
    const skyH = Math.max(0, horizonY + 40);
    const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (isNight()) {
      sky.addColorStop(0, '#040814');
      sky.addColorStop(1, '#0c1c30');
    } else {
      sky.addColorStop(0, '#bfe6f2');
      sky.addColorStop(1, '#eaf6ee');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, Math.max(0, horizonY));

    if (isNight()) {
      stars.forEach(s => {
        const tw = 0.5 + Math.sin(time * 1.4 + s.phase) * 0.5;
        if (s.y < horizonY) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${(0.35 + tw * 0.55).toFixed(2)})`;
          ctx.fill();
        }
      });

      const moonX = width * 0.82, moonY = horizonY, moonR = 40;
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonR * 3.2);
      moonGlow.addColorStop(0, 'rgba(210,222,240,0.28)');
      moonGlow.addColorStop(1, 'rgba(210,222,240,0)');
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = moonGlow;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#e8edf5';
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
      // crescent shadow
      ctx.beginPath();
      ctx.arc(moonX + moonR * 0.42, moonY - moonR * 0.18, moonR * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = '#040814';
      ctx.fill();
      ctx.restore();

      // craters
      ctx.fillStyle = 'rgba(180,192,212,0.5)';
      [[-0.32, -0.28, 0.13], [-0.5, 0.12, 0.09], [-0.12, 0.32, 0.07]].forEach(([dx, dy, r]) => {
        ctx.beginPath();
        ctx.arc(moonX + dx * moonR, moonY + dy * moonR, r * moonR, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      const sunX = width * 0.82, sunY = horizonY, sunR = 46;
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.2);
      glow.addColorStop(0, 'rgba(255,214,140,0.55)');
      glow.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2, false);
      ctx.fillStyle = '#ffe3a8';
      ctx.fill();
    }
  }

  function drawWaterSurfaceLine(horizonY) {
    if (horizonY < -20 || horizonY > height + 20) return;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= width; x += 14) {
      ctx.lineTo(x, waveY(x, time * 0.6, 5, 0.01, 0, horizonY));
    }
    ctx.lineTo(width, horizonY + 6);
    ctx.lineTo(0, horizonY + 6);
    ctx.closePath();
    ctx.fillStyle = isNight() ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.35)';
    ctx.fill();
  }

  function drawWaveLayer(baseline, amp, freq, speed, phase, color) {
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, waveY(0, time * speed, amp, freq, phase, baseline));
    for (let x = 0; x <= width; x += 16) {
      ctx.lineTo(x, waveY(x, time * speed, amp, freq, phase, baseline));
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawRoundFish(f, fillColor) {
    const tailSwing = Math.sin(time * 6 + f.tailPhase) * 0.35;
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.quadraticCurveTo(-0.6, -0.62, 0.55, -0.4);
    ctx.quadraticCurveTo(1.15, -0.16, 1.5, 0);
    ctx.quadraticCurveTo(1.15, 0.16, 0.55, 0.4);
    ctx.quadraticCurveTo(-0.6, 0.62, -1.1, 0);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-1.05, 0);
    ctx.lineTo(-1.75 + tailSwing * 0.3, -0.5);
    ctx.lineTo(-1.35, 0);
    ctx.lineTo(-1.75 + tailSwing * 0.3, 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0.95, -0.06, 0.055, 0, Math.PI * 2);
    ctx.fillStyle = isNight() ? 'rgba(255,255,255,0.6)' : 'rgba(13,34,51,0.5)';
    ctx.fill();
  }

  function drawLongFish(f, fillColor) {
    const tailSwing = Math.sin(time * 7 + f.tailPhase) * 0.4;
    ctx.beginPath();
    ctx.moveTo(-1.5, 0);
    ctx.quadraticCurveTo(-0.8, -0.28, 0.9, -0.16);
    ctx.quadraticCurveTo(1.5, -0.06, 1.75, 0);
    ctx.quadraticCurveTo(1.5, 0.06, 0.9, 0.16);
    ctx.quadraticCurveTo(-0.8, 0.28, -1.5, 0);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-1.45, 0);
    ctx.lineTo(-2.0 + tailSwing * 0.25, -0.28);
    ctx.lineTo(-1.75, 0);
    ctx.lineTo(-2.0 + tailSwing * 0.25, 0.28);
    ctx.closePath();
    ctx.fill();
  }

  function drawJelly(f, fillColor) {
    const pulse = 0.85 + Math.sin(time * 2.2 + f.bobPhase) * 0.15;
    ctx.save();
    ctx.scale(1, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, 1, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.75;
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 0.06;
    for (let t = -0.7; t <= 0.7; t += 0.35) {
      const sway = Math.sin(time * 2 + f.bobPhase + t * 4) * 0.25;
      ctx.beginPath();
      ctx.moveTo(t, 0.05);
      ctx.quadraticCurveTo(t + sway * 0.5, 1.1, t + sway, 2.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawFish(f) {
    const bob = f.type === 'jelly' ? Math.sin(time * 0.6 + f.bobPhase) * 6 : Math.sin(time * 1.2 + f.bobPhase) * 4;
    const alpha = f.type === 'jelly' ? 0.6 : 0.85;
    const fillColor = hexToRgba(f.color, alpha);

    ctx.save();
    ctx.translate(f.x, f.y + bob);
    const s = f.type === 'jelly' ? f.scale * 10 : f.scale * 9;
    ctx.scale(f.dir * s, s);

    if (f.type === 'round') drawRoundFish(f, fillColor);
    else if (f.type === 'long') drawLongFish(f, fillColor);
    else drawJelly(f, fillColor);

    ctx.restore();

    if (f.glow) {
      const glowAlpha = Math.min(0.55, 0.12 + OceanState.depth * 0.5);
      const g = ctx.createRadialGradient(f.x, f.y + bob, 0, f.x, f.y + bob, 46 * f.scale);
      g.addColorStop(0, hexToRgba(f.color, glowAlpha));
      g.addColorStop(1, hexToRgba(f.color, 0));
      ctx.beginPath();
      ctx.arc(f.x, f.y + bob, 46 * f.scale, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  function drawFrame() {
    const zone = zoneAt(OceanState.depth);
    const horizonY = 96 - window.scrollY * 0.75;

    ctx.clearRect(0, 0, width, height);

    // water body
    const grad = ctx.createLinearGradient(0, Math.max(0, horizonY), 0, height);
    grad.addColorStop(0, `rgb(${zone.top.join(',')})`);
    grad.addColorStop(1, `rgb(${zone.bottom.join(',')})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.max(0, horizonY), width, height);



    const wl1 = `rgba(255,255,255,${(0.05 + (1 - OceanState.depth) * 0.05).toFixed(3)})`;
    const wl2 = `rgba(255,255,255,${(0.03 + (1 - OceanState.depth) * 0.03).toFixed(3)})`;
    drawWaveLayer(Math.max(horizonY, -40) + 46, 24, 0.0032, 0.55, 0, wl1);

    const currentPalette = paletteForDepth(OceanState.depth);
    fish.forEach(f => {
      if (f.type !== 'jelly') {
        f.x += f.vx;
        if (f.vx > 0 && f.x > width + 60) Object.assign(f, makeFish(true));
        if (f.vx < 0 && f.x < -60) Object.assign(f, makeFish(true));
      } else {
        f.x += f.vx;
        if (f.x > width + 60 || f.x < -60) Object.assign(f, makeFish(true));
      }
      if (f.visibility <= currentPalette.density) drawFish(f);
    });

    drawWaveLayer(Math.max(horizonY, -40) + 92, 16, 0.006, 0.32, 4.2, wl2);

    particles.forEach(pt => {
      pt.y -= pt.speed;
      pt.x += Math.sin(time * 0.4 + pt.phase) * pt.drift * 0.3;
      if (pt.y < 0) { pt.y = height; pt.x = Math.random() * width; }
      const flicker = 0.3 + Math.sin(time * 1.5 + pt.phase) * 0.25;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, flicker * 0.35).toFixed(2)})`;
      ctx.fill();
    });

    drawSky(horizonY);
    drawWaterSurfaceLine(horizonY);

    time += 0.012;
    requestAnimationFrame(drawFrame);
  }

  window.addEventListener('resize', () => { resize(); createParticles(); createFish(); createStars(); });

  resize();
  createParticles();
  createFish();
  createStars();
  drawFrame();
})();


// ==========================================
// 3. SCROLL DEPTH (drives colour, gauge, sky)
// ==========================================
(function initDepth() {
  const metersEl = document.getElementById('gauge-meters');
  const zoneEl = document.getElementById('gauge-zone');

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    OceanState.depth = progress;
    const zone = zoneAt(progress);
    OceanState.meters = zone.meters;
    OceanState.zoneName = zone.name;
    document.documentElement.style.setProperty('--depth', progress.toFixed(3));
    if (metersEl) metersEl.textContent = `${zone.meters.toLocaleString()} m`;
    if (zoneEl) zoneEl.textContent = zone.name;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();


// ==========================================
// 2. CURSOR GLOW
// ==========================================
(function initCursor() {
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  let mx = 0, my = 0, cx = 0, cy = 0;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animate() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';
    requestAnimationFrame(animate);
  }
  animate();
})();


// ==========================================
// 3. SCROLL REVEAL
// ==========================================
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.skill-category, .timeline-item, .contact-link, .section-header, .bar-item, .project-empty, .contact-form'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();


// ==========================================
// 4. SKILL BAR ANIMATION
// ==========================================
(function initSkillBars() {
  const bars = document.querySelectorAll('.bar-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-width');
        setTimeout(() => { bar.style.width = width + '%'; }, 200);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });
  bars.forEach(b => observer.observe(b));
})();


// ==========================================
// 5. NAV ACTIVE STATE
// ==========================================
(function initNavActive() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const links = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(s => observer.observe(s));
})();


// ==========================================
// 6. NAV SCROLL SHADOW
// ==========================================
(function initNavScroll() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20 ? '0 10px 30px rgba(0,0,0,0.25)' : 'none';
  });
})();


// ==========================================
// 7. CONTACT FORM
// ==========================================
(function initContactForm() {
  const btn = document.getElementById('send-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const nameInput = document.querySelector('.contact-form .form-input');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.style.borderColor = 'rgba(248, 113, 113, 0.6)';
      setTimeout(() => { nameInput.style.borderColor = ''; }, 1800);
      return;
    }

    const original = btn.innerHTML;
    btn.innerHTML = `<span>Sending…</span>`;
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Message Sent</span>`;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2600);
    }, 1200);
  });
})();


// ==========================================
// 8. THEME TOGGLE (Surface / Depths)
// ==========================================
(function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const saved = localStorage.getItem('ocean-theme');
  if (saved === 'surface') document.body.classList.add('surface');

  btn.addEventListener('click', () => {
    document.body.classList.toggle('surface');
    const isSurface = document.body.classList.contains('surface');
    if (isSurface) {
      localStorage.setItem('ocean-theme', 'surface');
    } else {
      localStorage.removeItem('ocean-theme');
    }
  });
=======
/* ==========================================
   script.js — AI/ML Resume Website
========================================== */

// ==========================================
// 1. NEURAL NETWORK CANVAS ANIMATION
// ==========================================
(function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');

  let width, height, nodes, mouse;

  mouse = { x: -1000, y: -1000 };

  const NODE_COUNT = 150;
  const CONNECTION_DIST = 160;
  const MOUSE_REPEL = 120;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
        type: Math.random() > 0.85 ? 'hub' : 'node'
      });
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    // Update positions
    nodes.forEach(n => {
      n.pulse += n.pulseSpeed;
      n.x += n.vx;
      n.y += n.vy;

      // Mouse repulsion
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_REPEL) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL;
        n.vx += (dx / dist) * force * 0.15;
        n.vy += (dy / dist) * force * 0.15;
      }

      // Friction
      n.vx *= 0.99;
      n.vy *= 0.99;

      // Wrap edges
      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;
    });

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.35;

          // Gradient line
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, `rgba(52, 211, 153, ${alpha})`);
          grad.addColorStop(0.5, `rgba(34, 211, 238, ${alpha * 0.7})`);
          grad.addColorStop(1, `rgba(52, 211, 153, ${alpha})`);

          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.7;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // Data pulse on some connections
          if (Math.random() < 0.0008) {
            drawPulse(a.x, a.y, b.x, b.y, alpha);
          }
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulseFactor = 0.6 + Math.sin(n.pulse) * 0.4;

      if (n.type === 'hub') {
        // Hub node with glow
        const r = (n.r * 2.5) * pulseFactor;
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 4);
        glow.addColorStop(0, 'rgba(52, 211, 153, 0.6)');
        glow.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${0.7 * pulseFactor})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulseFactor, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${0.5 * pulseFactor})`;
        ctx.fill();
      }
    });

    requestAnimationFrame(drawFrame);
  }

  const pulses = [];

  function drawPulse(x1, y1, x2, y2, alpha) {
    pulses.push({ x1, y1, x2, y2, t: 0, alpha });
  }

  function animatePulses() {
    pulses.forEach((p, i) => {
      p.t += 0.025;
      if (p.t > 1) { pulses.splice(i, 1); return; }
      const px = p.x1 + (p.x2 - p.x1) * p.t;
      const py = p.y1 + (p.y2 - p.y1) * p.t;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - p.t) * 0.6})`;
      ctx.fill();
    });
    requestAnimationFrame(animatePulses);
  }

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('resize', () => {
    resize();
    createNodes();
  });

  resize();
  createNodes();
  drawFrame();
  animatePulses();
})();


// ==========================================
// 2. CUSTOM CURSOR GLOW
// ==========================================
(function initCursor() {
  const glow = document.getElementById('cursor-glow');

  // Add a sharp inner cursor dot
  const dot = document.createElement('div');
  dot.style.cssText = `
    position: fixed;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 10px #34d399, 0 0 20px #34d399, 0 0 40px rgba(52,211,153,0.6);
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: width 0.15s, height 0.15s;
  `;
  document.body.appendChild(dot);

  // Add a medium ring that follows slightly slower
  const ring = document.createElement('div');
  ring.style.cssText = `
    position: fixed;
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1.5px solid rgba(52, 211, 153, 0.6);
    box-shadow: 0 0 12px rgba(52,211,153,0.4), inset 0 0 8px rgba(52,211,153,0.1);
    pointer-events: none;
    z-index: 9998;
    transform: translate(-50%, -50%);
  `;
  document.body.appendChild(ring);

  let mx = 0, my = 0;
  let cx = 0, cy = 0;   // glow
  let rx = 0, ry = 0;   // ring

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    // Dot follows instantly
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
  });

  // Scale dot on clickable elements
  document.querySelectorAll('a, button, .project-card, .contact-link, .skill-category').forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.width = '14px';
      dot.style.height = '14px';
      dot.style.boxShadow = '0 0 16px #34d399, 0 0 32px #34d399, 0 0 60px rgba(52,211,153,0.8)';
      ring.style.width = '50px';
      ring.style.height = '50px';
      ring.style.borderColor = 'rgba(52, 211, 153, 0.9)';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.boxShadow = '0 0 10px #34d399, 0 0 20px #34d399, 0 0 40px rgba(52,211,153,0.6)';
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.borderColor = 'rgba(52, 211, 153, 0.6)';
    });
  });

  function animateCursor() {
    // Glow trails slowly
    cx += (mx - cx) * 0.06;
    cy += (my - cy) * 0.06;
    glow.style.left = cx + 'px';
    glow.style.top = cy + 'px';

    // Ring trails at medium speed
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';

    requestAnimationFrame(animateCursor);
  }

  animateCursor();
})();


// ==========================================
// 3. SCROLL REVEAL ANIMATIONS
// ==========================================
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.skill-category, .project-card, .timeline-item, .contact-link, .stat-card, .section-header, .bar-item'
  );

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();


// ==========================================
// 4. SKILL BAR ANIMATION
// ==========================================
(function initSkillBars() {
  const bars = document.querySelectorAll('.bar-fill');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
          bar.style.width = width + '%';
        }, 200);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });

  bars.forEach(b => observer.observe(b));
})();


// ==========================================
// 5. SMOOTH NAVIGATION ACTIVE STATE
// ==========================================
(function initNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        links.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}`
            ? 'var(--accent)'
            : '';
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
})();


// ==========================================
// 6. NAV SCROLL SHADOW
// ==========================================
(function initNavScroll() {
  const nav = document.querySelector('.nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
})();


// ==========================================
// 7. CONTACT FORM — SEND BUTTON
// ==========================================
(function initContactForm() {
  const btn = document.getElementById('send-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const nameInput = document.querySelector('.contact-form .form-input');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.style.borderColor = 'rgba(248, 113, 113, 0.5)';
      setTimeout(() => { nameInput.style.borderColor = ''; }, 2000);
      return;
    }

    const original = btn.innerHTML;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Sending...</span>`;
    btn.disabled = true;

    const spinStyle = document.createElement('style');
    spinStyle.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
    document.head.appendChild(spinStyle);

    setTimeout(() => {
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Message Sent!</span>`;
      btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';

      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }, 1800);
  });
})();


// ==========================================
// 8. STAGGERED REVEAL FOR TIMELINE ITEMS
// ==========================================
(function initTimelineStagger() {
  const items = document.querySelectorAll('.timeline-item');

  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentNode.children);
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 120);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
})();


// ==========================================
// 9. TYPED HERO SUBTITLE WORDS
// ==========================================
(function initTypingEffect() {
  const words = ['machine learning', 'deep learning', 'neural networks', 'computer vision', 'NLP'];
  const el = document.querySelector('.hero-subtitle .highlight');
  if (!el) return;

  let wordIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function type() {
    const word = words[wordIdx];
    if (!deleting) {
      el.textContent = word.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === word.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      el.textContent = word.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        wordIdx = (wordIdx + 1) % words.length;
      }
    }
    setTimeout(type, deleting ? 60 : 90);
  }

  setTimeout(type, 2000);
})();




// ==========================================
// 11. THEME TOGGLE
// ==========================================
(function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  // Persist preference
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light');

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    if (isLight) {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.removeItem('theme');
    }
  });
})();

// ==========================================
(function initCardTilt() {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * 4;
      const ry = -((x - cx) / cx) * 4;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
>>>>>>> ecf0ac7ae299509e1c284b651ba697c1d5764359
})();