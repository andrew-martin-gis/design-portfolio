<script>
  export let name = '';
</script>

<span class="pill">{name}</span>

<style>
  .pill {
    display: inline-block;
    font-size: 0.8rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 0.35rem 0.9rem;
    transition: color var(--transition), border-color var(--transition),
                background var(--transition);
    cursor: default;
  }

  .pill:hover {
    color: var(--accent-light);
    border-color: rgba(59, 130, 246, 0.35);
    background: rgba(59, 130, 246, 0.06);
  }
</style>
