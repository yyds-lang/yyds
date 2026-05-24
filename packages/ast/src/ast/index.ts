export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface Position {
  line: number
  column: number
  offset: number
}

export interface Range {
  start: Position
  end: Position
}

export interface Token {
  type: string
  value: string
  range: Range
}

export interface Diagnostic {
  code: string
  severity: DiagnosticSeverity
  message: string
  range: Range
}

export interface AstNode {
  type: string
  range: Range
}

export interface HeaderNode extends AstNode {
  type: 'Header'
  key: string
  value: string
}

export interface ChordAliasNode extends AstNode {
  type: 'ChordAlias'
  name: string
  nameRange: Range
  value: string
  notes: string[]
}

export interface TrackRefNode {
  section: string
  track: string
  sectionRange?: Range
  trackRange?: Range
}

export interface ChordAliasRefNode {
  name: string
  range: Range
}

export interface BarNode extends AstNode {
  type: 'Bar'
  events: string[]
  chordRefs: ChordAliasRefNode[]
}

export interface TrackNode extends AstNode {
  type: 'Track'
  name: string
  nameRange: Range
  instrument?: string
  ref?: TrackRefNode
  bars: BarNode[]
}

export interface SectionNode extends AstNode {
  type: 'Section'
  name: string
  nameRange: Range
  tracks: TrackNode[]
}

export interface PlayNode extends AstNode {
  type: 'Play'
  section: string
  sectionRange: Range
}

export type StatementNode = HeaderNode | ChordAliasNode | SectionNode | PlayNode

export interface ProgramNode extends AstNode {
  type: 'Program'
  body: StatementNode[]
}
