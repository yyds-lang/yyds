/// <reference lib="webworker" />

import { formatDocument } from '@yyds-lang/language-service'
import type { FormatWorkerRequest, FormatWorkerResponse } from './formatProtocol'

declare const self: DedicatedWorkerGlobalScope

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

self.onmessage = (event: MessageEvent<FormatWorkerRequest>) => {
  const { id, source } = event.data
  try {
    const result = formatDocument(source)
    const error = result.diagnostics.find((item) => item.severity === 'error')
    if (error) {
      const response: FormatWorkerResponse = {
        id,
        ok: false,
        error: error.message
      }
      self.postMessage(response)
      return
    }
    const response: FormatWorkerResponse = {
      id,
      ok: true,
      payload: {
        source: result.text
      }
    }
    self.postMessage(response)
  } catch (error) {
    const response: FormatWorkerResponse = {
      id,
      ok: false,
      error: toErrorMessage(error)
    }
    self.postMessage(response)
  }
}
