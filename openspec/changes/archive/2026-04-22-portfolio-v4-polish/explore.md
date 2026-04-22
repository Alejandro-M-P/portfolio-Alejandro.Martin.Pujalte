# Exploration Report: portfolio-v4-polish

## 1. Security: GitHub API Decentralization
The current implementation exposes `PUBLIC_GITHUB_TOKEN` and makes direct calls to the GitHub API from the client-side.

### Findings
- **Vulnerabilities**: `PUBLIC_GITHUB_TOKEN` is accessible in the browser. Direct calls to `api.github.com` from `.tsx` components (`AdminPanel`, `LogTerminal`, `ProjectModal`) reveal repository structures and potentially leak rate limits.
- **Current Usage**:
  - `AdminPanel.tsx`: Fetches repo details, languages, and README for sync.
  - `LogTerminal.tsx`: Fetches public events for the user.
  - `ProjectModal.tsx`: Fetches README and contents for display.
- **Parameters Needed**: `repoSlug`, `username`, `path`.

### Proposed Solution
Move all GitHub API logic to `src/pages/api/github.ts`.
- **New Actions**:
  - `getRepoDetails`: Combines repo info, languages, and README parsing.
  - `getUserActivity`: Fetches public events.
  - `getRepoContent`: Fetches specific files/README.
- **Security**: Remove `PUBLIC_GITHUB_TOKEN` and use the server-side `GITHUB_TOKEN` exclusively.

## 2. Robustness: README Frontmatter Parsing
The `parseReadme` function currently relies on fragile regex for "Architecture" and "Tech Stack" sections.

### Findings
- **Current Regex**:
  - Architecture: `/#+\s*(architect\w*|structure|design|overview)[^\n]*\n([\s\S]*?)(?=\n#+\s|\n---|\n___|\n\*\*\*|$)/i`
  - Tech Stack: ``/`([A-Za-z][A-Za-z0-9+#._-]{1,20})`/g``

### Proposed Solution
Integrate a manual parser for Frontmatter (YAML or JSON) that runs before the regex.
- **Logic**: Check if the README starts with `---` (YAML) or `---json` (JSON).
- **Benefit**: Allows project owners to explicitly define metadata (ID, Stack, Architecture, Impact) in the README without relying on section headers.

## 3. Warm Cache: Vercel KV & Cron
Currently, there is no server-side caching, leading to redundant API calls and potential rate limiting.

### Findings
- **Stack**: Astro 5.18 on Vercel.
- **Missing Deps**: `@vercel/kv`.

### Proposed Solution
1. **Cron Job**: Create `src/pages/api/cron/sync-github.ts`.
2. **Vercel Config**: Add cron schedule in `vercel.json`.
3. **Batching**: Sync 5 projects at a time using a "cursor" stored in KV.
4. **Logic**:
   - Cron triggers every hour.
   - Fetches projects from `public/data/projects.json`.
   - Updates Vercel KV with fresh data from GitHub.
   - Respects GitHub rate limits by batching and using the server-side token.

## 4. UX Sync: Local Storage vs. Server Cache
The AdminPanel manages state in `localStorage`, which can drift from the published data or the server cache.

### Findings
- **Load Pattern**: `AdminPanel` loads directly from `localStorage.getItem('portfolioProjects')`.
- **Sync Trigger**: `PUBLISH_BRIDGE` sends `localStorage` data to GitHub.

### Proposed Solution
- **Diffing Logic**: Upon AdminPanel mount, fetch the "Latest Known Good" state from the server cache (Vercel KV via `/api/github?action=getCache`).
- **Conflict Detection**: Compare `localStorage` hashes with server cache hashes.
- **Feedback**: If mismatch, log `[WARN] LOCAL_BUFFER_OUT_OF_SYNC` in the Core console.
- **Manual Sync**: Add a button to "FORCE_PULL_FROM_CACHE" to overwrite local drift.

## Design Decisions & Bugs
- **Bug**: `AdminPanel.tsx` uses `atob` for README content, which might fail with non-ASCII characters. Use `Buffer.from(data, 'base64').toString('utf-8')` on the server-side.
- **Decision**: Centralize all "Data Orchestration" in the server-side API to enable future transitions to a real database if needed.
