import { defineConfig } from 'vite-plus'
import { mergeCommonConfig } from '../../scripts/vite/vite.config.common.ts'

export default defineConfig(
  mergeCommonConfig({
    pack: {
      entry: {
        index: 'src/index.ts',
        types: 'src/types/index.ts'
      }
    }
  })
)
