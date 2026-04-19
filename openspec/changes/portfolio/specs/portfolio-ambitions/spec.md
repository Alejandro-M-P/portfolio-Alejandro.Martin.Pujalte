# Portfolio Ambitions Specification

## Purpose

This specification defines the roadmap section displaying short-term, mid-term, and long-term goals with checkbox-style progress tracking.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono (primary), Inter (descriptions)
- Geometry: 0px border-radius, 1px borders, nested boxes

## Requirements

### Requirement: Three-Section Layout

The ambitions MUST display in three distinct time-horizon sections.

#### Scenario: Sections render correctly

- GIVEN the ambitions component renders
- WHEN the page loads
- THEN display: "SHORT_TERM" | "MID_TERM" | "LONG_TERM"
- AND each section displays in its own container
- AND containers are arranged vertically or horizontally based on viewport

#### Scenario: Short-term section

- GIVEN rendering short-term ambitions
- WHEN viewing section header
- THEN header shows "SHORT_TERM (0-3 MONTHS)"
- AND section background is `#0A0A0A`
- AND border is 1px solid `#FFFFFF`

#### Scenario: Mid-term section

- GIVEN rendering mid-term ambitions
- WHEN viewing section header
- THEN header shows "MID_TERM (3-12 MONTHS)"
- AND section background is `#0A0A0A`
- AND border is 1px solid `#FFFFFF`

#### Scenario: Long-term section

- GIVEN rendering long-term ambitions
- WHEN viewing section header
- THEN header shows "LONG_TERM (1+ YEAR)"
- AND section background is `#0A0A0A`
- AND border is 1px solid `#FFFFFF`

### Requirement: Goal Checkboxes

Each goal MUST display as a square checkbox.

#### Scenario: Unchecked goal checkbox

- GIVEN a goal with completed: false
- WHEN rendering
- THEN display empty square checkbox (1px border, no fill)
- AND checkbox size is 16x16px

#### Scenario: Checked goal checkbox

- GIVEN a goal with completed: true
- WHEN rendering
- THEN display filled square checkbox
- AND fill color is `#0055FF`

#### Scenario: Checkbox click toggles state

- GIVEN a goal checkbox is displayed
- WHEN user clicks the checkbox
- THEN toggle completed state
- AND persist the change

#### Scenario: Goal text display

- GIVEN a goal with text description
- WHEN rendering the goal
- THEN display text to the right of checkbox
- AND text is uppercase for headers
- AND text uses Inter for descriptions

### Requirement: Nested Box Design

The ambitions MUST follow the nested box aesthetic.

- GIVEN the ambitions container
- WHEN rendering
- THEN outer container has border 1px `#FFFFFF`
- AND inner section containers nested inside
- AND padding between nested containers is 8px

#### Scenario: Nested borders visible

- GIVEN multiple nested boxes
- WHEN rendering
- THEN each box shows 1px border
- AND borders create visual hierarchy

### Requirement: Add New Ambition

Users SHOULD be able to add new ambitions to any section.

- GIVEN viewing an ambitions section
- WHEN clicking "ADD_GOAL" button
- THEN show input field for new goal
- AND on submit, add to list
- AND persist to storage

### Requirement: Empty Section State

When a section has no goals, it MUST show an empty state message.

- GIVEN a section with empty goals array
- WHEN rendering
- THEN display "NO_GOALS_REGISTERED"
- AND show "ADD_GOAL" button to add first goal

## Data Structure

### Requirement: Ambition Data Format

Ambitions MUST conform to the following structure:

```typescript
interface Ambition {
  id: string;
  section: 'short' | 'mid' | 'long';
  text: string;
  completed: boolean;
}
```

#### Scenario: Valid ambition renders

- GIVEN an ambition object with all fields
- WHEN rendering
- THEN checkbox shows correct state
- AND text displays next to checkbox

#### Scenario: Ambition in correct section

- GIVEN an ambition with section: 'short'
- WHEN rendering
- THEN ambition appears in Short-Term section

## Visual Requirements

### Requirement: Responsive Layout

The sections MUST adapt to different screen sizes.

- GIVEN viewport under 640px
- WHEN rendering
- THEN sections stack vertically
- AND full width each

- GIVEN viewport 640px and above
- WHEN rendering
- THEN sections display side-by-side if space permits
- OR stack with visual separation