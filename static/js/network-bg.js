/**
 * Network Graph Background — Signal-exact style
 * Hollow square nodes, directional arrows, hub nodes with accent lines,
 * one red-ring selected node, one green dot node.
 */
(function () {
  'use strict';

  /* ─── Palette ────────────────────────────────────────────────── */
  const C = {
    bg:          '#0d0e0f',
    line:        'rgba(255,255,255,0.18)',
    lineHub:     'rgba(200,220,100,0.55)',   // yellow-green hub spokes
    nodeFill:    'transparent',
    nodeStroke:  'rgba(255,255,255,0.55)',
    nodeHubStroke:'rgba(200,220,100,0.85)',
    dot:         'rgba(255,255,255,0.50)',
    dotHub:      'rgba(200,220,100,0.90)',
    label:       'rgba(255,255,255,0.42)',
    labelHub:    'rgba(200,220,100,0.80)',
    selected:    'rgba(220,80,60,0.90)',     // red-orange ring node
    selectedGlow:'rgba(220,80,60,0.20)',
    activeGreen: 'rgba(140,230,120,0.90)',   // j.okafor green dot
  };

  /* ─── Config ─────────────────────────────────────────────────── */
  const TOTAL_NODES   = 65;
  const HUB_COUNT     = 3;         // big hub nodes
  const CONNECT_DIST  = 200;       // px — draw edge if closer
  const MOUSE_DIST    = 230;
  const SPEED         = 0.28;
  const FONT          = '9px "JetBrains Mono", "Courier New", monospace';
  const ARROW_SIZE    = 5;

  /* ─── Tech labels (dev / infra themed) ───────────────────────── */
  const LABELS = [
    'pankaj.dev','ai-ml-engineer','python','flask','fastapi',
    'postgresql','redis-cache','docker','gcp','terraform',
    'rag-pipeline','llm-service','whisper-asr','embeddings','scikit-learn',
    'tensorflow','pandas','rest-api','react-native','git',
    'idp-core','vpn-edge','prod-k8s','ci-runner','db-primary',
    'github.io','zoibit','dreweb','nlp-engine','devops',
  ];

  /* ─── State ──────────────────────────────────────────────────── */
  let canvas, ctx, W, H, nodes = [];
  let mouse  = { x: -9999, y: -9999 };
  let raf;

  /* ─── Node factory ───────────────────────────────────────────── */
  function makeNode(i, isHub, isSelected, isGreen) {
    const label = LABELS[i % LABELS.length];
    return {
      x:        Math.random() * W,
      y:        Math.random() * H,
      vx:       (Math.random() - 0.5) * SPEED,
      vy:       (Math.random() - 0.5) * SPEED,
      // squares: size is half-side; dots: radius
      size:     isHub ? 6 : (Math.random() < 0.65 ? 4 : 2.5),
      shape:    Math.random() < 0.65 ? 'square' : 'dot',
      isHub,
      isSelected,
      isGreen,
      label,
      phase:    Math.random() * Math.PI * 2,
    };
  }

  /* ─── Draw arrow head ────────────────────────────────────────── */
  function arrow(x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ax    = x2 - ARROW_SIZE * Math.cos(angle - 0.45);
    const ay    = y2 - ARROW_SIZE * Math.sin(angle - 0.45);
    const bx    = x2 - ARROW_SIZE * Math.cos(angle + 0.45);
    const by    = y2 - ARROW_SIZE * Math.sin(angle + 0.45);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(ax, ay);
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 0.8;
    ctx.stroke();
  }

  /* ─── Draw edge ──────────────────────────────────────────────── */
  function drawEdge(a, b) {
    const dx   = b.x - a.x;
    const dy   = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > CONNECT_DIST) return;

    const ratio   = 1 - dist / CONNECT_DIST;
    const isAccent = a.isHub || b.isHub;
    const baseAlpha = isAccent ? 0.6 : 0.22;
    const alpha     = ratio * baseAlpha;

    // line colour
    let lineColor;
    if (isAccent)    lineColor = `rgba(200,220,100,${alpha})`;
    else             lineColor = `rgba(255,255,255,${alpha * 2.2})`;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth   = isAccent ? 0.9 : 0.65;
    ctx.stroke();

    // draw arrow every ~3 edges towards the hub or b
    if (ratio > 0.45) {
      const mx = a.x + dx * 0.6;
      const my = a.y + dy * 0.6;
      arrow(a.x, a.y, mx, my, lineColor);
    }
  }

  /* ─── Draw mouse edges ───────────────────────────────────────── */
  function drawMouseEdge(n) {
    const dx   = n.x - mouse.x;
    const dy   = n.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MOUSE_DIST) return;
    const ratio = 1 - dist / MOUSE_DIST;
    const color = `rgba(200,220,100,${ratio * 0.45})`;
    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y);
    ctx.lineTo(n.x, n.y);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    arrow(mouse.x, mouse.y, mouse.x + (n.x - mouse.x) * 0.7,
          mouse.y + (n.y - mouse.y) * 0.7, color);
  }

  /* ─── Draw node ──────────────────────────────────────────────── */
  function drawNode(n) {
    const pulse = 0.7 + 0.3 * Math.sin(n.phase);

    /* ── selected (red ring) ── */
    if (n.isSelected) {
      const r = n.size * 3.5;
      // outer glow
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = C.selectedGlow;
      ctx.lineWidth   = 8;
      ctx.stroke();
      // ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = C.selected;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      // inner square
      const s = n.size;
      ctx.beginPath();
      ctx.rect(n.x - s, n.y - s, s * 2, s * 2);
      ctx.strokeStyle = C.selected;
      ctx.lineWidth   = 1.2;
      ctx.stroke();
      // label
      ctx.font      = FONT;
      ctx.fillStyle = C.selected;
      ctx.fillText(n.label, n.x + n.size * 3.8, n.y + 3);
      return;
    }

    /* ── green active dot (j.okafor) ── */
    if (n.isGreen) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle   = C.activeGreen;
      ctx.fill();
      // subtle outer ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * 2.5 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140,230,120,${0.25 * pulse})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
      ctx.font      = FONT;
      ctx.fillStyle = C.activeGreen;
      ctx.fillText(n.label, n.x + n.size + 5, n.y + 3);
      return;
    }

    /* ── hub node ── */
    if (n.isHub) {
      const s = n.size;
      ctx.beginPath();
      ctx.rect(n.x - s, n.y - s, s * 2, s * 2);
      ctx.strokeStyle = C.nodeHubStroke;
      ctx.lineWidth   = 1.4;
      ctx.stroke();
      ctx.font      = FONT;
      ctx.fillStyle = C.labelHub;
      ctx.fillText(n.label, n.x + s + 5, n.y + 3);
      return;
    }

    /* ── regular square ── */
    if (n.shape === 'square') {
      const s = n.size;
      ctx.beginPath();
      ctx.rect(n.x - s, n.y - s, s * 2, s * 2);
      ctx.strokeStyle = C.nodeStroke;
      ctx.lineWidth   = 0.9;
      ctx.stroke();
      if (n.label && Math.random() < 0.003) {   // only some labelled
        ctx.font      = FONT;
        ctx.fillStyle = C.label;
        ctx.fillText(n.label, n.x + s + 4, n.y + 3);
      }
      // persistent label for about 40% of squares
      if (n._showLabel) {
        ctx.font      = FONT;
        ctx.fillStyle = C.label;
        ctx.fillText(n.label, n.x + s + 4, n.y + 3);
      }
    } else {
      /* ── tiny dot ── */
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
      ctx.fillStyle = C.dot;
      ctx.fill();
    }
  }

  /* ─── Animate ────────────────────────────────────────────────── */
  function tick() {
    ctx.clearRect(0, 0, W, H);

    // move nodes
    for (const n of nodes) {
      n.x    += n.vx;
      n.y    += n.vy;
      n.phase += 0.016;
      if (n.x < -30)    n.x = W + 30;
      if (n.x > W + 30) n.x = -30;
      if (n.y < -30)    n.y = H + 30;
      if (n.y > H + 30) n.y = -30;
    }

    // edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        drawEdge(nodes[i], nodes[j]);
      }
    }

    // mouse edges
    for (const n of nodes) drawMouseEdge(n);

    // nodes on top
    for (const n of nodes) drawNode(n);

    raf = requestAnimationFrame(tick);
  }

  /* ─── Resize ─────────────────────────────────────────────────── */
  function resize() {
    const section = document.getElementById('about');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    W = canvas.width  = rect.width;
    H = canvas.height = rect.height;
  }

  /* ─── Init ───────────────────────────────────────────────────── */
  function init() {
    const section = document.getElementById('about');
    if (!section) return;

    if (getComputedStyle(section).position === 'static')
      section.style.position = 'relative';

    // remove old canvas if re-init
    const old = document.getElementById('network-canvas');
    if (old) old.remove();
    if (raf)  cancelAnimationFrame(raf);

    canvas = document.createElement('canvas');
    canvas.id = 'network-canvas';
    Object.assign(canvas.style, {
      position:      'absolute',
      inset:         '0',
      width:         '100%',
      height:        '100%',
      pointerEvents: 'none',
      zIndex:        '0',
    });
    section.prepend(canvas);

    // lift content above canvas
    [...section.children].forEach(el => {
      if (el === canvas) return;
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.zIndex = '1';
    });

    ctx = canvas.getContext('2d');
    resize();

    // build nodes
    nodes = [];
    const hubIdxs      = new Set();
    const selectedIdx  = Math.floor(Math.random() * HUB_COUNT); // one hub = selected ring
    const greenIdx     = TOTAL_NODES - 1;  // last node = green dot

    for (let i = 0; i < HUB_COUNT; i++) hubIdxs.add(i);

    for (let i = 0; i < TOTAL_NODES; i++) {
      const isHub      = hubIdxs.has(i);
      const isSelected = (i === selectedIdx);
      const isGreen    = (i === greenIdx);
      const n          = makeNode(i, isHub, isSelected, isGreen);
      if (!isHub && !isSelected && !isGreen) {
        n._showLabel = Math.random() < 0.40;
      }
      nodes.push(n);
    }

    // space hubs apart from each other
    nodes[0].x = W * 0.35; nodes[0].y = H * 0.45;
    nodes[1].x = W * 0.62; nodes[1].y = H * 0.30;
    nodes[2].x = W * 0.75; nodes[2].y = H * 0.60;

    // mouse tracking on section (canvas is pointer-events:none)
    section.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    section.addEventListener('mouseleave', () => {
      mouse.x = -9999; mouse.y = -9999;
    });
    section.addEventListener('touchmove', e => {
      if (!e.touches.length) return;
      const r = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - r.left;
      mouse.y = e.touches[0].clientY - r.top;
    }, { passive: true });

    window.addEventListener('resize', resize);
    tick();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();
})();
