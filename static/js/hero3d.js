/**
 * hero3d.js — Transformer Architecture 3D Visualization
 * Interactive 3D Transformer with Scroll-Responsive Particle Dispersion
 * Built with Three.js r128 | Clean & fully tested
 */
(function () {
  'use strict';

  function init() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const parent = canvas.parentElement;
    const W = (parent && parent.clientWidth > 0 ? parent.clientWidth : canvas.clientWidth) || 600;
    const H = (parent && parent.clientHeight > 0 ? parent.clientHeight : canvas.clientHeight) || 440;

    /* ─── Renderer ─────────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* ─── Scene & Camera ───────────────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 1.2, 9);
    camera.lookAt(0, 0, 0);

    /* ─── Color Palette ───────────────────────────────────────────────── */
    const C = {
      cyan:   0x4ec9b0,
      blue:   0x569cd6,
      violet: 0x9b8cff,
      indigo: 0x7059d4,
      orange: 0xce9178,
      white:  0xffffff,
    };

    /* ═══════════════════════════════════════════════════════════════════
       HELPER: create a glowing particle PLANE with scatter vectors
    ═══════════════════════════════════════════════════════════════════ */
    function makeParticlePlane(opts) {
      const rows = opts.rows || 28;
      const cols = opts.cols || 20;
      const w = opts.w || 1.0;
      const h = opts.h || 1.4;
      const z = opts.z || 0;
      const color = opts.color || C.cyan;
      const tiltX = opts.tiltX || -0.25;
      const tiltY = opts.tiltY || 0.0;
      const noise = opts.noise || 0.06;
      const alpha = opts.alpha || 0.9;
      const size = opts.size || 0.028;

      const count = rows * cols;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const origPos = new Float32Array(count * 3);
      const scatterVec = new Float32Array(count * 3);
      const c = new THREE.Color(color);

      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const i = (r * cols + cc) * 3;
          const px = (cc / (cols - 1) - 0.5) * w + (Math.random() - 0.5) * noise;
          const py = (r  / (rows - 1) - 0.5) * h + (Math.random() - 0.5) * noise;
          const pz = (Math.random() - 0.5) * noise * 2;

          pos[i]     = px;
          pos[i + 1] = py;
          pos[i + 2] = pz;

          origPos[i]     = px;
          origPos[i + 1] = py;
          origPos[i + 2] = pz;

          // 3D dispersion velocity vector for scroll spreading
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI;
          const dist = 1.0 + Math.random() * 2.8;
          scatterVec[i]     = Math.cos(phi) * Math.cos(theta) * dist;
          scatterVec[i + 1] = Math.sin(phi) * dist;
          scatterVec[i + 2] = Math.cos(phi) * Math.sin(theta) * dist * 1.5;

          const bright = 0.6 + Math.random() * 0.4;
          col[i]     = c.r * bright;
          col[i + 1] = c.g * bright;
          col[i + 2] = c.b * bright;
        }
      }

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

      const mat = new THREE.PointsMaterial({
        size: size,
        vertexColors: true,
        transparent: true,
        opacity: alpha,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const pts = new THREE.Points(geo, mat);

      /* ── Glowing frame border lines ── */
      const hw = w / 2 + 0.04;
      const hh = h / 2 + 0.04;
      const corners = [
        new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3( hw, -hh, 0),
        new THREE.Vector3( hw,  hh, 0),
        new THREE.Vector3(-hw,  hh, 0),
        new THREE.Vector3(-hw, -hh, 0),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(corners);
      const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const border = new THREE.Line(lineGeo, lineMat);

      const group = new THREE.Group();
      group.add(pts);
      group.add(border);
      group.rotation.x = tiltX;
      group.rotation.y = tiltY;
      group.position.z = z;

      return {
        group: group,
        pts: pts,
        geo: geo,
        mat: mat,
        border: border,
        posArray: pos,
        origPos: origPos,
        scatterVec: scatterVec,
        count: count,
        basePos: new THREE.Vector3(),
        driftVec: new THREE.Vector3(),
      };
    }

    /* ═══════════════════════════════════════════════════════════════════
       BUILD SCENE COMPONENTS
    ═══════════════════════════════════════════════════════════════════ */
    const root = new THREE.Group();
    scene.add(root);

    /* ─── 1. INPUT TOKENS panel (leftmost) ─── */
    const inputPlane = makeParticlePlane({
      rows: 22, cols: 14, w: 0.7, h: 1.1,
      color: C.cyan, tiltX: -0.18, tiltY: 0.08,
      noise: 0.04, alpha: 0.85, size: 0.025,
    });
    inputPlane.basePos.set(-3.6, 0.1, 0);
    inputPlane.driftVec.set(-1.8, 0.5, 0.6);
    inputPlane.group.position.copy(inputPlane.basePos);
    root.add(inputPlane.group);

    /* ─── 2. EMBEDDING plane (blue-cyan gradient) ─── */
    const embedPlane = makeParticlePlane({
      rows: 32, cols: 22, w: 1.0, h: 1.4,
      color: C.blue, tiltX: -0.22, tiltY: 0.06,
      noise: 0.07, alpha: 0.9, size: 0.027,
    });
    embedPlane.basePos.set(-1.9, 0.1, 0);
    embedPlane.driftVec.set(-0.9, -0.4, 0.4);
    embedPlane.group.position.copy(embedPlane.basePos);
    root.add(embedPlane.group);

    /* ─── 3. TRANSFORMER LAYERS (stacked, violet/indigo) ─── */
    const layerCount = 4;
    const layers = [];
    for (let l = 0; l < layerCount; l++) {
      const lc = makeParticlePlane({
        rows: 36, cols: 24, w: 1.1, h: 1.5,
        color: (l % 2 === 0 ? C.violet : C.indigo),
        tiltX: -0.22, tiltY: 0.06,
        noise: 0.08, alpha: 0.75 - l * 0.05, size: 0.028,
      });
      lc.basePos.set(0.5 + l * 0.3, 0.1, l * -0.35);
      lc.driftVec.set((l - 1.5) * 0.7, (l % 2 === 0 ? 0.6 : -0.6), (l + 1) * -0.9);
      lc.group.position.copy(lc.basePos);
      lc.group.scale.setScalar(1 - l * 0.015);
      root.add(lc.group);
      layers.push(lc);
    }

    /* ─── 4. OUTPUT BLOB (organic 3D shape, right side) ─── */
    const blobGeo = new THREE.IcosahedronGeometry(0.72, 5);
    const blobOrigPos = blobGeo.attributes.position.array.slice();
    const blobCount = blobGeo.attributes.position.count;
    const blobScatter = new Float32Array(blobCount * 3);
    for (let i = 0; i < blobCount; i++) {
      const ox = blobOrigPos[i * 3];
      const oy = blobOrigPos[i * 3 + 1];
      const oz = blobOrigPos[i * 3 + 2];
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
      const mag = 1.0 + Math.random() * 2.2;
      blobScatter[i * 3]     = (ox / len) * mag;
      blobScatter[i * 3 + 1] = (oy / len) * mag;
      blobScatter[i * 3 + 2] = (oz / len) * mag;
    }

    const blobMat = new THREE.PointsMaterial({
      size: 0.022,
      color: C.cyan,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const blobPts = new THREE.Points(blobGeo, blobMat);
    const blobBasePos = new THREE.Vector3(3.3, 0.1, 0);
    const blobDriftVec = new THREE.Vector3(2.0, 0.4, 0.8);
    blobPts.position.copy(blobBasePos);
    root.add(blobPts);

    /* ─── 5. BACKGROUND NEBULA PARTICLES ─── */
    const nebCount = 1200;
    const nebGeo = new THREE.BufferGeometry();
    const nebPos = new Float32Array(nebCount * 3);
    const nebCol = new Float32Array(nebCount * 3);
    const nebColors = [
      new THREE.Color(C.cyan),
      new THREE.Color(C.violet),
      new THREE.Color(C.blue),
    ];
    for (let i = 0; i < nebCount; i++) {
      nebPos[i * 3]     = (Math.random() - 0.5) * 11;
      nebPos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      nebPos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
      const c = nebColors[Math.floor(Math.random() * nebColors.length)];
      const bright = 0.15 + Math.random() * 0.35;
      nebCol[i * 3]     = c.r * bright;
      nebCol[i * 3 + 1] = c.g * bright;
      nebCol[i * 3 + 2] = c.b * bright;
    }
    nebGeo.setAttribute('position', new THREE.BufferAttribute(nebPos, 3));
    nebGeo.setAttribute('color',    new THREE.BufferAttribute(nebCol, 3));
    const nebMat = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nebula = new THREE.Points(nebGeo, nebMat);
    scene.add(nebula);

    /* ─── 6. FLOWING CONNECTION BEAMS ─── */
    const allBeams = [];
    function makeBeam(x1, x2, y, color) {
      const pts = [];
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push(new THREE.Vector3(
          x1 + (x2 - x1) * t,
          y + Math.sin(t * Math.PI) * 0.1,
          0
        ));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Line(geo, mat);
      allBeams.push(beam);
      return beam;
    }

    // Input → Embed
    for (let i = -2; i <= 2; i++) {
      const b = makeBeam(-3.2, -1.4, i * 0.22, C.cyan);
      root.add(b);
    }
    // Embed → First transformer layer
    for (let i = -2; i <= 2; i++) {
      const b = makeBeam(-1.4, -0.1, i * 0.25, C.blue);
      root.add(b);
    }
    // Last transformer layer → Output blob
    for (let i = -1; i <= 1; i++) {
      const b = makeBeam(2.0, 2.9, i * 0.3, C.violet);
      root.add(b);
    }

    /* ─── 7. SIGNAL PULSE PARTICLES ─── */
    const PULSE_COUNT = 40;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePos = new Float32Array(PULSE_COUNT * 3);
    const pulseCol = new Float32Array(PULSE_COUNT * 3);

    const pulseData = [];
    const pulseColorList = [
      new THREE.Color(C.cyan),
      new THREE.Color(C.blue),
      new THREE.Color(C.violet),
    ];

    for (let i = 0; i < PULSE_COUNT; i++) {
      const lane = Math.floor(Math.random() * 3);
      const yOff = (Math.random() - 0.5) * 1.0;
      pulseData.push({
        lane: lane,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        yOff: yOff,
        color: pulseColorList[lane],
      });
      pulsePos[i * 3]     = 0;
      pulsePos[i * 3 + 1] = 0;
      pulsePos[i * 3 + 2] = 0;
      pulseCol[i * 3]     = pulseColorList[lane].r;
      pulseCol[i * 3 + 1] = pulseColorList[lane].g;
      pulseCol[i * 3 + 2] = pulseColorList[lane].b;
    }
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
    pulseGeo.setAttribute('color',    new THREE.BufferAttribute(pulseCol, 3));
    const pulseMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const pulseMesh = new THREE.Points(pulseGeo, pulseMat);
    root.add(pulseMesh);

    const lanePaths = [
      [-3.2, -1.4],
      [-1.4,  0.4],
      [ 2.0,  2.9],
    ];

    /* ═══════════════════════════════════════════════════════════════════
       SCROLL PROGRESS & SPREAD TRACKING
    ═══════════════════════════════════════════════════════════════════ */
    let targetSpread = 0;
    let currentSpread = 0;

    function handleScroll() {
      const editorPane = document.getElementById('editor-pane');
      const scrollTop = editorPane ? editorPane.scrollTop : (window.pageYOffset || 0);
      targetSpread = Math.min(1.0, Math.max(0.0, scrollTop / 380));
    }

    const editorPane = document.getElementById('editor-pane');
    if (editorPane) {
      editorPane.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* ═══════════════════════════════════════════════════════════════════
       MOUSE / DRAG INTERACTION
    ═══════════════════════════════════════════════════════════════════ */
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let targetRotY = 0, targetRotX = 0;
    let currentRotY = 0, currentRotX = 0;
    const mouse = new THREE.Vector2();
    const stage = document.getElementById('hero-3d-stage');

    function onDown(e) {
      isDragging = true;
      prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    }
    function onMove(e) {
      const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      if (isDragging) {
        targetRotY += (cx - prevX) * 0.008;
        targetRotX += (cy - prevY) * 0.004;
        targetRotX = Math.max(-0.5, Math.min(0.5, targetRotX));
        prevX = cx; prevY = cy;
      }
      if (stage) {
        const rect = stage.getBoundingClientRect();
        mouse.x = ((cx - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((cy - rect.top)  / rect.height) * 2 + 1;
      }
    }
    function onUp() { isDragging = false; }

    canvas.addEventListener('mousedown',  onDown);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);

    /* ─── Touch Handling: Horizontal drag rotates, vertical scrolls page ─── */
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDir = null;

    function handleTouchStart(e) {
      if (!e.touches || !e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDir = null;
      onDown(e.touches[0]);
    }

    function handleTouchMove(e) {
      if (!e.touches || !e.touches[0] || !isDragging) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);

      if (!touchDir && (dx > 6 || dy > 6)) {
        touchDir = dx > dy ? 'h' : 'v';
      }

      if (touchDir === 'h') {
        if (e.cancelable) e.preventDefault();
        onMove(t);
      } else if (touchDir === 'v') {
        isDragging = false;
      }
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onUp);
    canvas.addEventListener('touchcancel', onUp);

    /* ─── CLICK: forward-pass shockwave ─── */
    let forwardPass = false;
    let fpTime = 0;
    canvas.addEventListener('click', function () {
      forwardPass = true;
      fpTime = 0;
    });

    /* ═══════════════════════════════════════════════════════════════════
       RESIZE
    ═══════════════════════════════════════════════════════════════════ */
    function onResize() {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      if (w <= 0 || h <= 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;

      // Adjust camera distance for mobile so architecture fits nicely
      if (w < 480) {
        camera.position.set(0, 0.9, 11.2);
      } else if (w < 768) {
        camera.position.set(0, 1.0, 10.0);
      } else {
        camera.position.set(0, 1.2, 9.0);
      }

      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    setTimeout(onResize, 50);
    setTimeout(onResize, 300);

    /* ═══════════════════════════════════════════════════════════════════
       ANIMATE
    ═══════════════════════════════════════════════════════════════════ */
    let clock = 0;
    const stages = [inputPlane, embedPlane].concat(layers);

    function animate() {
      requestAnimationFrame(animate);
      clock += 0.016;

      /* ── Smooth spread interpolation ── */
      currentSpread += (targetSpread - currentSpread) * 0.08;

      /* ── Smooth camera rotation ── */
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;
      root.rotation.y = currentRotY;
      root.rotation.x = currentRotX;

      /* ── Idle gentle sway ── */
      if (!isDragging) {
        targetRotY += 0.0008;
      }

      /* ── Animate particle planes (shimmer + scroll spread) ── */
      stages.forEach(function (pl, pi) {
        const pArr = pl.geo.attributes.position.array;
        const oPos = pl.origPos;
        const sVec = pl.scatterVec;

        for (let i = 0; i < pl.count; i++) {
          const idx = i * 3;
          const shimmer = 0.004 * Math.sin(clock * 2.5 + i * 0.3 + pi * 1.1);

          // Disperse outward when user scrolls
          pArr[idx]     = oPos[idx]     + sVec[idx]     * currentSpread * 2.5;
          pArr[idx + 1] = oPos[idx + 1] + sVec[idx + 1] * currentSpread * 2.5;
          pArr[idx + 2] = oPos[idx + 2] + sVec[idx + 2] * currentSpread * 2.5 + shimmer;
        }
        pl.geo.attributes.position.needsUpdate = true;

        // Group drift on scroll
        pl.group.position.x = pl.basePos.x + pl.driftVec.x * currentSpread * 1.6;
        pl.group.position.y = pl.basePos.y + pl.driftVec.y * currentSpread * 1.6;
        pl.group.position.z = pl.basePos.z + pl.driftVec.z * currentSpread * 2.2;

        // Border frame dissolves as particles scatter
        pl.border.material.opacity = Math.max(0, (1 - currentSpread * 1.7) * 0.35);
      });

      /* ── Animate blob vertices (organic morph + scroll spread) ── */
      const blobPos = blobGeo.attributes.position;
      for (let i = 0; i < blobCount; i++) {
        const idx = i * 3;
        const ox = blobOrigPos[idx];
        const oy = blobOrigPos[idx + 1];
        const oz = blobOrigPos[idx + 2];
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;
        const nx = ox / len, ny = oy / len, nz = oz / len;
        const wave = 0.08 * Math.sin(clock * 1.2 + nx * 4 + ny * 3 + nz * 5);

        // Scatter outward along normal vector
        const sx = blobScatter[idx]     * currentSpread * 2.6;
        const sy = blobScatter[idx + 1] * currentSpread * 2.6;
        const sz = blobScatter[idx + 2] * currentSpread * 2.6;

        blobPos.setXYZ(i, ox + nx * wave + sx, oy + ny * wave + sy, oz + nz * wave + sz);
      }
      blobPos.needsUpdate = true;

      blobPts.position.x = blobBasePos.x + blobDriftVec.x * currentSpread * 1.6;
      blobPts.position.y = blobBasePos.y + blobDriftVec.y * currentSpread * 1.6;
      blobPts.position.z = blobBasePos.z + blobDriftVec.z * currentSpread * 2.0;

      // Pulsing blob colour
      const blobHue = (clock * 0.03) % 1;
      blobMat.color.setHSL(blobHue * 0.4 + 0.45, 0.8, 0.6);

      /* ── Animate signal pulses ── */
      for (let i = 0; i < PULSE_COUNT; i++) {
        const pd = pulseData[i];
        pd.t += pd.speed;
        if (pd.t > 1) pd.t -= 1;
        const path = lanePaths[pd.lane];
        const x = path[0] + (path[1] - path[0]) * pd.t;
        const y = pd.yOff + Math.sin(pd.t * Math.PI) * 0.08;
        pulsePos[i * 3]     = x;
        pulsePos[i * 3 + 1] = y;
        pulsePos[i * 3 + 2] = 0;

        const bright = 0.6 + 0.4 * Math.sin(pd.t * Math.PI);
        pulseCol[i * 3]     = pd.color.r * bright;
        pulseCol[i * 3 + 1] = pd.color.g * bright;
        pulseCol[i * 3 + 2] = pd.color.b * bright;
      }
      pulseGeo.attributes.position.needsUpdate = true;
      pulseGeo.attributes.color.needsUpdate    = true;

      /* ── Beams and pulse opacity on scroll ── */
      allBeams.forEach(function (b) {
        b.material.opacity = Math.max(0, (1 - currentSpread * 1.8) * 0.2);
      });
      pulseMesh.material.opacity = Math.max(0, (1 - currentSpread * 1.5) * 0.95);

      /* ── HUD overlays fade smoothly on scroll ── */
      if (stage) {
        const hudItems = stage.querySelectorAll('.transformer-hud, .transformer-title-hud, .transformer-legend, .transformer-interact-hint');
        const hudAlpha = Math.max(0, 1 - currentSpread * 2.2);
        hudItems.forEach(function (el) {
          el.style.opacity = hudAlpha;
        });
      }

      /* ── Forward pass shockwave (click effect) ── */
      if (forwardPass) {
        fpTime += 0.025;
        stages.forEach(function (s, idx) {
          const delay = idx * 0.18;
          const t = fpTime - delay;
          if (t > 0 && t < 1) {
            s.mat.opacity = 0.9 + 0.5 * Math.sin(t * Math.PI);
            s.mat.size    = 0.038 + 0.012 * Math.sin(t * Math.PI);
          } else {
            s.mat.opacity = s === inputPlane ? 0.85 :
                            s === embedPlane ? 0.9 : 0.75;
            s.mat.size    = s === inputPlane ? 0.025 :
                            s === embedPlane ? 0.027 : 0.028;
          }
        });
        if (fpTime > stages.length * 0.18 + 1.2) forwardPass = false;
      }

      /* ── Nebula drift & expand on scroll ── */
      nebula.rotation.y = clock * (0.015 + currentSpread * 0.03);
      nebula.rotation.x = clock * (0.008 + currentSpread * 0.015);
      nebula.scale.setScalar(1 + currentSpread * 0.3);

      renderer.render(scene, camera);
    }

    animate();
  }

  /* ─── Boot ─────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
