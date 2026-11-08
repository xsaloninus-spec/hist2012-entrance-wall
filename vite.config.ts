import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { inspectAttr } from 'kimi-plugin-inspect-react'

export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), viteSingleFile()],
  server: { port: 3000 },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
