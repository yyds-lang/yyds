import { expect, test } from "vite-plus/test";
import { AST_PACKAGE, YYDS_DIAGNOSTIC_CODES, YYDS_DIAGNOSTIC_SEVERITY } from "../src/index.ts";
import type { ProgramNode } from "../src/types/index.ts";

test("program node shape is importable", () => {
  const program: ProgramNode = {
    type: "Program",
    body: [],
    range: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
  };

  expect(program.type).toBe("Program");
  expect(AST_PACKAGE).toBe("@yyds-lang/ast");
});

test("ast contract keeps stable core fields", () => {
  const sampleProgram: ProgramNode = {
    type: "Program",
    body: [],
    range: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
  };
  expect(Object.keys(sampleProgram).sort()).toEqual(["body", "range", "type"]);
});

test("diagnostic constants follow standard prefixes", () => {
  expect(YYDS_DIAGNOSTIC_CODES.SEM_UNKNOWN_SECTION.startsWith("YYDS_SEM_")).toBe(true);
  expect(YYDS_DIAGNOSTIC_CODES.PARSE_UNEXPECTED_TOKEN.startsWith("YYDS_PARSE_")).toBe(true);
  expect(YYDS_DIAGNOSTIC_CODES.LEX_UNTERMINATED_STRING.startsWith("YYDS_LEX_")).toBe(true);
  expect(YYDS_DIAGNOSTIC_SEVERITY.ERROR).toBe("error");
});
