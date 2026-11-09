import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'ClimbTrack',
      short_name: 'ClimbTrack',
      lang: 'es',
      theme_color: '#eef1f4',
      background_color: '#eef1f4',
      display: 'standalone',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    // La letra va empaquetada: se guarda también para usar la app sin cobertura.
    workbox: { globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico,webmanifest}'] },
  })],
});
