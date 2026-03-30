/* ─────────────────────────────────────────────────────────
   3D Scene — Blueprint Gears
   ABSOLUTE rotation from master angle (no accumulation drift)
   Gear mesh law: θB = ratioB × master + φB
───────────────────────────────────────────────────────── */
(() => {
  'use strict';

  // ── Renderer ─────────────────────────────────────────
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  scene.fog = new THREE.FogExp2(0x050505, 0.002);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(-110, 20, 280);
  camera.lookAt(-130, 0, 0);

  // ── Lights ────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dL = new THREE.DirectionalLight(0xffffff, 1.0);
  dL.position.set(1, 2, 3);
  scene.add(dL);

  // ── Gear geometry builder ─────────────────────────────
  function makeGearGeo(teeth, R, depth) {
    const shape = new THREE.Shape();
    const ir    = R * 0.86;
    const step  = (Math.PI * 2) / teeth;

    for (let i = 0; i < teeth; i++) {
      const a1=i*step, a2=a1+step*.18, a3=a1+step*.38,
            a4=a1+step*.62, a5=a1+step*.82;
      const fn = i === 0 ? 'moveTo' : 'lineTo';
      shape[fn](Math.cos(a1)*ir, Math.sin(a1)*ir);
      shape.lineTo(Math.cos(a2)*R, Math.sin(a2)*R);
      shape.lineTo(Math.cos(a3)*R, Math.sin(a3)*R);
      shape.lineTo(Math.cos(a4)*ir, Math.sin(a4)*ir);
      shape.lineTo(Math.cos(a5)*ir, Math.sin(a5)*ir);
    }
    const hub = new THREE.Path();
    hub.absarc(0, 0, R*.27, 0, Math.PI*2, false);
    shape.holes.push(hub);
    for (let k = 0; k < 4; k++) {
      const a = (Math.PI/2)*k + Math.PI/4, c = new THREE.Path();
      c.absarc(Math.cos(a)*R*.54, Math.sin(a)*R*.54, R*.19, 0, Math.PI*2, false);
      shape.holes.push(c);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 2, bevelSize: .7, bevelThickness: .7
    });
    geo.center();
    return geo;
  }

  function createGear(teeth, R, depth) {
    const group = new THREE.Group();
    const geo  = makeGearGeo(teeth, R, depth);
    const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1c1c1c }));
    group.add(fill);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 15),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
    );
    group.add(edges);
    return { group, fill, edges };
  }

  // ── Gear definitions ──────────────────────────────────
  // Tooth profile: tip center at ~0.28×step, valley center at ~0.90×step
  const TOOTH_CENTER = 0.28;  // fraction of step where tooth tip is centered
  const VALLEY_CENTER = 0.90; // fraction of step where valley is centered

  const G1_R=62, G2_R=43, G3_R=31, G4_R=22;
  const gears = [
    { T:32, R:G1_R, depth:18, cx:-75,           cy:0 },
    { T:22, R:G2_R, depth:16, cx:-75+G1_R+G2_R, cy:0 },
    { T:16, R:G3_R, depth:14, cx:-75,           cy:G1_R+G3_R },
    { T:12, R:G4_R, depth:12,
      cx: -75+G1_R+G2_R + (G2_R+G4_R)*Math.cos(-0.42),
      cy: (G2_R+G4_R)*Math.sin(-0.42) },
  ];

  // ── Compute physically-correct ratios & phases ────────
  // Mesh pairs: 0→1, 0→2, 1→3
  // ratio = angular velocity relative to gear 0 (master)
  // φ = initial phase offset

  gears[0].ratio = 1;
  gears[0].φ = 0;

  function computeMesh(driverIdx, drivenIdx) {
    const A = gears[driverIdx];
    const B = gears[drivenIdx];
    const stepA = (Math.PI * 2) / A.T;
    const stepB = (Math.PI * 2) / B.T;

    // Contact angle: from A center to B center
    const α = Math.atan2(B.cy - A.cy, B.cx - A.cx);

    // Speed ratio relative to master (gear 0)
    B.ratio = -A.ratio * (A.T / B.T);

    // Phase calculation:
    // When master=0, gear A is at angle A.φ. Its tooth nearest to contact:
    //   A.φ + k×stepA + TOOTH_CENTER×stepA ≈ α
    // At that master offset, gear B must have valley at α+π:
    //   B.φ + B.ratio/A.ratio × (α - TOOTH_CENTER×stepA - A.φ) + VALLEY_CENTER×stepB ≈ α+π
    //
    // Simplified: pick the phase so that at master=0, the teeth interlock
    // at the contact angle.
    const masterAtContact = (α - TOOTH_CENTER * stepA - A.φ) / A.ratio;
    B.φ = (α + Math.PI) - VALLEY_CENTER * stepB - B.ratio * masterAtContact;
  }

  computeMesh(0, 1);  // G0 drives G1
  computeMesh(0, 2);  // G0 drives G2
  computeMesh(1, 3);  // G1 drives G3

  // ── Build cluster ─────────────────────────────────────
  const cluster = new THREE.Group();
  cluster.position.set(-210, -15, 0);
  scene.add(cluster);

  const gearMeshes = gears.map(g => {
    const obj = createGear(g.T, g.R, g.depth);
    obj.group.position.set(g.cx, g.cy, 0);
    cluster.add(obj.group);
    return obj;
  });

  // Gentle tilt for 3D depth
  cluster.rotation.x = 0.15;
  cluster.rotation.y = -0.1;

  // ── Floating particles ────────────────────────────────
  const PN = 200;
  const pArr = new Float32Array(PN * 3);
  const pVel = [];
  for (let i = 0; i < PN; i++) {
    pArr[i*3]   = (Math.random()-.5)*600;
    pArr[i*3+1] = (Math.random()-.5)*400;
    pArr[i*3+2] = (Math.random()-.5)*300;
    pVel.push({ x:(Math.random()-.5)*.04, y:(Math.random()-.5)*.03, z:(Math.random()-.5)*.03 });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x556677, size: 0.8, transparent: true, opacity: 0.3, depthWrite: false
  })));

  // ── Scroll sync ───────────────────────────────────────
  const cvPanel = document.querySelector('.cv-panel');
  let scrollPct = 0;
  if (cvPanel) {
    cvPanel.addEventListener('scroll', () => {
      scrollPct = cvPanel.scrollTop / (cvPanel.scrollHeight - cvPanel.clientHeight || 1);
    });
  }

  // ── Mouse parallax ────────────────────────────────────
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 18;
    my = (e.clientY / window.innerHeight - 0.5) * 12;
  });

  // ── Render loop ───────────────────────────────────────
  const BASE_SPEED = 0.002;
  let masterAngle = 0;
  let tick = 0;

  (function animate() {
    requestAnimationFrame(animate);
    tick++;

    // Master angle drives everything (no per-gear accumulation)
    const boost = Math.abs(scrollPct - 0.5) * 0.001;
    masterAngle += BASE_SPEED + boost;

    // Camera parallax + scroll depth
    camera.position.x += ((-110 + mx) - camera.position.x) * 0.03;
    camera.position.y += ((20 - my) - camera.position.y) * 0.03;
    camera.position.z += ((280 - scrollPct * 40) - camera.position.z) * 0.05;
    camera.lookAt(-130, 0, 0);

    // ── ABSOLUTE gear rotation (guarantees perfect meshing) ──
    gears.forEach((g, i) => {
      gearMeshes[i].group.rotation.z = g.ratio * masterAngle + g.φ;
    });

    // Subtle cluster breathing
    cluster.rotation.y = -0.1 + Math.sin(tick * 0.003) * 0.06;

    // Particle drift
    for (let i = 0; i < PN; i++) {
      pArr[i*3]   += pVel[i].x;
      pArr[i*3+1] += pVel[i].y;
      pArr[i*3+2] += pVel[i].z;
      if (Math.abs(pArr[i*3])   > 310) pVel[i].x *= -1;
      if (Math.abs(pArr[i*3+1]) > 210) pVel[i].y *= -1;
      if (Math.abs(pArr[i*3+2]) > 160) pVel[i].z *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  })();

  // ── Resize ────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  // ── Lofi Player Toggle ─────────────────────────────
  const lofiToggle = document.getElementById('lofi-toggle');
  const lofiAudio = document.getElementById('lofi-audio');
  const lofiText = lofiToggle.querySelector('.lofi-text');
  const lofiWidget = document.querySelector('.lofi-widget');
  let isPlaying = false;

  // Sync state if browser allows autoplay
  lofiAudio.addEventListener('play', () => {
    isPlaying = true;
    lofiText.innerText = "Stop Song";
    lofiWidget.classList.add('playing');
  });

  lofiToggle.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      lofiAudio.play().catch(e => console.log("Audio play blocked."));
      lofiText.innerText = "Stop Song";
      lofiWidget.classList.add('playing');
    } else {
      lofiAudio.pause();
      lofiText.innerText = "Play Song";
      lofiWidget.classList.remove('playing');
    }
  });

  // ── Experience Initiation Logic ───────────────────
  const overlay = document.getElementById('experience-overlay');
  const initBtn = document.getElementById('init-button');

  initBtn.addEventListener('click', () => {
    // 1. Hide overlay with animation
    overlay.classList.add('hidden');
    // 2. Reveal main content simultaneously
    document.body.classList.add('revealed');
    // 3. Start music
    if (!isPlaying) {
      lofiAudio.play().catch(e => console.log("Play failed: ", e));
      isPlaying = true;
      lofiText.innerText = "Stop Song";
      lofiWidget.classList.add('playing');
    }
  });

  // (Optional: remove overlay from DOM after animation)
  overlay.addEventListener('transitionend', () => {
    if (overlay.classList.contains('hidden')) {
      overlay.style.display = 'none';
    }
  });

  // ── Experience Accordion ────────────────────────────
  document.querySelectorAll('.cv-exp-header').forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.closest('.cv-exp');
      parent.classList.toggle('active');
    });
  });
})();
