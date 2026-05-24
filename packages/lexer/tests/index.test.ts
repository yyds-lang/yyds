import { expect, test } from 'vite-plus/test'
import { tokenize } from '../src/index.ts'

test('tokenize handles basic YYDS snippet', () => {
  const tokens = tokenize('tempo 120\nsection intro {}\n')
  expect(tokens[0]?.value).toBe('tempo')
  expect(tokens[1]?.value).toBe('120')
  expect(tokens.at(-1)?.type).toBe('eof')
})
