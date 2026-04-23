# Tasks: pretext-cleanup

## Phase 1: Pre-Uninstall Verification

- [x] 1.1 Search codebase for `@chenglou/pretext` or `pretext` imports using grep (include: *.ts, *.tsx, *.js, *.jsx)
- [x] 1.2 Confirm zero import statements found — dependency is safe to remove

## Phase 2: Dependency Removal

- [x] 2.1 Run `npm uninstall @chenglou/pretext` to remove from package.json and package-lock.json
- [x] 2.2 Verify `@chenglou/pretext` removed from package.json dependencies
- [x] 2.3 Verify PRETEXT entry removed from package-lock.json

## Phase 3: Post-Removal Verification

- [x] 3.1 Run `npm run dev` to start dev server
- [x] 3.2 Confirm server starts without errors
- [x] 3.3 Verify application loads correctly

## Phase 4: Cleanup (Optional)

- [ ] 4.1 Verify bundle size reduction if applicable