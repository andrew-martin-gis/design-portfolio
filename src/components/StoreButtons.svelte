<script lang="ts">
  import type { GozioApp } from '../data/gozioApps';
  import { activeAppIndex } from '../stores/carouselStore';

  export let apps: GozioApp[];

  $: app = apps[$activeAppIndex];
</script>

<div class="store-buttons">
  <a
    href={app.appStoreUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="store-btn store-btn-apple"
    aria-label="Download {app.name} on the App Store"
  >
    <svg class="store-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
    <span class="store-btn-text">
      <span class="store-btn-sub">Download on the</span>
      <span class="store-btn-main">App Store</span>
    </span>
  </a>

  <a
    href={app.googlePlayUrl || '#'}
    target="_blank"
    rel="noopener noreferrer"
    class="store-btn store-btn-google"
    class:store-btn-disabled={!app.googlePlayUrl}
    aria-label="{app.googlePlayUrl ? `Get ${app.name} on Google Play` : 'Google Play coming soon'}"
    aria-disabled={!app.googlePlayUrl || undefined}
    tabindex={app.googlePlayUrl ? undefined : -1}
  >
    <svg class="store-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.18 23.76c.3.17.65.21.98.12l11.53-11.53L12.17 9l-8.99 14.76zM20.6 10.48l-2.8-1.62-3.35 3.35 3.35 3.35 2.82-1.63c.8-.46.8-1.99-.02-2.45zM2.11.25C1.78.44 1.55.8 1.55 1.25v21.5c0 .45.23.81.56 1l10.06-10.06L2.11.25zM15.71 2.26L4.18.14c-.33-.06-.65.0-.91.18l10.31 10.31 2.13-8.37z"/>
    </svg>
    <span class="store-btn-text">
      <span class="store-btn-sub">Get it on</span>
      <span class="store-btn-main">Google Play</span>
    </span>
  </a>
</div>

<style>
  .store-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .store-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.65rem 1.4rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: #000;
    color: #fff;
    text-decoration: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .store-btn {
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }
  }

  .store-btn:hover:not(.store-btn-disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .store-btn-disabled {
    opacity: 0.38;
    cursor: not-allowed;
    pointer-events: none;
  }

  .store-logo {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    color: #fff;
  }

  .store-btn-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .store-btn-sub {
    font-size: 0.62rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    opacity: 0.75;
  }

  .store-btn-main {
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
</style>
