import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative assets so the built app works in an IIS virtual directory.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    strictPort: true,
    open: false,
  },
})
