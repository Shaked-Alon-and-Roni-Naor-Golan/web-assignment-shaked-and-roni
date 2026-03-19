import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 443,
    https: {
      key: fs.readFileSync('../../client-key.pem'),
      cert: fs.readFileSync('../../client-cert.pem'),
    }
  }
})
