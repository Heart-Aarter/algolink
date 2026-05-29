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
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/naive-ui')) {
            return 'naive'
          }

          if (id.includes('node_modules/echarts')) {
            return 'echarts'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/atcoder-api': {
        target: 'https://kenkoooo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/atcoder-api/, '/atcoder'),
      },
    },
  },
})
