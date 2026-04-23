# Tasks: terminal-responsive

## Phase 1: Detection Logic

- [ ] 1.1 Add ResizeObserver hook in index.astro to detect terminal container dimensions
- [ ] 1.2 Add `window.matchMedia('(min-width: 1024px)')` listener for desktop threshold
- [ ] 1.3 Implement toggle mode activation when: width < 1024px OR height < 480px
- [ ] 1.4 Expose `isToggleMode` state at layout level (React state)

## Phase 2: State Management

- [ ] 2.1 Add `isTerminalVisible` state (default: true)
- [ ] 2.2 Implement sessionStorage persistence for `terminal_visible` key
- [ ] 2.3 Initialize state from sessionStorage on mount
- [ ] 2.4 Add toggle function to switch visibility state

## Phase 3: Toggle Button UI

- [ ] 3.1 Create toggle button component or inline button in index.astro
- [ ] 3.2 Show button only when toggle mode is active
- [ ] 3.3 Display "Hide Terminal" / "Show Terminal" based on state
- [ ] 3.4 Add click handler to toggle visibility

## Phase 4: Conditional Rendering & Animation

- [ ] 4.1 Wrap terminal shell div with visibility toggle logic
- [ ] 4.2 Add CSS transition: `all 0.25s ease-in-out` to terminal container
- [ ] 4.3 Preserve layout space when hidden (placeholder height or display toggle)
- [ ] 4.4 Test smooth animation on toggle click

## Phase 5: Identity Reorder

- [ ] 5.1 Modify left column layout order based on `isTerminalVisible`
- [ ] 5.2 When hidden: IdentitySection renders first, terminal placeholder at bottom
- [ ] 5.3 When visible: IdentitySection + terminal (original order)
- [ ] 5.4 Verify identity order matches spec scenario

## Phase 6: Integration with CoreConsole

- [ ] 6.1 Pass `isToggleMode` and `isTerminalVisible` props to CoreConsole
- [ ] 6.2 Test CoreConsole accepts new props without breaking existing behavior
- [ ] 6.3 Verify terminal still renders when toggle mode is inactive