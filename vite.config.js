import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  root: 'game',
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

  // Toying around with the idea of supporting old Kindle experimental browser.
  plugins: [
    legacy({
      targets: ['defaults'],
    }),
  ],
})
