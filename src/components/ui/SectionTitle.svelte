<script>
  import { onMount } from 'svelte';

  export let label = ''; // e.g. "Selected Work"
  export let title = ''; // e.g. "Projects"

  let el;
  let hydrated = false;
  let visible  = false;

  onMount(() => {
    // Mark as hydrated so CSS hides element for the reveal animation
    hydrated = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  });
</script>

<div
  class="section-title"
  class:hydrated
  class:visible
  bind:this={el}
>
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <div class="title-row">
    <span class="line line-left"></span>
    <h2>{title}</h2>
    <span class="line line-right"></span>
  </div>
</div>

<style>
  /* Default: fully visible (SSR / no-JS fallback) */
  .section-title {
    margin-bottom: clamp(2rem, 4vw, 3rem);
    text-align: center;
  }

  /* Once JS hydrates, hide for the scroll-reveal animation */
  .section-title.hydrated {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  /* Reveal when IntersectionObserver fires */
  .section-title.visible {
    opacity: 1;
    transform: none;
  }

  .label {
    display: block;
    font-size: 0.65rem;
    font-weight: 400;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--accent-light);
    margin-bottom: 0.6rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(1rem, 2vw, 1.75rem);
  }

  h2 {
    font-size: clamp(1.6rem, 3.5vw, 2.5rem);
    font-weight: 200;
    color: var(--text-primary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .line {
    display: block;
    height: 1px;
    flex: 1;
    max-width: 120px;
    transition: max-width 0.6s ease 0.3s, opacity 0.6s ease 0.3s;
    opacity: 0;
  }

  .line-left {
    background: linear-gradient(to right, transparent, var(--accent));
  }

  .line-right {
    background: linear-gradient(to left, transparent, var(--accent));
  }

  .section-title.visible .line {
    max-width: 120px;
    opacity: 1;
  }

  @media (max-width: 600px) {
    .line {
      max-width: 60px;
    }
    .section-title.visible .line {
      max-width: 60px;
    }
  }
</style>
