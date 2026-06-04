import { expect, test } from 'vite-plus/test'
import { analyze, format, parse, tokenize, YYDS_SCOPE_NAME } from '../src/index.ts'
import * as yydsExports from '../src/index.ts'

test('aggregate package exports core APIs', () => {
  const tokens = tokenize('tempo 120\nsection intro {}\n')
  const program = parse('tempo 120\nsection intro {}\n')
  const semantic = analyze(program)
  const formatted = format('meter 4 / 4\n')

  expect(tokens.length > 0).toBe(true)
  expect(program.type).toBe('Program')
  expect(Array.isArray(semantic.diagnostics)).toBe(true)
  expect(formatted.code).toContain('meter 4/4')
  expect(YYDS_SCOPE_NAME).toBe('source.yyds')
})

test('aggregate exports stay abstract and generic', () => {
  expect('toShikiLanguageDefinition' in yydsExports).toBe(false)
  expect('ShikiLanguageDefinition' in yydsExports).toBe(false)
})
