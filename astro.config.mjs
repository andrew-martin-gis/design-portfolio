import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://andrew-martin-gis.github.io',
  base: '/design-portfolio',
  integrations: [svelte()],
  output: 'static',
});

