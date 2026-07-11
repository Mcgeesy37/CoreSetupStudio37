/* ════════════════════════════════════════════
   CoreSetup Studio — main.js
   ULTIMATE EDITION
════════════════════════════════════════════ */

document.body.classList.add('loading');

/* ──────────────────────────────────────────
   PRELOADER — animated counter + reveal
────────────────────────────────────────── */
(function preloader() {
  const pre     = document.getElementById('preloader');
  const fill    = document.getElementById('preFill');
  const percent = document.getElementById('prePercent');
  let p = 0;

  const tick = setInterval(() => {
    /* natural-feeling loading curve */
    const step = p < 60 ? 3 + Math.random() * 5
               : p < 85 ? 1 + Math.random() * 3
               : 0.5 + Math.random() * 1.5;
    p = Math.min(p + step, 100);
    fill.style.width  = p + '%';
    percent.textContent = Math.floor(p) + '%';

    if (p >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        pre.classList.add('done');
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
      }, 350);
    }
  }, 60);
})();

/* ──────────────────────────────────────────
   NAV
────────────────────────────────────────── */
const nav    = document.getElementById('nav');
const burger = document.getElementById('burger');

window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', window.scrollY > 60);
});
burger.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

/* ──────────────────────────────────────────
   SCROLL REVEAL
────────────────────────────────────────── */
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

/* ──────────────────────────────────────────
   COUNT UP
────────────────────────────────────────── */
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.to;
    let val = 0;
    const step = Math.max(1, Math.ceil(target / 55));
    const timer = setInterval(() => {
      val = Math.min(val + step, target);
      el.textContent = val;
      if (val >= target) clearInterval(timer);
    }, 24);
    co.unobserve(el);
  });
}, { threshold: 0.7 });
document.querySelectorAll('.count').forEach(el => co.observe(el));

/* ──────────────────────────────────────────
   FAQ ACCORDION
────────────────────────────────────────── */
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');

  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    /* close all */
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = null;
    });

    /* open clicked (if it was closed) */
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

/* ──────────────────────────────────────────
   SMOOTH ANCHOR
────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ──────────────────────────────────────────
   CONTACT FORM
────────────────────────────────────────── */
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const msg = document.getElementById('formMsg');
  msg.style.display = 'block';
  msg.textContent = '✦ Nachricht gesendet! Wir melden uns innerhalb von 24 Stunden.';
  e.target.reset();
});

/* ──────────────────────────────────────────
   CARD TILT
────────────────────────────────────────── */
document.querySelectorAll('.card, .pcard, .review').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - .5) * 7;
    const y = ((e.clientY - r.top)  / r.height - .5) * 7;
    card.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

/* ════════════════════════════════════════════
   THREE.JS GLOBE — detailed, gold connections
════════════════════════════════════════════ */
(function buildGlobe() {
  if (typeof THREE === 'undefined') { console.warn('Three.js missing'); return; }

  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(0, 0, 3.8);

  function resize() {
    const w = canvas.parentElement.offsetWidth;
    const h = canvas.parentElement.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── Globe shader: continents via fbm noise ── */
  const globeVS = `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUv;
    void main() {
      vNormal   = normalize(normalMatrix * normal);
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vUv       = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const globeFS = `
    precision highp float;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i),            hash(i+vec2(1,0)), u.x),
                 mix(hash(i+vec2(0,1)),  hash(i+vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
      return v;
    }

    float continentMask(vec2 uv) {
      float lon = uv.x * 6.2832 - 3.1416;
      float lat = (uv.y - 0.5) * 3.1416;
      float clat = cos(lat);
      vec2  sp   = vec2(clat * cos(lon), clat * sin(lon));

      float land = 0.0;
      land += smoothstep(-0.05, 0.35, fbm(sp * 2.8 + vec2( 1.2,  0.3)) - 0.28) * 0.90;
      land += smoothstep(-0.05, 0.35, fbm(sp * 2.5 + vec2(-2.1,  0.1)) - 0.30) * 0.85;
      land += smoothstep(-0.05, 0.40, fbm(sp * 2.6 + vec2( 2.5,  0.5)) - 0.27) * 0.95;
      land += smoothstep(-0.05, 0.30, fbm(sp * 4.0 + vec2( 2.8, -1.1)) - 0.36) * 0.70;
      land += smoothstep(0.58, 0.95, abs(uv.y - 0.5) * 2.0) * 0.5;
      return clamp(land, 0.0, 1.0);
    }

    void main() {
      vec2 uv = vUv;
      float land = continentMask(uv);

      vec3 deepOcean    = vec3(0.02, 0.04, 0.09);
      vec3 shallowOcean = vec3(0.05, 0.08, 0.14);
      vec3 landDark     = vec3(0.09, 0.08, 0.05);
      vec3 landMid      = vec3(0.14, 0.12, 0.07);
      vec3 landHigh     = vec3(0.20, 0.17, 0.09);

      float oceanVar = fbm(uv * 6.0) * 0.5 + 0.5;
      vec3  oceanCol = mix(deepOcean, shallowOcean, oceanVar * 0.6);

      float elev    = fbm(uv * 9.0 + vec2(3.0));
      vec3  landCol = mix(landDark, mix(landMid, landHigh, elev), 0.9);

      vec3 baseCol = mix(oceanCol, landCol, step(0.45, land));

      /* coast glow */
      float eps = 0.004;
      float grad = abs(continentMask(uv + vec2(eps,0.)) - land)
                 + abs(continentMask(uv + vec2(0.,eps)) - land);
      baseCol += vec3(0.83, 0.69, 0.21) * clamp(grad * 8.0, 0.0, 1.0) * 0.25;

      /* gold grid */
      float lw = 0.025;
      float grd  = max(step(1.0 - lw,       mod(uv.x * 36.0, 1.0)), step(1.0 - lw,       mod(uv.y * 18.0, 1.0)));
      float grdM = max(step(1.0 - lw * 1.6, mod(uv.x * 12.0, 1.0)), step(1.0 - lw * 1.6, mod(uv.y *  6.0, 1.0)));
      baseCol += vec3(0.83, 0.69, 0.21) * max(grd * 0.10, grdM * 0.20) * (0.4 + 0.6 * (1.0 - land));

      /* scan pulse */
      float pulse = sin(uv.y * 120.0 - uTime * 0.6) * 0.5 + 0.5;
      baseCol += vec3(0.83, 0.69, 0.21) * pulse * 0.015 * (1.0 - land);

      /* key light */
      vec3 lightDir = normalize(vec3(1.4, 1.6, 2.0));
      float diff = max(dot(vNormal, lightDir), 0.0);
      baseCol += vec3(0.70, 0.58, 0.22) * pow(diff, 28.0) * 0.45;

      /* rim atmosphere */
      vec3  viewDir = normalize(cameraPosition - vWorldPos);
      float rim = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);
      baseCol += vec3(0.83, 0.69, 0.21) * rim * 0.55;

      gl_FragColor = vec4(baseCol, 0.88 + rim * 0.12);
    }
  `;

  const globeMat = new THREE.ShaderMaterial({
    vertexShader: globeVS,
    fragmentShader: globeFS,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
  });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1.0, 128, 128), globeMat);
  scene.add(globe);

  /* ── Atmosphere shells ── */
  function shell(radius, power, alpha) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vN; varying vec3 vP;
          void main(){ vN=normalize(normalMatrix*normal); vP=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
        `,
        fragmentShader: `
          varying vec3 vN; varying vec3 vP;
          void main(){
            vec3 v=normalize(cameraPosition-vP);
            float r=pow(1.-dot(vN,v),${power.toFixed(1)});
            gl_FragColor=vec4(vec3(0.83,0.69,0.21),r*${alpha.toFixed(2)});
          }
        `,
        transparent: true, side: THREE.BackSide, depthWrite: false,
      })
    );
  }
  scene.add(shell(1.10, 3.0, 0.28));
  scene.add(shell(1.18, 5.0, 0.12));

  /* ── Stars ── */
  const starGeo = new THREE.BufferGeometry();
  const starArr = new Float32Array(2400 * 3);
  for (let i = 0; i < starArr.length; i++) starArr[i] = (Math.random() - .5) * 60;
  starGeo.setAttribute('position', new THREE.BufferAttribute(starArr, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xfff8e0, size: 0.028, transparent: true, opacity: 0.55
  })));

  /* ── Cities + arcs ── */
  function ll2v3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const th  = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(th),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(th)
    );
  }

  const cities = [
    [52.5,13.4],[51.5,-0.1],[48.9,2.3],[40.7,-74.0],[34.1,-118.2],
    [-23.5,-46.6],[6.5,3.4],[30.0,31.2],[55.8,37.6],[25.2,55.3],
    [19.1,72.9],[28.6,77.2],[1.3,103.8],[22.3,114.2],[31.2,121.5],
    [35.7,139.7],[37.6,126.9],[-33.9,151.2],[-26.2,28.0],[41.9,-87.6],
    [19.4,-99.1],[41.0,28.9],
  ];
  const cityVecs = cities.map(c => ll2v3(c[0], c[1], 1.012));

  const nodeGeo  = new THREE.SphereGeometry(0.013, 8, 8);
  const nodeMat  = new THREE.MeshBasicMaterial({ color: 0xf0d878 });
  const pulseGeo = new THREE.RingGeometry(0.018, 0.034, 16);
  const pulseRings = [];

  cityVecs.forEach(pos => {
    const dot = new THREE.Mesh(nodeGeo, nodeMat);
    dot.position.copy(pos);
    globe.add(dot);

    const ring = new THREE.Mesh(pulseGeo,
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, side: THREE.DoubleSide }));
    ring.position.copy(pos);
    ring.lookAt(new THREE.Vector3(0, 0, 0));
    ring.userData.phase = Math.random() * Math.PI * 2;
    globe.add(ring);
    pulseRings.push(ring);
  });

  const connections = [
    [0,1],[0,2],[0,8],[0,21],[0,11],[1,2],[1,3],[1,7],[1,21],
    [3,4],[3,19],[3,20],[4,20],[5,20],[5,6],[6,18],[7,18],[7,9],
    [9,10],[9,11],[10,12],[11,12],[12,13],[12,15],[13,14],[14,15],
    [15,16],[15,17],[16,17],[8,21],[8,9],[0,3],[3,5],
  ];

  const arcs = connections.map(([a, b]) => {
    const p1  = cityVecs[a].clone();
    const p2  = cityVecs[b].clone();
    const mid = p1.clone().lerp(p2, .5).normalize()
      .multiplyScalar(1.0 + .15 + p1.distanceTo(p2) * .22);
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const line  = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)),
      new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: .2 })
    );
    globe.add(line);
    return { line, curve, phase: Math.random() * Math.PI * 2 };
  });

  const packets = arcs.map(arc => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true })
    );
    globe.add(mesh);
    return { mesh, curve: arc.curve, t: Math.random(), speed: .0018 + Math.random() * .0025 };
  });

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0xfff8e0, 0.20));
  const sun = new THREE.DirectionalLight(0xffd080, 1.1);
  sun.position.set(4, 3, 3);
  scene.add(sun);

  /* ── Mouse parallax ── */
  let mxT = 0, myT = 0, mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mxT = (e.clientX / innerWidth  - .5) * .4;
    myT = (e.clientY / innerHeight - .5) * .25;
  });

  function positionGlobe() {
    if (innerWidth < 768) { globe.position.set(0, .2, 0); globe.scale.setScalar(.68); }
    else                  { globe.position.set(1.65, 0, 0); globe.scale.setScalar(1); }
  }
  positionGlobe();
  window.addEventListener('resize', positionGlobe);

  /* ── Intro scale-in of globe after preloader ── */
  globe.scale.setScalar(0.001);
  let introDone = false;
  setTimeout(() => { introDone = true; }, 1200);

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.007;

    globeMat.uniforms.uTime.value = time;
    globe.rotation.y = time * 0.09;

    /* intro grow */
    if (introDone) {
      const targetScale = innerWidth < 768 ? .68 : 1;
      const cur = globe.scale.x;
      if (cur < targetScale - .001) {
        const next = cur + (targetScale - cur) * .06;
        globe.scale.setScalar(next);
      }
    }

    mx += (mxT - mx) * .04;
    my += (myT - my) * .04;
    camera.position.x = mx * .6;
    camera.position.y = -my * .4;
    camera.lookAt(globe.position);

    pulseRings.forEach(ring => {
      const v = Math.abs(Math.sin(time * 1.1 + ring.userData.phase));
      ring.scale.setScalar(1 + .55 * v);
      ring.material.opacity = .55 - .45 * v;
    });

    arcs.forEach(arc => {
      arc.line.material.opacity = .12 + .18 * (.5 + .5 * Math.sin(time * .9 + arc.phase));
    });

    packets.forEach(p => {
      p.t += p.speed;
      if (p.t > 1) p.t = 0;
      p.mesh.position.copy(p.curve.getPoint(p.t));
      p.mesh.material.opacity = Math.sin(p.t * Math.PI) * .9;
    });

    renderer.render(scene, camera);
  }
  animate();
})();
