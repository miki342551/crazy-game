import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: (process.env.VERCEL || process.env.NETLIFY) ? "/" : "/crazy-game/",
  server: {
    host: true,
    allowedHosts: true
  }
})
