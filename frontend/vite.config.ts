import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-ignore
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
  ssr: {
    noExternal: [/@asamuzakjp\/css-color/, /@csstools\/css-calc/]
  }
})

