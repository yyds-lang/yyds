import type { Position, Range, Token } from "@yyds-lang/ast/types";

const SYMBOLS = new Set(["{", "}", "[", "]", "|", "/", ".", "@", "%", "=", "-", ">", "+"]);

function createPosition(line: number, column: number, offset: number): Position {
  return { line, column, offset };
}

function createRange(start: Position, end: Position): Range {
  return { start, end };
}

function isAlphaNumeric(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  while (index < source.length) {
    const char = source[index];

    if (char === "\n") {
      index += 1;
      line += 1;
      column = 1;
      continue;
    }

    if (char === " " || char === "\t" || char === "\r") {
      index += 1;
      column += 1;
      continue;
    }

    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") {
        index += 1;
        column += 1;
      }
      continue;
    }

    const start = createPosition(line, column, index);

    if (char === '"') {
      let value = '"';
      index += 1;
      column += 1;
      while (index < source.length && source[index] !== '"') {
        value += source[index];
        index += 1;
        column += 1;
      }
      if (source[index] === '"') {
        value += '"';
        index += 1;
        column += 1;
      }
      tokens.push({
        type: "string",
        value,
        range: createRange(start, createPosition(line, column, index)),
      });
      continue;
    }

    if (/[0-9]/.test(char)) {
      let value = "";
      while (index < source.length && /[0-9.]/.test(source[index])) {
        value += source[index];
        index += 1;
        column += 1;
      }
      tokens.push({
        type: "number",
        value,
        range: createRange(start, createPosition(line, column, index)),
      });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let value = "";
      while (index < source.length && isAlphaNumeric(source[index])) {
        value += source[index];
        index += 1;
        column += 1;
      }
      tokens.push({
        type: "ident",
        value,
        range: createRange(start, createPosition(line, column, index)),
      });
      continue;
    }

    if (char === "-" && source[index + 1] === ">") {
      index += 2;
      column += 2;
      tokens.push({
        type: "symbol",
        value: "->",
        range: createRange(start, createPosition(line, column, index)),
      });
      continue;
    }

    if (SYMBOLS.has(char)) {
      index += 1;
      column += 1;
      tokens.push({
        type: "symbol",
        value: char,
        range: createRange(start, createPosition(line, column, index)),
      });
      continue;
    }

    // Unknown characters are surfaced as symbol tokens for downstream diagnostics.
    index += 1;
    column += 1;
    tokens.push({
      type: "symbol",
      value: char,
      range: createRange(start, createPosition(line, column, index)),
    });
  }

  const eof = createPosition(line, column, index);
  tokens.push({
    type: "eof",
    value: "",
    range: createRange(eof, eof),
  });

  return tokens;
}
