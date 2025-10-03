import { defineConfig } from 'vite'

export default defineConfig({
  base: '/thud-and-tile-web/', // GitHub Pages用のベースパス
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