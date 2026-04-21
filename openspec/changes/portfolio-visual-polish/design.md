# Design: Portfolio Visual Polish

## Technical Approach

Visual polish implementing focus states, project limit, token consolidation, and transition timing — without layout or logic changes. Approach: React state for expand control, global CSS for focus ring, single token source in CSS.

---

## Architecture Decisions

### Decision: Projects Expand State

**Choice**: Manage expand state with React useState in `ProjectGrid`, slice from full sorted array
**Alternatives considered**: Astro islands with client-side directive — unnecessary complexity
**Rationale**: Component already loads client-side state; adding expand state is minimal change

### Decision: Focus Ring Implementation

**Choice**: Single `:focus-visible` rule in `global.css` with cobalt outline
**Alternatives considered**: Class-based per-component focus — violates DRY, inconsistent
**Rationale**: Tailwind v4 supports CSS-first approach; `:focus-visible` hides from mouse users

### Decision: Token Source of Truth

**Choice**: Keep colors in `global.css` `@theme`, remove from `tailwind.config.mjs`
**Alternatives considered**: Keep both — duplicate sources cause drift
**Rationale**: Tailwind v4 prefers CSS-first; global.css already has all tokens

### Decision: Transition Duration

**Choice**: Standardize on `duration-150` for hover transitions
**Alternatives considered**: Keep existing `duration-100` — inconsistent, too fast
**Rationale**: 150ms feels more deliberate; spec explicitly calls for polish

---

## Data Flow

```
ProjectGrid loads projects → sorted by score → slice(0, expanded ? ALL : 3)
                                        ↓
                              ExpandButton shows when projects.length > 3
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/deployments/ProjectGrid.tsx` | Modify | Add `expanded` state, change limit 6→3, update button style |
| `src/styles/global.css` | Modify | Add `:focus-visible` rule |
| `tailwind.config.mjs` | Modify | Remove duplicate color definitions |

---

## Implementation Details

### ProjectGrid.tsx

```
- const featured = projects.slice(0, 6)
+ const [expanded, setExpanded] = useState(false)
+ const limit = expanded ? projects.length : 3
+ const featured = projects.slice(0, limit)

- {projects.length > 6 && (
+ {projects.length > 3 && (
   <button className="... border border-cobalt/50 text-cobalt text-xs tracking-widest uppercase px-4 py-2 hover:bg-cobalt hover:text-white">
     [+] EXPAND_MODULES ({projects.length})
   </button>
```

### global.css

```css
/* Add after @theme block */
:focus-visible {
  outline: 2px solid var(--color-cobalt);
  outline-offset: 2px;
}
```

### tailwind.config.mjs

Remove entire `colors` object — keep only `content` and empty `theme.extend`.

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | 3 projects shown initially | Manual: reload page, count cards |
| Visual | Expand button shows count | Manual: check button text |
| Visual | Focus ring on Tab | Manual: Tab through elements |
| Visual | No ring on click | Manual: click element |

**No unit tests**: Visual DOM, no logic to test.

---

## Migration / Rollout

No migration required. CSS-only changes deploy instantly.

---

## Open Questions

- [ ] None — spec covers all requirements