import type { Position, Range, Token } from '@yyds-lang/ast/types'

const SYMBOLS = new Set(['{', '}', '[', ']', '|', '/', '.', '@', '%', '=', '-', '>', '+'])
const CHAR_NEWLINE = 10
const CHAR_CARRIAGE_RETURN = 13
const CHAR_TAB = 9
const CHAR_SPACE = 32
const CHAR_DQUOTE = 34
const CHAR_SLASH = 47
const CHAR_DOT = 46
const CHAR_ZERO = 48
const CHAR_NINE = 57
const CHAR_UPPER_A = 65
const CHAR_UPPER_Z = 90
const CHAR_UNDERSCORE = 95
const CHAR_LOWER_A = 97
const CHAR_LOWER_Z = 122

function createPosition(line: number, column: number, offset: number): Position {
  return { line, column, offset }
}

function createRange(start: Position, end: Position): Range {
  return { start, end }
}

function isDigitCode(code: number): boolean {
  return code >= CHAR_ZERO && code <= CHAR_NINE
}

function isIdentifierStartCode(code: number): boolean {
  return (
    (code >= CHAR_UPPER_A && code <= CHAR_UPPER_Z) ||
    (code >= CHAR_LOWER_A && code <= CHAR_LOWER_Z) ||
    code === CHAR_UNDERSCORE
  )
}

function isIdentifierCode(code: number): boolean {
  return isIdentifierStartCode(code) || isDigitCode(code)
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const length = source.length
  let index = 0
  let line = 1
  let column = 1

  while (index < length) {
    const char = source[index]
    const code = source.charCodeAt(index)

    if (code === CHAR_NEWLINE) {
      index += 1
      line += 1
      column = 1
      continue
    }

    if (code === CHAR_SPACE || code === CHAR_TAB || code === CHAR_CARRIAGE_RETURN) {
      index += 1
      column += 1
      continue
    }

    if (code === CHAR_SLASH && source.charCodeAt(index + 1) === CHAR_SLASH) {
      while (index < length && source.charCodeAt(index) !== CHAR_NEWLINE) {
        index += 1
        column += 1
      }
      continue
    }

    const start = createPosition(line, column, index)

    if (code === CHAR_DQUOTE) {
      const valueStart = index
      index += 1
      column += 1
      while (index < length && source.charCodeAt(index) !== CHAR_DQUOTE) {
        index += 1
        column += 1
      }
      if (source.charCodeAt(index) === CHAR_DQUOTE) {
        index += 1
        column += 1
      }
      tokens.push({
        type: 'string',
        value: source.slice(valueStart, index),
        range: createRange(start, createPosition(line, column, index))
      })
      continue
    }

    if (isDigitCode(code)) {
      const valueStart = index
      while (index < length) {
        const nextCode = source.charCodeAt(index)
        if (!isDigitCode(nextCode) && nextCode !== CHAR_DOT) {
          break
        }
        index += 1
        column += 1
      }
      tokens.push({
        type: 'number',
        value: source.slice(valueStart, index),
        range: createRange(start, createPosition(line, column, index))
      })
      continue
    }

    if (isIdentifierStartCode(code)) {
      const valueStart = index
      while (index < length && isIdentifierCode(source.charCodeAt(index))) {
        index += 1
        column += 1
      }
      tokens.push({
        type: 'ident',
        value: source.slice(valueStart, index),
        range: createRange(start, createPosition(line, column, index))
      })
      continue
    }

    if (char === '-' && source[index + 1] === '>') {
      index += 2
      column += 2
      tokens.push({
        type: 'symbol',
        value: '->',
        range: createRange(start, createPosition(line, column, index))
      })
      continue
    }

    if (SYMBOLS.has(char)) {
      index += 1
      column += 1
      tokens.push({
        type: 'symbol',
        value: char,
        range: createRange(start, createPosition(line, column, index))
      })
      continue
    }

    // Unknown characters are surfaced as symbol tokens for downstream diagnostics.
    index += 1
    column += 1
    tokens.push({
      type: 'symbol',
      value: char,
      range: createRange(start, createPosition(line, column, index))
    })
  }

  const eof = createPosition(line, column, index)
  tokens.push({
    type: 'eof',
    value: '',
    range: createRange(eof, eof)
  })

  return tokens
}
