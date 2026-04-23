# Proposal: admin-load-flow

## Intent

Fix the admin panel's broken data loading flow. Currently it ONLY reads from localStorage, which leaves projects invisible when localStorage is empty (first visit, cleared cache, incognito mode). The admin must load from localStorage FIRST, then fallback to JSON files, ensuring projects are always visible in the admin panel.

## Scope

### In Scope
- Modify `ProjectsTab` load function to try localStorage first, then fetch from `/data/projects.json`
- Ensure after publish, admin reads back from JSON files (public/data/*.json)
- Fix data consistency between editor state and public files

### Out of Scope
- GitHub API integration for read (only reads from local JSON files)
- Schema changes to project data structure

## Capabilities

### Modified Capabilities
- `portfolio-admin`: Change loading behavior from "read only from localStorage" to "read localStorage → fallback to JSON files"

## Approach

1. Modify `load` callback (AdminPanel.tsx line 236-241) to:
   - Try localStorage.getItem('portfolioProjects') first
   - If null/empty → fetch('/data/projects.json') as fallback
   - Both should populate `projects` state
2. After edit/save → continue saving to localStorage (current behavior)
3. After GitHub publish → fetch from `/data/projects.json` on next load (reads the updated public file)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/admin/AdminPanel.tsx` | Modified | ProjectsTab load function (lines 236-241) |
| `public/data/projects.json` | Read | Fallback data source |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Race condition if localStorage & JSON differ | Low | localStorage wins; JSON is fallback-only |
| Build fails due to fetch type | Low | Add proper typing or use `any` temporarily |

## Rollback Plan

Revert AdminPanel.tsx back to original load function that only reads from localStorage. The JSON files remain unchanged.

## Dependencies

- None (uses existing JSON file in public/data/)

## Success Criteria

- [ ] Load admin in incognito → projects visible from JSON fallback
- [ ] Load admin after clearing cache → projects visible from JSON fallback
- [ ] Publish project → re-load admin → reads updated JSON data