/* ============================================================
   SIGNAL-STYLE HERO — Network Graph + Live Counter
   ============================================================ */

(function() {
  'use strict';

  /* ── NETWORK GRAPH CANVAS ──────────────────────────────── */
  const canvas = document.getElementById('signal-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Node types matching the screenshot
  const NODE_TYPES = ['user','service','laptop','bucket'];
  const NODE_LABELS = [
    'prod-k8s','bkt/billing-exports','db-primary','ci-runner-04',
    'git-mirror','idp-core','vpn-edge','mbp-lindqvist',
    'halyard-prod','j.okafor','api-gateway','s3-logs',
    'auth-svc','redis-cache','cdn-edge','monitoring',
    'sec-scanner','ml-pipeline','data-lake','webhook-svc'
  ];

  let nodes = [];
  let edges = [];
  let W, H;
  let animFrame;

  /* ── Resize ─────────────────────────────────────────────── */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
  }

  /* ── Seeded RNG for stable layout ──────────────────────── */
  function seeded(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  /* ── Build graph ────────────────────────────────────────── */
  function buildGraph() {
    const rng = seeded(42);

    // Scatter nodes — mostly right half
    nodes = NODE_LABELS.map((label, i) => {
      const inRight = i < 14; // most nodes in right 55%
      const x = inRight
        ? W * 0.38 + rng() * W * 0.58
        : W * 0.02 + rng() * W * 0.38;
      const y = H * 0.04 + rng() * H * 0.88;

      return {
        id: i,
        x, y,
        vx: (rng() - 0.5) * 0.15,
        vy: (rng() - 0.5) * 0.15,
        type: NODE_TYPES[Math.floor(rng() * NODE_TYPES.length)],
        label,
        size: 3 + rng() * 3,
        alpha: 0.5 + rng() * 0.5,
        // the "central" bright node (j.okafor equivalent)
        highlight: i === 9,
        pulseR: 0,
      };
    });

    // Edges — connect pairs with slight random weighting toward center
    edges = [];
    const CENTER = 9; // j.okafor node
    nodes.forEach((n, i) => {
      if (i === CENTER) return;
      // always connect to center node
      edges.push({ a: CENTER, b: i, alpha: 0.12 + rng() * 0.18 });
      // random extra edges
      if (rng() > 0.55) {
        const target = Math.floor(rng() * nodes.length);
        if (target !== i) edges.push({ a: i, b: target, alpha: 0.06 + rng() * 0.1 });
      }
    });
  }

  /* ── Draw node shape by type ────────────────────────────── */
  function drawNode(n) {
    ctx.save();
    ctx.globalAlpha = n.alpha * 0.9;

    if (n.highlight) {
      // pulsing glow
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 26 + n.pulseR);
      grad.addColorStop(0, 'rgba(168,255,62,0.35)');
      grad.addColorStop(1, 'rgba(168,255,62,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 26 + n.pulseR, 0, Math.PI * 2);
      ctx.fill();

      // bright lime dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#a8ff3e';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#a8ff3e';
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const col = 'rgba(255,255,255,' + (0.22 + n.alpha * 0.3) + ')';
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;

      switch (n.type) {
        case 'user':
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'service':
          ctx.beginPath();
          ctx.moveTo(n.x, n.y - n.size * 1.2);
          ctx.lineTo(n.x + n.size * 1.2, n.y);
          ctx.lineTo(n.x, n.y + n.size * 1.2);
          ctx.lineTo(n.x - n.size * 1.2, n.y);
          ctx.closePath();
          ctx.stroke();
          break;
        case 'laptop':
          ctx.strokeRect(n.x - n.size, n.y - n.size * 0.8, n.size * 2, n.size * 1.6);
          break;
        case 'bucket':
          ctx.strokeRect(n.x - n.size, n.y - n.size * 0.6, n.size * 2, n.size * 1.2);
          break;
      }
    }

    // Label
    ctx.globalAlpha = n.highlight ? 0.95 : 0.38;
    ctx.fillStyle = n.highlight ? '#a8ff3e' : '#fff';
    ctx.font = n.highlight ? '500 11px "JetBrains Mono", monospace' : '400 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(n.label, n.x + n.size + 5, n.y + 4);

    ctx.restore();
  }

  /* ── Animate ────────────────────────────────────────────── */
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    // Draw edges
    edges.forEach(e => {
      const a = nodes[e.a], b = nodes[e.b];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,255,255,' + e.alpha + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    });

    // Draw nodes + gentle drift
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      // Soft boundaries (keep in right 60% mostly for center node)
      if (n.x < 10) { n.x = 10; n.vx *= -1; }
      if (n.x > W - 10) { n.x = W - 10; n.vx *= -1; }
      if (n.y < 10) { n.y = 10; n.vy *= -1; }
      if (n.y > H - 10) { n.y = H - 10; n.vy *= -1; }

      // Pulse on highlight node
      if (n.highlight) {
        n.pulseR = Math.sin(t * 2) * 8 + 8;
      }

      drawNode(n);
    });

    // Animated data packet along edges
    const packetEdge = edges[Math.floor(t * 2) % edges.length];
    if (packetEdge) {
      const pa = nodes[packetEdge.a], pb = nodes[packetEdge.b];
      const pct = (Math.sin(t * 3) + 1) / 2;
      const px = pa.x + (pb.x - pa.x) * pct;
      const py = pa.y + (pb.y - pa.y) * pct;
      ctx.save();
      ctx.fillStyle = 'rgba(168,255,62,0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#a8ff3e';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animFrame = requestAnimationFrame(draw);
  }

  /* ── LIVE COUNTER ──────────────────────────────────────── */
  const counterEl = document.getElementById('signal-counter-num');
  let counterVal = 1_892_344 + Math.floor(Math.random() * 400000);

  function tickCounter() {
    counterVal += Math.floor(Math.random() * 30) + 5;
    if (counterEl) {
      counterEl.textContent = counterVal.toLocaleString('en-US');
    }
  }

  /* ── LIVE CLOCK ─────────────────────────────────────────── */
  const clockEl = document.getElementById('signal-hero-clock');
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2,'0');
    const m = String(now.getUTCMinutes()).padStart(2,'0');
    const s = String(now.getUTCSeconds()).padStart(2,'0');
    clockEl.textContent = h + ':' + m + ':' + s + ' UTC';
  }

  /* ── INIT ───────────────────────────────────────────────── */
  resize();
  buildGraph();
  draw();
  tickClock();
  tickCounter();
  setInterval(tickClock, 1000);
  setInterval(tickCounter, 1200);

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animFrame);
    resize();
    buildGraph();
    draw();
  });

})();

/* ── IDE shell toggle: hide chrome when hero is active ──────── */
(function() {
  const heroSection = document.getElementById('about');
  if (!heroSection) return;

  // Apply hero-active on load
  document.body.classList.add('hero-active');

  // Watch scroll inside editor-pane
  const editorPane = document.querySelector('.editor-pane');
  if (!editorPane) return;

  function checkHeroVisibility() {
    const scroll = editorPane.scrollTop;
    const heroH = heroSection.offsetHeight;
    if (scroll < heroH * 0.6) {
      document.body.classList.add('hero-active');
      // Freeze scroll inside pane while hero is shown
      editorPane.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hero-active');
      editorPane.style.overflow = '';
    }
  }

  // When clicking nav links inside hero, disable hero-active to show IDE
  document.querySelectorAll('.signal-nav-link, .signal-btn-secondary, #hero-cta-projects, #hero-cta-contact').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#') && href !== '#about') {
        document.body.classList.remove('hero-active');
        editorPane.style.overflow = '';
        // Give the DOM a tick to re-enable overflow before scrolling
        setTimeout(() => {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        e.preventDefault();
      }
    });
  });

  // Also listen for sidebar/tab navigation
  document.querySelectorAll('.file-item, .tab').forEach(item => {
    item.addEventListener('click', function() {
      const section = this.dataset.section;
      if (section && section !== 'about') {
        document.body.classList.remove('hero-active');
        editorPane.style.overflow = '';
      } else {
        document.body.classList.add('hero-active');
        editorPane.style.overflow = 'hidden';
      }
    });
  });

  editorPane.addEventListener('scroll', checkHeroVisibility);
})();
