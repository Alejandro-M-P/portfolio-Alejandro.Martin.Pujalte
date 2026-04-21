# Delta for Focus States

## ADDED Requirements

### Requirement: Visible Focus Indicators

The system MUST provide visible focus indicators for all interactive elements when navigating via keyboard. Focus indicators MUST use the cobalt color with a 2px offset.

All interactive elements MUST render a focus ring meeting these specifications:
- Outline color: `outline-cobalt`
- Outline width: `outline-2`
- Outline offset: `outline-offset-2`

(Applies to: buttons, links, inputs, checkboxes, modals, cards with click handlers)

#### Scenario: Focus ring visible on Tab navigation

- GIVEN the user presses Tab to navigate
- WHEN focus reaches an interactive element
- THEN a cobalt outline appears around the element
- AND the outline is offset 2px from the element edge

#### Scenario: No focus ring for mouse users

- GIVEN the user clicks on an interactive element
- THEN no focus ring is rendered (uses :focus-visible, not :focus)

#### Scenario: Focus on project cards

- GIVEN a project card is keyboard-focusable
- WHEN the user Tabs to it
- THEN it shows the cobalt outline ring

#### Scenario: Focus on expand button

- GIVEN the user Tabs to the "[+] EXPAND_MODULES" button
- THEN the button shows cobalt outline on focus

## ADDED Requirements (Global)

### Requirement: Global Focus Style

The system SHOULD apply a consistent focus-visible style across all components using CSS.

#### Scenario: Global focus styles applied

- GIVEN any interactive element receives keyboard focus
- THEN it displays the cobalt focus ring as defined in global.css