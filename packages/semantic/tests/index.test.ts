import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { expect, test } from 'vite-plus/test'
import type { ProgramNode } from '@yyds-lang/ast/types'
import { parse } from '@yyds-lang/parser'
import { analyze } from '../src/index.ts'

const fixture = (...segments: string[]) =>
  resolve(fileURLToPath(new URL('../../../fixtures', import.meta.url)), ...segments)

test('analyze reports duplicate sections', () => {
  const program: ProgramNode = {
    type: 'Program',
    range: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 3, column: 1, offset: 20 }
    },
    body: [
      {
        type: 'Section',
        name: 'intro',
        nameRange: {
          start: { line: 1, column: 9, offset: 8 },
          end: { line: 1, column: 14, offset: 13 }
        },
        tracks: [],
        range: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 14, offset: 13 }
        }
      },
      {
        type: 'Section',
        name: 'intro',
        nameRange: {
          start: { line: 2, column: 9, offset: 22 },
          end: { line: 2, column: 14, offset: 27 }
        },
        tracks: [],
        range: {
          start: { line: 2, column: 1, offset: 14 },
          end: { line: 2, column: 14, offset: 27 }
        }
      }
    ]
  }

  const result = analyze(program)
  expect(result.diagnostics.length).toBe(1)
  expect(result.diagnostics[0]?.code).toBe('YYDS_SEM_DUPLICATE_SECTION')
})

test('analyze reports unknown track reference target', () => {
  const program: ProgramNode = {
    type: 'Program',
    range: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 6, column: 1, offset: 60 }
    },
    body: [
      {
        type: 'Section',
        name: 'verse',
        nameRange: {
          start: { line: 1, column: 9, offset: 8 },
          end: { line: 1, column: 14, offset: 13 }
        },
        range: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 3, column: 1, offset: 30 }
        },
        tracks: [
          {
            type: 'Track',
            name: 'lead',
            nameRange: {
              start: { line: 2, column: 9, offset: 16 },
              end: { line: 2, column: 13, offset: 20 }
            },
            bars: [],
            ref: { section: 'intro', track: 'lead' },
            range: {
              start: { line: 2, column: 3, offset: 10 },
              end: { line: 2, column: 28, offset: 35 }
            }
          }
        ]
      }
    ]
  }

  const result = analyze(program)
  expect(result.diagnostics[0]?.code).toBe('YYDS_SEM_UNKNOWN_SECTION')
})

test('analyze invalid fixture', () => {
  const code = readFileSync(fixture('invalid', 'unknown-section-ref.yyds'), 'utf8')
  const result = analyze(parse(code))
  expect(result.diagnostics.some((item) => item.code === 'YYDS_SEM_UNKNOWN_SECTION')).toBe(true)
})

test('analyze edge fixture cyclic refs', () => {
  const code = readFileSync(fixture('edge', 'cyclic-track-ref.yyds'), 'utf8')
  const result = analyze(parse(code))
  expect(result.diagnostics.some((item) => item.code === 'YYDS_SEM_CYCLIC_REF')).toBe(true)
})

test('analyze chord aliases and references', () => {
  const result = analyze(
    parse(`
%C = [A2 C#3 E3 A3]
section intro {
  track lead {
    | [%C] C4 / q [%X] |
  }
}
play intro
`)
  )
  expect(result.definitions.some((item) => item.id === 'macro:C')).toBe(true)
  expect(result.references.some((item) => item.id === 'macro:C')).toBe(true)
  const macroDef = result.definitions.find((item) => item.id === 'macro:C')
  const macroRef = result.references.find((item) => item.id === 'macro:C')
  expect(macroDef?.range.start.column).toBe(1)
  expect(macroRef?.range.start.column).toBe(7)
  expect(result.diagnostics.some((item) => item.code === 'YYDS_SEM_UNKNOWN_CHORD_ALIAS')).toBe(true)
})
