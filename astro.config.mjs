// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config/site.ts';
import { withLastmod } from './src/config/lastmod.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [sitemap({ serialize: withLastmod })],
  vite: { plugins: [tailwindcss()] },
});
