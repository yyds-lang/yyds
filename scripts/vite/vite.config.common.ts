import { mergeConfig, type UserConfig } from "vite-plus";

const commonConfig: UserConfig = {
  pack: {
    dts: true,
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  build: {
    minify: true,
  },
  fmt: {},
};

export function mergeCommonConfig(config: UserConfig): UserConfig {
  return mergeConfig(commonConfig, config);
}
