# Design: Full Portfolio Polish

## Technical Approach

This change implements a comprehensive polish pass across the portfolio, implementing nine coordinated spec items that improve data handling, layout, modal layering, terminal functionality, and UI naming. All data flows from JSON files through index.astro as props to child components—no hardcoded fallbacks persist in component files.

## Architecture Decisions

### Decision: Z-Index Layering for Modals

**Choice**: Elevate ProjectModal z-index to 9999 (container) and backdrop to 9998
**Alternatives considered**: Maintain z-50 / z-49; use z-100 / z-99
**Rationale**: Current z-50 conflicts with BaseLayout.astro nav (z-50) and mobile menu (z-40). Raising to 9999 ensures modal always floats above all UI elements including fixed navigation.

### Decision: Initial Limit Constant

**Choice**: Define `INITIAL_LIMIT = 6` as a named constant at top of ProjectGrid.tsx
**Alternatives considered**: Inline `slice(0, 6)`; pass limit as prop from index.astro
**Rationale**: Named constant communicates intent clearly. Props would add unnecessary prop-drilling; inline magic numbers obscure meaning.

### Decision: CV Download Functionality

**Choice**: Add `download` attribute to IdentitySection CV anchor with filename from cvUrl
**Alternatives considered**: Use download API; trigger blob download programmatically
**Rationale**: HTML5 `download` attribute is simplest, requires no JavaScript, works with existing `cvUrl` prop. Browser handles naming automatically.

### Decision: Terminal Command Parsing

**Choice**: Intercept `wget` commands in LogTerminal and trigger CV download
**Alternatives considered**: Add command palette modal; use custom terminal emulator
**Rationale**: Fits existing terminal aesthetic. Simple string matching (`startsWith('wget')`) is lightweight and requires no new dependencies.

### Decision: Terminal Text Handling

**Choice**: Add `whitespace-normal` to terminal message container, use custom `wrap-break-word` class for overflow
**Alternatives considered**: CSS grid; JavaScript word-wrap
**Rationale**: Tailwind-native approach. `whitespace-normal` collapses excess space; `wrap-break-word` handles long unbreakable strings like URLs.

## Data Flow

```
public/data/*.json
        │
        ▼ (imported in index.astro)
index.astro
        │
        ├── props ──► IdentitySection ({ cvUrl, ... })
        ├── props ──► ProjectGrid ({ projects: from projects.json })
        │
        ▼ (client-side hydration via localStorage)
        ProjectGrid.tsx ──► ProjectModal.tsx
        TechMatrix.tsx ──► AllTechModal.tsx
        LogTerminal.tsx
```

**No hardcoded fallbacks**: Each component accepts props but receives data exclusively from index.astro. LocalStorage hydration provides runtime sync from admin panel updates only—not static fallbacks.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/deployments/ProjectGrid.tsx` | Modify | Change `INITIAL_LIMIT` from 3 to 6 |
| `src/components/deployments/ProjectModal.tsx` | Modify | Bump z-index: z-50 → z-9999, backdrop z-49 → z-9998 |
| `src/components/identity/IdentitySection.tsx` | Modify | Add `download=""` to CV anchor |
| `src/components/systemlogs/LogTerminal.tsx` | Modify | Rename header text "TERMINAL", add wget handler, fix text wrap |
| `src/pages/index.astro` | Modify | Reorder sections: Projects > TechStack > Roadmap; pass initialLimit prop |
| `openspec/changes/portfolio-full-polish/specs/` | Create | Delta specs artifact store |

## Implementation Details

### ProjectGrid.tsx (INITIAL_LIMIT)

```tsx
// Line 11: change from 3 to 6
const INITIAL_LIMIT = 6;
```

### ProjectModal.tsx (Z-Index)

```tsx
// Line 154: backdrop
className="fixed inset-0 z-[9998] ..."

// Line 157: modal container
className="... z-[9999] ..."
```

### IdentitySection.tsx (CV Download)

```tsx
// Line 57-64: add download attribute
<a
  href={cvUrl}
  download // extracts filename from URL
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
```

### LogTerminal.tsx (Header + wget)

```tsx
// Line 235: rename header text
<span className="text-xs text-text-faint tracking-widest uppercase">TERMINAL &gt;_</span>

// Add wget handler in fetchGitHubActivity or new function:
// Match: entry.message.toLowerCase().startsWith('wget')
// Action: trigger CV download via IdentitySection pattern
```

### index.astro (Layout Reorder)

Current order in `<main>`:
- IdentitySection (left sidebar)
- ProjectGrid (Projects section)
- TechMatrix (TECH_STACK)
- Roadmap (ROADMAP)

Target order for main content area:
- Projects >
- TechStack >
- Roadmap

Section IDs for navigation anchors already exist in BaseLayout.astro nav.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | INITIAL_LIMIT = 6 | Verify ProjectGrid renders 6 items initially |
| Unit | Modal z-index | Verify ProjectModal above nav |
| Integration | CV download | Click CV button, verify download initiates |
| Integration | Terminal wget | Type "wget cv.pdf", verify download |
| E2E | Layout order | Visual verification: Projects → TechStack → Roadmap |

## Migration / Rollout

No data migration required. All changes are UI/UX improvements with no breaking changes to persisted data. Feature flags not needed—all specs are always-enabled.

## Open Questions

- [ ] Should terminal wget accept full URL or just "wget cv.pdf"? — *Recommend shorthand for simplicity*
- [ ] Confirm cv filename extraction from URL works across browsers — *download attribute behavior is standard but filename parsing varies*

## Related Artifacts

- `openspec/changes/portfolio-full-polish/specs/` — Delta specifications
- `public/data/projects.json` — Project data source
- `public/data/settings.json` — CV URL configuration