import { formatDocument } from '@yyds-lang/language-service'
import { formatInWorker } from '../lib/formatClient'

export function formatYydsSource(source: string): string {
  const result = formatDocument(source)
  const error = result.diagnostics.find((item) => item.severity === 'error')
  if (error) {
    throw new Error(error.message)
  }
  return result.text
}

export async function formatYydsSourceInWorker(source: string): Promise<string> {
  return formatInWorker(source)
}
