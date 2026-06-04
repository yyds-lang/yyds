import type {
  AliasNode,
  BarEventDraft,
  BarNode,
  CommentNode,
  DocumentIr,
  FormatToken,
  SectionItemNode,
  SectionNode,
  SimpleLineNode,
  TopLevelNode,
  TrackItemNode,
  TrackNode
} from './types.ts'

class IrBuilder {
  private readonly tokens: FormatToken[]
  private pos = 0

  constructor(tokens: FormatToken[]) {
    this.tokens = tokens
  }

  build(): DocumentIr {
    const nodes: TopLevelNode[] = []
    while (!this.isEOF()) {
      if (this.check('comment')) {
        nodes.push(this.parseComment())
        continue
      }
      if (this.checkSymbol('%')) {
        nodes.push(this.parseAlias())
        continue
      }
      if (this.checkIdent('section')) {
        nodes.push(this.parseSection())
        continue
      }
      nodes.push(this.parseSimpleLine())
    }
    return { nodes }
  }

  private parseComment(): CommentNode {
    return { kind: 'comment', text: this.advance().text }
  }

  private parseAlias(): AliasNode {
    this.advance()
    let name = ''
    if (
      !this.isEOF() &&
      this.peek().kind !== 'comment' &&
      this.peek().line === this.previous().line
    ) {
      name = this.advance().text
    }
    if (this.checkSymbol('=')) {
      this.advance()
    }
    const valueTokens: FormatToken[] = []
    if (this.checkSymbol('[')) {
      this.advance()
      while (!this.isEOF() && !this.checkSymbol(']')) {
        valueTokens.push(this.advance())
      }
      this.matchSymbol(']')
    }
    const trailingComment = this.check('comment') ? this.advance().text : undefined
    this.consumeLineRemainder()
    return { kind: 'alias', name, valueTokens, trailingComment }
  }

  private parseSection(): SectionNode {
    const headerTokens: FormatToken[] = [this.advance()]
    while (!this.isEOF() && !this.checkSymbol('{') && !this.startsLineBoundary()) {
      if (this.check('comment')) {
        break
      }
      headerTokens.push(this.advance())
    }
    this.matchSymbol('{')

    const items: SectionItemNode[] = []
    while (!this.isEOF() && !this.checkSymbol('}')) {
      if (this.check('comment')) {
        items.push(this.parseComment())
        continue
      }
      if (this.checkSymbol('%')) {
        items.push(this.parseAlias())
        continue
      }
      if (this.checkIdent('track')) {
        items.push(this.parseTrack())
        continue
      }
      items.push(this.parseSimpleLine())
    }
    this.matchSymbol('}')

    return { kind: 'section', headerTokens, items }
  }

  private parseTrack(): TrackNode {
    const headerTokens: FormatToken[] = [this.advance()]
    while (
      !this.isEOF() &&
      !this.startsLineBoundary() &&
      !this.checkSymbol('{') &&
      !this.checkIdent('refer')
    ) {
      if (this.check('comment')) {
        break
      }
      headerTokens.push(this.advance())
    }

    if (this.checkIdent('refer')) {
      const referTokens: FormatToken[] = [this.advance()]
      while (!this.isEOF() && !this.startsLineBoundary()) {
        referTokens.push(this.advance())
      }
      return { kind: 'track', headerTokens, referTokens }
    }

    if (!this.matchSymbol('{')) {
      this.consumeLineRemainder()
      return { kind: 'track', headerTokens }
    }

    const items: TrackItemNode[] = []
    while (!this.isEOF() && !this.checkSymbol('}')) {
      if (this.check('comment')) {
        items.push(this.parseComment())
        continue
      }
      if (this.checkSymbol('|')) {
        items.push(this.parseBar())
        continue
      }
      items.push(this.parseSimpleLine())
    }
    this.matchSymbol('}')

    return { kind: 'track', headerTokens, items }
  }

  private parseBar(): BarNode {
    this.advance()
    const tokens: FormatToken[] = []
    while (!this.isEOF() && !this.checkSymbol('|') && !this.check('comment')) {
      tokens.push(this.advance())
    }
    this.matchSymbol('|')
    const trailingComment = this.check('comment') ? this.advance().text : undefined
    this.consumeLineRemainder()
    return { kind: 'bar', events: parseBarEventDrafts(tokens), trailingComment }
  }

  private parseSimpleLine(): SimpleLineNode {
    const tokens: FormatToken[] = []
    while (!this.isEOF() && (tokens.length === 0 || !this.startsLineBoundary())) {
      tokens.push(this.advance())
      if (tokens[tokens.length - 1]?.kind === 'comment') {
        break
      }
    }
    return { kind: 'line', tokens }
  }

  private consumeLineRemainder(): void {
    while (!this.isEOF() && !this.startsLineBoundary()) {
      this.advance()
    }
  }

  private check(kind: FormatToken['kind']): boolean {
    return this.peek().kind === kind
  }

  private checkSymbol(value: string): boolean {
    return this.peek().kind === 'symbol' && this.peek().text === value
  }

  private checkIdent(value: string): boolean {
    return this.peek().kind === 'ident' && this.peek().text === value
  }

  private matchSymbol(value: string): boolean {
    if (this.checkSymbol(value)) {
      this.advance()
      return true
    }
    return false
  }

  private startsLineBoundary(): boolean {
    if (this.pos === 0 || this.isEOF()) {
      return false
    }
    return this.tokens[this.pos - 1]?.line !== this.peek().line
  }

  private previous(): FormatToken {
    return this.tokens[this.pos - 1] ?? this.tokens[0]!
  }

  private advance(): FormatToken {
    const token = this.tokens[this.pos]!
    this.pos += 1
    return token
  }

  private peek(): FormatToken {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!
  }

  private isEOF(): boolean {
    return this.peek().kind === 'eof'
  }
}

export function buildIr(tokens: FormatToken[]): DocumentIr {
  return new IrBuilder(tokens).build()
}

function parseBarEventDrafts(tokens: FormatToken[]): BarEventDraft[] {
  const events: BarEventDraft[] = []
  let pos = 0

  const peek = (): FormatToken | undefined => tokens[pos]
  const advance = (): FormatToken | undefined => {
    const token = tokens[pos]
    pos += 1
    return token
  }
  const matchSymbol = (value: string): boolean => {
    const token = peek()
    if (token?.kind === 'symbol' && token.text === value) {
      pos += 1
      return true
    }
    return false
  }

  const compactPitchOrAlias = (): string => {
    if (matchSymbol('%')) {
      const alias = advance()
      return `%${alias?.text ?? ''}`
    }
    const token = advance()
    if (!token) {
      return ''
    }
    let text = token.text
    if (matchSymbol('#')) {
      text += '#'
    }
    const maybeOctave = peek()
    if (maybeOctave?.kind === 'number' && isIntegerLiteral(maybeOctave.text)) {
      text += maybeOctave.text
      advance()
    }
    return text
  }

  while (pos < tokens.length) {
    const token = peek()
    if (!token || token.kind === 'comment') {
      break
    }

    let text = ''
    let durationUnit: string | undefined
    let dotted = false

    if (matchSymbol('[')) {
      const parts: string[] = []
      while (pos < tokens.length && !matchSymbol(']')) {
        parts.push(compactPitchOrAlias())
      }
      text = `[${parts.filter(Boolean).join(' ')}]`
    } else {
      text = compactPitchOrAlias()
    }

    if (matchSymbol('/')) {
      const durationToken = advance()
      if (durationToken) {
        durationUnit = durationToken.text
        text += `/${durationToken.text}`
      }
      if (matchSymbol('.')) {
        dotted = true
        text += '.'
      }
    }

    if (matchSymbol('@')) {
      const velocityToken = advance()
      text += `@${velocityToken?.text ?? ''}`
    }

    if (text.length > 0) {
      events.push({ text, durationUnit, dotted })
    } else {
      advance()
    }
  }

  return events
}

function isIntegerLiteral(value: string): boolean {
  return /^[0-9]+$/.test(value)
}
