<!--
  Animated stat counter — counts up from 0 when it enters the viewport.
  Props:
    value    — target integer
    prefix   — string prepended to number (e.g. '~')
    suffix   — string appended to number   (e.g. '+')
    label    — description below the number
    duration — animation length in ms (default 1800)
    comma    — whether to format with locale commas (default false)
-->
<script>
  import { onMount } from 'svelte';

  export let value    = 0;
  export let prefix   = '';
  export let suffix   = '';
  export let label    = '';
  export let duration = 1800;
  export let comma    = false;

  let displayed = 0;
  let el;

  onMount(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t      = Math.min((now - start) / duration, 1);
        const eased  = 1 - Math.pow(1 - t, 3); // easeOutCubic
        displayed    = Math.round(eased * value);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  });

  $: formatted = comma ? displayed.toLocaleString() : String(displayed);
</script>

<div class="stat" bind:this={el}>
  <span class="stat-num">{prefix}{formatted}{suffix}</span>
  <span class="stat-label">{label}</span>
</div>

<style>
  .stat { text-align: right; }

  .stat-num {
    display: block;
    font-size: 2.5rem;
    font-weight: 200;
    color: var(--text-primary);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 0.3rem;
    display: block;
  }

  @media (max-width: 640px) {
    .stat { text-align: left; }
  }
</style>
