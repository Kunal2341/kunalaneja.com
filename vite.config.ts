import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // Custom domain kunalaneja.com
  build: {
    target: 'esnext',
    minify: 'terser',
    outDir: 'docs', // GitHub Pages serves from /docs
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3000,
  },
})
