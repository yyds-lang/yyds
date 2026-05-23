export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Token {
  type: string;
  value: string;
  range: Range;
}

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  range: Range;
}

export interface AstNode {
  type: string;
  range: Range;
}

export interface HeaderNode extends AstNode {
  type: "Header";
  key: string;
  value: string;
}

export interface TrackRefNode {
  section: string;
  track: string;
}

export interface BarNode extends AstNode {
  type: "Bar";
  events: string[];
}

export interface TrackNode extends AstNode {
  type: "Track";
  name: string;
  instrument?: string;
  ref?: TrackRefNode;
  bars: BarNode[];
}

export interface SectionNode extends AstNode {
  type: "Section";
  name: string;
  tracks: TrackNode[];
}

export interface PlayNode extends AstNode {
  type: "Play";
  section: string;
}

export type StatementNode = HeaderNode | SectionNode | PlayNode;

export interface ProgramNode extends AstNode {
  type: "Program";
  body: StatementNode[];
}
