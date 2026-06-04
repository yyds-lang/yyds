import type { WorkerRequest, WorkerResponse, WorkerSuccessResponse } from '../workers/protocol'

interface PendingRequest {
  resolve: (value: WorkerSuccessResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let workerInstance: Worker | null = null
let seq = 0
const pending = new Map<number, PendingRequest>()

function nextId(): number {
  seq += 1
  return seq
}

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/yyds.worker.ts', import.meta.url), {
      type: 'module'
    })
    workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      const slot = pending.get(message.id)
      if (!slot) {
        return
      }
      clearTimeout(slot.timer)
      pending.delete(message.id)
      if (!message.ok) {
        slot.reject(new Error(message.error))
        return
      }
      slot.resolve(message)
    }
    workerInstance.onerror = (event) => {
      const error = new Error(event.message || 'Worker runtime error')
      for (const [, slot] of pending) {
        clearTimeout(slot.timer)
        slot.reject(error)
      }
      pending.clear()
    }
  }
  return workerInstance
}

function request<T extends WorkerRequest>(
  message: T,
  timeoutMs = 15000
): Promise<WorkerSuccessResponse> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const timer = setTimeout(() => {
      pending.delete(message.id)
      reject(new Error(`Worker request timeout: ${message.type}`))
    }, timeoutMs)
    pending.set(message.id, { resolve, reject, timer })
    worker.postMessage(message)
  })
}

export async function initWasm(): Promise<void> {
  const response = await request({
    id: nextId(),
    type: 'init'
  })
  if (response.type !== 'init') {
    throw new Error('Unexpected init response')
  }
}

export async function renderWav(
  source: string,
  instrument: string
): Promise<{
  bytes: Uint8Array
  size: number
  durationSeconds: number
  roll: {
    notes: Array<{
      start: number
      duration: number
      pitch: number
      velocity: number
      symbol: string
      instrument: string
    }>
    totalTicks: number
    minPitch: number
    maxPitch: number
    tempo: number
  }
}> {
  const response = await request({
    id: nextId(),
    type: 'render',
    payload: { source, instrument }
  })
  if (response.type !== 'render') {
    throw new Error('Unexpected render response')
  }
  return {
    bytes: new Uint8Array(response.payload.wav),
    size: response.payload.size,
    durationSeconds: response.payload.durationSeconds,
    roll: response.payload.roll
  }
}
