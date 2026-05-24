# `modern-monaco/shiki` Missing Type Export Repro

## Summary

`modern-monaco` publishes root and core type declarations, but the `./shiki` subpath in `exports` does not provide a `types` entry. TypeScript consumers hit `TS7016` when importing `modern-monaco/shiki`.

## Current Package Export

`modern-monaco@0.4.1` `package.json`:

```json
"./shiki": {
  "import": "./dist/shiki.mjs"
}
```

No corresponding `types` path is exposed.

## Reproduction

```ts
// repro.ts
import * as shiki from 'modern-monaco/shiki'

console.log(shiki)
```

Run:

```bash
pnpm exec tsc --noEmit
```

TypeScript error:

```txt
TS7016: Could not find a declaration file for module 'modern-monaco/shiki'
```

## Expected

`modern-monaco/shiki` should be importable in TypeScript without local patching (`@ts-ignore` / `declare module`).

## Suggested Fix

Add a typed export for `./shiki` in `modern-monaco`:

```json
"./shiki": {
  "import": "./dist/shiki.mjs",
  "types": "./types/shiki.d.ts"
}
```

And ship `types/shiki.d.ts` covering:

- `initShiki`
- `initShikiMonacoTokenizer`
- `registerShikiMonacoTokenizer`
- `setDefaultWasmLoader`
- `textmateThemeToMonacoTheme`

## Why This Matters

- Avoids local type hacks in consumers.
- Enables clean usage of `modern-monaco` + Shiki best-practice flows.
- Keeps strongly typed runtime wrappers in downstream language packages.
