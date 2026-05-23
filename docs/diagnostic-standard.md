# Diagnostic Standard

## 1. Shape

Diagnostic shape is defined in `@yyds-lang/ast/types`:

- `code`
- `severity`
- `message`
- `range`

## 2. Code Prefixes

- `YYDS_LEX_*`
- `YYDS_PARSE_*`
- `YYDS_SEM_*`

Current canonical constants:

- `packages/ast/src/diagnostic/codes.ts`

## 3. Severity

Allowed values:

- `error`
- `warning`
- `info`

Current constants:

- `YYDS_DIAGNOSTIC_SEVERITY.ERROR`
- `YYDS_DIAGNOSTIC_SEVERITY.WARNING`
- `YYDS_DIAGNOSTIC_SEVERITY.INFO`

## 4. Range Rule

- Every diagnostic must include precise `range`.
- Parser and semantic diagnostics use source range from related node/token.
