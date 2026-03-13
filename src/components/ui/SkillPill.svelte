<!--
  Props:
    name    — skill label
    context — short description shown on hover tooltip
    delay   — stagger animation delay in ms
-->
<script>
  import { onMount } from 'svelte';

  export let name    = '';
  export let context = '';
  export let delay   = 0;

  let el;

  onMount(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('visible');
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  });
</script>

<span class="pill" bind:this={el} style="--delay: {delay}ms">
  {name}
  {#if context}
    <span class="tooltip">{context}</span>
  {/if}
</span>

<style>
  .pill {
    position: relative;
    display: inline-block;
    font-size: 0.8rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 0.35rem 0.9rem;
    cursor: default;
    opacity: 0;
    transform: translateY(10px);
    transition: color var(--transition), border-color var(--transition),
                background var(--transition);
  }

  .pill.visible {
    animation: pillIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both var(--delay);
  }

  @keyframes pillIn {
    to { opacity: 1; transform: translateY(0); }
  }

  .pill:hover {
    color: var(--accent-light);
    border-color: rgba(59, 130, 246, 0.35);
    background: rgba(59, 130, 246, 0.06);
  }

  /* ── Tooltip ── */
  .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.67rem;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    background: rgba(6, 14, 38, 0.96);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.28rem 0.65rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 10;
  }

  .pill:hover .tooltip {
    opacity: 1;
  }
</style>
