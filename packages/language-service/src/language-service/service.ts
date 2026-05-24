import type { Range } from '@yyds-lang/ast/types'
import { parse } from '@yyds-lang/parser'
import { analyze, type SymbolDefinition, type SymbolReference } from '@yyds-lang/semantic'

export interface TextPosition {
  line: number
  column: number
}

export interface HoverResult {
  symbolId: string
  title: string
  value?: string
  range: Range
}

export interface RenameEdit {
  range: Range
  newName: string
}

export interface YydsDocumentAnalysis {
  definitions: SymbolDefinition[]
  references: SymbolReference[]
  diagnostics: ReturnType<typeof analyze>['diagnostics']
}

function isInRange(position: TextPosition, range: Range): boolean {
  if (position.line < range.start.line || position.line > range.end.line) {
    return false
  }
  if (position.line === range.start.line && position.column < range.start.column) {
    return false
  }
  if (position.line === range.end.line && position.column > range.end.column) {
    return false
  }
  return true
}

export function analyzeDocument(text: string): YydsDocumentAnalysis {
  const semantic = analyze(parse(text))
  return {
    definitions: semantic.definitions,
    references: semantic.references,
    diagnostics: semantic.diagnostics
  }
}

function findSymbolIdAtPosition(
  analysis: YydsDocumentAnalysis,
  position: TextPosition
): string | undefined {
  const ref = analysis.references.find((item) => isInRange(position, item.range))
  if (ref) {
    return ref.id
  }
  const def = analysis.definitions.find((item) => isInRange(position, item.range))
  return def?.id
}

export function getDefinition(
  analysis: YydsDocumentAnalysis,
  position: TextPosition
): SymbolDefinition | undefined {
  const symbolId = findSymbolIdAtPosition(analysis, position)
  if (!symbolId) {
    return undefined
  }
  return analysis.definitions.find((item) => item.id === symbolId)
}

export function getHover(
  analysis: YydsDocumentAnalysis,
  position: TextPosition
): HoverResult | undefined {
  const definition = getDefinition(analysis, position)
  if (!definition) {
    return undefined
  }
  if (definition.kind === 'macro') {
    return {
      symbolId: definition.id,
      title: `%${definition.name}`,
      value: definition.detail,
      range: definition.range
    }
  }
  if (definition.kind === 'track') {
    return {
      symbolId: definition.id,
      title: `track ${definition.name}`,
      value: definition.container ? `section ${definition.container}` : undefined,
      range: definition.range
    }
  }
  return {
    symbolId: definition.id,
    title: `${definition.kind} ${definition.name}`,
    range: definition.range
  }
}

export function getRenameEdits(
  analysis: YydsDocumentAnalysis,
  position: TextPosition,
  newName: string
): RenameEdit[] {
  const symbolId = findSymbolIdAtPosition(analysis, position)
  if (!symbolId) {
    return []
  }
  const edits: RenameEdit[] = []
  for (const definition of analysis.definitions) {
    if (definition.id === symbolId) {
      edits.push({ range: definition.range, newName })
    }
  }
  for (const reference of analysis.references) {
    if (reference.id === symbolId) {
      edits.push({ range: reference.range, newName })
    }
  }
  return edits
}
