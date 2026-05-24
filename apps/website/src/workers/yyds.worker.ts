/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from './protocol'

declare const self: DedicatedWorkerGlobalScope

interface GoLike {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): Promise<void> | void
}

declare global {
  interface WorkerGlobalScope {
    Go?: new () => GoLike
    yydsRenderWav?: (source: string, instrument?: string) => unknown
    yydsFormat?: (source: string) => unknown
  }
}

let initPromise: Promise<void> | null = null

async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = initWasmRuntime()
  }
  return initPromise
}

async function initWasmRuntime(): Promise<void> {
  const runtimeSource = await fetch('/wasm/wasm_exec.js').then(async (res) => {
    if (!res.ok) {
      throw new Error('Failed to load wasm_exec.js')
    }
    return res.text()
  })
  // wasm_exec.js is distributed as a classic script.
  ;(0, eval)(runtimeSource)

  if (!self.Go) {
    throw new Error('Go runtime is not available')
  }
  const go = new self.Go()
  const result = await instantiateWasm('/wasm/yyds.wasm', go.importObject)
  void go.run(result.instance)
  await waitForExports()
}

async function instantiateWasm(
  url: string,
  imports: WebAssembly.Imports
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  if ('instantiateStreaming' in WebAssembly) {
    try {
      return await WebAssembly.instantiateStreaming(fetch(url), imports)
    } catch (error) {
      if (!String(error).includes('MIME')) {
        throw error
      }
    }
  }
  const bytes = await fetch(url).then(async (res) => {
    if (!res.ok) {
      throw new Error('Failed to fetch wasm file')
    }
    return res.arrayBuffer()
  })
  return WebAssembly.instantiate(bytes, imports)
}

async function waitForExports(): Promise<void> {
  const timeoutAt = Date.now() + 5000
  while (Date.now() < timeoutAt) {
    if (self.yydsRenderWav && self.yydsFormat) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 16))
  }
  throw new Error('YYDS wasm exports were not registered')
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function post(response: WorkerResponse, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) {
    self.postMessage(response, { transfer })
    return
  }
  self.postMessage(response)
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data
  try {
    if (message.type === 'init') {
      await ensureInitialized()
      post({ id: message.id, ok: true, type: 'init' })
      return
    }

    await ensureInitialized()

    if (message.type === 'format') {
      const result = self.yydsFormat?.(message.payload.source) as
        | { ok?: boolean; source?: string; error?: string }
        | undefined
      if (!result?.ok) {
        throw new Error(result?.error ?? 'YYDS format failed')
      }
      post({
        id: message.id,
        ok: true,
        type: 'format',
        payload: { source: result.source ?? '' }
      })
      return
    }

    if (message.type === 'render') {
      const result = self.yydsRenderWav?.(message.payload.source, message.payload.instrument) as
        | {
            ok?: boolean
            wav?: Uint8Array
            size?: number
            durationSeconds?: number
            roll?: {
              notes?: Array<{
                start: number
                duration: number
                pitch: number
                velocity: number
                symbol: string
                instrument: string
              }>
              totalTicks?: number
              minPitch?: number
              maxPitch?: number
              tempo?: number
            }
            error?: string
          }
        | undefined

      if (!result?.ok || !result.wav) {
        throw new Error(result?.error ?? 'YYDS render failed')
      }
      const wav = Uint8Array.from(result.wav).buffer
      post(
        {
          id: message.id,
          ok: true,
          type: 'render',
          payload: {
            wav,
            size: result.size ?? result.wav.byteLength,
            durationSeconds: result.durationSeconds ?? 0,
            roll: {
              notes: result.roll?.notes ?? [],
              totalTicks: result.roll?.totalTicks ?? 0,
              minPitch: result.roll?.minPitch ?? 60,
              maxPitch: result.roll?.maxPitch ?? 72,
              tempo: result.roll?.tempo ?? 120
            }
          }
        },
        [wav]
      )
      return
    }
  } catch (error) {
    post({
      id: message.id,
      ok: false,
      error: toErrorMessage(error)
    })
  }
}
