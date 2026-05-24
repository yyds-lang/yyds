import { expect, test } from 'vite-plus/test'
import { parse, parseWithDiagnostics } from '../src/index.ts'
import type { StatementNode } from '@yyds-lang/ast/types'

test('parse reads headers and sections', () => {
  const program = parse(`
tempo 120
meter 4/4
section intro {
  track lead {
    | C4 / q D4 / q |
  }
}
play intro
`)
  expect(program.type).toBe('Program')
  expect(program.body.some((node: StatementNode) => node.type === 'Header')).toBe(true)
  const section = program.body.find((node: StatementNode) => node.type === 'Section')
  expect(section?.type).toBe('Section')
  if (section?.type === 'Section') {
    expect(section.tracks.length).toBe(1)
    expect(section.tracks[0]?.bars.length).toBe(1)
  }
})

test('parse track refer', () => {
  const program = parse(`
section intro {
  track low {
    | C2 / q |
  }
}
section verse {
  track low refer intro -> low
}
play verse
`)

  const verse = program.body.find(
    (node): node is Extract<StatementNode, { type: 'Section' }> =>
      node.type === 'Section' && node.name === 'verse'
  )
  expect(verse).toBeDefined()
  expect(verse?.tracks[0]?.ref?.section).toBe('intro')
  expect(verse?.tracks[0]?.ref?.track).toBe('low')
  expect(verse?.tracks[0]?.ref?.sectionRange).toBeDefined()
  expect(verse?.tracks[0]?.ref?.trackRange).toBeDefined()
})

test('parse chord alias declarations and references', () => {
  const program = parse(`
%C = [A2 C#3 E3 A3]
section intro {
  track lead {
    | [%C] C4 / q |
  }
}
play intro
`)

  const alias = program.body.find(
    (node): node is Extract<StatementNode, { type: 'ChordAlias' }> => node.type === 'ChordAlias'
  )
  expect(alias).toBeDefined()
  expect(alias?.name).toBe('C')
  expect(alias?.value).toBe('A2 C#3 E3 A3')
  expect(alias?.nameRange.start.column).toBe(1)
  expect(alias?.nameRange.start.line).toBeGreaterThan(0)

  const section = program.body.find(
    (node): node is Extract<StatementNode, { type: 'Section' }> => node.type === 'Section'
  )
  expect(section?.nameRange).toBeDefined()
  const bar = section?.tracks[0]?.bars[0]
  expect(bar?.chordRefs[0]?.name).toBe('C')
  expect(bar?.chordRefs[0]?.range.start.column).toBe(7)
  expect(bar?.chordRefs[0]?.range.start.line).toBeGreaterThan(0)
})

test('parseWithDiagnostics reports skipped tokens in fallback paths', () => {
  const { program, diagnostics } = parseWithDiagnostics(`
tempo 120
section verse ??? {
  track lead ??? {
    ??? | C4 / q |
  }
}
`)

  expect(program.body.some((node) => node.type === 'Section')).toBe(true)
  expect(diagnostics.length).toBeGreaterThan(0)
  expect(diagnostics.some((item) => item.code === 'YYDS_PARSE_UNEXPECTED_TOKEN')).toBe(true)
})
