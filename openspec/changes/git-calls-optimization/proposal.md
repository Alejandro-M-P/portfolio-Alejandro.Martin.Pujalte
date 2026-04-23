# Proposal: git-calls-optimization

## Intent

Reduce redundant GitHub API calls and add intelligent caching to prevent duplicate fetches for the same data. Current implementation makes uncached calls to endpoints like `/repos/{slug}`, `/repos/{slug}/languages`, and `/repos/{slug}/readme` repeatedly without any deduplication.

## Scope

### In Scope
- Map all GitHub API call sites and identify duplicate calls
- Add in-memory cache with TTL for read-only GitHub API responses
- Implement cache invalidation for user-triggered actions (publish, upload)
- Cache `GET /user/repos` and activity endpoints

### Out of Scope
- Serverless edge caching (requires external infrastructure)
- Git blob/tree/commit caching for publish flow (stateless, one-time operations)

## Capabilities

### New Capabilities
- `github-api-cache`: In-memory cache layer for GitHub API GET requests with configurable TTL
- `cached-repo-details`: Cached `getRepoDetails()` with automatic invalidation on publish

### Modified Capabilities
- None at spec level — this is a pure performance optimization

## Approach

Create a `GitHubAPICache` class in `src/lib/github-server.ts` that:
1. Wraps all `fetch()` calls for GET endpoints
2. Uses Map<string, { data, expiresAt }> for in-memory caching
3. Default TTL: 5 minutes for repo details, 2 minutes for user repos
4. Invalidates cache on publish/upload actions
5. Uses Promise.all pattern for multi-endpoint fetches (existing) but caches each response individually

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/github-server.ts` | Modified | Add GitHubAPICache class and wrap fetch calls |
| `src/pages/api/github.ts` | Modified | Connect publish action to cache invalidation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale data returned from cache | Med | Configure appropriate TTL, clear on publish |
| Memory leak from unbounded cache | Low | Add max-size eviction (LRU) with 50 entry limit |

## Rollback Plan

1. Remove GitHubAPICache class from `github-server.ts`
2. Revert `github.ts` to direct fetch calls
3. No migration needed — purely additive change

## Dependencies

- None — no external packages required

## Success Criteria

- [ ] `getRepoDetails()` returns cached response on second call within TTL
- [ ] Cache invalidated when `publish` action succeeds
- [ ] No duplicate fetch calls visible in network logs for same endpoint within TTL window