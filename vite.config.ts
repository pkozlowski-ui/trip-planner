import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // @tambo-ai/react exports "development": "./src/index.ts" but npm pack only ships dist/esm – force ESM build
    alias: {
      '@tambo-ai/react': path.resolve(__dirname, 'node_modules/@tambo-ai/react/esm/index.js'),
    },
  },
  server: {
    proxy: {
      // Proxy Nominatim in dev to avoid CORS/preflight (custom headers trigger OPTIONS; browser blocks)
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'TripPlanner/1.0');
          });
        },
      },
    },
  },
})

