# Grammar Change Policy and Versioning

## 1. Single Source Principle

- TextMate grammar source of truth: `packages/textmate/src/textmate/grammar.ts`
- Keyword source of truth: `packages/textmate/src/textmate/keywords.ts`

Any grammar-related change must update these sources first.

## 2. Change Classification

- **Patch**: bug fix, no grammar surface change
- **Minor**: additive grammar feature, backward-compatible
- **Major**: breaking grammar behavior or AST contract change

## 3. Mandatory Change Checklist

Every grammar change must include:

1. Spec update in `docs/grammar-spec.md`
2. Tests update:
   - textmate regression tests
   - parser/semantic consistency tests
3. Changelog entry under `CHANGELOG.md` `Unreleased`
4. Compatibility note (if minor/major behavior shift)

## 4. Version Strategy

- Grammar/token behavior changes follow semver in package releases.
- AST field removal or rename requires major version bump.
- New optional fields may be minor version if fully backward-compatible.
