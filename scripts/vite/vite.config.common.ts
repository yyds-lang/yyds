import { mergeConfig, type UserConfig } from 'vite-plus'

const commonConfig: UserConfig = {
  pack: {
    dts: true,
    exports: true
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true
    }
  },
  build: {
    minify: true
  },
  fmt: {
    singleQuote: true,
    semi: false,
    trailingComma: 'none'
  }
}

export function mergeCommonConfig(config: UserConfig): UserConfig {
  return mergeConfig(commonConfig, config)
}
