import { defineConfig } from 'vite-plus'
import { fileURLToPath } from 'node:url'
import { mergeCommonConfig } from '../../scripts/vite/vite.config.common.ts'

const fromRoot = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

export default defineConfig(
  mergeCommonConfig({
    pack: {
      entry: {
        index: 'src/index.ts',
        types: 'src/types/index.ts'
      }
    },
    resolve: {
      alias: {
        '@yyds-lang/ast': fromRoot('../ast/src/index.ts'),
        '@yyds-lang/ast/types': fromRoot('../ast/src/types/index.ts'),
        '@yyds-lang/parser': fromRoot('../parser/src/index.ts'),
        '@yyds-lang/semantic': fromRoot('../semantic/src/index.ts')
      }
    }
  })
)
