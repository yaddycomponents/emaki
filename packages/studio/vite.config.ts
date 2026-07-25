import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The CLI serves this app. Port 5273 matches `npx emaki studio`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5273 },
})
