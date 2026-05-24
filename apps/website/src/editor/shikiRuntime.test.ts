import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const mocked = vi.hoisted(() => ({
  init: vi.fn(),
  createRuntime: vi.fn(),
  setup: vi.fn()
}))

vi.mock('modern-monaco/core', () => ({
  init: mocked.init
}))

vi.mock('yyds-lang-shiki/monaco', () => ({
  createYydsMonacoRuntime: mocked.createRuntime
}))

function createMonacoMock() {
  return {
    languages: {
      getLanguages: vi.fn(() => []),
      register: vi.fn(),
      setLanguageConfiguration: vi.fn()
    }
  }
}

describe('ensureShikiRuntime', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocked.init.mockImplementation(async () => createMonacoMock())
    mocked.setup.mockResolvedValue(undefined)
    mocked.createRuntime.mockReturnValue({
      setup: mocked.setup
    })
  })

  it('initializes runtime only once', async () => {
    const { ensureShikiRuntime } = await import('./shikiRuntime')

    const [runtime1, runtime2] = await Promise.all([ensureShikiRuntime(), ensureShikiRuntime()])

    expect(runtime1).toBe(runtime2)
    expect(mocked.init).toHaveBeenCalledOnce()
    expect(mocked.createRuntime).toHaveBeenCalledOnce()
    expect(mocked.setup).toHaveBeenCalledOnce()
  })

  it('clears failed promise and allows retry', async () => {
    mocked.setup.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined)

    const { ensureShikiRuntime } = await import('./shikiRuntime')

    await expect(ensureShikiRuntime()).rejects.toThrow('boom')
    await expect(ensureShikiRuntime()).resolves.toMatchObject({
      monaco: expect.any(Object)
    })

    expect(mocked.createRuntime).toHaveBeenCalledOnce()
    expect(mocked.init).toHaveBeenCalledTimes(2)
    expect(mocked.setup).toHaveBeenCalledTimes(2)
  })
})
