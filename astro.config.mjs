// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config/site.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
