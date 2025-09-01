import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://odata-active-record.dev',
  integrations: [
    // OData Active Record integration will be added here
  ],
  output: 'hybrid', // Enable both SSR and SSG
  experimental: {
    assets: true
  }
});
