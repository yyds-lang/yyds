import { expect, test } from 'vite-plus/test'
import { format } from '../src/index.ts'

const LARGE_SAMPLE = `yyds 2
song "Perf"
tempo 120
meter 4/4
unit q
section main {
  track[piano] lead {
    | C4/q D4/q E4/q F4/q |
    | G4/q A4/q B4/q C5/q |
  }
}
play main
`

test('format baseline performance stays within budget', () => {
  const source = LARGE_SAMPLE.repeat(80)
  const startedAt = Date.now()
  for (let i = 0; i < 40; i += 1) {
    format(source)
  }
  const elapsedMs = Date.now() - startedAt
  expect(elapsedMs).toBeLessThan(5000)
})
