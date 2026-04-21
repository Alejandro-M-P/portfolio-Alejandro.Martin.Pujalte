# Tasks: portfolio-full-polish

## Phase 1: Data Loading (JSON)

- [x] 1.1 Create `public/data/identity.json` with cvUrl, name, title, bio, social
- [x] 1.2 Create `public/data/logs.json` with log entries array
- [x] 1.3 Import identity.json in index.astro, pass to IdentitySection
- [x] 1.4 Import logs.json in index.astro, pass to LogTerminal
- [x] 1.5 Remove hardcoded fallbacks from IdentitySection.tsx
- [x] 1.6 Remove hardcoded fallbacks from LogTerminal.tsx

## Phase 2: Layout Reorder

- [x] 2.1 Move ProjectGrid above TechMatrix in index.astro `<main>` (already was)
- [x] 2.2 Move TechMatrix above Roadmap in index.astro `<main>` (restacked vertically)
- [x] 2.3 Add `min-w-96` to right panel container

## Phase 3: Modal z-index

- [x] 3.1 Set ProjectModal container `z-[9999]`
- [x] 3.2 Set backdrop `z-[9998]`

## Phase 4: Projects Visible

- [x] 4.1 Change `INITIAL_LIMIT = 3` to `6` in ProjectGrid.tsx

## Phase 5: Panel Sizing

- [x] 5.1 Add `min-h-[24rem]` to IdentitySection panel
- [x] 5.2 Add `min-h-[24rem]` to Terminal panel

## Phase 6: CV Download

- [x] 6.1 Add `download` attribute to IdentitySection CV anchor

## Phase 7: Terminal wget

- [x] 7.1 Add `wget` command handler in LogTerminal.tsx (already existed)
- [x] 7.2 Trigger CV download on "wget cv.pdf" command (already existed)

## Phase 8: Terminal Improvements

- [x] 8.1 Add `whitespace-normal` to terminal message container
- [x] 8.2 Add word-wrap for long URLs in terminal (wrap-break-word + break-all)

## Phase 9: UI Rename

- [x] 9.1 Change "SYSTEM LOGS" header to "TERMINAL >_" in LogsPanel