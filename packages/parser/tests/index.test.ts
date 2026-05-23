import { expect, test } from "vite-plus/test";
import { parse } from "../src/index.ts";
import type { StatementNode } from "@yyds-lang/ast/types";

test("parse reads headers and sections", () => {
  const program = parse(`
tempo 120
meter 4/4
section intro {
  track lead {
    | C4 / q D4 / q |
  }
}
play intro
`);
  expect(program.type).toBe("Program");
  expect(program.body.some((node: StatementNode) => node.type === "Header")).toBe(true);
  const section = program.body.find((node: StatementNode) => node.type === "Section");
  expect(section?.type).toBe("Section");
  if (section?.type === "Section") {
    expect(section.tracks.length).toBe(1);
    expect(section.tracks[0]?.bars.length).toBe(1);
  }
});

test("parse track refer", () => {
  const program = parse(`
section intro {
  track low {
    | C2 / q |
  }
}
section verse {
  track low refer intro -> low
}
play verse
`);

  const verse = program.body.find(
    (node): node is Extract<StatementNode, { type: "Section" }> =>
      node.type === "Section" && node.name === "verse",
  );
  expect(verse).toBeDefined();
  expect(verse?.tracks[0]?.ref?.section).toBe("intro");
  expect(verse?.tracks[0]?.ref?.track).toBe("low");
});
