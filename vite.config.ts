import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'es2020'
  },
  optimizeDeps: {
    exclude: ['../pkg/thud_and_tile.js']
  },
  assetsInclude: ['**/*.wasm']
})