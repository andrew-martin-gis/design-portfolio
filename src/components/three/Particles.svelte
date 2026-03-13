<!--
  Ambient 2D particle field — lightweight canvas overlay for section backgrounds.
  Props:
    count   — number of particles (default 60)
    color   — particle colour (default accent blue)
    opacity — max opacity (default 0.35)
-->
<script>
  import { onMount } from 'svelte';

  export let count   = 60;
  export let color   = '#3b82f6';
  export let opacity = 0.35;

  let canvas;
  let raf;

  onMount(() => {
    const ctx  = canvas.getContext('2d');
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;

    // Parse colour to rgba
    const toRgba = (hex, a) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    // Initialise particles
    const particles = Array.from({ length: count }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      r:    1 + Math.random() * 2,
      vx:   (Math.random() - 0.5) * 0.18,
      vy:   (Math.random() - 0.5) * 0.18,
      a:    Math.random() * opacity,
    }));

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0)  p.x = W;
        if (p.x > W)  p.x = 0;
        if (p.y < 0)  p.y = H;
        if (p.y > H)  p.y = 0;

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
