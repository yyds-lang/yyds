# YYDS Web Studio

最小可用 Web 音乐生成器，技术栈：

- Vue 3 + `vue-router`（pages 文件路由）
- `unplugin-auto-import` + `unplugin-vue-components`
- UnoCSS
- modern-monaco
- Web Worker + Go WASM

## 运行

在仓库根目录执行：

```bash
vp run website#dev
```

构建：

```bash
vp run website#build
```

## WASM 资源

页面依赖以下文件：

- `public/wasm/yyds.wasm`
- `public/wasm/wasm_exec.js`

## 常见问题

- **报错 `Failed to load wasm_exec.js`**：确认 `public/wasm/wasm_exec.js` 存在。
- **报错 `YYDS wasm exports were not registered`**：通常是 `yyds.wasm` 与 `wasm_exec.js` 不匹配，或 wasm 初始化失败。
- **浏览器不支持 `instantiateStreaming`**：代码会自动 fallback 到 `arrayBuffer` 路径。
