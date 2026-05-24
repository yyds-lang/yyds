import type {
  BarNode,
  ChordAliasNode,
  Diagnostic,
  HeaderNode,
  PlayNode,
  ProgramNode,
  Range,
  SectionNode,
  StatementNode,
  TrackNode,
  Token
} from '@yyds-lang/ast/types'
import { YYDS_DIAGNOSTIC_CODES, YYDS_DIAGNOSTIC_SEVERITY } from '@yyds-lang/ast'
import { tokenize } from '@yyds-lang/lexer'

export const PARSER_HEADER_KEYWORDS = ['tempo', 'meter', 'key', 'unit', 'song', 'velocity'] as const
export const PARSER_CONTROL_KEYWORDS = ['section', 'track', 'play', 'refer'] as const

function emptyRange(): Range {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 }
  }
}

function toHeaderNode(key: string, value: string, token: Token): HeaderNode {
  return {
    type: 'Header',
    key,
    value,
    range: token.range
  }
}

function toSectionNode(name: string, token: Token): SectionNode {
  return {
    type: 'Section',
    name,
    nameRange: token.range,
    tracks: [],
    range: token.range
  }
}

function isToken(token: Token | undefined, type: string, value?: string): boolean {
  return token?.type === type && (value === undefined || token.value === value)
}

function mergeRange(start: Range['start'], end: Range['end']): Range {
  return { start, end }
}

class Parser {
  private readonly headerKeys: ReadonlySet<string> = new Set(PARSER_HEADER_KEYWORDS)
  private readonly tokens: Token[]
  private readonly source: string
  private readonly diagnostics: Diagnostic[] = []
  private readonly reportedOffsets = new Set<number>()
  private pos = 0

  constructor(tokens: Token[], source = '') {
    this.tokens = tokens
    this.source = source
  }

  parse(): ProgramNode {
    const body: StatementNode[] = []
    while (!this.isEOF()) {
      const token = this.peek()
      if (!token) {
        break
      }
      if (token.type === 'ident' && this.headerKeys.has(token.value)) {
        body.push(this.parseHeader())
        continue
      }
      if (isToken(token, 'symbol', '%')) {
        body.push(this.parseChordAlias())
        continue
      }
      if (isToken(token, 'ident', 'section')) {
        body.push(this.parseSection())
        continue
      }
      if (isToken(token, 'ident', 'play')) {
        body.push(this.parsePlay())
        continue
      }
      this.pushUnexpectedToken(token, 'top-level statement')
      this.advance()
    }

    return {
      type: 'Program',
      body,
      range:
        body.length > 0
          ? mergeRange(body[0].range.start, body[body.length - 1].range.end)
          : emptyRange()
    }
  }

  private parseHeader(): HeaderNode {
    const keyToken = this.advance()!
    const key = keyToken.value

    if (key === 'meter') {
      const num = this.takeValue()
      const slash = isToken(this.peek(), 'symbol', '/') ? this.advance()!.value : ''
      const den = this.takeValue()
      return toHeaderNode(key, `${num}${slash}${den}`.trim(), keyToken)
    }

    const value = this.takeValue()
    return toHeaderNode(key, value, keyToken)
  }

  private parseChordAlias(): ChordAliasNode {
    const percentToken = this.advance()!
    const nameToken = this.peek()
    const aliasName =
      nameToken && nameToken.type === 'ident' ? this.advance()!.value : 'anonymous_alias'
    const aliasNameRange =
      nameToken && nameToken.type === 'ident'
        ? mergeRange(percentToken.range.start, nameToken.range.end)
        : percentToken.range

    if (isToken(this.peek(), 'symbol', '=')) {
      this.advance()
    }

    let value = ''
    const notes: string[] = []
    if (isToken(this.peek(), 'symbol', '[')) {
      const openToken = this.advance()!
      const valueStartOffset = openToken.range.end.offset
      while (!this.isEOF() && !isToken(this.peek(), 'symbol', ']')) {
        notes.push(this.advance()!.value)
      }
      const closeToken = isToken(this.peek(), 'symbol', ']') ? this.advance()! : openToken
      if (this.source.length > 0) {
        value = this.source.slice(valueStartOffset, closeToken.range.start.offset).trim()
      } else {
        value = notes.join(' ').trim()
      }
    }

    const end = this.tokens[Math.max(this.pos - 1, 0)]?.range.end ?? percentToken.range.end
    return {
      type: 'ChordAlias',
      name: aliasName,
      nameRange: aliasNameRange,
      value,
      notes,
      range: mergeRange(percentToken.range.start, end)
    }
  }

  private parseSection(): SectionNode {
    const sectionToken = this.advance()!
    const nameToken = this.peek()
    const sectionNameToken = nameToken?.type === 'ident' ? this.advance()! : undefined
    const sectionName = sectionNameToken?.value ?? 'anonymous'
    const section = toSectionNode(sectionName, sectionToken)
    section.nameRange = sectionNameToken?.range ?? sectionToken.range

    while (!this.isEOF() && !isToken(this.peek(), 'symbol', '{')) {
      const token = this.peek()
      if (!token) {
        break
      }
      this.pushUnexpectedToken(token, 'section opening "{"')
      this.advance()
    }
    if (isToken(this.peek(), 'symbol', '{')) {
      this.advance()
    }

    const tracks: TrackNode[] = []
    while (!this.isEOF() && !isToken(this.peek(), 'symbol', '}')) {
      if (isToken(this.peek(), 'ident', 'track')) {
        tracks.push(this.parseTrack())
      } else {
        const token = this.peek()
        if (token) {
          this.pushUnexpectedToken(token, 'track declaration or section closing "}"')
        }
        this.advance()
      }
    }
    if (isToken(this.peek(), 'symbol', '}')) {
      const close = this.advance()!
      section.range = mergeRange(section.range.start, close.range.end)
    }
    section.tracks = tracks
    return section
  }

  private parseTrack(): TrackNode {
    const trackToken = this.advance()!
    let instrument: string | undefined
    if (isToken(this.peek(), 'symbol', '[')) {
      this.advance()
      if (this.peek()?.type === 'ident') {
        instrument = this.advance()!.value
      }
      if (isToken(this.peek(), 'symbol', ']')) {
        this.advance()
      }
    }

    const trackNameToken = this.peek()?.type === 'ident' ? this.advance()! : undefined
    const name = trackNameToken?.value ?? 'track'
    const bars: BarNode[] = []
    let ref: TrackNode['ref']

    while (
      !this.isEOF() &&
      !isToken(this.peek(), 'symbol', '{') &&
      !isToken(this.peek(), 'ident', 'refer')
    ) {
      const token = this.peek()
      if (token) {
        this.pushUnexpectedToken(token, 'track body "{" or refer expression')
      }
      this.advance()
    }

    if (isToken(this.peek(), 'ident', 'refer')) {
      this.advance()
      const refSectionToken = this.peek()?.type === 'ident' ? this.advance()! : undefined
      const refSection = refSectionToken?.value ?? ''
      if (isToken(this.peek(), 'symbol', '->')) {
        this.advance()
      } else if (isToken(this.peek(), 'symbol', '-')) {
        this.advance()
        if (isToken(this.peek(), 'symbol', '>')) {
          this.advance()
        }
      }
      const refTrackToken = this.peek()?.type === 'ident' ? this.advance()! : undefined
      const refTrack = refTrackToken?.value ?? ''
      ref = {
        section: refSection,
        track: refTrack,
        sectionRange: refSectionToken?.range,
        trackRange: refTrackToken?.range
      }
    } else if (isToken(this.peek(), 'symbol', '{')) {
      this.advance()
      while (!this.isEOF() && !isToken(this.peek(), 'symbol', '}')) {
        if (isToken(this.peek(), 'symbol', '|')) {
          bars.push(this.parseBar())
          continue
        }
        const token = this.peek()
        if (token) {
          this.pushUnexpectedToken(token, 'bar delimiter "|" or track closing "}"')
        }
        this.advance()
      }
      if (isToken(this.peek(), 'symbol', '}')) {
        this.advance()
      }
    }

    const end = this.tokens[Math.max(this.pos - 1, 0)]?.range.end ?? trackToken.range.end
    return {
      type: 'Track',
      name,
      nameRange: trackNameToken?.range ?? trackToken.range,
      instrument,
      ref,
      bars,
      range: mergeRange(trackToken.range.start, end)
    }
  }

  private parseBar(): BarNode {
    const start = this.advance()!
    const events: string[] = []
    const chordRefs: BarNode['chordRefs'] = []
    while (
      !this.isEOF() &&
      !isToken(this.peek(), 'symbol', '|') &&
      !isToken(this.peek(), 'symbol', '}')
    ) {
      if (
        isToken(this.peek(), 'symbol', '[') &&
        isToken(this.peek(1), 'symbol', '%') &&
        this.peek(2)?.type === 'ident'
      ) {
        const openToken = this.advance()!
        this.advance()
        const aliasToken = this.advance()!
        events.push('[', '%', aliasToken.value)
        const closeToken = isToken(this.peek(), 'symbol', ']') ? this.advance()! : aliasToken
        chordRefs.push({
          name: aliasToken.value,
          range: mergeRange(openToken.range.start, closeToken.range.end)
        })
        if (closeToken !== aliasToken) {
          events.push(closeToken.value)
        }
        continue
      }
      events.push(this.advance()!.value)
    }
    const endToken = isToken(this.peek(), 'symbol', '|') ? this.advance()! : start
    return {
      type: 'Bar',
      events,
      chordRefs,
      range: mergeRange(start.range.start, endToken.range.end)
    }
  }

  private parsePlay(): PlayNode {
    const playToken = this.advance()!
    const sectionToken = this.peek()?.type === 'ident' ? this.advance()! : undefined
    const section = sectionToken?.value ?? ''
    const end = this.tokens[Math.max(this.pos - 1, 0)]?.range.end ?? playToken.range.end
    return {
      type: 'Play',
      section,
      sectionRange: sectionToken?.range ?? playToken.range,
      range: mergeRange(playToken.range.start, end)
    }
  }

  private takeValue(): string {
    const token = this.peek()
    if (!token || token.type === 'eof') {
      return ''
    }
    this.advance()
    return token.value
  }

  private isEOF(): boolean {
    return isToken(this.peek(), 'eof')
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.pos + offset]
  }

  private advance(): Token | undefined {
    const token = this.tokens[this.pos]
    this.pos += 1
    return token
  }

  getDiagnostics(): Diagnostic[] {
    return this.diagnostics
  }

  private pushUnexpectedToken(token: Token, expected: string): void {
    if (token.type === 'eof' || this.reportedOffsets.has(token.range.start.offset)) {
      return
    }
    this.reportedOffsets.add(token.range.start.offset)
    this.diagnostics.push({
      code: YYDS_DIAGNOSTIC_CODES.PARSE_UNEXPECTED_TOKEN,
      severity: YYDS_DIAGNOSTIC_SEVERITY.WARNING,
      message: `Unexpected token "${token.value}" while parsing ${expected}.`,
      range: token.range
    })
  }
}

export function parseTokens(tokens: Token[], source = ''): ProgramNode {
  return parseTokensWithDiagnostics(tokens, source).program
}

export interface ParseResult {
  program: ProgramNode
  diagnostics: Diagnostic[]
}

export function parseTokensWithDiagnostics(tokens: Token[], source = ''): ParseResult {
  const parser = new Parser(tokens, source)
  const program = parser.parse()
  return {
    program,
    diagnostics: parser.getDiagnostics()
  }
}

export function parse(code: string): ProgramNode {
  const tokens = tokenize(code)
  return parseTokens(tokens, code)
}

export function parseWithDiagnostics(code: string): ParseResult {
  const tokens = tokenize(code)
  return parseTokensWithDiagnostics(tokens, code)
}
