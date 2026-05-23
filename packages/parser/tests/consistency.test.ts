import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { expect, test } from "vite-plus/test";
import { YYDS_KEYWORDS, yydsGrammar } from "@yyds-lang/textmate";
import { PARSER_CONTROL_KEYWORDS, PARSER_HEADER_KEYWORDS, parse } from "../src/index.ts";

const fixture = (...segments: string[]) =>
  resolve(fileURLToPath(new URL("../../../fixtures", import.meta.url)), ...segments);

test("parser keywords are covered by textmate keywords", () => {
  const textmateKeywords = new Set(YYDS_KEYWORDS);
  for (const keyword of PARSER_HEADER_KEYWORDS) {
    expect(textmateKeywords.has(keyword)).toBe(true);
  }
  for (const keyword of PARSER_CONTROL_KEYWORDS) {
    expect(textmateKeywords.has(keyword)).toBe(true);
  }
});

test("parser can parse valid fixture", () => {
  const code = readFileSync(fixture("valid", "basic-song.yyds"), "utf8");
  const program = parse(code);
  expect(program.body.some((node) => node.type === "Section")).toBe(true);
  expect(program.body.some((node) => node.type === "Play")).toBe(true);
});

test("textmate repository covers parser-relevant token groups", () => {
  expect(yydsGrammar.repository.keywords).toBeDefined();
  expect(yydsGrammar.repository.operators).toBeDefined();
  expect(yydsGrammar.repository.numbers).toBeDefined();
});
