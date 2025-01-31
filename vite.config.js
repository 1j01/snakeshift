import { defineConfig } from 'vite'

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
  },
  // Without this, you don't get errors when files fail to load!
  // It'll "successfully" return your index.html when trying to load .css or anything.
  appType: 'mpa',
})
