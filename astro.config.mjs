import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://www.gisdev.me',
  base: '/',
  integrations: [svelte()],
  output: 'static',
});

