# Proposal: Portfolio Visual Design Improvements

## Intent

Fix critical design system issues: duplicate color tokens (tailwind.config.mjs + global.css have mismatched hex values), flat typography with no hierarchy, inconsistent UI component patterns (Box lacks variants while Button has them), missing accessibility focus states, and repeated inline section headers. Goal: elevate visual quality while preserving terminal/brutalist identity.

## Scope

### In Scope
- Consolidate all design tokens to single source (global.css @theme)
- Add typography scale tokens using IBM Plex Mono weights
- Refactor Box component to support variants (like Button)
- Add visible focus states for keyboard navigation
- Extract reusable SectionHeader component

### Out of Scope
- Color palette changes (keep existing carbono/cobalt/bronze)
- Font changes (keep IBM Plex Mono)
- Adding new UI components beyond fixes above

## Capabilities

### New Capabilities
- `design-tokens`: Unified token system with typography scale
- `focus-states`: Keyboard-accessible focus indicators

### Modified Capabilities
- `ui-box`: Add variant support (solid, outline, ghost)
- `ui-section-header`: Extract from inline to reusable component

## Approach

1. **Token Consolidation**: Remove colors from tailwind.config.mjs, keep only @theme in global.css (Tailwind v4 pattern). Verify all components reference CSS variables, not hardcoded values.

2. **Typography Scale**: Add to @theme:
   - `--font-size-xs/sm/base/lg/xl/2xl/3xl`
   - `--font-weight-light/normal/medium/semibold/bold`
   - `--tracking-tight/normal/widest`

3. **Box Variants**: Refactor to support `variant` prop (solid | outline | ghost) matching Button pattern.

4. **Focus States**: Add `:focus-visible` ring using cobalt color, remove from :focus (mouse users).

5. **SectionHeader**: Create component with consistent styling for all section titles.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `tailwind.config.mjs` | Modified | Remove duplicate colors, keep minimal config |
| `src/styles/global.css` | Modified | @theme becomes single source of truth |
| `src/components/ui/Box.tsx` | Modified | Add variant prop |
| `src/components/ui/Button.tsx` | Modified | Add focus-visible styles |
| `src/components/ui/Pill.tsx` | Modified | Add focus-visible styles |
| `src/components/ui/SectionHeader.tsx` | New | Extract reusable header |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Components still reference old Tailwind classes | Medium | Audit all usages post-refactor |
| Break existing inline styles | Low | Only add, don't remove unless redundant |

## Rollback Plan

1. Restore tailwind.config.mjs from git
2. Revert global.css @theme to previous state
3. Revert Box.tsx to pre-variant version
4. Delete SectionHeader.tsx

## Dependencies

- None (pure refactoring, no external deps)

## Success Criteria

- [ ] All colors defined only in global.css @theme
- [ ] Box has variant prop matching Button pattern
- [ ] SectionHeader component exists and used in all sections
- [ ] Focus states visible on Tab navigation
- [ ] No hardcoded color values in components
