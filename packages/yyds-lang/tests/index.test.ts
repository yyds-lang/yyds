import { expect, test } from "vite-plus/test";
import { analyze, parse, tokenize, YYDS_SCOPE_NAME } from "../src/index.ts";

test("aggregate package exports core APIs", () => {
  const tokens = tokenize("tempo 120\nsection intro {}\n");
  const program = parse("tempo 120\nsection intro {}\n");
  const semantic = analyze(program);

  expect(tokens.length > 0).toBe(true);
  expect(program.type).toBe("Program");
  expect(Array.isArray(semantic.diagnostics)).toBe(true);
  expect(YYDS_SCOPE_NAME).toBe("source.yyds");
});
