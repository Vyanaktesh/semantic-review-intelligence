import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Forward /api/* to the SRIS backend.
// Default port is 5000 - override with VITE_API_TARGET in frontend/.env
// (e.g. VITE_API_TARGET=http://localhost:3001).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_TARGET || 'http://localhost:5000'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
