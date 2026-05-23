import { expect, test } from "vite-plus/test";
import { analyzeDocument, getDefinition, getHover, getRenameEdits } from "../src/index.ts";

const demo = `
%C = [A2 C#3 E3 A3]
section intro {
  track lead {
    | [%C] C4 / q |
  }
}
play intro
`;

test("hover and definition resolve macro alias", () => {
  const analysis = analyzeDocument(demo);
  const definition = getDefinition(analysis, { line: 5, column: 8 });
  expect(definition?.id).toBe("macro:C");

  const hover = getHover(analysis, { line: 5, column: 8 });
  expect(hover?.title).toBe("%C");
  expect(hover?.value).toBe("[A2 C#3 E3 A3]");
});

test("rename edits include declaration and references", () => {
  const analysis = analyzeDocument(demo);
  const edits = getRenameEdits(analysis, { line: 5, column: 8 }, "CMaj");
  expect(edits.length).toBeGreaterThanOrEqual(2);
});
