import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { initWasm, renderWav } from './wasmClient'

class FakeWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: ErrorEvent) => void) | null = null

  postMessage(message: { id: number; type: string }) {
    queueMicrotask(() => {
      if (!this.onmessage) {
        return
      }
      if (message.type === 'init') {
        this.onmessage(
          new MessageEvent('message', { data: { id: message.id, ok: true, type: 'init' } })
        )
        return
      }
      this.onmessage(
        new MessageEvent('message', {
          data: {
            id: message.id,
            ok: true,
            type: 'render',
            payload: {
              wav: new Uint8Array([1, 2, 3]).buffer,
              size: 3,
              durationSeconds: 1,
              roll: {
                notes: [],
                totalTicks: 0,
                minPitch: 60,
                maxPitch: 72,
                tempo: 120
              }
            }
          }
        })
      )
    })
  }
}

describe('wasmClient', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', FakeWorker)
  })

  it('initializes worker', async () => {
    await expect(initWasm()).resolves.toBeUndefined()
  })

  it('renders wav via worker', async () => {
    const result = await renderWav('source', 'piano')
    expect(result.size).toBe(3)
    expect(result.bytes.length).toBe(3)
  })
})
