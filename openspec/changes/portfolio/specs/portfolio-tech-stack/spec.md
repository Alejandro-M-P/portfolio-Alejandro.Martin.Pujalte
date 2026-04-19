# Portfolio Tech Stack Specification

## Purpose

This specification defines the technology matrix showing tools, their versions, and usage levels as segmented progress bars.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono (primary)
- Geometry: 0px border-radius, 1px borders

## Requirements

### Requirement: Tech Stack Table Layout

The tech stack MUST display as a 3-column table.

#### Scenario: Table renders columns

- GIVEN the tech stack component renders
- WHEN the page loads
- THEN display headers: TOOL | VERSION | USAGE LEVEL
- AND align columns left
- AND font-family is IBM Plex Mono

#### Scenario: Table row structure

- GIVEN a tool entry with name, version, and level
- WHEN rendering a row
- THEN Tool column shows tool name (uppercase)
- AND Version column shows version (e.g., "v18.2.0")
- AND Usage Level column shows progress bar

### Requirement: Usage Level Progress Bars

Each usage level MUST display as a segmented progress bar.

#### Scenario: Progress bar segments

- GIVEN a usage level value (0-100)
- WHEN rendering the progress bar
- THEN divide into 10 equal segments
- AND fill segments proportional to usage level
- AND filled segments are `#0055FF`
- AND unfilled segments are `#0A0A0A` with 1px `#FFFFFF` border

#### Scenario: Usage level at 0%

- GIVEN usage level is 0
- WHEN rendering the progress bar
- THEN all 10 segments are unfilled (empty)

#### Scenario: Usage level at 100%

- GIVEN usage level is 100
- WHEN rendering the progress bar
- THEN all 10 segments are filled (`#0055FF`)

#### Scenario: Usage level at 50%

- GIVEN usage level is 50
- WHEN rendering the progress bar
- THEN 5 segments are filled
- AND 5 segments are unfilled

### Requirement: Tool Data Format

Tool data MUST conform to the following structure:

```typescript
interface TechTool {
  name: string;        // e.g., "TypeScript"
  version: string;     // e.g., "v5.3.0"
  usageLevel: number;  // 0-100
}
```

#### Scenario: Tool renders correctly

- GIVEN a tech tool object with all fields
- WHEN rendering
- THEN name displays uppercase
- AND version displays with "v" prefix
- AND progress bar shows usage level

### Requirement: Responsive Table

The table MUST be responsive on mobile devices.

#### Scenario: Table overflow on mobile

- GIVEN viewport under 640px
- WHEN table renders
- THEN allow horizontal scroll
- AND maintain fixed column widths

#### Scenario: Table fits on desktop

- GIVEN viewport 640px and above
- WHEN table renders
- THEN display without scroll
- AND fit container width

## Visual Requirements

### Requirement: Table Styling

The table MUST follow brutalist design principles.

- GIVEN the table container
- WHEN rendering
- THEN background is `#0A0A0A`
- AND border is 1px solid `#FFFFFF`
- AND padding is 16px
- AND border-radius is 0px

### Requirement: Empty State

When no tools are provided, the table MUST show an empty state message.

- GIVEN an empty tools array
- WHEN rendering
- THEN display "NO_TOOLS_REGISTERED"
- AND center the message