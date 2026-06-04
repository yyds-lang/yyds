import { describe, expect, it } from 'vite-plus/test'
import { formatYydsSource } from './format'

describe('formatYydsSource', () => {
  it('formats valid input via language-service', () => {
    const output = formatYydsSource('meter 4 / 4\n')
    expect(output).toContain('meter 4/4')
  })
})
