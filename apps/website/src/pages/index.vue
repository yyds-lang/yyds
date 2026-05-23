<template>
  <section class="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8">
    <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Minimal Viable</p>
    <h2 class="text-3xl font-semibold leading-tight">YYDS 音乐生成器</h2>
    <p class="max-w-2xl text-zinc-300">
      这个页面使用 Vue Router 的 pages 文件路由模式，核心渲染链路为
      <code class="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-100"
        >Editor -> Worker -> WASM -> WAV</code
      >。
    </p>
    <div class="flex gap-3">
      <RouterLink
        to="/studio"
        class="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        打开 Studio
      </RouterLink>
    </div>
  </section>
</template>
