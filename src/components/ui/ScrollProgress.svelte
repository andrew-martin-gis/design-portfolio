<!--
  Thin gradient bar at the top of the viewport that tracks scroll depth.
-->
<script>
  import { onMount } from 'svelte';

  let bar;

  onMount(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(window.scrollY / max * 100, 100) : 0;
      bar.style.width = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  });
</script>

<div class="track" aria-hidden="true">
  <div class="bar" bind:this={bar}></div>
</div>

<style>
  .track {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    z-index: 201;
    background: transparent;
  }

  .bar {
    height: 100%;
    width: 0%;
    background: linear-gradient(to right, var(--accent), var(--accent-light), var(--cyan));
    box-shadow: 0 0 10px var(--accent-glow);
    transition: width 0.12s ease;
  }
</style>
