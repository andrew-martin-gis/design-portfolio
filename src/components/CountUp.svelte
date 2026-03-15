<script lang="ts">
  import { onMount } from 'svelte';

  export let target: number;
  export let suffix: string = '';
  export let duration: number = 2000;

  let display = 0;
  let el: HTMLElement;

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  });

  function animate() {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      display = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
</script>

<span bind:this={el} class="countup">
  {display.toLocaleString()}{suffix}
</span>

<style>
  .countup {
    font-family: var(--font);
    font-variant-numeric: tabular-nums;
  }
</style>
