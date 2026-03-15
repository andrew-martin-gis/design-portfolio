<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { GozioApp } from '../data/gozioApps';
  import { activeAppIndex } from '../stores/carouselStore';

  export let apps: GozioApp[];

  $: currentApp = apps[$activeAppIndex];

  let dialog: HTMLDialogElement;
  let lightboxSrc = '';
  let lightboxAlt = '';
  let lightboxIndex = 0;

  /* ── Screenshot grid height management ── */
  let gridHeight = 0;

  function openLightbox(src: string, alt: string, index: number) {
    lightboxIndex = index;
    lightboxSrc = src;
    lightboxAlt = alt;
    dialog.showModal();
  }

  function closeLightbox() {
    dialog.close();
  }

  function lightboxPrev() {
    lightboxIndex = (lightboxIndex - 1 + currentApp.images.length) % currentApp.images.length;
    lightboxSrc = currentApp.images[lightboxIndex];
    lightboxAlt = `${currentApp.name} screenshot ${lightboxIndex + 1}`;
  }

  function lightboxNext() {
    lightboxIndex = (lightboxIndex + 1) % currentApp.images.length;
    lightboxSrc = currentApp.images[lightboxIndex];
    lightboxAlt = `${currentApp.name} screenshot ${lightboxIndex + 1}`;
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === dialog) closeLightbox();
  }

  function onKeydown(e: KeyboardEvent) {
    if (!dialog || !dialog.open) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { e.preventDefault(); lightboxPrev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); lightboxNext(); }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="screenshots-wrap" style="min-height: {gridHeight ? gridHeight + 'px' : 'auto'}">
  {#key $activeAppIndex}
    <div
      class="screenshot-grid"
      bind:clientHeight={gridHeight}
      in:fly={{ x: 40, duration: 300, delay: 100 }}
      out:fade={{ duration: 150 }}
    >
      {#each currentApp.images as src, i}
        <button
          class="screenshot-btn"
          on:click={() => openLightbox(src, `${currentApp.name} screenshot ${i + 1}`, i)}
          aria-label="View {currentApp.name} screenshot {i + 1} full size"
        >
          <img
            {src}
            alt="{currentApp.name} screenshot {i + 1}"
            class="screenshot-img"
            loading="lazy"
          />
        </button>
      {/each}
    </div>
  {/key}
</div>

<!-- Lightbox dialog -->
<dialog
  bind:this={dialog}
  class="lightbox"
  on:click={onBackdropClick}
  aria-label="Screenshot lightbox"
>
  <div class="lightbox-content">
    <button class="lightbox-close" on:click={closeLightbox} aria-label="Close lightbox">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <button class="lightbox-arrow lightbox-arrow-left" on:click|stopPropagation={lightboxPrev} aria-label="Previous screenshot">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4L6 10l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    {#key lightboxIndex}
      <img
        src={lightboxSrc}
        alt={lightboxAlt}
        class="lightbox-img"
        in:fade={{ duration: 200 }}
      />
    {/key}

    <button class="lightbox-arrow lightbox-arrow-right" on:click|stopPropagation={lightboxNext} aria-label="Next screenshot">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</dialog>

<style>
  .screenshots-wrap {
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .screenshot-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(0.75rem, 2vw, 1.25rem);
    align-items: start;
  }

  @media (max-width: 600px) {
    .screenshot-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* ── Screenshot button / image ── */
  .screenshot-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: zoom-in;
    border-radius: 12px;
    overflow: hidden;
  }

  .screenshot-img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  @media (prefers-reduced-motion: no-preference) {
    .screenshot-btn {
      transition: transform 300ms ease;
    }
    .screenshot-btn:hover .screenshot-img {
      transform: perspective(800px) rotateY(3deg) scale(1.02);
      transition: transform 300ms ease;
    }
  }

  /* ── Lightbox ── */
  .lightbox {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    outline: none;
  }

  .lightbox:not([open]) {
    display: none;
  }

  .lightbox[open] {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lightbox::backdrop {
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
  }

  .lightbox-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }

  .lightbox-img {
    display: block;
    max-width: min(80vw, 500px);
    max-height: 85vh;
    width: auto;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 8px 60px rgba(0, 0, 0, 0.7);
  }

  .lightbox-close {
    position: fixed;
    top: 1.25rem;
    right: 1.25rem;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 10;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: no-preference) {
    .lightbox-close {
      transition: background 0.2s, color 0.2s;
    }
  }

  .lightbox-close:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  /* ── Lightbox navigation arrows ── */
  .lightbox-arrow {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(2, 8, 24, 0.65);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    flex-shrink: 0;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: no-preference) {
    .lightbox-arrow {
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
  }

  .lightbox-arrow:hover {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.55);
    color: #fff;
  }
</style>
