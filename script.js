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
})();
