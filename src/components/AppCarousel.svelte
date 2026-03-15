<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GozioApp } from '../data/gozioApps';
  import { activeAppIndex } from '../stores/carouselStore';

  export let apps: GozioApp[];

  // Derive the 5-slot window indices (infinite wrap)
  $: total = apps.length;
  $: wrap = (i: number) => ((i % total) + total) % total;

  $: farLeft  = wrap($activeAppIndex - 2);
  $: left     = wrap($activeAppIndex - 1);
  $: center   = $activeAppIndex;
  $: right    = wrap($activeAppIndex + 1);
  $: farRight = wrap($activeAppIndex + 2);

  $: slots = [
    { idx: farLeft,  role: 'far-left'  },
    { idx: left,     role: 'left'      },
    { idx: center,   role: 'center'    },
    { idx: right,    role: 'right'     },
    { idx: farRight, role: 'far-right' },
  ];

  /* ── Auto-rotation ── */
  const DEFAULT_INTERVAL = 10_000;
  const USER_INTERVAL    = 30_000;

  let autoInterval = DEFAULT_INTERVAL;
  let timer: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;
  let rafId: number;
  let ringEl: SVGCircleElement;

  const CIRCUMFERENCE = 2 * Math.PI * 8; // r = 8

  function startAutoRotate() {
    stopAutoRotate();
    startTime = performance.now();
    timer = setInterval(() => {
      activeAppIndex.update(i => wrap(i + 1));
      // After one bumped cycle, revert to default
      if (autoInterval !== DEFAULT_INTERVAL) {
        autoInterval = DEFAULT_INTERVAL;
        startAutoRotate();
      } else {
        startTime = performance.now();
      }
    }, autoInterval);
    tickRing();
  }

  function stopAutoRotate() {
    if (timer !== null) { clearInterval(timer); timer = null; }
    if (rafId) cancelAnimationFrame(rafId);
  }

  function tickRing() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / autoInterval, 1);
    if (ringEl) {
      ringEl.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    }
    rafId = requestAnimationFrame(tickRing);
  }

  function bumpInterval() {
    autoInterval = USER_INTERVAL;
    startAutoRotate();
  }

  onMount(() => startAutoRotate());
  onDestroy(() => stopAutoRotate());

  /* ── Navigation ── */
  function prev() {
    activeAppIndex.update(i => wrap(i - 1));
    bumpInterval();
  }
  function next() {
    activeAppIndex.update(i => wrap(i + 1));
    bumpInterval();
  }
  function goTo(idx: number) {
    activeAppIndex.set(idx);
    bumpInterval();
  }

  // Swipe / pointer drag support
  let pointerStartX: number | null = null;
  let pointerCurrentX: number | null = null;

  function onPointerDown(e: PointerEvent) {
    pointerStartX = e.clientX;
    pointerCurrentX = e.clientX;
  }
  function onPointerMove(e: PointerEvent) {
    if (pointerStartX !== null) pointerCurrentX = e.clientX;
  }
  function onPointerUp(e: PointerEvent) {
    if (pointerStartX !== null && pointerCurrentX !== null) {
      const delta = pointerCurrentX - pointerStartX;
      if (Math.abs(delta) > 60) {
        if (delta < 0) {
          activeAppIndex.update(i => wrap(i + 1));
        } else {
          activeAppIndex.update(i => wrap(i - 1));
        }
        bumpInterval();
      }
    }
    pointerStartX = null;
    pointerCurrentX = null;
  }
</script>

<div
  class="carousel"
  aria-label="App showcase carousel"
  touch-action="pan-y"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:pointercancel={onPointerUp}
>
  <!-- Arrow: previous -->
  <button class="arrow arrow-left" on:click={prev} aria-label="Previous app">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M11 4L6 9l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  <!-- Card strip -->
  <div class="strip">
    {#each slots as slot (slot.idx)}
      <button
        class="card card-{slot.role}"
        on:click={() => goTo(slot.idx)}
        aria-label="Select {apps[slot.idx].name}"
        aria-current={slot.role === 'center' ? 'true' : undefined}
      >
        <div class="icon-wrap">
          {#if slot.role === 'center'}
            <div class="glow-ring" aria-hidden="true"></div>
          {/if}
          <img
            src={apps[slot.idx].icon}
            alt="{apps[slot.idx].name} app icon"
            class="app-icon"
            loading="lazy"
          />
        </div>
        {#if slot.role === 'center'}
          <span class="app-label">{apps[slot.idx].name}</span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- Arrow: next -->
  <button class="arrow arrow-right" on:click={next} aria-label="Next app">
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M7 4l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  <!-- Dot indicators with countdown ring -->
  <div class="dots" role="tablist" aria-label="App navigation dots">
    {#each apps as _, i}
      <div class="dot-wrap">
        <button
          class="dot"
          class:dot-active={i === $activeAppIndex}
          on:click={() => goTo(i)}
          role="tab"
          aria-selected={i === $activeAppIndex}
          aria-label="Go to app {i + 1}"
        ></button>
        {#if i === $activeAppIndex}
          <svg class="countdown-ring" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
            <circle
              bind:this={ringEl}
              cx="10" cy="10" r="8"
              fill="none"
              stroke="var(--accent-light)"
              stroke-width="1.5"
              stroke-dasharray={CIRCUMFERENCE}
              stroke-dashoffset={CIRCUMFERENCE}
              stroke-linecap="round"
              transform="rotate(-90 10 10)"
            />
          </svg>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .carousel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding-block: 1rem;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ── Card strip ── */
  .strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    perspective: 1200px;
    width: 100%;
    height: clamp(170px, 24vw, 250px);
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    background: none;
    border: none;
    padding: 0;
    flex-shrink: 0;
    transform-style: preserve-3d;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: no-preference) {
    .card {
      transition:
        transform 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
        opacity 350ms ease;
    }
  }

  /* Size/opacity/rotation per slot */
  .card-center {
    width: clamp(130px, 18vw, 200px);
    transform: scale(1.0) rotateY(0deg);
    opacity: 1;
    z-index: 5;
    cursor: default;
  }
  .card-left {
    width: clamp(95px, 13vw, 140px);
    transform: scale(0.82) rotateY(8deg);
    opacity: 0.6;
    z-index: 4;
  }
  .card-right {
    width: clamp(95px, 13vw, 140px);
    transform: scale(0.82) rotateY(-8deg);
    opacity: 0.6;
    z-index: 4;
  }
  .card-far-left {
    width: clamp(72px, 10vw, 105px);
    transform: scale(0.65) rotateY(14deg);
    opacity: 0.35;
    z-index: 3;
  }
  .card-far-right {
    width: clamp(72px, 10vw, 105px);
    transform: scale(0.65) rotateY(-14deg);
    opacity: 0.35;
    z-index: 3;
  }

  /* ── Icon wrap ── */
  .icon-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }

  .app-icon {
    width: 100%;
    height: 100%;
    border-radius: 22%;
    object-fit: cover;
    display: block;
  }

  .card-center .app-icon {
    box-shadow:
      0 4px 16px rgba(0,0,0,0.5),
      0 0 0 1px rgba(255,255,255,0.06),
      0 12px 40px rgba(59,130,246,0.18);
  }
  .card-left .app-icon,
  .card-right .app-icon {
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  }

  /* ── Glow ring (center only) ── */
  .glow-ring {
    position: absolute;
    inset: -8px;
    border-radius: 22%;
    border: 1.5px solid rgba(59, 130, 246, 0.5);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .glow-ring {
      animation: glowPulse 2.5s ease-in-out infinite;
    }

    @keyframes glowPulse {
      0%, 100% { opacity: 0.4; box-shadow: 0 0 12px rgba(59, 130, 246, 0.2); }
      50%       { opacity: 0.8; box-shadow: 0 0 24px rgba(59, 130, 246, 0.45); }
    }
  }

  /* ── App label (center only) ── */
  .app-label {
    font-size: 0.75rem;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--text-secondary);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  /* ── Arrow buttons ── */
  .arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(2, 8, 24, 0.65);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 10;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: no-preference) {
    .arrow {
      transition: background 0.2s, border-color 0.2s, color 0.2s;
    }
  }

  .arrow:hover {
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.55);
    color: #fff;
  }

  .arrow-left  { left:  -1.5rem; }
  .arrow-right { right: -1.5rem; }

  /* ── Dot indicators ── */
  .dots {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .dot-wrap {
    position: relative;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    padding: 0;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: no-preference) {
    .dot {
      transition: width 0.25s ease, background 0.25s ease;
    }
  }

  .dot-active {
    width: 8px;
    height: 8px;
    background: var(--accent-light);
  }

  .countdown-ring {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
</style>
