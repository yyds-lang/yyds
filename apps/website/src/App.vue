<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100">
    <header class="mx-auto max-w-7xl px-6 py-4">
      <div
        class="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">YYDS</p>
          <h1 class="text-lg font-semibold">Web Music Generator</h1>
        </div>
        <nav class="flex items-center gap-2 text-sm">
          <RouterLink
            class="rounded-md px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            to="/"
          >
            首页
          </RouterLink>
          <RouterLink
            class="rounded-md px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            to="/studio"
          >
            Studio
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-6 pb-8">
      <RouterView />
    </main>
  </div>
</template>
