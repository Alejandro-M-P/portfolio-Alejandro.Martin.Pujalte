# Portfolio Admin Specification

## Purpose

This specification defines the protected admin panel for CRUD operations on projects, managed via GitHub API to update projects.json.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono, Inter
- Geometry: 0px border-radius, 1px borders

## Requirements

### Requirement: Admin Route Protection

The /admin route MUST be protected by password authentication.

#### Scenario: No credentials provided

- GIVEN user navigates to /admin
- WHEN no session exists
- THEN display password input prompt
- AND show "ENTER_ADMIN_ACCESS" header

#### Scenario: Wrong password entered

- GIVEN user enters incorrect password
- WHEN submitting password
- THEN display error message "ACCESS_DENIED"
- AND do NOT grant access

#### Scenario: Correct password entered

- GIVEN user enters correct password (matches env var)
- WHEN submitting password
- THEN grant access to admin panel
- AND create session/token for subsequent requests

#### Scenario: Session expires

- GIVEN session token exists but is expired
- WHEN accessing admin route
- THEN redirect to password prompt

### Requirement: Admin Form Fields

The admin form MUST include the following fields for project CRUD:

- Title (text input, required)
- Git URL (text input, URL validation)
- Status (dropdown: "active" | "archived" | "planned")
- Tags (comma-separated input)
- Ambitions (textarea for goal descriptions)

#### Scenario: Form renders all fields

- GIVEN the admin panel loads
- WHEN viewing the form
- THEN all fields display with correct labels
- AND required fields are marked

#### Scenario: Form validation - required fields

- GIVEN submitting with empty Title
- WHEN user clicks Save
- THEN display validation error "TITLE_REQUIRED"
- AND do NOT submit

#### Scenario: Form validation - Git URL format

- GIVEN entering invalid Git URL
- WHEN losing focus on Git URL field
- THEN display error "INVALID_URL_FORMAT"

### Requirement: Create Project

Admin MUST be able to create new projects.

#### Scenario: Create new project

- GIVEN all required fields are filled
- WHEN clicking "CREATE_PROJECT"
- THEN send PUT request to GitHub API
- AND update projects.json with new entry

#### Scenario: Create success feedback

- GIVEN project created successfully
- WHEN GitHub API returns success
- THEN display success message "PROJECT_CREATED"
- AND clear form fields
- AND auto-log to System Logs

### Requirement: Read Projects

Admin MUST be able to view existing projects.

#### Scenario: Load existing projects

- GIVEN admin panel loads
- WHEN fetching data
- THEN load projects from projects.json via GitHub API
- AND display in list/table view

#### Scenario: Select project to edit

- GIVEN project list is displayed
- WHEN clicking a project
- THEN populate form with project data
- AND change submit button to "UPDATE_PROJECT"

### Requirement: Update Project

Admin MUST be able to update existing projects.

#### Scenario: Update existing project

- GIVEN form is populated with project data
- WHEN clicking "UPDATE_PROJECT"
- THEN send PATCH request to GitHub API
- AND update the specific project entry

#### Scenario: Update success feedback

- GIVEN project updated successfully
- WHEN GitHub API returns success
- THEN display success message "PROJECT_UPDATED"

### Requirement: Delete Project

Admin MUST be able to delete projects.

#### Scenario: Delete project

- GIVEN a project is selected
- WHEN clicking "DELETE_PROJECT"
- THEN show confirmation dialog "CONFIRM_DELETE"
- AND on confirmation, send DELETE to GitHub API

#### Scenario: Delete success feedback

- GIVEN project deleted successfully
- WHEN GitHub API returns success
- THEN display success message "PROJECT_DELETED"
- AND remove from list
- AND auto-log to System Logs

### Requirement: GitHub API Integration

All CRUD operations MUST use GitHub API.

#### Scenario: API request structure

- GIVEN making API request
- WHEN sending to GitHub
- THEN use PUT /repos/{owner}/{repo}/contents/projects.json
- AND include Base64-encoded content
- AND include commit message

#### Scenario: API rate limit handling

- GIVEN GitHub API rate limit is hit
- WHEN request fails with 403
- THEN display error "RATE_LIMIT_EXCEEDED"
- AND suggest waiting before retry

#### Scenario: API authentication failure

- GIVEN GitHub token is invalid
- WHEN API request fails
- THEN display error "AUTH_FAILED"
- AND prompt to check credentials

### Requirement: Auto-log to System Logs

All CRUD operations MUST automatically log to System Logs.

- GIVEN a CRUD operation completes
- WHEN success response received
- THEN create log entry with level "INFO"
- AND message describes the operation (e.g., "PROJECT_CREATED: MyProject")

## Data Structure

### Requirement: Project Data Format for Admin

Admin operations MUST use the following format:

```typescript
interface AdminProject {
  id: string;
  title: string;
  gitUrl: string;
  status: 'active' | 'archived' | 'planned';
  tags: string[];
  ambitions: string;
}
```

#### Scenario: FormData to object conversion

- GIVEN form is submitted
- WHEN processing
- THEN convert form data to AdminProject
- AND validate all required fields
- AND prepare for API request

### Requirement: Environment Variables

The admin panel MUST reference the following env vars:

- ADMIN_PASSWORD (required): Password for access
- GITHUB_TOKEN (required): Personal access token
- GITHUB_REPO (required): Owner/repo format

#### Scenario: Missing environment variables

- GIVEN required env var is not set
- WHEN admin panel attempts to load
- THEN display config error "MISSING_ENV_CONFIG"