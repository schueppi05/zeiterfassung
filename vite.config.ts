import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Lokale Entwicklung: API (func start) läuft auf Port 7071
    proxy: { '/api': 'http://localhost:7071' },
  },
})
