# Skill Registry - Portfolio

## User Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| skill-creator | When user asks to create a new skill, add agent instructions, or document patterns for AI | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/skill-creator/SKILL.md |
| sdd-verify | When the orchestrator launches you to verify a completed (or partially completed) change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-verify/SKILL.md |
| sdd-tasks | When the orchestrator launches you to create or update the task breakdown for a change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-tasks/SKILL.md |
| sdd-spec | When the orchestrator launches you to write or update specs for a change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-spec/SKILL.md |
| sdd-propose | When the orchestrator launches you to create or update a proposal for a change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-propose/SKILL.md |
| sdd-init | When user wants to initialize SDD in a project, or says "sdd init", "iniciar sdd", "openspec init" | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-init/SKILL.md |
| sdd-explore | When the orchestrator launches you to think through a feature, investigate the codebase, or clarify requirements | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-explore/SKILL.md |
| sdd-design | When the orchestrator launches you to write or update the technical design for a change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-design/SKILL.md |
| sdd-archive | When the orchestrator launches you to archive a change after implementation and verification | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-archive/SKILL.md |
| skill-registry | When user says "update skills", "skill registry", "actualizar skills", "update registry", or after installing/removing skills | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/skill-registry/SKILL.md |
| sdd-apply | When the orchestrator launches you to implement one or more tasks from a change | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-apply/SKILL.md |
| issue-creation | When creating a GitHub issue, reporting a bug, or requesting a feature | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/issue-creation/SKILL.md |
| go-testing | When writing Go tests, using teatest, or adding test coverage | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/go-testing/SKILL.md |
| branch-pr | When creating a pull request, opening a PR, or preparing changes for review | /home/alejandro/Documentos/dev/.entorno/portfolio/.branch-pr/SKILL.md |
| judgment-day | When user says "judgment day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/judgment-day/SKILL.md |
| sdd-onboard | When the orchestrator launches you to onboard a user through the full SDD cycle | /home/alejandro/Documentos/dev/.entorno/portfolio/.gemini/skills/sdd-onboard/SKILL.md |

## Compact Rules

### sdd-init
- Detect stack, conventions, and testing capabilities.
- Bootstrap the active persistence backend (engram/openspec).

### sdd-apply
- Implement tasks from the change, writing actual code following the specs and design.

### sdd-verify
- Validate that implementation matches specs, design, and tasks.

### sdd-spec
- Write specifications with requirements and scenarios (delta specs for changes).

### sdd-propose
- Create a change proposal with intent, scope, and approach.

### sdd-tasks
- Break down a change into an implementation task checklist.

### sdd-design
- Create technical design document with architecture decisions and approach.

### sdd-explore
- Explore and investigate ideas before committing to a change.

### sdd-archive
- Sync delta specs to main specs and archive a completed change.

### go-testing
- Go testing patterns for Gentleman.Dots, including Bubbletea TUI testing.

### issue-creation
- Issue creation workflow for Agent Teams Lite following the issue-first enforcement system.

### branch-pr
- PR creation workflow for Agent Teams Lite following the issue-first enforcement system.

### judgment-day
- Parallel adversarial review protocol with two independent blind judge sub-agents.
