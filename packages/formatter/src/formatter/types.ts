import type { Diagnostic, Range, Token } from '@yyds-lang/ast/types'

export type FormatTokenKind = 'eof' | 'ident' | 'number' | 'string' | 'symbol' | 'comment'

export interface FormatToken {
  kind: FormatTokenKind
  text: string
  line: number
  column: number
  range: Range
}

export interface CommentNode {
  kind: 'comment'
  text: string
}

export interface SimpleLineNode {
  kind: 'line'
  tokens: FormatToken[]
}

export interface AliasNode {
  kind: 'alias'
  name: string
  valueTokens: FormatToken[]
  trailingComment?: string
}

export interface BarNode {
  kind: 'bar'
  events: BarEventDraft[]
  trailingComment?: string
}

export interface BarEventDraft {
  text: string
  durationUnit?: string
  dotted: boolean
}

export interface TrackNode {
  kind: 'track'
  headerTokens: FormatToken[]
  referTokens?: FormatToken[]
  items?: TrackItemNode[]
}

export type TrackItemNode = CommentNode | SimpleLineNode | BarNode

export interface SectionNode {
  kind: 'section'
  headerTokens: FormatToken[]
  items: SectionItemNode[]
}

export type SectionItemNode = CommentNode | AliasNode | TrackNode | SimpleLineNode
export type TopLevelNode = CommentNode | AliasNode | SectionNode | SimpleLineNode

export interface DocumentIr {
  nodes: TopLevelNode[]
}

export interface BarEvent {
  text: string
  duration: number
}

export interface NormalizedBarNode {
  kind: 'bar'
  events: BarEvent[]
  trailingComment?: string
}

export interface NormalizedTrackNode {
  kind: 'track'
  headerTokens: FormatToken[]
  referTokens?: FormatToken[]
  items?: NormalizedTrackItemNode[]
}

export type NormalizedTrackItemNode = CommentNode | SimpleLineNode | NormalizedBarNode
export type NormalizedSectionItemNode =
  | CommentNode
  | AliasNode
  | NormalizedTrackNode
  | SimpleLineNode

export interface NormalizedSectionNode {
  kind: 'section'
  headerTokens: FormatToken[]
  items: NormalizedSectionItemNode[]
}

export type NormalizedTopLevelNode =
  | CommentNode
  | AliasNode
  | NormalizedSectionNode
  | SimpleLineNode

export interface NormalizedDocumentIr {
  nodes: NormalizedTopLevelNode[]
}

export interface FormatterOptions {
  finalNewline?: boolean
  lineEnding?: '\n' | '\r\n'
}

export interface FormatResult {
  code: string
  changed: boolean
  diagnostics: Diagnostic[]
}

export interface ScannedDocument {
  formatTokens: FormatToken[]
  parserTokens: Token[]
}
