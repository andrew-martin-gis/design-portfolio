<script>
  import { onMount }   from 'svelte';
  import { fly }       from 'svelte/transition';
  import { cubicOut }  from 'svelte/easing';
  import * as THREE    from 'three';
  import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
  import { projects } from '../../data/projects.js';

  let wrap;
  let canvas;

  // Reactive UI state
  let activeProject  = null;
  let hoveredProject = null;
  let hoverPos       = { x: 0, y: 0 };

  // Bridge to close panel from template button
  let doClose = () => {};

  const base = import.meta.env.BASE_URL;

  // Projects with geographic coordinates
  const locatedProjects = projects.filter(p => p.location);

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

    // Inner sphere — night earth texture, dark fallback while loading
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x020818 });
    new THREE.TextureLoader().load(
      `${base}2k_earth_nightmap.jpg`,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map   = tex;
        earthMat.color.set(0xffffff);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => console.warn('Night earth texture unavailable — using fallback colour')
    );
    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.998, 64, 64),
      earthMat
    ));

    // ── Cloud layer ──────────────────────────────────────────────────────
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
    globeGroup.add(cloudMesh);

    new THREE.TextureLoader().load(
      `${base}8k_earth_clouds.jpg`,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        cloudMat.alphaMap = tex;
        cloudMat.opacity  = 1;
        cloudMat.needsUpdate = true;
      },
      undefined,
      () => console.warn('Cloud texture unavailable — cloud layer hidden')
    );

    // Fibonacci dot cloud
    {
      const N = 7500, dp = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const phi = Math.acos(1 - 2*(i+0.5)/N), th = Math.PI*(1+Math.sqrt(5))*i;
        dp[i*3] = Math.sin(phi)*Math.cos(th); dp[i*3+1] = Math.cos(phi); dp[i*3+2] = Math.sin(phi)*Math.sin(th);
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      globeGroup.add(new THREE.Points(dg, new THREE.PointsMaterial({ color:0x60a5fa, size:0.007, transparent:true, opacity:0.22, sizeAttenuation:true, depthWrite:false })));
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

    // ── Project markers ──────────────────────────────────────────────────
    const raycaster    = new THREE.Raycaster();
    const markerMeshes = [];
    const markerData   = [];
    const dotGeoM      = new THREE.SphereGeometry(0.022, 12, 12);
    const ringGeoM     = new THREE.TorusGeometry(0.038, 0.004, 8, 32);

    locatedProjects.forEach(project => {
      const pos = latLonToVec3(project.location.lat, project.location.lon, 1.015);

      const dot = new THREE.Mesh(dotGeoM, new THREE.MeshBasicMaterial({ color:0x38bdf8, transparent:true }));
      dot.position.copy(pos);
      dot.userData = { project };
      globeGroup.add(dot);
      markerMeshes.push(dot);

      const makeRing = (col, opa) => {
        const r = new THREE.Mesh(ringGeoM, new THREE.MeshBasicMaterial({
          color:col, transparent:true, opacity:opa, blending:THREE.AdditiveBlending, depthWrite:false,
        }));
        r.position.copy(pos);
        r.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), pos.clone().normalize());
        globeGroup.add(r);
        return r;
      };

      markerData.push({ dot, ring:makeRing(0x38bdf8,0.6), ring2:makeRing(0x60a5fa,0.4), project, phase:Math.random()*Math.PI*2 });
    });

    // ── Interaction state machine ────────────────────────────────────────
    // States: 'auto' | 'drag' | 'coast' | 'spinning'
    let intState  = 'auto';
    const vel     = { x: 0 };
    const AUTO    = 0.0004;   // ~1 full revolution per 4 min
    let spinTgt   = null;
    let prevDrag  = { x:0, y:0 };
    let mdPos     = null;
    let wasDrag   = false;
    const THRESH  = 6;

    const mouse   = { nx:0, ny:0 };
    const tiltLag = { x:0, z:0 };

    // ── Post-processing ──────────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W,H), 0.55, 0.4, 0.28));

    // Screen-space helpers
    const worldToScreen = mesh => {
      const wp = new THREE.Vector3();
      mesh.getWorldPosition(wp);
      wp.project(camera);
      return { x:(wp.x+1)/2*canvas.offsetWidth, y:(-wp.y+1)/2*canvas.offsetHeight };
    };
    const ndcFromEvent = e => {
      const r = canvas.getBoundingClientRect();
      return { x:((e.clientX-r.left)/r.width)*2-1, y:-((e.clientY-r.top)/r.height)*2+1 };
    };

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
      } else if (intState === 'spinning' && spinTgt !== null) {
        const diff = spinTgt - globeGroup.rotation.y;
        globeGroup.rotation.y += diff * 0.055;
        if (Math.abs(diff) < 0.008) { globeGroup.rotation.y = spinTgt; spinTgt = null; intState = 'auto'; }
      }

      cloudMesh.rotation.y += 0.00008;

      // Mouse parallax on tiltGroup
      tiltLag.x += (mouse.ny *  0.12 - tiltLag.x) * 0.04;
      tiltLag.z += (mouse.nx * -0.08 - tiltLag.z) * 0.04;
      tiltGroup.rotation.x = tiltLag.x;
      tiltGroup.rotation.z = tiltLag.z;

      // Marker pulse
      markerData.forEach(({ dot, ring, ring2, phase }) => {
        const p1 = (t*1.2 + phase) % (Math.PI*2);
        const p2 = (t*1.2 + phase + Math.PI) % (Math.PI*2);
        const s1 = 1 + ((Math.sin(p1)+1)/2)*1.2;
        ring.scale.setScalar(s1);
        ring.material.opacity = 0.55*(1-(s1-1)/1.2);
        const s2 = 1 + ((Math.sin(p2)+1)/2)*1.2;
        ring2.scale.setScalar(s2);
        ring2.material.opacity = 0.35*(1-(s2-1)/1.2);
        dot.material.opacity = 0.7 + 0.3*Math.sin(t*2+phase);
      });

      // Keep hover label glued to spinning marker
      if (hoveredProject) {
        const m = markerData.find(d => d.project.slug === hoveredProject.slug);
        if (m) hoverPos = worldToScreen(m.dot);
      }

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

    // ── Project selection ────────────────────────────────────────────────
    const selectProject = project => {
      activeProject  = project;
      hoveredProject = null;
      canvas.style.cursor = 'default';
      const pos   = latLonToVec3(project.location.lat, project.location.lon, 1);
      const rawY  = Math.atan2(-pos.x, pos.z);
      const curr  = globeGroup.rotation.y;
      let delta   = ((rawY - curr) % (Math.PI*2));
      if (delta >  Math.PI) delta -= Math.PI*2;
      if (delta < -Math.PI) delta += Math.PI*2;
      spinTgt  = curr + delta;
      intState = 'spinning';
    };

    const closePanel = () => {
      activeProject = null;
      intState = 'auto';
      canvas.style.cursor = 'grab';
    };
    doClose = closePanel; // expose to template

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

      // Hover raycasting (only when idle)
      if (!wasDrag && !activeProject) {
        raycaster.setFromCamera(ndcFromEvent(e), camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length) {
          const proj = hits[0].object.userData.project;
          if (!hoveredProject || hoveredProject.slug !== proj.slug) {
            hoveredProject = proj;
            hoverPos = worldToScreen(hits[0].object);
          }
          canvas.style.cursor = 'pointer';
        } else {
          hoveredProject = null;
          canvas.style.cursor = 'grab';
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
      if (!wasDrag) {
        raycaster.setFromCamera(ndcFromEvent(e), camera);
        const hits = raycaster.intersectObjects(markerMeshes);
        if (hits.length) {
          selectProject(hits[0].object.userData.project);
        } else if (activeProject) {
          closePanel();
        }
      } else {
        intState = 'coast';
        canvas.style.cursor = 'grab';
      }
      mdPos = null;
    };

    const onLeave = () => {
      mouse.nx = 0; mouse.ny = 0;
      hoveredProject = null;
      if (intState === 'drag') { intState = 'coast'; canvas.style.cursor = 'grab'; }
    };

    // Touch passthrough
    const onTStart = e => { const t = e.touches[0]; onDown({clientX:t.clientX,clientY:t.clientY}); };
    const onTMove  = e => { const t = e.touches[0]; onMove({clientX:t.clientX,clientY:t.clientY}); e.preventDefault(); };
    const onTEnd   = e => { const t = e.changedTouches[0]; onUp({clientX:t.clientX,clientY:t.clientY}); };

    canvas.addEventListener('mousedown',  onDown);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('touchstart', onTStart, { passive:false });
    canvas.addEventListener('touchmove',  onTMove,  { passive:false });
    canvas.addEventListener('touchend',   onTEnd);
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
      canvas.removeEventListener('touchstart', onTStart);
      canvas.removeEventListener('touchmove',  onTMove);
      canvas.removeEventListener('touchend',   onTEnd);
      renderer.dispose();
    };
  });
</script>

<!-- ══ Template ══════════════════════════════════════════════════════════════ -->
<div class="wrap" bind:this={wrap}>
  <canvas bind:this={canvas} style="display:block;width:100%;height:100%;" />

  <!-- Hover tooltip -->
  {#if hoveredProject && !activeProject}
    <div class="hover-tag" style="left:{hoverPos.x}px;top:{hoverPos.y}px;">
      {hoveredProject.location.label}
    </div>
  {/if}

  <!-- Project info panel -->
  {#if activeProject}
    <aside
      class="info-panel"
      in:fly={{ x:72, duration:420, easing:cubicOut }}
      out:fly={{ x:72, duration:280, easing:cubicOut }}
      role="complementary"
      aria-label="Project details"
    >
      <button class="close-btn" on:click={doClose} aria-label="Close panel">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>

      <span class="panel-loc">{activeProject.location.label}</span>
      <h3 class="panel-title">{activeProject.title}</h3>
      <p class="panel-desc">{activeProject.description}</p>

      <ul class="panel-tags">
        {#each activeProject.tags as tag}<li>{tag}</li>{/each}
      </ul>

      <a href="{base}projects/{activeProject.slug}" class="panel-link">
        View project
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </aside>
  {/if}
</div>

<!-- ══ Styles ════════════════════════════════════════════════════════════════ -->
<style>
  .wrap {
    position: absolute;
    inset: 0;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Hover tooltip ── */
  .hover-tag {
    position: absolute;
    transform: translate(-50%, calc(-100% - 14px));
    background: rgba(2, 8, 24, 0.9);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 4px;
    padding: 0.3rem 0.75rem;
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    color: #7dd3fc;
    white-space: nowrap;
    pointer-events: none;
    backdrop-filter: blur(8px);
  }
  .hover-tag::after {
    content: '';
    position: absolute;
    top: 100%; left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(56, 189, 248, 0.35);
  }

  /* ── Info panel ── */
  .info-panel {
    position: absolute;
    top: 50%;
    right: clamp(1.5rem, 4vw, 3.5rem);
    transform: translateY(-50%);
    width: min(380px, calc(100vw - 3rem));
    background: rgba(2, 8, 24, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(59, 130, 246, 0.22);
    border-left: 2px solid #3b82f6;
    border-radius: 10px;
    padding: 2rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    z-index: 10;
  }

  .close-btn {
    position: absolute;
    top: 0.9rem; right: 0.9rem;
    width: 28px; height: 28px;
    display: grid; place-items: center;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.45);
    transition: background 0.2s, color 0.2s;
  }
  .close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

  .panel-loc {
    font-size: 0.67rem;
    font-weight: 400;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #60a5fa;
  }
  .panel-title {
    font-size: 1.08rem;
    font-weight: 300;
    color: #f0f6ff;
    line-height: 1.3;
    padding-right: 1.5rem;
  }
  .panel-desc {
    font-size: 0.82rem;
    font-weight: 300;
    line-height: 1.65;
    color: #94a3b8;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .panel-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
  }
  .panel-tags li {
    font-size: 0.67rem;
    letter-spacing: 0.06em;
    color: rgba(255,255,255,0.38);
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 3px;
    padding: 0.2rem 0.5rem;
  }
  .panel-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.4rem;
    font-size: 0.74rem;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #60a5fa;
    transition: letter-spacing 0.2s;
  }
  .panel-link:hover { letter-spacing: 0.18em; }
</style>
