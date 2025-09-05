import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  server: {
    port: 5173,
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy error para Netlify Dev:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            console.log('Proxy request para:', proxyReq.path);
          });
        }
      },
      '/.netlify': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
