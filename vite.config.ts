import { defineConfig } from 'vite'

export default defineConfig({
  base: '/thud-and-tile-web/', // GitHub Pages用のベースパス
  server: {
    host: '0.0.0.0', // 外部アクセスを許可
    port: 5173,      // ポート番号を明示
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