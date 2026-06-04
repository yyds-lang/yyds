import type {
  FormatWorkerErrorResponse,
  FormatWorkerRequest,
  FormatWorkerResponse,
  FormatWorkerSuccessResponse
} from '../workers/formatProtocol'

interface PendingRequest {
  resolve: (value: FormatWorkerSuccessResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let workerInstance: Worker | null = null
let seq = 0
const pending = new Map<number, PendingRequest>()

function isFormatWorkerError(message: FormatWorkerResponse): message is FormatWorkerErrorResponse {
  return message.ok === false
}

function nextId(): number {
  seq += 1
  return seq
}

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/format.worker.ts', import.meta.url), {
      type: 'module'
    })
    workerInstance.onmessage = (event: MessageEvent<FormatWorkerResponse>) => {
      const message = event.data
      const slot = pending.get(message.id)
      if (!slot) {
        return
      }
      clearTimeout(slot.timer)
      pending.delete(message.id)
      if (isFormatWorkerError(message)) {
        slot.reject(new Error(message.error))
        return
      }
      slot.resolve(message)
    }
    workerInstance.onerror = (event) => {
      const error = new Error(event.message || 'Format worker runtime error')
      for (const [, slot] of pending) {
        clearTimeout(slot.timer)
        slot.reject(error)
      }
      pending.clear()
    }
  }
  return workerInstance
}

function request(
  message: FormatWorkerRequest,
  timeoutMs = 8000
): Promise<FormatWorkerSuccessResponse> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const timer = setTimeout(() => {
      pending.delete(message.id)
      reject(new Error('Format worker request timeout'))
    }, timeoutMs)
    pending.set(message.id, { resolve, reject, timer })
    worker.postMessage(message)
  })
}

export async function formatInWorker(source: string): Promise<string> {
  const response = await request({
    id: nextId(),
    source
  })
  return response.payload.source
}
