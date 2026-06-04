<script setup lang="ts">
import { DEFAULT_SOURCE, createYydsEditor } from '../editor/monaco'
import { initWasm, renderWav } from '../lib/wasmClient'

const instruments = ['piano', 'guitar', 'drums', 'dizi'] as const

const editorEl = ref<HTMLElement | null>(null)
const source = ref(DEFAULT_SOURCE)
const selectedInstrument = ref<(typeof instruments)[number]>('piano')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('loading')
const statusText = ref('正在初始化 WASM...')
const errorText = ref('')
const audioUrl = ref('')
const renderMs = ref(0)
const durationSeconds = ref(0)
const wavSize = ref(0)
const isRendering = computed(() => status.value === 'loading')

let editorHandle: Awaited<ReturnType<typeof createYydsEditor>> | null = null

function stripTrackInstrumentHints(input: string): string {
  return input.replace(/\btrack\s*\[[^\]\r\n]+\]\s*/g, 'track ')
}

function clearAudio(): void {
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
}

async function bootstrap(): Promise<void> {
  status.value = 'loading'
  statusText.value = '正在初始化 WASM...'
  errorText.value = ''
  try {
    await initWasm()
    status.value = 'idle'
    statusText.value = '就绪'
  } catch (error) {
    status.value = 'error'
    statusText.value = '初始化失败'
    errorText.value = error instanceof Error ? error.message : String(error)
  }
}

async function runFormat(): Promise<void> {
  if (isRendering.value || !editorHandle) {
    return
  }
  status.value = 'loading'
  statusText.value = '格式化中...'
  errorText.value = ''
  try {
    const formatted = await editorHandle.formatDocument()
    source.value = formatted
    status.value = 'success'
    statusText.value = '格式化完成'
  } catch (error) {
    status.value = 'error'
    statusText.value = '格式化失败'
    errorText.value = error instanceof Error ? error.message : String(error)
  }
}

async function runRender(): Promise<void> {
  if (isRendering.value || !editorHandle) {
    return
  }
  status.value = 'loading'
  statusText.value = '正在生成 WAV...'
  errorText.value = ''
  clearAudio()
  try {
    const startedAt = performance.now()
    const currentSource = editorHandle.getValue()
    const sourceToRender = stripTrackInstrumentHints(currentSource)
    const result = await renderWav(sourceToRender, selectedInstrument.value)
    renderMs.value = Math.round(performance.now() - startedAt)
    durationSeconds.value = result.durationSeconds
    wavSize.value = result.size
    const wavBlob = new Blob([result.bytes], { type: 'audio/wav' })
    audioUrl.value = URL.createObjectURL(wavBlob)
    status.value = 'success'
    statusText.value = '渲染成功'
    source.value = editorHandle.getValue()
  } catch (error) {
    status.value = 'error'
    statusText.value = '渲染失败'
    errorText.value = error instanceof Error ? error.message : String(error)
  }
}

onMounted(async () => {
  if (editorEl.value) {
    editorHandle = await createYydsEditor(editorEl.value, (next) => {
      source.value = next
    })
  }
  await bootstrap()
})

onBeforeUnmount(() => {
  editorHandle?.dispose()
  clearAudio()
})
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
    <div class="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="cursor-pointer appearance-none border-none rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isRendering"
          @click="runFormat"
        >
          格式化
        </button>
        <button
          type="button"
          class="cursor-pointer appearance-none border-none rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isRendering"
          @click="runRender"
        >
          生成 WAV
        </button>
        <StatusBadge :status="status" :text="statusText" />
      </div>
      <div
        ref="editorEl"
        class="h-[65vh] min-h-[420px] overflow-hidden rounded-xl border border-zinc-800"
      />
    </div>

    <aside class="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h2 class="text-lg font-semibold">渲染面板</h2>
      <label class="block text-sm text-zinc-300">
        乐器
        <select
          v-model="selectedInstrument"
          class="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-400"
        >
          <option v-for="instrument in instruments" :key="instrument" :value="instrument">
            {{ instrument }}
          </option>
        </select>
      </label>
      <div
        class="space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300"
      >
        <p>时长: {{ durationSeconds.toFixed(2) }}s</p>
        <p>大小: {{ Math.round(wavSize / 1024) }} KB</p>
        <p>耗时: {{ renderMs }} ms</p>
      </div>
      <audio v-if="audioUrl" :src="audioUrl" controls class="w-full" />
      <p
        v-if="errorText"
        class="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
      >
        {{ errorText }}
      </p>
      <details class="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
        <summary class="cursor-pointer text-zinc-200">当前源码（调试）</summary>
        <pre class="mt-2 whitespace-pre-wrap break-all">{{ source }}</pre>
      </details>
    </aside>
  </section>
</template>
