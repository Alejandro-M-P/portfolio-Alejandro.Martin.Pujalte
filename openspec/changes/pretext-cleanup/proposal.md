# Proposal: pretext-cleanup

## Intent

Remove the unused `@chenglou/pretext` dependency from package.json to eliminate ~19KB of unnecessary bundle size. The package is installed but never imported or used anywhere in the codebase, and there is no problem (performance, CLS, or otherwise) that PRETEXT would solve for this static portfolio.

## Scope

### In Scope
- Remove `@chenglou/pretext` from `package.json` dependencies
- Remove corresponding entry from `package-lock.json`
- Verify no import statements reference PRETEXT

### Out of Scope
- Implementing PRETEXT for learning purposes (overkill — no problem to solve)
- Adding virtualization to the project list (static JSON, 10-20 items)

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None — this is a dependency cleanup that does not affect existing spec behavior.

## Approach

1. Run `npm uninstall @chenglou/pretext` to remove the dependency from package.json and package-lock.json
2. Verify no code references `@chenglou/pretext` (grep search)
3. Confirm bundle size reduction

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Removed | Line 18: `@chenglou/pretext` dependency |
| `package-lock.json` | Removed | PRETEXT entry and its sub-dependencies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Accidental removal of needed package | Low | Verify zero imports before running uninstall |
| Lockfile merge conflicts | Low | Standard npm uninstall handles this cleanly |

## Rollback Plan

Run `npm install @chenglou/pretext@^0.0.6` to restore the dependency. No code changes needed to revert.

## Dependencies

- None — direct package removal, no prerequisites required.

## Success Criteria

- [ ] `@chenglou/pretext` removed from package.json dependencies
- [ ] No imports of `@chenglou/pretext` exist in codebase
- [ ] Dev server runs without errors after removal