# Tasks: GitHub API Calls Optimization

## Phase 1: Infrastructure

- [ ] 1.1 Create `GitHubAPICache` class in `src/lib/github-server.ts` with Map<string, { data, expiresAt }> storage
- [ ] 1.2 Add `get()` method for cache lookup with TTL checking
- [ ] 1.3 Add `set()` method with LRU eviction (max 50 entries, evict oldest)
- [ ] 1.4 Add `clear()` method for cache invalidation

## Phase 2: Core Implementation

- [ ] 2.1 Wrap `getRepoDetails()` fetch calls in cache (5-min TTL for repo details)
- [ ] 2.2 Modify `getRepoDetails()` to cache each endpoint independently (/repos, /languages, /readme)
- [ ] 2.3 Create `getActivityCached()` in `github-server.ts` with 2-min TTL for /users/{username}/events
- [ ] 2.4 Create `getUserReposCached()` in `github-server.ts` with 2-min TTL for /user/repos

## Phase 3: Integration & Invalidation

- [ ] 3.1 Export cache clear function from `github-server.ts`
- [ ] 3.2 Call cache clear in `handlePublish()` after successful publish (line ~168 in github.ts)
- [ ] 3.3 Add try/catch in publish handler to NOT clear cache on failure (spec scenario)

## Phase 4: Verification

- [ ] 4.1 Test: Second `getRepoDetails()` call returns cached data (log check)
- [ ] 4.2 Test: Cache hit response under 10ms
- [ ] 4.3 Test: After publish, subsequent calls fetch fresh data
- [ ] 4.4 Test: Cache respects 50-entry limit via LRU eviction