import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/proxy/polymarket': {
        target: 'https://gamma-api.polymarket.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/polymarket/, ''),
      },
      '/proxy/kalshi': {
        target: 'https://trading-api.kalshi.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/proxy\/kalshi/, ''),
      },
    },
  },
  define: {
    'process.env': {}
  }
})
