import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you deploy to a repo (username.github.io/<repo>), set base to '/<repo>/'.
// If you use a custom domain (like kunalaneja.com), keep base as '/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist' }
})
