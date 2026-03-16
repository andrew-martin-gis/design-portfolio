<script>
  import { onMount }   from 'svelte';
  import * as THREE    from 'three';
  import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
  import cloudsUrl from '../../assets/8k_earth_clouds.jpg?url';

  let wrap;
  let canvas;

  // Reactive UI state
  let isDayView      = true;
  let showClouds     = true;

  // Bridge refs for Three.js ↔ template communication
  let threeRefs  = { earthMat: null, nightTex: null, dayTex: null, cloudMesh: null, cloudReady: false };

  function toggleView() {
    isDayView = !isDayView;
    const { earthMat, nightTex, dayTex, cloudMesh, cloudReady } = threeRefs;
    if (!earthMat) return;
    if (isDayView && dayTex) {
      earthMat.map = dayTex;
      earthMat.needsUpdate = true;
      if (cloudMesh) cloudMesh.visible = showClouds && cloudReady;
    } else if (!isDayView && nightTex) {
      earthMat.map = nightTex;
      earthMat.needsUpdate = true;
      if (cloudMesh) cloudMesh.visible = false;
    }
  }

  function toggleClouds() {
    showClouds = !showClouds;
    const { cloudMesh, cloudReady } = threeRefs;
    if (cloudMesh) cloudMesh.visible = isDayView && showClouds && cloudReady;
  }

  const base = import.meta.env.BASE_URL;

  // Background arc hub cities
  const HUBS = [
    [ 40.71, -74.01],  [ 51.51,  -0.13],  [ 35.69, 139.69],
    [-33.87, 151.21],  [ 19.08,  72.88],  [-23.55, -46.63],
    [  1.35, 103.82],  [ 55.75,  37.62],  [ 34.05,-118.24],
    [ -1.29,  36.82],  [ 48.85,   2.35],  [ 39.91, 116.39],
  ];

  // Matches Three.js SphereGeometry UV convention:
  // u=0 → -x (lon=-180°), prime meridian → +x, west coast US (lon≈-120°) → +z (faces camera)
  function latLonToVec3(lat, lon, r = 1) {
    const latR = lat * (Math.PI / 180);
    const lonR = lon * (Math.PI / 180);
    return new THREE.Vector3(
       r * Math.cos(latR) * Math.cos(lonR),   // x
       r * Math.sin(latR),                    // y (north pole = +y)
      -r * Math.cos(latR) * Math.sin(lonR)   // z (+z faces camera at initial orient.)
    );
  }

  onMount(() => {
    let raf;
    const W = window.innerWidth, H = window.innerHeight;

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ── Scene & fixed camera ─────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x020818); // prevents EffectComposer alpha/bloom black-disc artifact
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(0, 0, 2.8);
    camera.lookAt(0, 0, 0);

    // ── Stars ────────────────────────────────────────────────────────────
    {
      const sp = new Float32Array(3000 * 3);
      for (let i = 0; i < 3000; i++) {
        const r = 60 + Math.random() * 40, phi = Math.acos(2 * Math.random() - 1), th = Math.random() * Math.PI * 2;
        sp[i*3] = r*Math.sin(phi)*Math.cos(th); sp[i*3+1] = r*Math.cos(phi); sp[i*3+2] = r*Math.sin(phi)*Math.sin(th);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color:0xffffff, size:0.1, transparent:true, opacity:0.5, sizeAttenuation:true })));
    }

    // ── Globe group hierarchy:  tiltGroup (parallax) → globeGroup (spin) ─
    const tiltGroup  = new THREE.Group();
    const globeGroup = new THREE.Group();
    tiltGroup.add(globeGroup);
    scene.add(tiltGroup);

    // ── Earth textures (preload both) ─────────────────────────────────────
    const loader   = new THREE.TextureLoader();
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x020818 });
    const pubBase  = base.replace(/\/?$/, '/');
    threeRefs.earthMat = earthMat;

    // Day texture (default) — from public/
    loader.load(
      pubBase + '8k_earth_daymap.jpg',
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        threeRefs.dayTex = tex;
        earthMat.map   = tex;
        earthMat.color.set(0xffffff);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => console.warn('Day earth texture unavailable — using fallback colour')
    );

    // Night texture — preload from public/
    loader.load(
      pubBase + '8k_earth_nightmap.jpg',
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        threeRefs.nightTex = tex;
        // Apply immediately if user toggled to night before this loaded
        if (!isDayView) { earthMat.map = tex; earthMat.needsUpdate = true; }
      },
      undefined,
      () => console.warn('Night earth texture unavailable')
    );

    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.998, 64, 64),
      earthMat
    ));

    // ── Cloud layer (day view only) ─────────────────────────────────────
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      alphaTest: 0.05,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.010, 64, 64),
      cloudMat
    );
    cloudMesh.visible = false; // shown once texture loads (day view default)
    globeGroup.add(cloudMesh);
    threeRefs.cloudMesh = cloudMesh;

    loader.load(
      cloudsUrl,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        cloudMat.alphaMap = tex;
        cloudMat.opacity  = 0.3;
        cloudMat.needsUpdate = true;
        threeRefs.cloudReady = true;
        cloudMesh.visible = isDayView && showClouds; // respect current view state
      },
      undefined,
      () => console.warn('Cloud texture unavailable — cloud layer hidden')
    );

    // Fibonacci dot cloud — subtle, low opacity to not obscure imagery
    {
      const N = 7500, dp = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const phi = Math.acos(1 - 2*(i+0.5)/N), th = Math.PI*(1+Math.sqrt(5))*i;
        dp[i*3] = Math.sin(phi)*Math.cos(th); dp[i*3+1] = Math.cos(phi); dp[i*3+2] = Math.sin(phi)*Math.sin(th);
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      globeGroup.add(new THREE.Points(dg, new THREE.PointsMaterial({ color:0x60a5fa, size:0.005, transparent:true, opacity:0.07, sizeAttenuation:true, depthWrite:false })));
    }

    // ── Lat / lon grid ───────────────────────────────────────────────────
    const GS = 80;
    [-60, -30, 0, 30, 60].forEach(lat => {
      const pts = [];
      for (let i = 0; i <= GS; i++) pts.push(latLonToVec3(lat, (i/GS)*360-180, 1.001));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: lat===0 ? 0x1e4080 : 0x0d1f40, transparent:true, opacity: lat===0 ? 0.45 : 0.22,
      })));
    });
    for (let lon = -180; lon < 180; lon += 30) {
      const pts = [];
      for (let i = 0; i <= GS; i++) pts.push(latLonToVec3((i/GS)*180-90, lon, 1.001));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color:0x0d1f40, transparent:true, opacity:0.18 })));
    }

    // ── Atmosphere (Fresnel shader) ──────────────────────────────────────
    const atmVert = `
      varying vec3 vN; varying vec3 vVP;
      void main() {
        vN  = normalize(normalMatrix * normal);
        vVP = (modelViewMatrix * vec4(position,1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`;
    const atmFrag = `
      varying vec3 vN; varying vec3 vVP;
      uniform vec3 col; uniform float pw; uniform float co;
      void main() { float f = pow(max(0.0, co - dot(vN, normalize(-vVP))), pw); gl_FragColor = vec4(col*f, f); }`;
    const addAtm = (r, hex, pw, co, side) => scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: atmVert, fragmentShader: atmFrag,
        uniforms: { col:{value:new THREE.Color(hex)}, pw:{value:pw}, co:{value:co} },
        transparent:true, blending:THREE.AdditiveBlending, depthWrite:false, side,
      })
    ));
    addAtm(1.002, 0x1e6eff, 5.0, 0.60, THREE.FrontSide);  // tight rim glow
    addAtm(1.15,  0x2563eb, 2.8, 0.52, THREE.BackSide);   // mid haze
    addAtm(1.35,  0x1e3a8a, 1.8, 0.44, THREE.BackSide);   // outer corona (smaller radius)

    // ── Background hub arcs ──────────────────────────────────────────────
    const arcGroup  = new THREE.Group();
    globeGroup.add(arcGroup);
    const ARC_SPEED = 1.8;
    const arcStates = [];

    const spawnArc = () => {
      const from = Math.floor(Math.random() * HUBS.length);
      let to; do { to = Math.floor(Math.random() * HUBS.length); } while (to === from);
      const s = latLonToVec3(HUBS[from][0], HUBS[from][1], 1.01);
      const e = latLonToVec3(HUBS[to][0],   HUBS[to][1],   1.01);
      const m = s.clone().add(e).normalize().multiplyScalar(1.35 + Math.random()*0.2);
      const curve = new THREE.QuadraticBezierCurve3(s, m, e);
      const pts   = curve.getPoints(90);
      const geo   = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);
      const mat   = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(0.52+Math.random()*0.12, 1, 0.65),
        transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false,
      });
      const line  = new THREE.Line(geo, mat);
      arcGroup.add(line);
      return { line, geo, mat, total:pts.length, drawn:0, state:'drawing', hold:0 };
    };
    for (let i = 0; i < 7; i++) {
      const a = spawnArc();
      a.drawn = Math.floor(Math.random() * a.total * 0.65);
      a.geo.setDrawRange(0, a.drawn); a.mat.opacity = 0.7;
      arcStates.push(a);
    }

    // ── Interaction state machine ────────────────────────────────────────
    // States: 'auto' | 'drag' | 'coast'
    let intState  = 'auto';
    const vel     = { x: 0 };
    const AUTO    = 0.0004;   // ~1 full revolution per 4 min
    let prevDrag  = { x:0, y:0 };
    let mdPos     = null;
    let wasDrag   = false;
    const THRESH  = 6;

    const mouse   = { nx:0, ny:0 };
    const tiltLag = { x:0, z:0 };

    // ── Post-processing ──────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W,H), 0.55, 0.4, 0.82));

    // ── Animation loop ───────────────────────────────────────────────────
    const animate = ms => {
      raf = requestAnimationFrame(animate);
      const t = ms * 0.001;

      // Rotation state machine
      if (intState === 'auto') {
        vel.x = vel.x * 0.94 + AUTO * 0.06;
        globeGroup.rotation.y += vel.x;
      } else if (intState === 'coast') {
        vel.x *= 0.96;
        globeGroup.rotation.y += vel.x;
        if (Math.abs(vel.x - AUTO) < 0.0003) intState = 'auto';
      }
      // 'drag' state: no automatic rotation

      cloudMesh.rotation.y += 0.00008;

      // Mouse parallax on tiltGroup
      tiltLag.x += (mouse.ny *  0.12 - tiltLag.x) * 0.04;
      tiltLag.z += (mouse.nx * -0.08 - tiltLag.z) * 0.04;
      tiltGroup.rotation.x = tiltLag.x;
      tiltGroup.rotation.z = tiltLag.z;

      // Background arc lifecycle
      arcStates.forEach((arc, i) => {
        if (arc.state === 'drawing') {
          arc.drawn += ARC_SPEED;
          arc.geo.setDrawRange(0, Math.min(arc.total, Math.floor(arc.drawn)));
          arc.mat.opacity = Math.min(0.75, arc.drawn/15);
          if (arc.drawn >= arc.total) { arc.state = 'holding'; arc.hold = 0; }
        } else if (arc.state === 'holding') {
          arc.hold++; if (arc.hold > 80) arc.state = 'fading';
        } else {
          arc.mat.opacity -= 0.014;
          if (arc.mat.opacity <= 0) {
            arcGroup.remove(arc.line); arc.geo.dispose(); arc.mat.dispose();
            arcStates[i] = spawnArc(); arcGroup.add(arcStates[i].line);
          }
        }
      });

      composer.render();
    };
    requestAnimationFrame(animate);

    // ── Mouse / touch handlers ───────────────────────────────────────────
    const onMove = e => {
      mouse.nx = (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.ny = (e.clientY / window.innerHeight) * 2 - 1;

      if (mdPos) {
        const dx = e.clientX - mdPos.x, dy = e.clientY - mdPos.y;
        if (!wasDrag && Math.abs(dx)+Math.abs(dy) > THRESH) wasDrag = true;
        if (wasDrag) {
          vel.x = (e.clientX - prevDrag.x) * 0.006;
          globeGroup.rotation.y += vel.x;
          globeGroup.rotation.x = Math.max(-0.4, Math.min(0.4,
            globeGroup.rotation.x + (e.clientY - prevDrag.y) * 0.004
          ));
          prevDrag = { x: e.clientX, y: e.clientY };
        }
      }

    };

    const onDown = e => {
      mdPos    = { x: e.clientX, y: e.clientY };
      prevDrag = { x: e.clientX, y: e.clientY };
      wasDrag  = false;
      intState = 'drag';
      canvas.style.cursor = 'grabbing';
    };

    const onUp = e => {
      if (!mdPos) return;
      if (wasDrag) {
        intState = 'coast';
        canvas.style.cursor = 'grab';
      }
      mdPos = null;
    };

    const onLeave = () => {
      mouse.nx = 0; mouse.ny = 0;
      if (intState === 'drag') {
        intState = 'coast';
        canvas.style.cursor = 'grab';
      }
    };

    canvas.addEventListener('mousedown',  onDown);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);

    // Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w,h); composer.setSize(w,h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('resize',    onResize);
      canvas.removeEventListener('mousedown',  onDown);
      canvas.removeEventListener('mouseleave', onLeave);
      renderer.dispose();
    };
  });
</script>

<!-- ══ Template ══════════════════════════════════════════════════════════════ -->
<div class="wrap" bind:this={wrap}>
  <canvas bind:this={canvas} style="display:block;width:100%;height:100%;" />

  <!-- Day/night + cloud toggles — bottom-right of globe viewer -->
  <div class="toggle-group">
    <button
      class="toggle-btn"
      class:active={showClouds && isDayView}
      on:click|stopPropagation={toggleClouds}
      aria-label={showClouds ? 'Hide clouds' : 'Show clouds'}
      title={showClouds ? 'Hide clouds' : 'Show clouds'}
    >
      <!-- Cloud icon -->
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>
      </svg>
    </button>

    <button
      class="toggle-btn"
      on:click|stopPropagation={toggleView}
      aria-label={isDayView ? 'Switch to night view' : 'Switch to day view'}
      title={isDayView ? 'Switch to night view' : 'Switch to day view'}
    >
      {#if isDayView}
        <!-- Moon icon -->
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      {:else}
        <!-- Sun icon -->
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      {/if}
    </button>
  </div>

</div>

<!-- ══ Styles ════════════════════════════════════════════════════════════════ -->
<style>
  .wrap {
    position: absolute;
    inset: 0;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    touch-action: pan-y;
  }

  /* ── Toggle button group — bottom-right ── */
  .toggle-group {
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    z-index: 15;
    pointer-events: auto;
  }

  .toggle-btn {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(2, 8, 24, 0.72);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }

  .toggle-btn:hover {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.55);
    color: #fff;
  }

  .toggle-btn.active {
    background: rgba(59, 130, 246, 0.22);
    border-color: rgba(59, 130, 246, 0.6);
    color: #93c5fd;
  }

</style>
