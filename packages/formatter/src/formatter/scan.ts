import type { Position, Token } from '@yyds-lang/ast/types'
import type { FormatToken, ScannedDocument } from './types.ts'

function isAlpha(char: string): boolean {
  return /[A-Za-z_]/.test(char)
}

function isAlphaNumeric(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char)
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char)
}

function createPosition(line: number, column: number, offset: number): Position {
  return { line, column, offset }
}

export function scanDocument(source: string): ScannedDocument {
  const formatTokens: FormatToken[] = []
  const parserTokens: Token[] = []
  let index = 0
  let line = 1
  let column = 1

  const push = (
    token: { kind: FormatToken['kind']; text: string },
    startLine: number,
    startColumn: number,
    startOffset: number,
    endLine: number,
    endColumn: number,
    endOffset: number
  ) => {
    const range = {
      start: createPosition(startLine, startColumn, startOffset),
      end: createPosition(endLine, endColumn, endOffset)
    }
    formatTokens.push({ ...token, line: startLine, column: startColumn, range })
    if (token.kind !== 'comment') {
      parserTokens.push({
        type: token.kind === 'eof' ? 'eof' : token.kind,
        value: token.text,
        range
      })
    }
  }

  while (index < source.length) {
    const char = source[index]!

    if (char === '\n') {
      index += 1
      line += 1
      column = 1
      continue
    }

    if (char === ' ' || char === '\t' || char === '\r') {
      index += 1
      column += 1
      continue
    }

    const tokenLine = line
    const tokenColumn = column
    const tokenOffset = index

    if (char === '/' && source[index + 1] === '/') {
      let text = '//'
      index += 2
      column += 2
      while (index < source.length && source[index] !== '\n') {
        text += source[index]
        index += 1
        column += 1
      }
      push({ kind: 'comment', text }, tokenLine, tokenColumn, tokenOffset, line, column, index)
      continue
    }

    if (char === '"') {
      let text = '"'
      index += 1
      column += 1
      while (index < source.length && source[index] !== '"' && source[index] !== '\n') {
        text += source[index]
        index += 1
        column += 1
      }
      if (source[index] === '"') {
        text += '"'
        index += 1
        column += 1
      }
      push({ kind: 'string', text }, tokenLine, tokenColumn, tokenOffset, line, column, index)
      continue
    }

    if (isDigit(char)) {
      let text = ''
      while (index < source.length && /[0-9.]/.test(source[index]!)) {
        text += source[index]
        index += 1
        column += 1
      }
      push({ kind: 'number', text }, tokenLine, tokenColumn, tokenOffset, line, column, index)
      continue
    }

    if (isAlpha(char)) {
      let text = ''
      while (index < source.length && isAlphaNumeric(source[index]!)) {
        text += source[index]
        index += 1
        column += 1
      }
      push({ kind: 'ident', text }, tokenLine, tokenColumn, tokenOffset, line, column, index)
      continue
    }

    if (char === '-' && source[index + 1] === '>') {
      index += 2
      column += 2
      push({ kind: 'symbol', text: '->' }, tokenLine, tokenColumn, tokenOffset, line, column, index)
      continue
    }

    index += 1
    column += 1
    push({ kind: 'symbol', text: char }, tokenLine, tokenColumn, tokenOffset, line, column, index)
  }

  push({ kind: 'eof', text: '' }, line, column, index, line, column, index)
  return { formatTokens, parserTokens }
}

export function scan(source: string): FormatToken[] {
  return scanDocument(source).formatTokens
}
