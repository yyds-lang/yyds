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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@yyds-lang/ast': fileURLToPath(new URL('../../packages/ast/src/index.ts', import.meta.url)),
      '@yyds-lang/ast/types': fileURLToPath(
        new URL('../../packages/ast/src/types/index.ts', import.meta.url)
      ),
      '@yyds-lang/formatter': fileURLToPath(
        new URL('../../packages/formatter/src/index.ts', import.meta.url)
      ),
      '@yyds-lang/language-service': fileURLToPath(
        new URL('../../packages/language-service/src/index.ts', import.meta.url)
      ),
      '@yyds-lang/language-service/types': fileURLToPath(
        new URL('../../packages/language-service/src/types/index.ts', import.meta.url)
      ),
      '@yyds-lang/lexer': fileURLToPath(
        new URL('../../packages/lexer/src/index.ts', import.meta.url)
      ),
      '@yyds-lang/parser': fileURLToPath(
        new URL('../../packages/parser/src/index.ts', import.meta.url)
      ),
      '@yyds-lang/semantic': fileURLToPath(
        new URL('../../packages/semantic/src/index.ts', import.meta.url)
      )
    }
  }
})
