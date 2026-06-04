import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vite-plus/test'
import { parse } from '@yyds-lang/parser'
import { analyze } from '@yyds-lang/semantic'
import { format } from '../src/index.ts'

const fixture = (...segments: string[]) =>
  resolve(fileURLToPath(new URL('../../../fixtures', import.meta.url)), ...segments)

test('format canonicalizes headers, aliases and sections', () => {
  const input = `  yyds   2
song   "Demo" // title
tempo 120
meter 4 / 4
unit q
%C=[C4   E4 G4]
section intro repeat 2{
track[piano] lead@90{
|C#4/q@40   [E4 G4 %C]/h@96 R/q| // bar comment
}
track bass refer intro->lead // ref
}
play intro transpose +2`

  const result = format(input)
  expect(result.diagnostics.some((item) => item.severity === 'error')).toBe(false)
  expect(result.code).toContain('meter 4/4')
  expect(result.code).toContain('%C = [C4 E4 G4]')
  expect(result.code).toContain('section intro repeat 2 {')
  expect(result.code).toContain('track[piano] lead@90 {')
  expect(result.code).toContain('track bass refer intro->lead // ref')
  expect(result.code).toMatch(/\| C#4\/q@40\s+\[E4 G4 %C\]\/h@96\s+R\/q \| \/\/ bar comment/)
})

test('format is idempotent for already formatted source', () => {
  const source = readFileSync(fixture('valid', 'basic-song.yyds'), 'utf8')
  const once = format(source)
  const twice = format(once.code)
  expect(twice.code).toBe(once.code)
})

test('format keeps semantic shape stable', () => {
  const source = readFileSync(fixture('valid', 'basic-song.yyds'), 'utf8')
  const before = analyze(parse(source))
  const afterSource = format(source).code
  const after = analyze(parse(afterSource))

  expect(after.definitions.map((item) => `${item.kind}:${item.name}`)).toEqual(
    before.definitions.map((item) => `${item.kind}:${item.name}`)
  )
  expect(after.references.map((item) => item.id)).toEqual(before.references.map((item) => item.id))
})

test('format skips rewrite on semantic errors', () => {
  const source = readFileSync(fixture('invalid', 'unknown-section-ref.yyds'), 'utf8')
  const result = format(source)
  expect(result.code).toBe(source)
  expect(result.changed).toBe(false)
  expect(result.diagnostics.some((item) => item.severity === 'error')).toBe(true)
})
