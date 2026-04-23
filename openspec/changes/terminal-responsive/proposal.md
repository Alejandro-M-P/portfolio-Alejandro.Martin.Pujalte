# Proposal: Terminal-Responsive

## Intent

Fix the desktop layout when the terminal doesn't fit well (ultra-wide, smaller laptops, fractional widths). Add a toggle button to show/hide the terminal and move IdentitySection to the bottom of the left column when terminal is hidden.

## Scope

### In Scope
- Responsive detection for "terminal toggle mode" on Desktop
- Toggle button to show/hide terminal
- Reorder: Identity at bottom (after Projects, TechStack, Roadmap on right)
- Terminal visibility state management

### Out of Scope
- Mobile layout changes (already handled)
- New terminal functionality
- Changes to terminal internal behavior

## Capabilities

### New Capabilities
- `terminal-toggle-mode`: Detects when desktop screen is too narrow for the terminal and enables a toggle button to show/hide terminal. Identity moves to bottom of left column when terminal is hidden.

### Modified Capabilities
- None

## Approach

1. **Detection logic**: Use a `ResizeObserver` + media query threshold to detect when terminal doesn't fit (`min-height` constraint violated or computed width < threshold)
2. **Toggle state**: Add `isTerminalVisible` state managed at layout level (index.astro), passed to components
3. **Terminal wrapper**: Show/hide terminal shell based on state; show a styled button when hidden
4. **Layout reorder**: When terminal hidden, IdentitySection moves to bottom of left column (currently at top)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/index.astro` | Modified | Add toggle state, conditional rendering, reorder left column |
| `src/components/terminal/CoreConsole.tsx` | Modified | Accept `showToggle` prop or expose toggle via parent |
| `src/components/identity/IdentitySection.tsx` | No change | Already compatible |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Layout shift on detection | Low | Use CSS transition for smooth toggle |
| State persistence | Low | Store toggle state in sessionStorage |

## Rollback Plan

1. Revert index.astro to previous state (git checkout)
2. Terminal always visible, Identity at top (original layout)

## Dependencies

- None (purely CSS + React state)

## Success Criteria

- [ ] Desktop with narrow width: Terminal toggle button visible
- [ ] Desktop with ample width: Terminal always visible, Identity at bottom
- [ ] Toggle persists state across viewport resize
- [ ] No layout shift on toggle animation