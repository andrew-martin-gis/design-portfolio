<!--
  Custom cursor: fast dot + lagged ring.
  Only activates on fine-pointer (mouse) devices.
  Respects prefers-reduced-motion by not activating.
-->
<script>
  import { onMount } from 'svelte';

  let dot, ring;

  onMount(() => {
    // Skip on touch / reduced-motion
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('cursor-active');

    let x = -300, y = -300;
    let lx = -300, ly = -300;
    let raf;

    const onMove = (e) => { x = e.clientX; y = e.clientY; };
    document.addEventListener('mousemove', onMove);

    // Hover state via event delegation
    document.addEventListener('mouseover', (e) => {
      const isHover = !!e.target.closest('a, button, [role="button"], .pill, label');
      ring.classList.toggle('hover', isHover);
    });

    const tick = () => {
      lx += (x - lx) * 0.1;
      ly += (y - ly) * 0.1;
      dot.style.transform  = `translate(${x}px,  ${y}px)`;
      ring.style.transform = `translate(${lx}px, ${ly}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove('cursor-active');
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="cursor-dot"  bind:this={dot}  aria-hidden="true"></div>
<div class="cursor-ring" bind:this={ring} aria-hidden="true"></div>

<style>
  .cursor-dot,
  .cursor-ring {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 9999;
    will-change: transform;
    border-radius: 50%;
  }

  /* Small, fast dot — centered by negative margin */
  .cursor-dot {
    width: 6px;
    height: 6px;
    background: var(--accent-light);
    margin: -3px 0 0 -3px;
  }

  /* Lagged ring */
  .cursor-ring {
    width: 32px;
    height: 32px;
    border: 1px solid rgba(96, 165, 250, 0.45);
    margin: -16px 0 0 -16px;
    transition:
      width        0.22s ease,
      height       0.22s ease,
      margin       0.22s ease,
      border-color 0.22s ease,
      background   0.22s ease;
  }

  /* Hover: ring expands and brightens */
  .cursor-ring.hover {
    width: 48px;
    height: 48px;
    margin: -24px 0 0 -24px;
    border-color: rgba(96, 165, 250, 0.75);
    background: rgba(59, 130, 246, 0.08);
  }
</style>
