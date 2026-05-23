import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    chunkSizeWarningLimit: 900, // Three.js 포함이라 정상
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react':  ['react', 'react-dom'],
        },
      },
    },
  },
})
