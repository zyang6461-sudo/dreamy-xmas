import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/dreamy-xmas/', // ✅ 部署到 Vercel 用根路径
})
