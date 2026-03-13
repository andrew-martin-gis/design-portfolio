<script>
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
  import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

  let canvas;

  // Major cities used as arc endpoints
  const HUBS = [
    [ 40.71, -74.01],  // New York
    [ 51.51,  -0.13],  // London
    [ 35.69, 139.69],  // Tokyo
    [-33.87, 151.21],  // Sydney
    [ 19.08,  72.88],  // Mumbai
    [-23.55, -46.63],  // São Paulo
    [  1.35, 103.82],  // Singapore
    [ 55.75,  37.62],  // Moscow
    [ 34.05,-118.24],  // Los Angeles
    [ -1.29,  36.82],  // Nairobi
    [ 48.85,   2.35],  // Paris
    [ 39.91, 116.39],  // Beijing
  ];

  function latLonToVec3(lat, lon, r = 1) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  onMount(() => {
    let raf;
    const W = window.innerWidth, H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ── Scene & Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(0, 0, 2.8);

    // ── Controls ──────────────────────────────────────────────────────────────
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.04;
    controls.enableZoom       = false;
    controls.enablePan        = false;
    controls.autoRotate       = true;
    controls.autoRotateSpeed  = 0.35;
    controls.minPolarAngle    = Math.PI * 0.15;
    controls.maxPolarAngle    = Math.PI * 0.85;

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r     = 60 + Math.random() * 40;
      const phi   = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.1, transparent: true, opacity: 0.6, sizeAttenuation: true,
    })));

    // ── Globe group (dots + markers + arcs all rotate together) ───────────────
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Dark inner sphere — gives the dots depth
    globeGroup.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.998, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x020818 })
    ));

    // Dot cloud — Fibonacci sphere distribution
    const N       = 7500;
    const dotPos  = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      dotPos[i * 3]     = Math.sin(phi) * Math.cos(theta);
      dotPos[i * 3 + 1] = Math.cos(phi);
      dotPos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPos, 3));
    globeGroup.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
      color: 0x1d4ed8, size: 0.009, transparent: true, opacity: 1.0, sizeAttenuation: true,
    })));

    // ── Atmosphere — Fresnel shader ───────────────────────────────────────────
    const atmVert = `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal  = normalize(normalMatrix * normal);
        vViewPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const atmFrag = `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      uniform vec3  color;
      uniform float power;
      uniform float coeff;
      void main() {
        float f = pow(coeff - dot(vNormal, normalize(-vViewPos)), power);
        gl_FragColor = vec4(color * f, f);
      }
    `;
    const addAtm = (radius, hex, power, coeff, side) => {
      scene.add(new THREE.Mesh(
        new THREE.SphereGeometry(radius, 64, 64),
        new THREE.ShaderMaterial({
          vertexShader: atmVert, fragmentShader: atmFrag,
          uniforms: {
            color:  { value: new THREE.Color(hex) },
            power:  { value: power },
            coeff:  { value: coeff },
          },
          transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, side,
        })
      ));
    };
    addAtm(1.002, 0x1e6eff, 4.0, 0.65, THREE.FrontSide);  // tight rim glow
    addAtm(1.28,  0x3b82f6, 2.2, 0.58, THREE.BackSide);   // mid halo
    addAtm(1.55,  0x1e40af, 1.4, 0.50, THREE.BackSide);   // wide soft halo

    // ── Hub markers — pulsing spheres ─────────────────────────────────────────
    const markerGeo = new THREE.SphereGeometry(0.013, 8, 8);
    const markerData = HUBS.map(([lat, lon]) => {
      const mat  = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true });
      const mesh = new THREE.Mesh(markerGeo, mat);
      mesh.position.copy(latLonToVec3(lat, lon, 1.012));
      globeGroup.add(mesh);
      return { mesh, phase: Math.random() * Math.PI * 2 };
    });

    // ── Arcs ──────────────────────────────────────────────────────────────────
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    const ARC_SPEED = 1.8;
    const arcStates = [];

    function createArc(fromIdx, toIdx) {
      const start = latLonToVec3(HUBS[fromIdx][0], HUBS[fromIdx][1], 1.012);
      const end   = latLonToVec3(HUBS[toIdx][0],   HUBS[toIdx][1],   1.012);
      // Control point lifted above the surface
      const mid   = start.clone().add(end).normalize()
                         .multiplyScalar(1.35 + Math.random() * 0.2);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const pts   = curve.getPoints(90);
      const geo   = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);

      // Random hue in the cyan–blue band
      const hue = 0.52 + Math.random() * 0.12;
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(hue, 1.0, 0.72),
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });

      const line = new THREE.Line(geo, mat);
      arcGroup.add(line);
      return { line, geo, mat, total: pts.length, drawn: 0, state: 'drawing', hold: 0 };
    }

    function spawnArc() {
      const from = Math.floor(Math.random() * HUBS.length);
      let to;
      do { to = Math.floor(Math.random() * HUBS.length); } while (to === from);
      return createArc(from, to);
    }

    // Stagger 7 initial arcs so the screen isn't empty on load
    for (let i = 0; i < 7; i++) {
      const arc = spawnArc();
      arc.drawn = Math.floor(Math.random() * arc.total * 0.65);
      arc.geo.setDrawRange(0, arc.drawn);
      arc.mat.opacity = 0.75;
      arcStates.push(arc);
    }

    // ── Post-processing — bloom ───────────────────────────────────────────────
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(W, H),
      0.85,  // strength
      0.55,  // radius
      0.12   // threshold — bright enough for arcs and markers to bloom
    ));

    // ── Animation loop ────────────────────────────────────────────────────────
    let lastT = 0;
    const animate = (ms) => {
      raf = requestAnimationFrame(animate);
      const t  = ms * 0.001;
      lastT    = t;
      controls.update();

      // Pulse markers
      markerData.forEach(({ mesh, phase }) => {
        const s = 1 + 0.5 * Math.sin(t * 1.8 + phase);
        mesh.scale.setScalar(s);
        mesh.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.8 + phase));
      });

      // Animate arcs lifecycle
      arcStates.forEach((arc, i) => {
        if (arc.state === 'drawing') {
          arc.drawn += ARC_SPEED;
          arc.geo.setDrawRange(0, Math.min(arc.total, Math.floor(arc.drawn)));
          arc.mat.opacity = Math.min(0.85, arc.drawn / 15);
          if (arc.drawn >= arc.total) { arc.state = 'holding'; arc.hold = 0; }

        } else if (arc.state === 'holding') {
          arc.hold++;
          if (arc.hold > 80) arc.state = 'fading';

        } else { // fading
          arc.mat.opacity -= 0.014;
          if (arc.mat.opacity <= 0) {
            arcGroup.remove(arc.line);
            arc.geo.dispose();
            arc.mat.dispose();
            arcStates[i] = spawnArc();
            arcGroup.add(arcStates[i].line);
          }
        }
      });

      composer.render();
    };
    requestAnimationFrame(animate);

    // Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
    };
  });
</script>

<canvas bind:this={canvas} style="display:block;width:100%;height:100%;" />
