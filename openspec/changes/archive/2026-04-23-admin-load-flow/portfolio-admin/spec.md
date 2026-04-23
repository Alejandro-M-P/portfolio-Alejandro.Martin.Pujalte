# Delta for: portfolio-admin

## Context
**Stack**: React 19, TypeScript, Vercel.
**Change**: admin-load-flow — Fix broken data loading in admin panel.

---

## ADDED Requirements

### Requirement: Admin Projects Data Load Fallback

The admin panel **MUST** provide a two-tier fallback strategy for loading project data, ensuring projects are always visible regardless of localStorage state.

#### Scenario: Projects Load from localStorage (Primary)

- GIVEN the user has previously saved projects in localStorage
- WHEN the admin panel loads
- THEN the system **MUST** populate the projects list from `localStorage.getItem('portfolioProjects')`
- AND the UI **MUST** display these projects immediately

#### Scenario: Projects Load from JSON Fallback (localStorage Empty)

- GIVEN localStorage is empty or cleared (first visit, incognito, cleared cache)
- WHEN the admin panel loads and localStorage returns null/empty
- THEN the system **MUST** fetch from `/data/projects.json` as fallback
- AND the UI **MUST** display projects from the JSON file

#### Scenario: JSON Fetch Failure (Network Error)

- GIVEN the network request to `/data/projects.json` fails
- WHEN the fallback fetch is attempted
- THEN the system **MUST** handle the error gracefully
- AND the UI **MUST** display an empty projects list (no crash)

---

## MODIFIED Requirements

### Requirement: Admin Projects Data Source Priority

(Previously: Only read from localStorage — no fallback exists)

The admin panel **MUST** prioritize localStorage over JSON files when both contain data. The localStorage source is the authoritative/editable state; JSON files serve as readonly fallback for new/incognito sessions.

#### Scenario: Data Consistency — Edit Mode

- GIVEN the user edits and saves a project in the admin panel
- WHEN the save action completes
- THEN the system **MUST** update `localStorage.getItem('portfolioProjects')` with the new state
- AND subsequent loads **MUST** read from localStorage first (localStorage wins)

#### Scenario: Data Consistency — After Publish

- GIVEN the user has published changes to the public JSON files (via GitHub Pages deploy)
- WHEN the admin panel reloads after the publish
- THEN the system **MUST** attempt localStorage first
- AND if localStorage is empty, **MUST** read from the updated `/data/projects.json`
- AND the UI **MUST** display the newly published project data

---

## Requirements Summary

| Type | Count |
|------|-------|
| ADDED | 1 (3 scenarios) |
| MODIFIED | 1 (2 scenarios) |
| REMOVED | 0 |

---

## Coverage

| Category | Status |
|----------|--------|
| Happy path (localStorage) | Covered (Scenario 1) |
| Fallback path (JSON) | Covered (Scenario 2) |
| Error state (network fail) | Covered (Scenario 3) |
| Data consistency | Covered (Modified Scenarios 1-2) |