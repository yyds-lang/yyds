# AST Contract Baseline

## Stable Core Nodes

Defined in `packages/ast/src/ast/index.ts`:

- `ProgramNode`
- `HeaderNode`
- `SectionNode`
- `TrackNode`
- `TrackRefNode`
- `BarNode`
- `PlayNode`

## Contract Rules

- Existing field names are immutable unless major version bump.
- Field removal/rename is breaking.
- New fields must be additive and optional by default unless major bump.
- `range` is mandatory for all AST nodes.

## Current P1 Guidance

- Parser and semantic must consume the same AST shape.
- VSCode adapter layer should depend on AST contract, not parser internals.
- Contract changes must be documented in `CHANGELOG.md`.
