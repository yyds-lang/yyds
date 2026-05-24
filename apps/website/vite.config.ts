import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'vue-router/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  // Pre-bundle the core entry used by editor runtime bootstrapping.
  optimizeDeps: {
    include: ['modern-monaco/core']
  },
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      dts: '.auto-generated/typed-router.d.ts'
    }),
    Vue(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: '.auto-generated/auto-imports.d.ts',
      vueTemplate: true
    }),
    Components({
      dirs: ['src/components'],
      dts: '.auto-generated/components.d.ts'
    }),
    UnoCSS()
  ],
  resolve: {
    // Force a single modern-monaco runtime instance across all subpath imports.
    dedupe: ['modern-monaco'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
