# YYDS Grammar Specification Baseline

This document freezes the P0 grammar baseline for `yyds-lang`.

## 1. Keywords

Authoritative keyword source:

- `packages/textmate/src/textmate/keywords.ts`

Current baseline keywords:

- `yyds`, `song`, `tempo`, `velocity`, `meter`, `key`, `unit`, `octave`, `strict`
- `section`, `track`, `play`, `repeat`, `after`, `refer`
- `instrument`, `volume`, `pan`, `mute`, `solo`, `transpose`, `allow_unbalanced`

## 2. Lexical Classes

- **Comments**: `// ...`
- **Strings**: `"..."` (single-line)
- **Numbers**: integer and decimal
- **Operators/Symbols**: `|`, `@`, `%`, `=`, `->`, `-`, `/`, `.`, `{}`, `[]`

## 3. Structural Blocks

- Header lines: `tempo`, `meter`, `key`, `unit`, `song`, `velocity`
- Section block:
  - `section <name> { ... }`
- Track definition:
  - `track [instrument] <name> { | ... | }`
  - `track [instrument] <name> refer <section> -> <track>`
- Play statement:
  - `play <section>`

## 4. P0 Supported Surface

P0 guarantees:

- Parse headers, sections, tracks, refer, bars, play
- Produce AST for above structures
- Produce semantic diagnostics for duplicate section and track reference errors

P0 non-goals:

- Full event-level AST (`note/rest/chord/tie` details)
- Full meter duration validation
- LSP semantic token stream
