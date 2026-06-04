import type { Diagnostic } from '@yyds-lang/ast/types'
import { parseTokensWithDiagnostics } from '@yyds-lang/parser'
import { analyze } from '@yyds-lang/semantic'
import { buildIr } from './ir.ts'
import { normalizeDocument } from './normalize.ts'
import { printDocument } from './print.ts'
import { scanDocument } from './scan.ts'
import type { FormatResult, FormatterOptions } from './types.ts'

function hasBlockingErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}

export function format(source: string, options: FormatterOptions = {}): FormatResult {
  const scanned = scanDocument(source)
  const parseResult = parseTokensWithDiagnostics(scanned.parserTokens, source)
  const semanticResult = analyze(parseResult.program)
  const diagnostics = [...parseResult.diagnostics, ...semanticResult.diagnostics]
  if (hasBlockingErrors(diagnostics)) {
    return {
      code: source,
      changed: false,
      diagnostics
    }
  }

  const ir = buildIr(scanned.formatTokens)
  const normalized = normalizeDocument(ir)
  const code = printDocument(normalized, options)

  return {
    code,
    changed: code !== source,
    diagnostics
  }
}

export function formatOrThrow(source: string, options: FormatterOptions = {}): string {
  const result = format(source, options)
  const error = result.diagnostics.find((diagnostic) => diagnostic.severity === 'error')
  if (error) {
    throw new Error(error.message)
  }
  return result.code
}

export function canFormat(source: string): boolean {
  const scanned = scanDocument(source)
  const parseResult = parseTokensWithDiagnostics(scanned.parserTokens, source)
  const semanticResult = analyze(parseResult.program)
  return !hasBlockingErrors([...parseResult.diagnostics, ...semanticResult.diagnostics])
}
