import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    define: {
      'import.meta.env.STRAPI_URL': JSON.stringify(process.env.VITE_STRAPI_URL || 'http://localhost:1337'),
      'process.env': '{}',
      'process.browser': 'true',
    },
    ssr: {
      noExternal: ['react-router-dom', '@supabase/supabase-js'],
    },
  },
  output: 'server',
});