# Delta for terminal-toggle-mode

## Purpose

Enable responsive detection and toggle control for the terminal component on desktop layouts where the terminal cannot fit properly. Provide user control to show/hide terminal and reorganize the left column layout accordingly.

## ADDED Requirements

### Requirement: Terminal Toggle Mode Detection

The system **MUST** detect when desktop viewport dimensions are insufficient for the terminal component and automatically enable toggle mode.

#### Scenario: Terminal toggle mode activates on narrow width

- **Given**: A desktop browser with viewport width greater than or equal to 1024px
- **When**: The viewport width drops below 1024px OR the computed terminal height falls below 480px
- **Then**: The system **MUST** enable terminal toggle mode
- **And**: The toggle button **MUST** become visible in the UI

#### Scenario: Terminal toggle mode deactivates on ample width

- **Given**: A desktop browser in toggle mode with viewport width below 1024px
- **When**: The viewport width increases to 1024px or above AND computed terminal height is at least 480px
- **Then**: The system **MUST** disable toggle mode
- **And**: The terminal **MUST** be visible by default

### Requirement: Toggle Button Visibility

The toggle button **MUST** be visible only when terminal toggle mode is active.

#### Scenario: Toggle button visibility states

- **Given**: Terminal toggle mode is active
- **When**: The terminal is currently visible
- **Then**: The toggle button **MUST** display an icon/label indicating "hide" action (e.g., "[Hide Terminal]")

- **Given**: Terminal toggle mode is active
- **When**: The terminal is currently hidden
- **Then**: The toggle button **MUST** display an icon/label indicating "show" action (e.g., "[Show Terminal]")

### Requirement: Terminal Visibility State Management

The system **MUST** maintain and persist the terminal visibility state across component re-renders and viewport changes.

#### Scenario: Toggle state persists during session

- **Given**: A user has toggled the terminal to hidden state
- **When**: The user resizes the browser window (without page refresh)
- **Then**: The terminal **MUST** remain hidden until the user explicitly toggles it

#### Scenario: Toggle state persists in sessionStorage

- **Given**: A user has toggled the terminal visibility
- **When**: The page is reloaded OR the component remounts
- **Then**: The system **MUST** restore the last known visibility state from sessionStorage
- **And**: If no state exists in sessionStorage, default to visible

### Requirement: Layout Reorder When Terminal Hidden

When terminal toggle mode is active AND the terminal is hidden, the IdentitySection **MUST** be positioned at the bottom of the left column (after Projects, TechStack, Roadmap on the right).

#### Scenario: Identity repositions below other content when terminal hidden

- **Given**: Desktop layout with toggle mode active AND terminal hidden
- **When**: The page renders
- **Then**: IdentitySection **MUST** appear after terminal placeholder (or at bottom of left column)
- **And**: The vertical stacking order **MUST** be: (1) Projects (right column top), (2) TechStack + Roadmap (right column bottom), (3) IdentitySection (left column bottom)

#### Scenario: Identity returns to top when terminal shown

- **Given**: Desktop layout with toggle mode active AND terminal visible
- **When**: The user toggles terminal to visible
- **Then**: IdentitySection **MUST** return to its original position at the top of the left column
- **And**: The terminal **MUST** appear below IdentitySection

### Requirement: Smooth Toggle Transition

The toggle action **MUST** provide a smooth transition animation to avoid layout shift perception.

#### Scenario: Smooth show/hide animation

- **Given**: Terminal toggle mode is active
- **When**: User clicks toggle button to show OR hide terminal
- **Then**: The transition **MUST** animate over 200-300ms using CSS transition or equivalent
- **And**: No layout shift **MUST** occur during the animation (content should reflow smoothly)

## MODIFIED Requirements

(None — this is a new capability)

## REMOVED Requirements

(None)

---

## Implementation Notes

| Aspect | Detail |
|--------|--------|
| Detection trigger | `ResizeObserver` on terminal container + `window.matchMedia('(min-width: 1024px)')` |
| State storage | `sessionStorage` key: `terminal_visible` (boolean) |
| Default state | `true` (visible) when no stored state |
| Animation | CSS `transition: all 0.25s ease-in-out` on terminal container |
| Toggle trigger | Click event on button, keyboard shortcut optional (e.g., Ctrl+`) |