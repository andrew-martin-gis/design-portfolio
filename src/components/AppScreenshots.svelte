<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { GozioApp } from '../data/gozioApps';
  import { activeAppIndex } from '../stores/carouselStore';

  export let apps: GozioApp[];

  $: currentApp = apps[$activeAppIndex];

  let dialog: HTMLDialogElement;
  let lightboxSrc = '';
  let lightboxAlt = '';

  function openLightbox(src: string, alt: string) {
    lightboxSrc = src;
    lightboxAlt = alt;
    dialog.showModal();
  }

  function closeLightbox() {
    dialog.close();
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === dialog) closeLightbox();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeLightbox();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="screenshots-wrap">
  {#key $activeAppIndex}
    <div class="screenshot-grid" in:fade={{ duration: 250 }}>
      {#each currentApp.images as src, i}
        <button
          class="screenshot-btn"
          on:click={() => openLightbox(src, `${currentApp.name} screenshot ${i + 1}`)}
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
  <button class="lightbox-close" on:click={closeLightbox} aria-label="Close lightbox">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
  <img src={lightboxSrc} alt={lightboxAlt} class="lightbox-img" />
</dialog>

<style>
  .screenshots-wrap {
    width: 100%;
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
    background: transparent;
    border: none;
    padding: 0;
    max-width: 90vw;
    max-height: 90vh;
    outline: none;
  }

  .lightbox::backdrop {
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(6px);
  }

  .lightbox-img {
    display: block;
    max-width: 90vw;
    max-height: 88vh;
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
    z-index: 10;
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
</style>
