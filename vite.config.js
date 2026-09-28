import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

const base = '/Punkt-O-Mat/'

export default defineConfig({
  base,
  define: {
    // Build number = GitHub Actions run number of the deploy; "dev" locally.
    __BUILD__: JSON.stringify(process.env.VITE_BUILD ?? 'dev'),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Punkt-o-Mat',
        short_name: 'Punkt-o-Mat',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F8F7F4',
        theme_color: '#2E6F4E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
