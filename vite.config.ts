import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/luogu-api': {
        target: 'https://www.luogu.com.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/luogu-api/, ''),
        headers: {
          'x-lentille-request': 'content-only',
        },
      },
      '/atcoder-api': {
        target: 'https://kenkoooo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/atcoder-api/, '/atcoder'),
      },
    },
  },
})
