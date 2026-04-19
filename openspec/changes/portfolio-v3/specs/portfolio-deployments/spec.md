# Portfolio Deployments Specification

## Purpose

This specification defines the project grid section displaying deployed projects as interactive cards. Each card opens a modal with detailed architecture, initialization sequence, and technical specifications.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono, Inter (descriptions)
- Geometry: 0px border-radius, 1px borders

## Requirements

### Requirement: Project Grid Display

The projects MUST be displayed in a responsive grid layout.

#### Scenario: Grid renders on desktop

- GIVEN a list of projects exists
- WHEN rendering on viewport ≥1024px
- THEN display in 3-column grid
- AND gap between items is 16px

#### Scenario: Grid renders on tablet

- GIVEN a list of projects exists
- WHEN rendering on viewport between 640px and 1023px
- THEN display in 2-column grid
- AND gap between items is 16px

#### Scenario: Grid renders on mobile

- GIVEN a list of projects exists
- WHEN rendering on viewport under 640px
- THEN display in 1-column grid
- AND gap between items is 16px

### Requirement: Project Card

Each project card MUST display with the following elements:

- GIVEN a project object with id, name, photo, stack
- WHEN rendering the card
- THEN show ID pill formatted as "01_PROJECT_NAME"
- AND project thumbnail (grayscale filter applied)
- AND stack pills (tags showing technology used)

#### Scenario: Project card grayscale image

- GIVEN a project with a thumbnail URL
- WHEN rendering the card thumbnail
- THEN apply CSS filter grayscale(100%)
- AND image is 16:9 aspect ratio

#### Scenario: Project card stack pills

- GIVEN a project with stack array ["React", "TypeScript"]
- WHEN rendering the card
- THEN display pills: "[REACT]" "[TYPESCRIPT]"
- AND pill background is `#0A0A0A`
- AND pill border is 1px `#FFFFFF`
- AND text is uppercase

### Requirement: Project Card Click

Clicking a project card MUST open a detail modal.

#### Scenario: Card click opens modal

- GIVEN the user clicks a project card
- WHEN the click event fires
- THEN modal appears with fade-in animation
- AND modal shows project detail content
- AND background dims behind modal

#### Scenario: Modal shows architecture section

- GIVEN the modal is open
- WHEN viewing the content
- THEN section titled "System Architecture" displays
- AND contains architecture description text

#### Scenario: Modal shows initialization sequence

- GIVEN the modal is open
- WHEN viewing the content
- THEN section titled "Initialization Sequence" displays
- AND contains a code block with commands
- AND code block has monospace styling

#### Scenario: Modal shows technical specifications

- GIVEN the modal is open
- WHEN viewing the content
- THEN section titled "Technical Specifications" displays
- AND shows key-value pairs (e.g., "Framework", "Astro")
- AND shows array values (e.g., "Dependencies", ["react", "tailwind"])

### Requirement: Modal Close

The modal MUST be closable via multiple methods.

#### Scenario: Click close button

- GIVEN the modal is open
- WHEN user clicks the close button (X)
- THEN modal closes with fade-out animation

#### Scenario: Click outside modal

- GIVEN the modal is open
- WHEN user clicks the overlay background
- THEN modal closes

#### Scenario: Press Escape key

- GIVEN the modal is open
- WHEN user presses Escape key
- THEN modal closes

## Data Structure

### Requirement: Project Data Format

Project data MUST conform to the following structure:

```typescript
interface Project {
  id: string;          // e.g., "01"
  name: string;        // e.g., "Portfolio V3"
  photo: string;       // URL to thumbnail
  stack: string[];     // e.g., ["Astro", "React"]
  architecture: string;
  initSequence: string;
  specs: Record<string, string | string[]>;
}
```

#### Scenario: Valid project data renders

- GIVEN a project object matching the interface
- WHEN the component renders
- THEN all fields display correctly in card and modal

#### Scenario: Missing optional fields

- GIVEN a project object with missing optional fields
- WHEN rendering
- THEN display available fields
- AND show placeholder for missing fields ("N/A")