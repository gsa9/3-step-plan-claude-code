# 3-step-plan-claude-code

Decide → Plan → Execute skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each step produces a lightweight artifact so you can `/clear` context and start the next step fresh — better performance, lower token cost (see [Hotkeys](#hotkeys) to automate this).

- **Step 1** — structured Q&A where Claude challenges your assumptions, pushes back on risky choices, and discovers new questions as your answers reshape the problem. Writes `_step1_decisions.md`
- **Step 2** — reads the decisions file in a fresh window, transforms them into parallelism-maximized phases with dependencies, guardrails, and contextual inputs. Writes `_step2_plan.md`
- **Step 3** — reads the plan file in a fresh window, dispatches phases to subagents while the main context stays lean

Works for any structured task — code, documentation, configuration, research, process design. When a task involves code changes (git repo with source files), skills automatically activate code-aware behavior: deeper source analysis, file-level phase granularity, and code-specific dispatch instructions.

I run Claude Code with `bypassPermissions` mode enabled, which skips all permission prompts and lets Claude work autonomously. **Use with caution:** this setting allows Claude to modify files and execute commands without approval. This repo intentionally excludes `settings.json` to avoid overwriting your existing configuration. If you want to enable bypass mode, add to your `~/.claude/settings.json`:
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```
For a less aggressive option, use `"acceptEdits"` instead — it auto-approves file edits but still prompts for other operations. See the [Hooks](#hooks) section below for a custom statusline you may also want to add.

## Overview

Three skills, numbered steps: **1 → 2 → 3** (Decide → Plan → Execute).

```
/step1 (decide) → _step1_decisions.md
    ↓ fresh session
/step2 (plan)   → _step2_plan.md → deletes _step1_decisions.md
    ↓ fresh session
/step3 (execute) → completed work → deletes _step2_plan.md
```

`/step1` guides you from open question to clear decision through structured one-at-a-time Q&A — Claude asks, recommends, auto-decides when obvious, discovers new questions as answers reshape the picture, and tracks all decisions as you go. For multi-deliverable or convention-setting outcomes it writes `_step1_decisions.md` — the artifact that bridges analysis to planning. Only for trivially simple tasks does it skip the artifact and proceed directly. `/step2` reads `_step1_decisions.md` in a fresh session and transforms those decisions into a parallelism-maximized `_step2_plan.md` with per-phase guardrails, rich Inputs fields for subagent orientation, and a validation checklist before writing. `/step3` executes it via subagents in a fresh session. Each stage produces a disposable artifact consumed and deleted by the next. Completed work is the deliverable, not the artifacts.

Also included: `/distill` for optimizing LLM instruction files based on [empirical principles into instruction compliance](#distill--instruction-distillation), and `/gc` for streamlined git commit and push with a Python helper for compact diff summarization.

## Why Custom Step Skills?

Claude Code has a [built-in Plan Mode](https://docs.anthropic.com/en/docs/claude-code) and subagents (the Task tool). These custom skills explicitly ban both in `/step1` and `/step2` — Plan Mode hijacks the skill's own flow, and subagents lose the context that step1 needs for interrogation and step2 needs for accurate phase design. `/step3` uses subagents by design (it's a dispatcher) but still bans Plan Mode. The skills are the framework; built-in Plan Mode is a competing one.

### Why /step1, /step2, /step3?

The names follow a natural progression: **step 1** decide, **step 2** plan, **step 3** execute. Numbered commands are intuitive — the pipeline reads naturally as `/step1 → /step2 → /step3`, and the order is self-documenting. No ambiguity about what comes next.

### The Fresh Session Pattern

Each skill produces an artifact that carries context forward, so you start each stage with a clean context window. `/step1` writes `_step1_decisions.md`, then you start a fresh session for `/step2`. `/step2` reads `_step1_decisions.md`, writes `_step2_plan.md`, and deletes `_step1_decisions.md`. Then you start a fresh session for `/step3`.

**Recommended flow:**
```
/step1 → _step1_decisions.md → fresh session → /step2 → _step2_plan.md → fresh session → /step3
```

## Compatibility

Claude Code uses a bash shell on all platforms (macOS, Linux, Windows via Git Bash). Skills use only POSIX-compatible commands (`date`, `rm`, etc.) — no platform-specific dependencies.

## Installation

```bash
cp -r skills/ ~/.claude/skills/
```

Or cherry-pick specific files into your existing config. All five skills will be available as slash commands.

## Skills

Custom slash commands invoked with `/<skill-name>`.

### Planning Workflow

| Skill | Purpose |
|-------|---------|
| `/step1` | Decide: explore, interrogate (structured Q&A), bridge to decision |
| `/step2` | Plan: design structured phases with full context for fresh-session execution |
| `/step3` | Execute: run via parallel subagents, delete plan on success |

**Iterative by Design**

Complex work is iterative — you discover what you need step by step, not upfront. This workflow preserves that rhythm: smaller plans with controlled execution, letting you advance confidently while maintaining the ability to course-correct when a step proves wrong.

**Flow:** `/step1` → explore options, surface pitfalls, converge on ONE direction → `_step1_decisions.md` → fresh session → `/step2` → structured `_step2_plan.md` with rationale → fresh session → `/step3` → subagents execute → plan deleted

<details>
<summary><strong>Workflow Overview</strong></summary>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PLANNING WORKFLOW: DECIDE → PLAN → EXECUTE                 │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │   /step1    │         │   /step2    │         │   /step3    │
  │             │         │             │         │             │
  │   DECIDE    │────────▶│    PLAN     │────────▶│   EXECUTE   │
  │             │         │             │         │             │
  └─────────────┘         └─────────────┘         └─────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
  │ • Explore   │         │ • Rationale │         │ • Checkpoint│
  │ • Interrogat│         │ • Phases    │         │ • Subagents │
  │ • Discovery │         │ • Guardrails│         │ • Parallel  │
  │ • Bridge    │         │ • Write     │         │ • All-or-   │
  │ • Enrich    │         │   plan      │         │   nothing   │
  │   (agent)   │         │             │         │             │
  └─────────────┘         └─────────────┘         └─────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
  ┌──────────────┐        ┌──────────────┐        ┌─────────────┐
  │ _step1_      │        │ _step2_      │        │   Deleted   │
  │ decisions.md │        │ plan.md      │        │  (cleanup)  │
  │  (bridge)    │        │  (bridge)    │        │             │
  └──────────────┘        └──────────────┘        └─────────────┘

  USER CONTROL POINTS
  ───────────────────
  [1] During /step1        → Answer questions one at a time, go back if needed
  [2] After _step2_plan.md → Review phases, adjust before execution
  [3] During /step3        → Monitor progress, fail-fast on errors
  [4] After /step3 execute → Review changes, commit or recover

  WHY THREE STEPS?
  ────────────────
  • /step1 thinks WITH you — Claude asks, recommends, you decide one at a time
  • /step2 captures everything in _step2_plan.md — the sole context bridge
  • /step3 runs fresh — subagents get isolated context, main thread stays lean

  TOKEN LIFECYCLE
  ───────────────
  /step1 writes _step1_decisions.md → fresh session for /step2
  /step2 reads _step1_decisions.md, writes _step2_plan.md, deletes _step1_decisions.md
  Fresh session for /step3 (_step2_plan.md carries everything forward)
  On success: _step2_plan.md deleted (completed work is the deliverable)
```

</details>

<details>
<summary><strong>Why This Approach Works</strong></summary>

Since ChatGPT's public release on November 30, 2022, through the transition to Claude Code with Opus on the Max plan, one pattern has proven reliable: tight feedback loops with human judgment at decision points. This workflow gives you end-to-end execution from idea to completion while keeping you in control of pace and direction.

**Related tools:** I was already using multi-phase planning skills when I discovered [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done). What caught my attention was GSD's use of subagents to preserve the main context window. I incorporated that pattern into my workflow, refining `/step3` so the orchestrator stays minimal while subagents handle the heavy lifting.

Interestingly, Claude Code's built-in Plan Mode uses similar tactics — we're all converging on the same insight: **delegate context consumption to isolated agents**.

GSD does more than I need for my workflow. `/step1`, `/step2`, and `/step3` take a lighter approach for developers who prefer tighter feedback loops — scanning first, refining plans conversationally, steering direction as needed. More elaborate plans consume more of your usage allowance, which matters on Claude Code's Max plan where token efficiency is important.

</details>

**Features:** Phases with dependencies · Parallel groups · Checkpoint with all-or-nothing execution · Per-phase Inputs and Guardrails · Auto commit & push on success · Subagent orchestration · Token-efficient artifact lifecycle · Context window management

---

**Why analyze first?** `/step1` isn't just analysis — it's structured interrogation where Claude drives the conversation one question at a time, dynamically discovering new questions as each answer reshapes the problem space. It gathers context from available sources, forms opinions, probes for weaknesses in your chosen approach, and flags tensions between decisions. When the evidence is overwhelming, it auto-decides and moves on. You see a running decision tracker after every answer, and can go back to revisit any previous choice. The output is a compact decision block — with rejected alternatives and risks clearly stated — that `/step2` actively transforms into parallelism-maximized phases with per-phase guardrails.

In Claude Code, you can use skills in two ways:
- **Start of conversation** — Begin with just `/step1` to open an interactive session, bouncing ideas back and forth until direction crystallizes
- **Anywhere in a prompt** — Include `/step1` at the end or mid-prompt to get structured analysis before committing to implementation

---

### /step1 — Explore, Interrogate, Decide

Interactive Q&A that converges on decisions. Gathers context from available sources, identifies decision points, and walks through them one question at a time.

- Auto-decides when evidence is overwhelming
- Pushes back on risky choices
- Discovers new questions as answers reshape the problem
- Tracks decisions with a live status block after every answer
- Automatically detects code tasks (git repo with source files) and activates deeper source analysis

**Output:** `_step1_decisions.md` at repo root (or inline summary for trivially simple tasks via early resolution). An independent enrichment agent validates the file against a completeness checklist before handoff — gaps are fixed in-place.

**Usage:**
- `/step1` — asks what needs solving (or uses prior conversation context as the topic)

### /step2 — Structured Plan for Subagent Execution

Reads `_step1_decisions.md` and produces a self-contained execution plan. Designed so a fresh `/step3` session can execute it with zero prior context.

- Transforms decisions into phases with explicit deliverable names, guardrails, and dependencies
- Maximizes parallelism — groups independent phases for concurrent execution
- Validates before writing: parallel maximization, no output collisions, subagent autonomy, guardrail placement
- Automatically applies code-task overrides (file-level granularity, size budgets) when `code-task: true` is set

**Output:** `_step2_plan.md` at repo root. Deletes `_step1_decisions.md` after writing.

**Usage:**
- `/step2` — reads `_step1_decisions.md` automatically (falls back to conversation context or asks)

**Execution model note:** `/step2` designs phases so each is self-contained for subagent dispatch. If a phase needs extensive context to execute, it's too big or too vague and gets split.

### /step3 — Execute Plan via Subagents

Dispatches phases from `_step2_plan.md` to subagents. The main thread is a lightweight orchestrator — it never executes tasks directly.

- Creates a checkpoint before any work begins (git commit, file backup, or skip for greenfield)
- Runs parallel groups concurrently, serial groups in order
- Fail-fast: stops on first failure, presents recovery options
- All-or-nothing: on failure, user decides whether to recover or keep partial changes
- On success: deletes `_step2_plan.md`, commits and pushes (if remote configured)

**Execution model:** All-or-nothing. A checkpoint is created before any phase runs. If anything fails, recovery options are presented — git reset, backup restore, or keep partial changes.

**Usage:**
- `/step3` — loads and executes `_step2_plan.md`

### /distill — Instruction Distillation

LLM instruction compliance does not scale with length — beyond a threshold, more words means worse compliance. `/distill` optimizes instruction files (skill.md, CLAUDE.md, agent prompts) for maximum behavioral compliance per token. The principles are inlined in the skill itself.

Unlike conservative prose-trimming approaches that preserve every item via inventory counting, `/distill` is willing to cut, restructure, and rewrite. It removes redundant and self-evident rules, merges duplicates, strips hedge words, and flattens unnecessary structure — while preserving WHY clauses (the highest-value content) and all behavioral rules that have no equivalent remaining.

**Key principles:**
- One statement per concept — duplicates at the same level get merged
- Direct and front-loaded — "Do X" beats "You should consider doing X"
- WHY > WHAT — the model infers WHAT from WHY
- Evidence > authority — "X because Y" beats "CRITICAL: X"
- Remove self-evident rules — "Write valid Python" is noise

**Usage:**
- `/distill <file-path>`

### /gc — Git Commit and Push

A streamlined git commit and push workflow. `/gc` stages all changes, generates a commit message from a compact diff summary (via `gc_diff.py`, a Python helper that parses `git diff --staged -U0` into per-file stats), and pushes. It never reads files or runs expensive git commands to inform the message — only the script output and conversation memory.

`gc_diff.py` uses only Python stdlib — no dependencies required.

**Usage:**
- `/gc` — auto-generates message from diff
- `/gc <message>` — uses provided message
- `/gc --repo <path>` — targets a different repository

---

<details>
<summary><strong>/step1 Flow Diagram</strong></summary>

```
┌─────────────────────────────────────────────────────────────────┐
│        /step1 - Explore → Discover → Interrogate → Bridge        │
└─────────────────────────────────────────────────────────────────┘

  USER INPUT                    CLAUDE ACTIONS                 OUTPUT
  ──────────                    ──────────────                 ──────

  "/step1 auth-system"          ┌─────────────────┐
  or just "/step1"     ───────▶│  1. EXPLORE     │
                               │  • Topic (prior │
                            │    or ask)      │
                            │  • Gather       │
                            │    context      │
                            │  • ID initial   │
                            │    decisions    │
                            │  • Form opinions│
                            │  • Scope est:   │
                            │    "~N decisions│
                            │    to resolve"  │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  2. DISCOVER    │◀──── ONE Q AT A TIME
                            │                 │      via plain text
                            │  PURE INFO:     │
                            │  • One question │
                            │    per message  │
                            │  • Plain text   │◀──── no AskUserQuestion
                            │    output       │
                            │  • Branch into  │◀──── answers reveal
                            │    new dims     │      new dimensions
                            │  • Saturation → │
                            │    user confirms│
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  3. INTERROGATE │◀──── BATCH DECISIONS
                            │                 │
                            │  DYNAMIC:       │
                            │  • Auto-decide  │
                            │    if obvious   │
                            │  • Best answer  │
                            │    first        │
                            │  • Kill mooted  │
                            │    questions    │
                            │  • Probe weak-  │◀──── challenge choices
                            │    nesses       │
                            │  • Flag tensions│
                            └────────┬────────┘
                                     │
                            ┌────────┴────────┐
                            │ DECISION TRACKER│◀──── after each answer
                            │ 1. ✅ topic: X  │
                            │ 2. ✅(auto): Y  │
                            │ 3. 🆕 new topic │◀──── discovered mid-session
                            │ 4. ➖ dropped   │◀──── mooted by answers
                            │ 5. ⬜ next...   │
                            │                 │
                            │ (if >8, suggest │
                            │  splitting)     │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  4. BRIDGE      │
                            │                 │
                            │  EARLY (trivially│     FULL (multi-
                            │  simple task):  │     deliverable,
                            │  • No _step1_   │     conventions, docs):
                            │    decisions.md │
                            │  • Summarize    │     ┌─────────────────────────────┐
                            │    inline       │     │ ## Decision: [topic]        │
                            │  • Proceed      │     │ **Approach:** JWT + middle  │
                            │    directly     │     │ **Why:** fits existing...   │
                            │                 │     │ **Rejected:** session..     │
                            │  FULL:          │     │ **Risks:** token expiry..   │
                            │  • "Anything to │     │ **Key decisions:**          │
                            │    change?"     │     │ - decision 1, 2, 3...       │
                            │  • Write        │     └─────────────────────────────┘
                            │    _step1_      │
                            │    decisions.md │
                            │  • Enrichment   │◀──── independent agent
                            │    agent checks │      validates completeness
                            │    completeness │
                            │  • Fix gaps     │
                            └─────────────────┘

  CODE-TASK AUTO-DETECTION
  ────────────────────────
  Git repo with source files or user describes code changes →
  code-task: true in _step1_decisions.md. EXPLORE reads 5-10
  relevant source files. Enrichment additionally checks code
  specifics (lines, functions, snippets, before→after).

  CONSTRAINTS
  ───────────
  ✗ No implementation     - thinking only, no changes
                            (only _step1_decisions.md)
                            Exception: early resolution (trivially
                            simple task) skips artifact and proceeds
  ✓ Claude participates   - recommends, warns, challenges, validates
  ✓ Emergent discovery    - questions evolve from answers
  ✓ One question at a time- never batch, never dump a list
  ⏸ User controls pace    - never auto-chains to /step2
```

</details>

---

<details>
<summary><strong>/step2 Flow Diagram</strong></summary>

```
┌─────────────────────────────────────────────────────────────────┐
│          /step2 - Parallelism-First Phase Design                │
└─────────────────────────────────────────────────────────────────┘

  USER INPUT                    CLAUDE ACTIONS                 OUTPUT
  ──────────                    ──────────────                 ──────

  "Migrate to new API"        ┌─────────────────┐
  (or _step1_                 │ 1. GOAL         │
   decisions.md    ───────▶  │  Read _step1_   │
   from /step1)               │  decisions.md,  │
                              │  transform:     │
                              │  themes → phase,│
                              │  pitfalls →     │
                              │  guardrails     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 2. RESEARCH     │
                              │  • Read sources │
                              │  • Find patterns│
                              │  • Map deps     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 3. DESIGN +     │◀──── PARALLELISM-FIRST
                              │    WRITE        │
                              │  • One phase per│
                              │    deliverable  │
                              │    (default)    │
                              │  • Independent  │
                              │    deliverables │
                              │    = parallel   │
                              │  • Split only if│
                              │    part creates │
                              │    a dependency │
                              │  • Write plan in│
                              │    one Write cal│
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 4. WRITE        │──────────────────────┐
                              │  _step2_plan.md │                      │
                              └────────┬────────┘                      ▼
                                       │               ┌───────────────────────────┐
                              ┌────────▼────────┐      │ ## Rationale              │
                              │ 5. CLEAN UP     │      │ **Approach:** JWT + ...   │
                              │  Del _step1_    │      │ **Patterns:** follow...   │
                              │  decisions.md   │      │ **Non-goals:** no SSO...  │
                              └────────┬────────┘      │                           │
                                       │               │ | Phase | Name | Depends  │
                              ┌────────▼────────┐      │ |-------|------|--------- │
                              │ 6. CONFIRM      │      │ | 1     | A   | -        │
                              │  Show summary   │      │ | 2     | B   | 1        │
                              │  Suggest fresh  │      │                           │
                              │  session + exe  │      │ ## Phase 1: ...           │
                              └─────────────────┘      │ **Outputs:**              │
                                                       │ - deliverable names/paths │
                                                       │ **Inputs:**               │
                                                       │ - `source/ref` —          │
                                                       │   what to look at and why │
                                                       │ **Guardrails:**           │
                                                       │ - Don't modify User type  │
                                                       │ **Tasks:**                │
                                                       │ - [ ] Create base module  │
                                                       └───────────────────────────┘

  _step2_plan.md IS THE CONTEXT BRIDGE
  ─────────────────────────────
  Everything a fresh /step3 session needs is IN the plan:
  ✓ Rationale    - approach, patterns to follow, what's out of scope
  ✓ Phases       - self-contained, no cross-phase references
  ✓ Inputs       - sources to read + what to look at in them
  ✓ Guardrails   - per-phase constraints from analysis pitfalls
  ✓ Deliverables - explicit names, never "the output from Phase 2"

  PARALLELISM-FIRST DESIGN
  ────────────────────────
  Default: one phase per deliverable
  Independent deliverables = parallel group
  Split only when part of a deliverable creates
  a dependency other phases need first

  CODE-TASK OVERRIDES (when code-task: true)
  ──────────────────────────────────────────
  • Phase granularity: one phase per file
  • Size budget: 50-150 dispatched lines per phase
  • Labels: Modifies/Reference instead of Outputs/Inputs
  • Overview table: includes Est. Lines column
```

</details>

---

<details>
<summary><strong>/step3 Flow Diagram</strong></summary>

```
┌─────────────────────────────────────────────────────────────────┐
│                /step3 - Orchestrated Execution                   │
└─────────────────────────────────────────────────────────────────┘

  DESIGNED FOR FRESH SESSION — no prior context needed.
  _step2_plan.md contains everything.
  ALL-OR-NOTHING — checkpoint before execution, recover on failure.

                    ORCHESTRATOR (main context)
                    ───────────────────────────
                              │
                    ┌─────────▼─────────┐
                    │ 1. CHECKPOINT     │
                    │                   │
                    │  Git repo:        │
                    │   • git add -A    │◀─── SAFETY NET
                    │     commit        │
                    │   • Store hash    │
                    │                   │
                    │  Existing files   │
                    │  (no git):        │
                    │   • Backup to     │
                    │     _step3_backup/│
                    │                   │
                    │  Greenfield       │
                    │  (no git):        │
                    │   • Skip — nothing│
                    │     to recover    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. LOAD           │
                    │   • Parse phases  │
                    │   • Map deps      │
                    │   • Store minimal │◀─── keeps context LEAN
                    └─────────┬─────────┘
                              │
          ┌───────────────────▼───────────────────┐
          │           3. EXECUTE LOOP             │
          │  ┌─────────────────────────────────┐  │
          │  │ Find ready phases (deps met)   │  │
          │  └───────────────┬─────────────────┘  │
          │                  │                    │
          │  ┌───────────────▼─────────────────┐  │
          │  │ Group by parallel safety       │  │
          │  │ Same group → dispatch together │  │
          │  └───────────────┬─────────────────┘  │
          │                  │                    │
          │      ┌───────────┴───────────┐        │
          │      ▼                       ▼        │
          │ ┌─────────┐           ┌─────────┐     │
          │ │Subagent │           │Subagent │     │    PARALLEL
          │ │Phase 2  │           │Phase 3  │     │    EXECUTION
          │ │• Inputs │           │• Inputs │     │
          │ │  first  │           │  first  │     │    Subagents read
          │ │• Guard- │           │• Guard- │     │    Inputs FIRST,
          │ │  rails  │           │  rails  │     │    then produce
          │ │• Summary│           │• Summary│     │    Outputs
          │ └────┬────┘           └────┬────┘     │
          │      │                     │          │
          │  ┌───┴─────────────────────┴────────┐  │
          │  │ Log: "Phase N: [title]"          │  │
          │  └───────────────┬──────────────────┘  │
          │                  │                    │
          │         [continue until done]         │
          └───────────────────┬───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 4. SUCCESS        │
                    │  • Del _step2_   │
                    │    plan.md       │
                    │  • Commit (+push) │
                    │  • Report summary │
                    └───────────────────┘
                    Output: "Done."

          ┌───────────────────────────────────────┐
          │ ON FAILURE: RECOVERY OPTIONS           │
          │                                       │
          │ ╔═════════════════════════════════════╗│
          │ ║ PLAN FAILED — RECOVERY OPTIONS      ║│
          │ ║                                     ║│
          │ ║ Checkpoint: <hash or _step3_backup/>║│
          │ ║                                     ║│
          │ ║ If git:                             ║│
          │ ║   Recovery: git reset --hard <hash> ║│
          │ ║ If backup:                          ║│
          │ ║   Recovery: restore from backup     ║│
          │ ║                                     ║│
          │ ║ User decides: recover or keep       ║│
          │ ║ partial changes                     ║│
          │ ╚═════════════════════════════════════╝│
          └───────────────────────────────────────┘

  CONTEXT EFFICIENCY
  ──────────────────
  ORCHESTRATOR          │ SUBAGENT
  ──────────────────────│──────────────────────────
  • Reads plan ONCE     │ • Gets ONLY its phase
  • Tracks phase #s     │ • Gets Rationale (patterns, non-goals)
  • Never executes      │ • Gets dependency descriptions
  • Stays minimal       │ • Reads Inputs FIRST
  • 1 line per phase    │ • Respects Guardrails as hard constraints

  ALL-OR-NOTHING EXECUTION
  ────────────────────────
  ✓ Checkpoint before any phase runs
  ✗ Any failure → STOP immediately
  ✗ Recovery options presented — user decides
  ✓ Clean state guaranteed for re-run

  ON SUCCESS → COMMIT & CLEAN
  ───────────────────────────
  _step2_plan.md deleted. Changes committed (pushed if remote).
  Done.
```

</details>

---

## Example `_step2_plan.md`

```markdown
<!-- @plan: /step2 -->
# Migrate to New API

**Goal:** Replace legacy REST client with new versioned API across client and server.

## Rationale

**Approach:** Incremental migration — new types first, then client/server in parallel
**Why:** Existing code already uses typed responses; adding new types is non-breaking
**Patterns:** All types use Response<T> wrapper; endpoints follow RESTful naming in src/routes/
**Non-goals:** No SSO integration, no breaking changes to public API surface

## Phases Overview

| Phase | Name | Depends | Parallel Group |
|-------|------|---------|----------------|
| 1 | Create types | - | A |
| 2 | Update client | 1 | B |
| 3 | Update server | 1 | B |
| 4 | Integration tests | 2,3 | C |

## Phase 1: Create types
**Outputs:** src/types/
**Inputs:**
- `src/types/api.ts` — follow existing Response<T> wrapper pattern
- `src/types/index.ts` — add re-exports here
**Tasks:**
- [ ] Define new API response types
- [ ] Add validation schemas
```

## Artifact Lifecycle

```
/step1 → _step1_decisions.md written
    ↓ (fresh session)
/step2 → reads _step1_decisions.md → writes _step2_plan.md → deletes _step1_decisions.md
    ↓ (fresh session)
/step3 → checkpoint → executes → deletes _step2_plan.md (or recover on failure)
```

Both `_step1_decisions.md` and `_step2_plan.md` are disposable. Each step produces an artifact, the next consumes and deletes it. The completed work is the deliverable, not the artifacts.

**Location rules:** All plan artifacts live at repository root — never in subdirectories.

## Context Efficiency

The three-step pipeline is designed around context window limits:

1. **Fresh sessions** — each step starts clean, avoiding context bloat from prior exploration
2. **Artifacts as bridges** — `_step1_decisions.md` and `_step2_plan.md` carry only what the next step needs
3. **Direct reads in step1/step2** — both skills read sources directly (Read/Glob/Grep). The main agent needs context in its own window to interrogate decisions and design accurate phases
4. **Parallel subagents in step3** — dispatches small, focused phases that fit within subagent context windows. Only step3 uses subagents — it's a dispatcher, not an explorer
5. **No accumulated state** — the orchestrator in `/step3` tracks only phase numbers and status, not content
6. **Rationale propagation** — the Rationale section in `_step2_plan.md` gives subagents awareness of the "why" and pitfalls without the orchestrator having to relay context from the analysis session

**Fast execution:** With permissions pre-approved, execution is fast and — when you're confident — can run unsupervised to completion.

**Fully autonomous:** Enable `bypassPermissionsModeAccepted` in settings or run `claude --dangerously-skip-permissions` to skip all permission prompts (use with caution — try at your own risk).

## Hotkeys

### Quick-Access Hotkeys (Windows)

For frequent use, keyboard shortcuts eliminate typing skill names entirely. The included [AutoHotkey v2](https://www.autohotkey.com/) script binds skills and utilities to hotkeys when Windows Terminal is focused.

| Hotkey | Action |
|--------|--------|
| <kbd>Ctrl+1</kbd> | Send `/step1` + Enter (use after conversation context or at end of a typed prompt) |
| <kbd>Ctrl+2</kbd> | Clear context, then send `/step2` + Enter |
| <kbd>Ctrl+3</kbd> | Clear context, then send `/step3` + Enter |
| <kbd>Ctrl+H</kbd> | Send `/gc` + Enter |
| <kbd>Ctrl+M</kbd> | Send `/clear` + Enter |

**Why clear is built into <kbd>Ctrl+2</kbd> and <kbd>Ctrl+3</kbd>:** `/step2` and `/step3` are designed for fresh sessions — they read their input from artifact files (`_step1_decisions.md`, `_step2_plan.md`), not from conversation history. Running them in a stale context wastes tokens and risks confusing the model with leftover state. The `ClearAndCmd` function folds clear+invoke into one keypress. `/step1` and `/gc` don't auto-clear because they benefit from existing context — `/step1` often follows a conversation, and `/gc` commits what you just worked on.

**Using <kbd>Ctrl+1</kbd>:** Since it submits immediately, provide context *before* pressing the hotkey. Two typical patterns: (1) you've been chatting and session history already has the context — just hit <kbd>Ctrl+1</kbd>; (2) type your prompt first describing what you want to change, then hit <kbd>Ctrl+1</kbd> to append `/step1` and submit.

**The workflow cycle:**

```
Ctrl+1  →  (context already in session or typed in prompt) → /step1 runs, writes _step1_decisions.md
Ctrl+2  →  /clear + /step2 reads _step1_decisions.md, writes _step2_plan.md
Ctrl+3  →  /clear + /step3 executes plan
```

One keypress per stage — no manual clearing between steps.

**Setup:**

1. Install [AutoHotkey v2](https://www.autohotkey.com/) (v2.0+)
2. Create a shortcut to `hotkeys/3step-hotkeys.ahk` and place it in your Startup folder so it runs on login:
   - Right-click the `.ahk` file → **Create shortcut**
   - Move the shortcut to your Startup folder:
     ```
     %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
     ```
     Open this folder quickly with <kbd>Win+R</kbd> → `shell:startup` → Enter.
3. Double-click the script (or restart) to activate.

**Notes:**
- **Vim mode safety:** The script starts every hotkey with <kbd>Esc</kbd> → `i` to ensure the input is in insert mode regardless of current state. This prevents keystrokes from being interpreted as vim commands when the terminal is in normal mode. If you don't use vim mode in your terminal, this is harmless.
- **Sleep timing:** `Sleep(200)` between keystrokes and `Sleep(2000)` after `/clear` + Enter ensure reliable sequencing. Claude Code needs time to process `/clear` before accepting the next command. Increase these values if keystrokes arrive before Claude Code is ready.
- **`#HotIf` scoping:** `#HotIf WinActive("ahk_exe WindowsTerminal.exe")` scopes hotkeys exclusively to Windows Terminal — they never interfere with other applications. Customize this target for other terminals (e.g., `ahk_exe Code.exe` for VS Code's integrated terminal).
- **macOS/Linux:** Similar bindings can be achieved with tools like Hammerspoon (macOS) or xdotool (Linux).

## Hooks

### Status Line

`hooks/statusline.js` displays context usage, working directory, quota projections, and model:
```
▰▰▱▱▱▱▱▱ 25%    project    ▰▰▰▰▰▰▱▱ 48m    ▰▰▱▱▱▱▱▱ 2d 5h    Opus 4.6
```
Left to right: context bar (used % after bar), folder name, 5-hour quota with time remaining, 7-day quota with time remaining, model name. Filled segments (▰) use default text color, empty use outline (▱). Time adapts units: minutes (<1h), hours + minutes (<5h), hours (<1d), days + hours. Quota data from Anthropic OAuth API with 30s cache.

**Quota bars are two-tone.** Each bar has three zones: actual usage (default color), projected overshoot (orange), and remaining (outline). The projection asks: "at this rate of consumption, where will I be when the window ends?" — `rate = actual ÷ elapsed`, then `projected = rate × window`. Example: 20% used 1h into a 5h window → rate is 20%/h → projected 100% by window end. The orange zone fills the gap between actual and projected, giving an at-a-glance pace warning.

Enable in `settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node -e \"require(require('os').homedir() + '/.claude/hooks/statusline.js')\""
  }
}
```

## Files

```
skills/step1/skill.md       — /step1 skill definition
skills/step2/skill.md       — /step2 skill definition
skills/step3/skill.md       — /step3 skill definition
skills/distill/skill.md     — /distill skill definition
skills/gc/skill.md          — /gc skill definition
skills/gc/gc_diff.py        — compact diff summarizer for /gc
hooks/statusline.js         — custom status line hook
hotkeys/3step-hotkeys.ahk   — AutoHotkey keyboard shortcuts
```

## Co-Author

Built in collaboration with [Claude](https://claude.ai) by Anthropic.

## License

MIT
