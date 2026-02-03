import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Default to root path. Deployment scripts (like GitHub Pages) will override this via --base.
  base: "/",
  server: {
    host: true,
    allowedHosts: true
  }
})
