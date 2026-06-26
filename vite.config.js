import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Идентификатор сборки: попадает и в бандл (константа __BUILD_ID__), и в
// dist/version.json. Приложение раз в минуту сверяет одно с другим и, если
// задеплоена более новая сборка, показывает мягкую плашку «Обновить».
const BUILD_ID = String(Date.now())

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'emit-version-json',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
      },
    },
  ],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  base: process.env.VITE_BASE_PATH || '/',
})
