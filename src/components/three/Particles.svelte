<!--
  Ambient 2D particle field — mouse-reactive.
  Props:
    count   — number of particles (default 55)
    color   — hex colour string  (default '#3b82f6')
    opacity — max alpha          (default 0.35)
    attract — mouse attraction strength 0..1 (default 0.06)
-->
<script>
  import { onMount } from 'svelte';

  export let count   = 55;
  export let color   = '#3b82f6';
  export let opacity = 0.35;
  export let attract = 0.06;

  let canvas;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;

    const toRgba = (hex, a) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    // Mouse position (normalised to canvas coords)
    const mouse = { x: W / 2, y: H / 2, active: false };

    const onMouseMove = e => {
      const rect   = canvas.getBoundingClientRect();
      mouse.x      = e.clientX - rect.left;
      mouse.y      = e.clientY - rect.top;
      mouse.active = true;
    };
    const onMouseLeave = () => { mouse.active = false; };
    canvas.parentElement?.addEventListener('mousemove',  onMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousemove', onMouseMove);

    // Initialise particles
    const particles = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  0.8 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      a:  0.05 + Math.random() * opacity,
    }));

    let raf;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        // Attract toward mouse when active
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          // Attract gently from distance, repel when very close
          const force = dist < 80 ? -attract * 1.5 : attract * 0.4;
          p.vx += (dx / dist) * force * 0.04;
          p.vy += (dy / dist) * force * 0.04;
        }

        // Speed cap + damping
        const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (spd > 0.8) { p.vx *= 0.8/spd; p.vy *= 0.8/spd; }
        p.vx *= 0.99; p.vy *= 0.99;

        // Drift toward base velocity if mouse not active
        if (!mouse.active) {
          p.vx += (Math.random() - 0.5) * 0.005;
          p.vy += (Math.random() - 0.5) * 0.005;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -5)  p.x = W + 5;
        if (p.x > W+5) p.x = -5;
        if (p.y < -5)  p.y = H + 5;
        if (p.y > H+5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = toRgba(color, p.a);
        ctx.fill();
      }
    };

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    };

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true" />

<style>
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
