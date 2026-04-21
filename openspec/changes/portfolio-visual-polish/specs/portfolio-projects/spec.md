# Delta for Portfolio Projects

## MODIFIED Requirements

### Requirement: Initial Project Display

The system MUST display a limited subset of projects on initial load. The initial view MUST show the top 3 projects ranked by relevance score (highlighted × 2 + favorite × 1), then by push date, then by order field. A "VER MÁS" expand control MUST be rendered when more projects exist.

(Previously: Displayed 6 projects by default without expand control)

#### Scenario: Show top 3 projects

- GIVEN the user navigates to the portfolio homepage
- WHEN the projects have loaded
- THEN exactly 3 project cards are rendered in the grid
- AND the "VER MÁS" button is visible below the grid

#### Scenario: No expand button when ≤3 projects

- GIVEN fewer than 4 projects exist
- WHEN the projects have loaded
- THEN no "VER MÁS" button is rendered

#### Scenario: More than 3 projects triggers expand

- GIVEN more than 3 projects exist
- WHEN the projects have loaded
- THEN the expand button shows the total count: `[+] EXPAND_MODULES ({n})`

## REMOVED Requirements

### Requirement: Display Top 6 Projects by Default

(Reason: Scope changed to show only 3 projects initially, with expand for remaining)