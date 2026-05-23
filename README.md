# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

## YYDS Core Baseline

- Grammar baseline: `docs/grammar-spec.md`
- Grammar change/version policy: `docs/grammar-change-policy.md`
- AST contract: `docs/ast-contract.md`
- Diagnostic standard: `docs/diagnostic-standard.md`
- Shared fixtures: `fixtures/valid`, `fixtures/invalid`, `fixtures/edge`

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run -r test
```

- Build the monorepo:

```bash
vp run -r build
```

- Run the development server:

```bash
vp run dev
```
