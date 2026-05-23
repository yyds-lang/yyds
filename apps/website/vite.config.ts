import { fileURLToPath, URL } from "node:url";
import Vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import VueRouter from "unplugin-vue-router/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: "src/pages",
      dts: ".auto-generated/typed-router.d.ts",
    }),
    Vue(),
    AutoImport({
      imports: ["vue", "vue-router"],
      dts: ".auto-generated/auto-imports.d.ts",
      vueTemplate: true,
    }),
    Components({
      dirs: ["src/components"],
      dts: ".auto-generated/components.d.ts",
    }),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
