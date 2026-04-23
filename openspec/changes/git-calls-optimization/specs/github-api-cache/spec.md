# Delta for GitHub API Optimization

## ADDED Requirements

### Requirement: GitHubAPICache In-Memory Cache Layer

The system MUST implement an in-memory cache layer for GitHub API GET requests to reduce redundant network calls.

The cache MUST store responses with a configurable TTL and return cached data when available within the TTL window.

#### Scenario: Cache Hit for Repo Details

- GIVEN a previous call to `getRepoDetails('owner/repo')` completed within the last 5 minutes
- WHEN `getRepoDetails('owner/repo')` is called again
- THEN the system MUST return the cached response without making a new fetch to GitHub API
- AND the response time MUST be under 10ms (cache lookup time)

#### Scenario: Cache Miss Forces Fresh Fetch

- GIVEN no previous call to `getRepoDetails('owner/repo')` or TTL has expired (5+ minutes)
- WHEN `getRepoDetails('owner/repo')` is called
- THEN the system MUST make a fresh fetch to GitHub API endpoints (/repos, /languages, /readme)
- AND MUST store the response in cache with new expiration timestamp

#### Scenario: LRU Eviction Prevents Memory Growth

- GIVEN the cache has reached 50 stored entries
- WHEN a new cache entry is added
- THEN the system MUST evict the oldest (least recently used) entry
- AND the total in-memory cache size MUST NOT exceed 50 entries

### Requirement: Cache Invalidation on Publish

The system MUST invalidate relevant cache entries when a publish action succeeds to ensure fresh data on next fetch.

The cache MUST clear all stored entries when a publish operation completes successfully.

#### Scenario: Cache Cleared After Publish

- GIVEN cache contains entries from multiple previous `getRepoDetails()` calls
- WHEN a publish action completes successfully
- THEN the system MUST invalidate all cached GitHub API responses
- AND subsequent `getRepoDetails()` calls MUST fetch fresh data from GitHub API

#### Scenario: Publish Failure Does Not Clear Cache

- GIVEN cache contains valid entries from previous calls
- WHEN a publish action fails with an error
- THEN the system MUST NOT invalidate the cache
- AND subsequent calls continue to return cached data

### Requirement: Independent Caching for Multi-Endpoint Fetches

The system MUST cache each GitHub API endpoint response independently even when fetched together via Promise.all.

Each endpoint (/repos/{slug}, /repos/{slug}/languages, /repos/{slug}/readme) MUST have its own cache entry.

#### Scenario: Partial Cache Hit

- GIVEN /repos/{slug} is cached but /languages and /readme are not
- WHEN `getRepoDetails('owner/repo')` is called
- THEN the system MUST fetch only /languages and /readme
- AND must combine cached /repos response with fresh /languages and /readme responses

### Requirement: User Activity Cache

The system MUST implement a separate cache for user activity endpoint with shorter TTL.

The activity endpoint (`/users/{username}/events/public`) MUST have a TTL of 2 minutes.

#### Scenario: Activity Cache Hit

- GIVEN a previous call to getActivity('username') completed within the last 2 minutes
- WHEN getActivity('username') is called again
- THEN the system MUST return the cached response without making a new fetch
- AND subsequent calls within TTL window MUST NOT increment GitHub API rate limit counter

### Requirement: User Repos Cache

The system MUST implement a cache for user repos endpoint with TTL of 2 minutes.

The endpoint (`/user/repos`) MUST have a TTL of 2 minutes for user repository lists.

#### Scenario: User Repos Cache Hit

- GIVEN a previous call to `getUserRepos()` completed within the last 2 minutes
- WHEN `getUserRepos()` is called again
- THEN the system MUST return the cached response without making a new fetch to GitHub API