import { defineConfig } from 'vite'

export default defineConfig({
  root: 'game',
  base: '',
  build: {
    target: 'esnext',
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
