import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { formatInWorker } from './formatClient'

class FakeFormatWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null
  public onerror: ((event: ErrorEvent) => void) | null = null

  postMessage(message: { id: number; source: string }) {
    queueMicrotask(() => {
      this.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: message.id,
            ok: true,
            payload: { source: message.source.replace('4 / 4', '4/4') }
          }
        })
      )
    })
  }
}

describe('formatClient', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', FakeFormatWorker)
  })

  it('formats source via worker', async () => {
    await expect(formatInWorker('meter 4 / 4\n')).resolves.toContain('meter 4/4')
  })
})
