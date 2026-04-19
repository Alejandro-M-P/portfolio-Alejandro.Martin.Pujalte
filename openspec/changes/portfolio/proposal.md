# Proposal: Portfolio V3

## Intent

Build a professional developer portfolio using Astro + React + Tailwind CSS that reflects "Structural Honesty" and precise engineering. The portfolio will showcase ALEJANDRO.MP's technical work through 5 main sections (NODO 01-05) and an Admin Panel for project management via GitHub API.

## Scope

### In Scope
- Astro project with React islands architecture
- Brutalist design system (Industrial Structuralism per DESIGN.md)
- 5 main sections: Identity, Deployments, Tech Stack Matrix, System Logs, Ambitions
- Admin panel at /admin with password protection (env var)
- GitHub API integration for CRUD operations on projects.json
- Responsive design (mobile-friendly)
- Deployment-ready for Vercel/GitHub Pages

### Out of Scope
- Backend server (static site only)
- Full authentication system (password-only protection)
- Database (JSON file via GitHub API)

## Capabilities

### New Capabilities
- `portfolio-identity`: Profile section with photo, name, availability bar, contact CTA
- `portfolio-deployments`: Project grid with modal showing architecture/specs
- `portfolio-tech-stack`: Matrix showing tools, versions, usage levels
- `portfolio-system-logs`: Terminal-style log viewer with real commit data
- `portfolio-ambitions`: Roadmap with short/mid/long-term goals
- `portfolio-admin`: Protected admin panel with CRUD for projects

### Modified Capabilities
- None (new project)

## Approach

1. Initialize Astro project with minimal template
2. Add React integration (`npx astro add react`)
3. Add Tailwind CSS with custom brutalist config
4. Implement base layout with grid background texture
5. Build each NODO component following atomic design
6. Create React islands for modal and admin panel
7. Integrate GitHub API for project data persistence

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/` | New | Main pages (index.astro, admin.astro) |
| `src/components/` | New | Atomic UI components |
| `src/layouts/` | New | BaseLayout with grid background |
| `src/styles/` | New | Tailwind config + custom CSS |
| `public/` | New | Static assets (images) |
| `src/lib/` | New | GitHub API client |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| GitHub API rate limits | Medium | Cache requests, show user feedback |
| React hydration issues | Low | Use client:only for interactive islands |
| Modal complexity | Medium | Build separately, integrate gradually |

## Rollback Plan

1. **Deployment fails**: Revert to previous git commit
2. **Design mismatch**: Adjust Tailwind config, no structural changes
3. **GitHub API failure**: Display error message, allow retry

## Dependencies

- Node.js 18+
- GitHub personal access token (for API CRUD)
- Vercel account (deployment target)

## Success Criteria

- [ ] Astro project builds without errors
- [ ] All 5 sections render correctly
- [ ] Admin panel performs CRUD operations
- [ ] Responsive design works on mobile
- [ ] Deploys to Vercel successfully