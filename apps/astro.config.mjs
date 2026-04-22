import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://midjourney-prompt-generator.eu',
  output: 'server',
  adapter: vercel({ nodeVersion: '20', maxDuration: 30 }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    define: {
      'process.browser': 'true',
    },
    ssr: {
      noExternal: ['react-router-dom', '@supabase/supabase-js'],
    },
  },
});