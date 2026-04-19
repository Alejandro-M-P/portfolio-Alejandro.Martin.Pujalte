# Portfolio System Logs Specification

## Purpose

This specification defines the terminal-style log viewer that displays real commit data and learning milestones in a structured format with timestamps, levels, and messages.

## Design Reference

- Background: `#050505` (Carbono)
- Containers: `#0A0A0A`
- Text/Lines: `#FFFFFF`
- Accent: `#0055FF` (Cobalt Blue)
- Typography: IBM Plex Mono (monospace for terminal)
- Geometry: 0px border-radius, 1px borders

## Requirements

### Requirement: Terminal Display Layout

The system logs MUST display in a terminal-style container.

#### Scenario: Terminal container renders

- GIVEN the system logs component renders
- WHEN the page loads
- THEN container has background `#0A0A0A`
- AND border is 1px solid `#FFFFFF`
- AND font-family is IBM Plex Mono
- AND header shows "SYSTEM_LOGS >_"

#### Scenario: Terminal header

- GIVEN the terminal renders
- WHEN viewing the header
- THEN display terminal-style prompt "root@portfolio:~#"
- AND show blinking cursor indicator

### Requirement: Log Entry Columns

Each log entry MUST display in columns: Timestamp | Level | Message.

#### Scenario: Log entry structure

- GIVEN a log entry with timestamp, level, message
- WHEN rendering the entry
- THEN Timestamp column shows ISO format (YYYY-MM-DD HH:mm:ss)
- AND Level column shows level code
- AND Message column shows the log message

#### Scenario: Level INFO formatting

- GIVEN a log entry with level "INFO"
- WHEN rendering
- THEN level displays in `#FFFFFF` (white)
- AND message displays in `#FFFFFF`

#### Scenario: Level WARN formatting

- GIVEN a log entry with level "WARN"
- WHEN rendering
- THEN level displays in `#FFCC00` (yellow)
- AND message displays in `#FFCC00`

#### Scenario: Level ERR formatting

- GIVEN a log entry with level "ERR"
- WHEN rendering
- THEN level displays in `#FF3333` (red)
- AND message displays in `#FF3333`

### Requirement: Log Data Source

The logs MUST derive from real commit data.

#### Scenario: Fetch commit data

- GIVEN the GitHub API is accessible
- WHEN loading logs
- THEN fetch commits from the repository
- AND map each commit to a log entry
- AND use commit sha as identifier
- AND use commit message as log message
- AND use commit date as timestamp

#### Scenario: Include learning milestones

- GIVEN special commits marked as milestones
- WHEN rendering
- THEN include milestone entries with level "MILESTONE"
- AND display in accent color `#0055FF`

### Requirement: Scrollable Log View

The terminal MUST support scrolling for many entries.

#### Scenario: Log scroll container

- GIVEN more than viewport height of log entries
- WHEN rendering
- THEN container scrolls vertically
- AND scrollbar matches brutalist styling (thin, white)

#### Scenario: Auto-scroll to bottom

- GIVEN user is viewing logs
- WHEN new log entry added
- THEN automatically scroll to bottom
- AND show latest entry

### Requirement: Log Entry Limit

The terminal SHOULD display the most recent 50 entries by default.

- GIVEN more than 50 log entries exist
- WHEN rendering
- THEN display only the 50 most recent
- AND show indicator "... +N older entries hidden"

### Requirement: Empty Log State

When no commits exist, the terminal MUST show an empty state.

- GIVEN no commit data available
- WHEN rendering
- THEN display "NO_LOGS_AVAILABLE"
- AND show "Waiting for data stream..."

## Data Structure

### Requirement: Log Entry Format

Log entries MUST conform to the following structure:

```typescript
interface LogEntry {
  id: string;
  timestamp: string;    // ISO 8601 format
  level: 'INFO' | 'WARN' | 'ERR' | 'MILESTONE';
  message: string;
}
```

#### Scenario: Valid log entry renders

- GIVEN a log entry object
- WHEN rendering
- THEN all fields display in correct columns
- AND colors match level

### Requirement: New Log Entry Logging

New entries MUST be logged when created via Admin.

- GIVEN Admin creates a new project entry
- WHEN the entry is saved
- THEN automatically add log entry with level "INFO"
- AND message describes the action
- AND timestamp is current time