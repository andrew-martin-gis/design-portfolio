<script>
  export let slug        = '';
  export let title       = '';
  export let subtitle    = '';
  export let description = '';
  export let tags        = [];
  export let gradient    = 'linear-gradient(135deg, #0d1631, #020818)';
  export let year        = '';

  const base = import.meta.env.BASE_URL;
  const href = `${base}projects/${slug}`;
</script>

<article class="card">
  <a {href}>
    <!-- Visual header -->
    <div class="card-header" style={`background: ${gradient};`}>
      <span class="card-year">{year}</span>
    </div>

    <!-- Body -->
    <div class="card-body">
      <p class="card-subtitle">{subtitle}</p>
      <h3 class="card-title">{title}</h3>
      <p class="card-desc">{description}</p>

      <!-- Tags -->
      <ul class="card-tags">
        {#each tags as tag}
          <li>{tag}</li>
        {/each}
      </ul>

      <!-- Link affordance -->
      <span class="card-link">
        View project
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
  </a>
</article>

<style>
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: transform var(--transition), border-color var(--transition),
                box-shadow var(--transition);
  }

  .card:hover {
    transform: translateY(-6px);
    border-color: var(--border-hover);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1);
  }

  .card a {
    display: block;
    text-decoration: none;
    color: inherit;
    height: 100%;
  }

  /* ── Header image area ── */
  .card-header {
    height: 180px;
    position: relative;
    overflow: hidden;
  }

  .card-header::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(2, 8, 24, 0.7));
  }

  .card-year {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    color: rgba(255, 255, 255, 0.45);
    z-index: 1;
  }

  /* ── Body ── */
  .card-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-subtitle {
    font-size: 0.7rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--accent-light);
  }

  .card-title {
    font-size: 1.15rem;
    font-weight: 400;
    letter-spacing: 0.01em;
    color: var(--text-primary);
    line-height: 1.3;
  }

  .card-desc {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    /* clamp to 3 lines */
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Tags ── */
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .card-tags li {
    font-size: 0.68rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    padding: 0.2rem 0.55rem;
  }

  /* ── Link row ── */
  .card-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 1rem;
    font-size: 0.75rem;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-light);
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity var(--transition), transform var(--transition);
  }

  .card:hover .card-link {
    opacity: 1;
    transform: translateX(0);
  }
</style>
