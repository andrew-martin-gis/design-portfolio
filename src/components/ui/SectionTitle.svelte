<script>
  import { onMount } from 'svelte';

  export let label = ''; // e.g. "Selected Work"
  export let title = ''; // e.g. "Projects"

  let el;

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  });
</script>

<div class="section-title" bind:this={el}>
  {#if label}
    <span class="label">{label}</span>
  {/if}
  <h2>{title}</h2>
  <div class="rule"></div>
</div>

<style>
  .section-title {
    margin-bottom: clamp(1.5rem, 3vw, 2.5rem);
    text-align: center;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s ease, transform 0.7s ease;
  }

  .section-title.visible {
    opacity: 1;
    transform: none;
  }

  .label {
    display: block;
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--accent-light);
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: clamp(2rem, 4vw, 3.25rem);
    font-weight: 200;
    color: var(--text-primary);
    letter-spacing: 0.02em;
  }

  .rule {
    width: 40px;
    height: 1px;
    background: var(--accent);
    margin-top: 1.25rem;
    margin-inline: auto;
    transition: width 0.6s ease 0.4s;
  }

  .section-title.visible .rule {
    width: 80px;
  }
</style>
