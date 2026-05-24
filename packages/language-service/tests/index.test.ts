import { expect, test } from 'vite-plus/test'
import { analyzeDocument, getDefinition, getHover, getRenameEdits } from '../src/index.ts'

const demo = `
%C = [A2 C#3 E3 A3]
section intro {
  track lead {
    | [%C] C4 / q |
  }
}
play intro
`

test('hover and definition resolve macro alias', () => {
  const analysis = analyzeDocument(demo)
  const macroRef = analysis.references.find((item) => item.id === 'macro:C')
  expect(macroRef).toBeDefined()
  expect(macroRef?.range.start.column).toBe(7)
  const cursor = {
    line: macroRef!.range.start.line,
    column: macroRef!.range.start.column + 1
  }

  const definition = getDefinition(analysis, cursor)
  expect(definition?.id).toBe('macro:C')
  expect(definition?.range.start.column).toBe(1)

  const hover = getHover(analysis, cursor)
  expect(hover?.title).toBe('%C')
  expect(hover?.value).toBe('[A2 C#3 E3 A3]')
})

test('rename edits include declaration and references', () => {
  const analysis = analyzeDocument(demo)
  const macroRef = analysis.references.find((item) => item.id === 'macro:C')
  expect(macroRef).toBeDefined()
  const cursor = {
    line: macroRef!.range.start.line,
    column: macroRef!.range.start.column + 1
  }
  const edits = getRenameEdits(analysis, cursor, 'CMaj')
  expect(edits.length).toBeGreaterThanOrEqual(2)
})
