# Tasks: admin-load-flow

## Phase 1: Core Implementation

- [ ] 1.1 Modify `load` function in `src/components/admin/AdminPanel.tsx` — add JSON fallback logic using async/await for the fetch call, while keeping localStorage sync path first

## Phase 2: Error Handling

- [ ] 2.1 Add try-catch around fetch to `/data/projects.json` — on failure, log error and display empty state gracefully (Scenario 3)

## Phase 3: Testing

- [ ] 3.1 Test with localStorage empty (incognito) — projects visible from JSON
- [ ] 3.2 Test after clearing cache — JSON fallback loads
- [ ] 3.3 Test with network failure — graceful empty state, no crash

## Phase 4: Integration

- [ ] 4.1 Verify data consistency after edit/save — localStorage wins
- [ ] 4.2 Verify after publish (simulated) — reads updated JSON on reload

---

**Implementation Notes:**
- Current: `load = useCallback(() => { const stored = localStorage.getItem('portfolioProjects'); if (stored) setProjects(JSON.parse(stored)); }, []);`
- New: Wrap in async, add `fetch('/data/projects.json')` after localStorage null check
- Keep localStorage write behavior unchanged (handles data consistency scenarios 4-5)