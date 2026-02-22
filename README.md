# 3-step-plan-claude-code

Decide → Plan → Execute skills for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each step produces a lightweight artifact so you can `/clear` context and start the next step fresh — better performance, lower token cost (see [Hotkeys](#hotkeys) to automate this).

- **Step 1** — structured Q&A where Claude challenges your assumptions, pushes back on risky choices, and discovers new questions as your answers reshape the problem. Writes `_step1_decisions.md`
- **Step 2** — reads the decisions file in a fresh window, transforms them into parallelism-maximized phases with dependencies, guardrails, and file-level context. Writes `_step2_plan.md`
- **Step 3** — reads the plan file in a fresh window, dispatches phases to subagents while the main context stays lean

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
/step3 (execute) → code changes → deletes _step2_plan.md
```

`/step1` guides you from open question to clear decision through structured one-at-a-time Q&A — Claude asks, recommends, auto-decides when obvious, discovers new questions as answers reshape the picture, and tracks all decisions as you go. For multi-file or convention-setting outcomes it writes `_step1_decisions.md` — the artifact that bridges analysis to planning. Only for single-file localized fixes does it skip the artifact and proceed directly. `/step2` reads `_step1_decisions.md` in a fresh session and transforms those decisions into a parallelism-maximized `_step2_plan.md` with per-phase guardrails, rich Reference fields for subagent orientation, and a validation checklist before writing. `/step3` executes it via subagents in a fresh session. Each stage produces a disposable artifact consumed and deleted by the next. Code changes are the deliverable, not the artifacts.

Also included: `/trim` for token-efficient documentation condensing, and `/gc` for streamlined git commit and push with a Python helper for compact diff summarization.

## Why Custom Plan Skills?

Claude Code has a [built-in Plan Mode](https://docs.anthropic.com/en/docs/claude-code) and subagents (the Task tool). These custom skills explicitly ban both in `/step1` and `/step2` — Plan Mode hijacks the skill's own flow, and subagents lose the codebase context that step1 needs for interrogation and step2 needs for accurate phase design. `/step3` uses subagents by design (it's a dispatcher) but still bans Plan Mode. The skills are the framework; built-in Plan Mode is a competing one.

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

Software development is iterative — you discover what you need day by day, not upfront. This workflow preserves that rhythm: smaller plans with controlled execution, letting you advance confidently while maintaining the ability to course-correct when a step proves wrong.

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
  │ • Bridge    │         │ • Validate  │         │ • All-or-   │
  │             │         │             │         │   nothing   │
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
  [3] During /step3        → Monitor progress, fail-fast resets to checkpoint

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
  On success: _step2_plan.md deleted (code is the deliverable)
```

</details>

<details>
<summary><strong>Why This Approach Works</strong></summary>

Since ChatGPT's public release on November 30, 2022, through the transition to Claude Code with Opus on the Max plan, one pattern has proven reliable: tight feedback loops with human judgment at decision points. This workflow gives you end-to-end execution from idea to completion while keeping you in control of pace and direction.

**Related tools:** I was already using multi-phase planning skills when I discovered [GSD (Get Shit Done)](https://github.com/glittercowboy/get-shit-done). What caught my attention was GSD's use of subagents to preserve the main context window. I incorporated that pattern into my workflow, refining `/step3` so the orchestrator stays minimal while subagents handle the heavy lifting.

Interestingly, Claude Code's built-in Plan Mode uses similar tactics — we're all converging on the same insight: **delegate context consumption to isolated agents**.

GSD does more than I need for my workflow. `/step1`, `/step2`, and `/step3` take a lighter approach for developers who prefer tighter feedback loops — scanning first, refining plans conversationally, steering direction as needed. More elaborate plans consume more of your usage allowance, which matters on Claude Code's Max plan where token efficiency is important.

</details>

**Features:** Phases with dependencies · Parallel groups · Git checkpoint with all-or-nothing execution · Per-phase Reference and Guardrails · Auto commit & push on success · Subagent orchestration · Token-efficient artifact lifecycle · Context window management

---

**Why analyze first?** `/step1` isn't just analysis — it's structured interrogation where Claude drives the conversation one question at a time, dynamically discovering new questions as each answer reshapes the problem space. It explores the codebase, forms opinions, probes for weaknesses in your chosen approach, and flags tensions between decisions. When the evidence is overwhelming, it auto-decides and moves on. You see a running decision tracker after every answer, and can go back to revisit any previous choice. The output is a compact decision block — with rejected alternatives and risks clearly stated — that `/step2` actively transforms into parallelism-maximized phases with per-phase guardrails.

In Claude Code, you can use skills in two ways:
- **Start of conversation** — Begin with just `/step1` to open an interactive session, bouncing ideas back and forth until direction crystallizes
- **Anywhere in a prompt** — Include `/step1` at the end or mid-prompt to get structured analysis before committing to implementation

---

### /step1 — Explore, Interrogate, Decide

Interactive Q&A that converges on decisions. Reads your codebase, identifies decision points, and walks through them one question at a time.

- Auto-decides when codebase evidence is overwhelming
- Pushes back on risky choices
- Discovers new questions as answers reshape the problem
- Tracks decisions with a live status block after every answer

**Output:** `_step1_decisions.md` at repo root (or inline summary for single-file fixes via early resolution).

**Usage:**
- `/step1` — asks what needs solving
- `/step1 <topic>` — skips the opening question
- `/step1 resume` — continues from last decision tracker

### /step2 — Structured Plan for Subagent Execution

Reads `_step1_decisions.md` and produces a self-contained execution plan. Designed so a fresh `/step3` session can execute it with zero prior context.

- Transforms decisions into phases with explicit file paths, guardrails, and dependencies
- Maximizes parallelism — groups independent phases for concurrent execution
- Keeps each phase within a context budget (~50-150 lines) so subagents stay focused
- Validates before confirming: parallel maximization, no file collisions, subagent autonomy, guardrail placement, completeness

**Output:** `_step2_plan.md` at repo root. Deletes `_step1_decisions.md` after writing.

**Usage:**
- `/step2` — reads `_step1_decisions.md` automatically
- `/step2 <goal>` — falls back to description if no decisions file exists

**Execution model note:** `/step3` targets 50-150 lines per subagent dispatch. `/step2` designs phases to fit this budget — if a phase needs extensive context to execute, it's too big or too vague and gets split.

### /step3 — Execute Plan via Subagents

Dispatches phases from `_step2_plan.md` to subagents. The main thread is a lightweight orchestrator — it never executes tasks directly.

- Creates a git checkpoint before any work begins
- Runs parallel groups concurrently, serial groups in order
- Fail-fast: stops on first failure, recommends checkpoint reset
- On success: deletes `_step2_plan.md`, commits and pushes

**Execution model:** All-or-nothing. A git checkpoint is created before any phase runs. If anything fails, reset to the checkpoint — no partial recovery, no resume.

**Usage:**
- `/step3` — loads and executes `_step2_plan.md`

### /trim — Token-Efficient File Optimization

Documentation and instruction files tend to grow over time. Every conversation, Claude reads these files for context. That accumulated verbosity costs tokens without adding value. `/trim` condenses prose without losing a single piece of information. It inventories every fact, rule, and example before making changes, then verifies nothing was lost. When in doubt, it keeps the original.

Use `/trim` as periodic maintenance on any documentation that evolves with your project. The result: cleaner files, lower token overhead, same complete information.

**Usage:**
- `/trim <file-path>`

<details>
<summary><strong>/trim Flow Diagram</strong></summary>

```
┌─────────────────────────────────────────────────────────────────┐
│               /trim - Token-Efficient Optimization               │
└─────────────────────────────────────────────────────────────────┘

  USER INPUT                    CLAUDE ACTIONS                 OUTPUT
  ──────────                    ──────────────                 ──────

  "/trim CLAUDE.md"    ───────▶┌─────────────────┐
                               │ 1. GET PATH     │
                               │   (arg or ask)  │
                               └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │ 2. READ         │
                               │   • Load file   │
                               │   • Note lines  │
                               └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │ 3. INVENTORY    │◀─── CRITICAL STEP
                               │   List EVERY:   │
                               │   • Fact        │
                               │   • Rule        │
                               │   • Instruction │
                               │   • Example     │
                               │   • Value       │
                               └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │ 4. OPTIMIZE     │
                               │   Condense ONLY:│
                               │   • Filler words│
                               │   • Redundant   │
                               │     phrasing    │
                               │   • Whitespace  │
                               └────────┬────────┘
                                        │
                               ┌────────▼────────┐
                               │ 5. VERIFY       │◀─── MANDATORY
                               │   • Count items │
                               │   • Compare to  │
                               │     inventory   │
                               │   • Check meaning│
                               └────────┬────────┘
                                        │
                        ┌───────────────┴───────────────┐
                        │                               │
                  [counts match]                [counts differ]
                        │                               │
                        ▼                               ▼
               ┌─────────────────┐            ┌─────────────────┐
               │ 6. WRITE        │            │    STOP         │
               │   Save trimmed  │            │   Restore items │
               │   version       │            │   Do not write  │
               └────────┬────────┘            └─────────────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ 7. REPORT       │────────────────────────────────┐
               │   • Before/after│                                │
               │   • What changed│                                ▼
               └─────────────────┘            ┌───────────────────────────────┐
                                              │ Trimmed: CLAUDE.md            │
                                              │ Before: 127 lines             │
                                              │ After:  98 lines              │
                                              │ Condensed:                    │
                                              │  • Verbose explanations       │
                                              │  • Redundant phrases          │
                                              │  • Extra blank lines          │
                                              │ Preserved: all 42 rules/facts │
                                              └───────────────────────────────┘

  SAFETY GUARANTEES
  ─────────────────
  ✓ ZERO information loss   - every fact survives
  ✓ Inventory verification  - counts before and after
  ✓ Meaning preservation    - two rules stay as two rules
  ✓ Fail-safe default       - when uncertain, keep it

  WHAT GETS CONDENSED              WHAT NEVER CHANGES
  ──────────────────────           ───────────────────
  • "In order to" → "to"           • Rules and constraints
  • "It should be noted" → cut     • Examples and values
  • Redundant explanations         • Technical instructions
  • Excessive whitespace           • Code blocks
  • Filler phrases                 • Any distinct meaning

  PHILOSOPHY
  ──────────
  Tokens are cheap. Lost information cannot be recovered.
  When in doubt: KEEP IT.
```

</details>

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
│            /step1 - Explore → Interrogate → Bridge              │
└─────────────────────────────────────────────────────────────────┘

  USER INPUT                    CLAUDE ACTIONS                 OUTPUT
  ──────────                    ──────────────                 ──────

  "/step1 auth-system"          ┌─────────────────┐
  or just "/step1"     ───────▶│  1. EXPLORE     │
  or "/step1 resume"           │  • Topic (arg   │
                            │    or ask)      │
                            │  • Read files   │
                            │  • ID initial   │
                            │    decisions    │
                            │  • Form opinions│
                            │  • Scope est:   │
                            │    "~N decisions│
                            │    to resolve"  │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │  2. INTERROGATE │◀──── ONE Q AT A TIME
                            │                 │      via AskUserQuestion
                            │  DYNAMIC:       │
                            │  • Best answer  │
                            │    first        │
                            │  • Auto-decide  │
                            │    if obvious   │
                            │  • Discover new │◀──── answers reveal
                            │    questions    │      new problems
                            │  • Kill mooted  │
                            │    questions    │
                            │  • Probe weak-  │◀──── challenge choices
                            │    nesses       │
                            │  • Flag tensions│
                            │  • Go back/Park │
                            │    via "Other"  │
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
                            │  3. BRIDGE      │
                            │                 │
                            │  EARLY (single   │     FULL (multi-file,
                            │  file fix):     │     conventions, docs):
                            │  • Skip file    │     ┌─────────────────────────────┐
                            │  • Summarize    │     │ ## Decision: [topic]        │
                            │    inline       │     │ **Approach:** JWT + middle  │
                            │  • Proceed      │     │ **Why:** fits existing...   │
                            │    directly     │     │ **Rejected:** session..     │
                            │                 │     │ **Risks:** token expiry..   │
                            │  FULL:          │     │ **Key decisions:**          │
                            │  • "Anything to │     │ - decision 1, 2, 3...       │
                            │    change?"     │     └─────────────────────────────┘
                            │  • Write        │
                            │    _step1_      │
                            │    decisions.md │
                            └─────────────────┘

  CONSTRAINTS
  ───────────
  ✗ No implementation     - thinking only, no code changes
                            (only _step1_decisions.md)
                            Exception: early resolution (single-file
                            localized fix) skips artifact and proceeds
  ✓ Claude participates   - recommends, warns, challenges, validates
  ✓ Emergent discovery    - questions evolve from answers
  ✓ One question at a time- never batch, never dump a list
  ⏸ User controls pace    - never auto-chains to /step2
  ◉ Converge or park      - all decisions resolved, or pause
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

  "Build new auth             ┌─────────────────┐
   system"            ───────▶│ 1. GOAL         │
  (or _step1_                 │  Read _step1_   │
   decisions.md               │  decisions.md,  │
   from /step1)               │  transform:     │
                              │  themes → phase,│
                              │  pitfalls →     │
                              │  guardrails     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 2. RESEARCH     │
                              │  • Read files   │
                              │  • Find patterns│
                              │  • Map deps     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 3. DESIGN +     │◀──── PARALLELISM-FIRST
                              │    WRITE        │
                              │  • One phase per│
                              │    file (default│
                              │  • Diff files = │
                              │    parallel     │
                              │  • Split only if│
                              │    part creates │
                              │    a dependency │
                              │  • Write plan in│
                              │    one Write cal│
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 4. VALIDATE     │◀──── BEFORE CONFIRMING
                              │  • Max parallel?│
                              │  • No collisions│
                              │  • Subagent     │
                              │    autonomy +   │
                              │    budget ok?   │
                              │  • Guardrails   │
                              │    placed?      │
                              │  • Completeness?│
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │ 5. WRITE        │──────────────────────┐
                              │  _step2_plan.md │                      │
                              └────────┬────────┘                      ▼
                                       │               ┌───────────────────────────┐
                              ┌────────▼────────┐      │ ## Rationale              │
                              │ 6. CLEAN UP     │      │ **Approach:** JWT + ...   │
                              │  Del _step1_    │      │ **Patterns:** follow...   │
                              │  decisions.md   │      │ **Non-goals:** no SSO...  │
                              └────────┬────────┘      │                           │
                                       │               │ | Phase | Group | Est.Ln  │
                              ┌────────▼────────┐      │ |-------|-------|---------|
                              │ 7. CONFIRM      │      │ | 1     | A     | ~60     │
                              │  Show summary   │      │ | 2     | B     | ~80     │
                              │  Suggest fresh  │      │                           │
                              │  session + exe  │      │ ## Phase 1: ...           │
                              └─────────────────┘      │ **Reference:**            │
                                                       │ - `src/auth/mid.ts` —     │
                                                       │   follow guard pattern    │
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
  ✓ Reference    - files to read + what to look at in them
  ✓ Guardrails   - per-phase constraints from analysis pitfalls
  ✓ File paths   - explicit, never "the file from Phase 2"

  PARALLELISM-FIRST DESIGN
  ────────────────────────
  Default: one phase per file
  Different files = parallel group
  Split only when part of a file creates
  a dependency other phases need first

  VALIDATION (before writing)
  ──────────────────────────
  ✓ Could any dep be broken by splitting?
  ✓ No file collisions in parallel groups?
  ✓ Subagent autonomous + dispatch under ~150 lines?
  ✓ All pitfalls placed as guardrails?
  ✓ All decisions reflected in phases?

  CONTEXT BUDGET
  ──────────────
  Target 50-150 lines per subagent dispatch
  If a phase exceeds this, split it
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
  ALL-OR-NOTHING — git checkpoint before execution, reset on failure.

                    ORCHESTRATOR (main context)
                    ───────────────────────────
                              │
                    ┌─────────▼─────────┐
                    │ 1. CHECKPOINT     │
                    │   • git add -A    │
                    │     commit + push │◀─── SAFETY NET
                    │   • Store hash   │
                    │   • _step2_plan  │
                    │     .md included │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 2. LOAD           │
                    │   • Parse phases  │
                    │   • Map deps      │
                    │   • Est. Lines    │
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
          │  │ Check dispatch budget (Est.Ln) │  │
          │  └───────────────┬─────────────────┘  │
          │                  │                    │
          │      ┌───────────┴───────────┐        │
          │      ▼                       ▼        │
          │ ┌─────────┐           ┌─────────┐     │
          │ │Subagent │           │Subagent │     │    PARALLEL
          │ │Phase 2  │           │Phase 3  │     │    EXECUTION
          │ │• Ref 1st│           │• Ref 1st│     │
          │ │• Guard- │           │• Guard- │     │    Subagents read
          │ │  rails  │           │  rails  │     │    Reference files
          │ │• Summary│           │• Summary│     │    FIRST, then code
          │ └────┬────┘           └────┬────┘     │
          │      │                     │          │
          │  ┌───┴─────────────────────┴────────┐  │
          │  │ Log: "✓ Phase N: [title]"        │  │
          │  └───────────────┬──────────────────┘  │
          │                  │                    │
          │         [continue until done]         │
          └───────────────────┬───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ 4. SUCCESS        │
                    │  • Del _step2_   │
                    │    plan.md       │
                    │  • Commit + push  │
                    │  • Report summary │◀─── code is the deliverable
                    └───────────────────┘

          ┌───────────────────────────────────────┐
          │ ON FAILURE: RESET TO CHECKPOINT       │
          │                                       │
          │ ╔═════════════════════════════════════╗│
          │ ║ PLAN FAILED — RESET RECOMMENDED    ║│
          │ ║                                     ║│
          │ ║ git reset --hard <hash>            ║│
          │ ║ git push --force                   ║│
          │ ║                                     ║│
          │ ║ Restores codebase + _step2_plan.md ║│
          │ ║ ready for clean re-run              ║│
          │ ╚═════════════════════════════════════╝│
          └───────────────────────────────────────┘

  CONTEXT EFFICIENCY
  ──────────────────
  ORCHESTRATOR          │ SUBAGENT
  ──────────────────────│──────────────────────────
  • Reads plan ONCE     │ • Gets ONLY its phase
  • Tracks phase #s     │ • Gets Rationale (patterns, non-goals)
  • Never executes      │ • Gets dependency descriptions
  • Stays minimal       │ • Reads Reference files FIRST
  • 1 line per phase    │ • Respects Guardrails as hard constraints

  ALL-OR-NOTHING EXECUTION
  ────────────────────────
  ✓ Checkpoint before any phase runs
  ✗ Any failure → STOP immediately
  ✗ No partial recovery — reset to checkpoint
  ✓ Clean state guaranteed for re-run

  ON SUCCESS → COMMIT & CLEAN
  ───────────────────────────
  _step2_plan.md deleted. Changes committed and pushed.
  Code is the deliverable.
```

</details>

---

## Example `_step2_plan.md`

```markdown
<!-- @plan: /step2 260215_1430 -->
# Migrate to New API

**Goal:** Replace legacy REST client with new versioned API across client and server.
**Created:** 2026-02-15

## Rationale

**Approach:** Incremental migration — new types first, then client/server in parallel
**Why:** Existing code already uses typed responses; adding new types is non-breaking
**Patterns:** All types use Response<T> wrapper; endpoints follow RESTful naming in src/routes/
**Non-goals:** No SSO integration, no breaking changes to public API surface

## Phases Overview

| Phase | Name | Depends | Parallel Group | Est. Lines |
|-------|------|---------|----------------|------------|
| 1 | Create types | - | A | ~60 |
| 2 | Update client | 1 | B | ~80 |
| 3 | Update server | 1 | B | ~75 |
| 4 | Integration tests | 2,3 | C | ~50 |

## Phase 1: Create types
**Modifies:** src/types/
**Reference:**
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
/step3 → checkpoint → executes → deletes _step2_plan.md (or reset to checkpoint on failure)
```

Both `_step1_decisions.md` and `_step2_plan.md` are disposable. Each step produces an artifact, the next consumes and deletes it. The code changes are the deliverable, not the artifacts.

**Location rules:** All plan artifacts live at repository root — never in subdirectories.

## Context Efficiency

The three-step pipeline is designed around context window limits:

1. **Fresh sessions** — each step starts clean, avoiding context bloat from prior exploration
2. **Artifacts as bridges** — `_step1_decisions.md` and `_step2_plan.md` carry only what the next step needs
3. **Direct reads in step1/step2** — both skills read files directly (Read/Glob/Grep), never via subagents. The main agent needs the code in its own context to interrogate decisions and design accurate phases
4. **Parallel subagents in step3** — dispatches small, focused phases that fit within subagent context budgets (~50-150 lines per dispatch). Only step3 uses subagents — it's a dispatcher, not an explorer
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
skills/trim/skill.md        — /trim skill definition
skills/gc/skill.md          — /gc skill definition
skills/gc/gc_diff.py        — compact diff summarizer for /gc
hooks/statusline.js         — custom status line hook
hotkeys/3step-hotkeys.ahk   — AutoHotkey keyboard shortcuts
```

## Co-Author

Built in collaboration with [Claude](https://claude.ai) by Anthropic.

## License

MIT
