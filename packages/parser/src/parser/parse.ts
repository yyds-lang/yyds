import type {
  BarNode,
  HeaderNode,
  PlayNode,
  ProgramNode,
  Range,
  SectionNode,
  StatementNode,
  TrackNode,
  Token,
} from "@yyds-lang/ast/types";
import { tokenize } from "@yyds-lang/lexer";

export const PARSER_HEADER_KEYWORDS = [
  "tempo",
  "meter",
  "key",
  "unit",
  "song",
  "velocity",
] as const;
export const PARSER_CONTROL_KEYWORDS = ["section", "track", "play", "refer"] as const;

function emptyRange(): Range {
  return {
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 1, offset: 0 },
  };
}

function toHeaderNode(key: string, value: string, token: Token): HeaderNode {
  return {
    type: "Header",
    key,
    value,
    range: token.range,
  };
}

function toSectionNode(name: string, token: Token): SectionNode {
  return {
    type: "Section",
    name,
    tracks: [],
    range: token.range,
  };
}

function isToken(token: Token | undefined, type: string, value?: string): boolean {
  return token?.type === type && (value === undefined || token.value === value);
}

function mergeRange(start: Range["start"], end: Range["end"]): Range {
  return { start, end };
}

class Parser {
  private readonly headerKeys: ReadonlySet<string> = new Set(PARSER_HEADER_KEYWORDS);
  private readonly tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ProgramNode {
    const body: StatementNode[] = [];
    while (!this.isEOF()) {
      const token = this.peek();
      if (!token) {
        break;
      }
      if (token.type === "ident" && this.headerKeys.has(token.value)) {
        body.push(this.parseHeader());
        continue;
      }
      if (isToken(token, "ident", "section")) {
        body.push(this.parseSection());
        continue;
      }
      if (isToken(token, "ident", "play")) {
        body.push(this.parsePlay());
        continue;
      }
      this.advance();
    }

    return {
      type: "Program",
      body,
      range:
        body.length > 0
          ? mergeRange(body[0].range.start, body[body.length - 1].range.end)
          : emptyRange(),
    };
  }

  private parseHeader(): HeaderNode {
    const keyToken = this.advance()!;
    const key = keyToken.value;

    if (key === "meter") {
      const num = this.takeValue();
      const slash = isToken(this.peek(), "symbol", "/") ? this.advance()!.value : "";
      const den = this.takeValue();
      return toHeaderNode(key, `${num}${slash}${den}`.trim(), keyToken);
    }

    const value = this.takeValue();
    return toHeaderNode(key, value, keyToken);
  }

  private parseSection(): SectionNode {
    const sectionToken = this.advance()!;
    const nameToken = this.peek();
    const sectionName = nameToken?.type === "ident" ? this.advance()!.value : "anonymous";
    const section = toSectionNode(sectionName, sectionToken);

    while (!this.isEOF() && !isToken(this.peek(), "symbol", "{")) {
      this.advance();
    }
    if (isToken(this.peek(), "symbol", "{")) {
      this.advance();
    }

    const tracks: TrackNode[] = [];
    while (!this.isEOF() && !isToken(this.peek(), "symbol", "}")) {
      if (isToken(this.peek(), "ident", "track")) {
        tracks.push(this.parseTrack());
      } else {
        this.advance();
      }
    }
    if (isToken(this.peek(), "symbol", "}")) {
      const close = this.advance()!;
      section.range = mergeRange(section.range.start, close.range.end);
    }
    section.tracks = tracks;
    return section;
  }

  private parseTrack(): TrackNode {
    const trackToken = this.advance()!;
    let instrument: string | undefined;
    if (isToken(this.peek(), "symbol", "[")) {
      this.advance();
      if (this.peek()?.type === "ident") {
        instrument = this.advance()!.value;
      }
      if (isToken(this.peek(), "symbol", "]")) {
        this.advance();
      }
    }

    const name = this.peek()?.type === "ident" ? this.advance()!.value : "track";
    const bars: BarNode[] = [];
    let ref: TrackNode["ref"];

    while (
      !this.isEOF() &&
      !isToken(this.peek(), "symbol", "{") &&
      !isToken(this.peek(), "ident", "refer")
    ) {
      this.advance();
    }

    if (isToken(this.peek(), "ident", "refer")) {
      this.advance();
      const refSection = this.peek()?.type === "ident" ? this.advance()!.value : "";
      if (isToken(this.peek(), "symbol", "->")) {
        this.advance();
      } else if (isToken(this.peek(), "symbol", "-")) {
        this.advance();
        if (isToken(this.peek(), "symbol", ">")) {
          this.advance();
        }
      }
      const refTrack = this.peek()?.type === "ident" ? this.advance()!.value : "";
      ref = { section: refSection, track: refTrack };
    } else if (isToken(this.peek(), "symbol", "{")) {
      this.advance();
      while (!this.isEOF() && !isToken(this.peek(), "symbol", "}")) {
        if (isToken(this.peek(), "symbol", "|")) {
          bars.push(this.parseBar());
          continue;
        }
        this.advance();
      }
      if (isToken(this.peek(), "symbol", "}")) {
        this.advance();
      }
    }

    const end = this.tokens[Math.max(this.pos - 1, 0)]?.range.end ?? trackToken.range.end;
    return {
      type: "Track",
      name,
      instrument,
      ref,
      bars,
      range: mergeRange(trackToken.range.start, end),
    };
  }

  private parseBar(): BarNode {
    const start = this.advance()!;
    const events: string[] = [];
    while (
      !this.isEOF() &&
      !isToken(this.peek(), "symbol", "|") &&
      !isToken(this.peek(), "symbol", "}")
    ) {
      events.push(this.advance()!.value);
    }
    const endToken = isToken(this.peek(), "symbol", "|") ? this.advance()! : start;
    return {
      type: "Bar",
      events,
      range: mergeRange(start.range.start, endToken.range.end),
    };
  }

  private parsePlay(): PlayNode {
    const playToken = this.advance()!;
    const section = this.peek()?.type === "ident" ? this.advance()!.value : "";
    const end = this.tokens[Math.max(this.pos - 1, 0)]?.range.end ?? playToken.range.end;
    return {
      type: "Play",
      section,
      range: mergeRange(playToken.range.start, end),
    };
  }

  private takeValue(): string {
    const token = this.peek();
    if (!token || token.type === "eof") {
      return "";
    }
    this.advance();
    return token.value;
  }

  private isEOF(): boolean {
    return isToken(this.peek(), "eof");
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token | undefined {
    const token = this.tokens[this.pos];
    this.pos += 1;
    return token;
  }
}

export function parseTokens(tokens: Token[]): ProgramNode {
  return new Parser(tokens).parse();
}

export function parse(code: string): ProgramNode {
  return parseTokens(tokenize(code));
}
