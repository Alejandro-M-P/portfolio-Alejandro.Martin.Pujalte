# Tasks: Portfolio Visual Polish

## Phase 1: Foundation

- [ ] 1.1 Remove `colors` object from `tailwind.config.mjs` (keep only `content` array and empty `theme.extend`)
- [ ] 1.2 Add `:focus-visible` rule to `src/styles/global.css` after @theme block
- [ ] 1.3 Add base transition utility class to `src/styles/global.css` for interactive elements

## Phase 2: Project Grid Updates

- [ ] 2.1 Add `expanded` useState (boolean) to `ProjectGrid.tsx`
- [ ] 2.2 Change project limit from 6 to 3 initially
- [ ] 2.3 Add expand button with terminal style showing "[+] EXPAND_MODULES (n)" where n = remaining count
- [ ] 2.4 Style button with terminal aesthetic: border-cobalt/50 text-cobalt hover:bg-cobalt

## Phase 3: Cursor Pointer Polish

- [ ] 3.1 Verify `Button.tsx` has cursor-pointer (already has transition-colors)
- [ ] 3.2 Verify `ContactButton.tsx` has cursor-pointer (line 11 already has it)
- [ ] 3.3 Verify `ProjectCard.tsx` has cursor-pointer (line 78 already has it)

## Phase 4: Verification

- [ ] 4.1 Test: 3 projects shown on initial load
- [ ] 4.2 Test: Expand button shows correct remaining count
- [ ] 4.3 Test: Focus ring appears on Tab navigation
- [ ] 4.4 Test: No focus ring on mouse click
- [ ] 4.5 Verify no layout changes occurred
