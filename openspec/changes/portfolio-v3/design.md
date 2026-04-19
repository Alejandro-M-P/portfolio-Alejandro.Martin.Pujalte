# Design: Portfolio V3

## Technical Approach

Build a professional Astro + React + Tailwind portfolio following the "Structural Honesty" brutalist aesthetic. Use Astro Islands architecture to mix static content with React interactive components. The main page (`/`) renders 5 NODO sections statically with selective hydration for interactivity (modals, checkboxes). The admin page (`/admin`) is a full React island for CRUD operations via GitHub API.

## Architecture Decisions

### Decision: Astro Islands Hydration Strategy

**Choice**: Use `client:visible` for ProjectModal, `client:idle` for Roadmap checkboxes, `client:only="react"` for Admin, static for all display components.

**Alternatives considered**: All React (unnecessary hydration), All static with vanilla JS (less maintainable).

**Rationale**:
- ProjectModal: only loads JS when user clicks a card → `client:visible`
- Roadmap: toggle state after page idle → `client:idle`  
- Admin: full interactivity, no SSR needed → `client:only`
- Identity/TechStack/SystemLogs: display-only, no hydration → static HTML

### Decision: Component Architecture - Atomic Design

**Choice**: Create reusable primitives in `src/components/ui/` (Box, Pill, ProgressBar) used by domain components in feature folders.

**Alternatives considered**: Flat component structure, CSS-only components.

**Rationale**:
- Box/Pill/ProgressBar provide consistent brutalist geometry (0px radius, 1px borders)
- Feature folders (identity/, deployments/, techstack/, systemlogs/, ambitions/) co-locate domain logic
- Atomic pattern scales as more sections are added

### Decision: Data Flow Architecture

**Choice**: Fetch-time hydration pattern — static JSON at build time + client-side GitHub API fetch for admin/live data.

**Alternatives considered**: Server-side fetching at runtime, client-only fetching.

**Rationale**:
- Build-time: Projects load from local JSON or fetched at build → SEO-friendly, fast initial load
- Client: GitHub API for admin CRUD and live commit logs → eventual consistency
- LocalStorage: Roadmap checkbox state persists client-side

```
Static Build          Client Fetch              API Layer
[projects.json] ──→ [index.astro] ──→ [ProjectCard]
                            │
                            └──→ GitHub API ──→ [AdminPanel]
                                                  │
                                          [projects.json update]
```

### Decision: GitHub API Integration

**Choice**: Direct client-side API calls from Admin React island using Octokit.

**Alternatives considered**: Serverless functions, proxy API route.

**Rationale**:
- No server needed — static site deploys to Vercel/Cloudflare Pages
- Personal access token stored in env var, revealed only to admin
- Direct calls keep deployment simple; token exposed only to authenticated admin
- Rate limiting handled client-side with retry logic

### Decision: Tailwind Configuration

**Choice**: Custom Tailwind config with brutalist design tokens, zero border-radius, custom colors mapped to design system.

**Alternatives considered**: CSS-only design system, Tailwind plugins.

**Rationale**:
- Brand colors as Tailwind theme extension (carbono, cobalt)
- `rounded-none` explicit in config to prevent accidental rounding
- Fonts configured as theme extension (IBM Plex Mono, Inter)
- Grid-dot background via custom CSS class, not Tailwind

### Decision: Route Structure

**Choice**: Two routes — `/` (main portfolio) and `/admin` (React-only admin panel).

**Alternatives considered**: Single-page with hash navigation, API routes for admin.

**Rationale**:
- Separate `/admin` keeps main portfolio static/SEO-friendly
- Admin password-protected via client-side check (env var comparison)
- No API routes = no server = simpler deployment

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     RENDER PATH                             │
├─────────────────────────────────────────────────────────────┤
│  index.astro (static)                                        │
│    ├── ProfilePhoto      → static img                           │
│    ├── AvailabilityBar → static (no state)               │
│    ├── ContactButton   → static link                       │
│    ├── ProjectGrid    → static map from projects.json     │
│    │     └── ProjectModal (client:visible)              │
│    ├── TechMatrix    → static table                     │
│    ├── LogTerminal   → static + optional client fetch    │
│    └── Roadmap       → static + client:idle toggle     │
│                                                             │
│  admin.astro (client:only)                                 │
│    └── AdminPanel                                         │
│        ├── PasswordForm                                   │
│        ├── ProjectForm                                   │
│        └── GitHub API (PUT/GET/DELETE)                    │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/pages/index.astro` | Create | Main portfolio page, 5 NODO sections |
| `src/pages/admin.astro` | Create | Protected admin panel (React island) |
| `src/layouts/BaseLayout.astro` | Create | HTML shell + grid background |
| `src/components/ui/Box.tsx` | Create | Atomic container (border, padding) |
| `src/components/ui/Pill.tsx` | Create | Atomic badge (uppercase, border) |
| `src/components/ui/ProgressBar.tsx` | Create | Atomic progress indicator |
| `src/components/identity/ProfilePhoto.tsx` | Create | Circular profile image |
| `src/components/identity/AvailabilityBar.tsx` | Create | Blue progress bar |
| `src/components/identity/ContactButton.tsx` | Create | CTA button |
| `src/components/deployments/ProjectCard.tsx` | Create | Grid item card |
| `src/components/deployments/ProjectGrid.tsx` | Create | Responsive grid container |
| `src/components/deployments/ProjectModal.tsx` | Create | Detail modal (client:visible) |
| `src/components/techstack/TechMatrix.tsx` | Create | 3-column table |
| `src/components/techstack/UsageBar.tsx` | Create | Segmented progress bar |
| `src/components/systemlogs/LogTerminal.tsx` | Create | Terminal-style display |
| `src/components/ambitions/Roadmap.tsx` | Create | 3-section roadmap |
| `src/components/ambitions/Checkbox.tsx` | Create | Square checkbox |
| `src/lib/github.ts` | Create | GitHub API client (Octokit) |
| `src/styles/global.css` | Create | Tailwind + grid-dot texture |
| `tailwind.config.mjs` | Create | Brutalist theme config |
| `tsconfig.json` | Create | TypeScript config |
| `astro.config.mjs` | Create | Astro + React + Tailwind |
| `public/projects.json` | Create | Project data seed |
| `.env.example` | Create | Env var template |

## Interfaces

```typescript
// From portfolio-deployments/spec.md
interface Project {
  id: string;
  name: string;
  photo: string;
  stack: string[];
  architecture: string;
  initSequence: string;
  specs: Record<string, string | string[]>;
}

// From portfolio-tech-stack/spec.md  
interface TechTool {
  name: string;
  version: string;
  usageLevel: number;
}

// From portfolio-system-logs/spec.md
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'MILESTONE';
  message: string;
}

// From portfolio-ambitions/spec.md
interface Ambition {
  id: string;
  section: 'short' | 'mid' | 'long';
  text: string;
  completed: boolean;
}

// From portfolio-admin/spec.md
interface AdminProject {
  id: string;
  title: string;
  gitUrl: string;
  status: 'active' | 'archived' | 'planned';
  tags: string[];
  ambitions: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Atomic components (Box, Pill, ProgressBar) | Vitest + @testing-library/react |
| Integration | ProjectModal open/close flow | Playwright (click card → modal visible) |
| Integration | Admin CRUD flow | Playwright (fill form → submit → verify) |
| E2E | Full portfolio render | Playwright (screenshot diff base) |
| Config | Tailwind build | Verify no errors on `astro build` |

## Migration / Rollout

**No migration required** — Greenfield project. Rollout sequence:

1. Initialize Astro + React + Tailwind
2. Create base layout and global styles
3. Build atomic components
4. Build each NODO section in order:
   - NODO 01: Identity
   - NODO 02: Deployments  
   - NODO 03: Tech Stack
   - NODO 04: System Logs
   - NODO 05: Ambitions
5. Build admin panel
6. Connect GitHub API
7. Deploy to Vercel

## Open Questions

- [ ] **GitHub API Storage**: Should projects.json live in the repo (git-backed) or as a GitHub Gist? Git-backed is simpler but requires commits; Gist offers easier API updates.

- [x] **Local Storage vs. Server**: Roadmap checkbox state uses localStorage. Should this sync to a shared store? Currently "offline-first" — acceptable for personal portfolio.

- [ ] **Environment Strategy**: Production env vars (GITHUB_TOKEN) must not exposed to client. Will admin use serverless functions or direct API? Direct API, token sent only after password verification (client-side gate).

---

**Status**: success
**Summary**: Created technical design for Portfolio V3. Documented 6 architecture decisions, Astro islands strategy, data flow, file changes (24 new files), TypeScript interfaces, and testing approach.
**Artifacts**: `openspec/changes/portfolio-v3/design.md` | Engram `sdd/portfolio-v3/design`
**Next**: sdd-tasks
**Risks**: None identified — all decisions have clear rationale.
**Skill Resolution**: fallback-registry — loaded skill-registry to apply compact rules