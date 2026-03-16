<script>
  import { onMount } from 'svelte';

  export let profileImg = '';

  const links = [
    { href: '#gozio',    label: 'Work'     },
    { href: '#about',    label: 'About'    },
    { href: '#skills',   label: 'Skills'   },
    { href: '#projects', label: 'Projects' },
  ];

  let active     = '';
  let scrolled   = false;
  let menuOpen   = false;

  function toggleMenu() { menuOpen = !menuOpen; }
  function closeMenu()  { menuOpen = false; }

  onMount(() => {
    // Track scroll position for nav background
    const onScroll = () => { scrolled = window.scrollY > 60; };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Active section via IntersectionObserver
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) active = '#' + e.target.id; });
      },
      { threshold: 0.35 }
    );
    sections.forEach(s => observer.observe(s));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  });
</script>

<nav class:scrolled>
  <div class="inner">
    <!-- Logo / name -->
    <a href="#hero" class="logo" aria-label="Back to top">
      <img class="logo-avatar" src={profileImg} alt="Andrew Martin" />
      <span class="logo-name">Andrew Martin</span>
    </a>

    <!-- Nav links -->
    <ul class="nav-links" class:open={menuOpen}>
      {#each links as { href, label }}
        <li>
          <a {href} class:active={active === href} on:click={closeMenu}>{label}</a>
        </li>
      {/each}
    </ul>

    <!-- CTA -->
    <a
      href="mailto:andrew.martin.gis@outlook.com"
      class="cta"
      aria-label="Get in touch"
    >
      Contact
    </a>

    <!-- Mobile menu toggle -->
    <button class="menu-toggle" on:click={toggleMenu} aria-label="Toggle menu">
      <span class="bar" class:open={menuOpen}></span>
      <span class="bar" class:open={menuOpen}></span>
      <span class="bar" class:open={menuOpen}></span>
    </button>
  </div>
</nav>

<style>
  nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: 0 clamp(1.25rem, 5vw, 3rem);
    height: 4.5rem;
    display: flex;
    align-items: center;
    background: rgba(2, 8, 24, 0.4);
    transition: background 0.4s ease, backdrop-filter 0.4s ease,
                border-color 0.4s ease;
    border-bottom: 1px solid transparent;
  }

  nav.scrolled {
    background: rgba(2, 8, 24, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .inner {
    width: 100%;
    max-width: 1100px;
    margin-inline: auto;
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  /* Logo */
  .logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-shrink: 0;
  }

  .logo-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .logo-name {
    font-size: 0.9rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    opacity: 0.85;
  }

  /* Nav links */
  .nav-links {
    display: flex;
    gap: 2rem;
    margin-left: auto;
  }

  .nav-links a {
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-secondary);
    position: relative;
    transition: color 0.2s ease;
  }

  .nav-links a::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--accent-light);
    transition: width 0.25s ease;
  }

  .nav-links a:hover,
  .nav-links a.active {
    color: var(--text-primary);
  }

  .nav-links a.active::after,
  .nav-links a:hover::after {
    width: 100%;
  }

  /* CTA button */
  .cta {
    font-size: 0.75rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent-light);
    padding: 0.45rem 1rem;
    border: 1px solid rgba(59, 130, 246, 0.35);
    border-radius: var(--radius);
    transition: background 0.2s ease, border-color 0.2s ease;
    white-space: nowrap;
    margin-left: 1rem;
  }

  .cta:hover {
    background: rgba(59, 130, 246, 0.12);
    border-color: var(--accent);
  }

  /* Hamburger toggle — hidden on desktop */
  .menu-toggle {
    display: none;
    flex-direction: column;
    gap: 5px;
    padding: 0.5rem;
    margin-left: auto;
  }

  .menu-toggle .bar {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--text-secondary);
    border-radius: 1px;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .menu-toggle .bar.open:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }
  .menu-toggle .bar.open:nth-child(2) {
    opacity: 0;
  }
  .menu-toggle .bar.open:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  @media (max-width: 600px) {
    .logo-name { display: none; }
    .cta { display: none; }

    .menu-toggle {
      display: flex;
    }

    .nav-links {
      position: fixed;
      top: 4.5rem;
      left: 0;
      right: 0;
      flex-direction: column;
      align-items: center;
      gap: 0;
      padding: 1rem 0;
      margin-left: 0;
      background: rgba(2, 8, 24, 0.95);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      transform: translateY(-100%);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .nav-links.open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .nav-links a {
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
      width: 100%;
      text-align: center;
    }
  }
</style>
