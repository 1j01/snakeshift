import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  root: 'game',
  base: '',
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    minifyIdentifiers: false, // need to keep class names in tact for (de)serialization to work
    // pure: ['console.log'],    // example: have esbuild remove any console.log
  },
  server: {
    watch: {
      ignored: [
        '**/.history/**', // VS Code "Local History" extension
      ],
    },
    allowedHosts: [
      'tunnel.isaiahodhner.io',
      'ss.isaiahodhner.io',
    ],
  },
  // Without this, you don't get errors when files fail to load!
  // It'll "successfully" return your index.html when trying to load .css or anything.
  appType: 'mpa',

  // Toying around with the idea of supporting old Kindle experimental browser.
  // Also maybe Safari 14 for macOS Mojave.
  plugins: [
    legacy({
      targets: ['defaults'],
      polyfills: ['es.promise.finally', 'es/map', 'es/set', 'es/json'],
    }),
  ],
})
