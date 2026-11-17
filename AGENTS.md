# AGENTS.md

Shared instructions for every coding agent working in this repo (Claude Code, Codex, etc.).
`CLAUDE.md` imports this file; keep agent-neutral guidance here.

## What this is

**Brick Bin** (`brick-bin.app`): a self-hosted web app for a household's collection of building-brick
sets (LEGO and off-brand). Hosted on a Proxmox server, reachable over Tailscale. A sibling of
`game-inventory` ("The Shelf"), reusing its stack and architecture rules. Not a SaaS.
`docs/PLAN.md` is the implementation plan and the source of truth for scope, data model and phases.

## Stack

- Next.js (App Router) + TypeScript, strict
- **Mantine** for UI. **Do not add Tailwind** (or any utility-CSS framework). Use Mantine components,
  style props, and CSS modules with `postcss-preset-mantine`.
- **Design system "Brick Bin"**: tokens in `src/theme.ts` (`--app-*` CSS variables, light and dark), reference
  mockups in `docs/design/brick-bin/` (README, tokens.md). Bricolage Grotesque (titles) and Atkinson
  Hyperlegible Next (body) are in `src/fonts/`. Use `--app-*` variables in CSS modules, not hard-coded
  colours. Fonts and assets are
  **self-hosted**; never load anything from a CDN at runtime.
- PostgreSQL 17 + Drizzle ORM (migrations via drizzle-kit). v1 is deployed, so **never regenerate or
  edit existing migration SQL or snapshots in `drizzle/`**. Every schema change is a new migration:
  run `pnpm db:generate` and commit its output, including the updated `drizzle/meta/_journal.json`.
- pnpm; tool versions pinned with **mise** (`mise.toml`). Run `mise install` once, then use
  `mise exec -- pnpm <cmd>` if the shell isn't mise-activated.
- Linting and formatting use the **oxc stack** (oxlint + oxfmt). Do not add ESLint or Prettier.
- Vitest for unit tests, Playwright for e2e

## Commands

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm lint` (oxlint), `pnpm format` / `pnpm format:check` (oxfmt), `pnpm typecheck`, `pnpm test`
- `docker compose up -d db` starts local Postgres

## Architecture rules

Full detail is in `docs/PLAN.md` section 2. In short:

1. **Household scoping**: every domain table has `household_id`; every query goes through
   `src/server/data/` with a `DataContext`. The `rb_*` catalog tables are the one global exception.
2. **Set vs copy**: `sets` is the design, `copies` is a physical box with its own build state,
   location, value and missing pieces.
3. **Audit everything** in the same transaction (`recordAudit`), except private wishlist purchase
   marks.
4. **Soft deletes** with restore guards; delete buttons go through `ConfirmDelete`.
5. **Visibility is enforced on the server**, never only in the UI (restricted kid profiles, private
   purchase marks). Add tests asserting hidden data never appears.
6. **No background downloading.** External requests happen only when a person asks.
7. Config comes from environment variables. Update `.env.example` with every new variable.

## Conventions

- Strict TypeScript. Validate external input with zod.
- Keep commits small and conventional (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- **Work from branches.** v1 is deployed (tagged `v1.0.0`). Every change goes on a branch (`feat/...`, `fix/...`, `chore/...`) and lands on `main` through a PR once CI passes. A push to `main` publishes the image and the Proxmox host deploys it within minutes, so never push to `main` directly.
- Do not commit secrets or `.env` files.
- Avoid LEGO trade dress in the UI: no LEGO logo, red-and-yellow scheme, minifigure likeness.

<!-- mempalace-shared-brain:start (adapted from mempalace repo integrations/shared/coordination-protocol.md; host is resolved from MEMPALACE_LOCAL_HOSTNAME, ~/.mempalace-host or .mempalace-host) -->

## MemPalace shared brain

You share a MemPalace hub with other agents. Your agent identity is
host:harness:project. Resolve <host> once at session start;
the first of these that is set wins: (1) the MEMPALACE_LOCAL_HOSTNAME
environment variable, (2) the first line of ~/.mempalace-host, (3) the
first line of .mempalace-host in the root of the current git repo
(gitignored). If none exists, ask the user for the host name; never
guess it. <harness> is the name of the agent harness you are running in,
lowercase (for example claude, codex, gemini, opencode); always use your
own, never another harness's. <project> is the current workspace/repo
name (lowercase). Example:
<host>:<harness>:brick-bin. Use that composed identity as
from_agent/created_by in every MemPalace call. Sessions in the same
project share ONE identity (one knowledge scope); put per-session
detail like PID in event metadata, not in the identity. Never
impersonate another agent. Never mint a second harness suffix to split
windows — parallel lanes use topic, not a forged identity.

Memory (recall + writing):

- Before answering about past work, decisions, people, or projects,
  search the palace (mempalace_search; mempalace_kg_query for
  relational/temporal facts). Quote results verbatim — never paraphrase
  stored content. If the palace has nothing, say so; don't guess.
- File durable outcomes (decisions, conclusions, learned facts) with
  mempalace_add_drawer. New KG facts: mempalace_kg_add. When a
  single-valued fact changes: mempalace_kg_supersede. When a fact ended
  without replacement: mempalace_kg_invalidate. Don't file secrets or
  tokens.

Coordination (logstream):

- Chat sessions are declared-idle until a coordination loop starts.
  Do not arm a background watcher at session start. Focus on the user's
  request first; engage the logstream when collaborating, delegating,
  or when asked to listen.
- Inbox: when entering collaborative mode or before long tasks,
  mempalace_event_list with to_agent=<host>:<harness>:<project>,
  since_event_id=<last event id you processed>, preview=true. Omit
  order: a resume from a cursor is chronological, and with no cursor
  the same call returns newest-first. Remember that id — it is your
  cursor. Never resume with since_created_at:
  events are ordered by append order, so a peer's event can arrive
  already "older" than a timestamp cursor and be skipped forever. '*'
  broadcasts match automatically.
- Arm mempalace logstream watch (and re-arm after every wake) when any
  of these happen — not before: (1) the user asked you to listen or
  coordinate, (2) you ack a task with status=claimed, (3) you delegate
  (append a task.request). Command:
  `mempalace logstream watch --agent <host>:<harness>:<project>
  --type task.request --type task.reply --type patch.ready --json`
  Use --agent, not --to-agent: it also excludes your own events. The
  CLI defaults a sanitized --state-file from --agent. Treat exit 0 as
  mail and exit 2 as idle. Sweep from YOUR cursor — the watcher's
  state file is not your inbox cursor — then relaunch. In-turn,
  waiting on one known correlation, mempalace_event_wait complements
  the watcher, never replaces it. If this machine is a remote MCP
  client and does not own the palace or a synced replica, do not run
  local logstream watch; loop on mempalace_event_wait and carry
  since_event_id.
- When you arm a watcher, announce once (type=status, room=status,
  to_agent=*) naming your filter and cursor so others know you are
  listening. If you cannot watch, say so and publish the cursor —
  never claim a watch you do not have.
- Acks: mempalace_event_ack (CLI: `mempalace logstream ack`) — it
  fills type=event.ack and the ack_of link; don't hand-roll event.ack
  appends. Acks inherit the target event's topic.
- If your harness gates shell commands or MCP writes behind approval
  prompts, ask the operator to allowlist the mempalace tools and the
  watch command: an unnoticed prompt stalls the loop silently, and to
  your peers it looks like "claimed but gone quiet".
- Topics: write topic=<lane> on named workstreams (e.g. auth-v2). Do
  not filter the default inbox or watcher on topic unless you
  announced that filter. Stream = project/scope, room = lifecycle
  (delegation/reviews/status), topic = optional lane.
- To delegate: mempalace_event_append (type=task.request, stream=
  project/<name>, room=delegation, topic=<lane if any>,
  correlation_id=task_..., status=open, body = goal + branch + base
  commit + definition of done), then mempalace_event_wait on that
  correlation_id.
- When you accept a task: first check the correlation for an existing
  status=claimed from your OWN identity — a sibling session on the
  same project may already own it; if so, don't double-work (on a
  simultaneous claim, lowest-HLC wins). Then ack with status=claimed.
  Deliver code as a patch via mempalace_patch_submit (never just push
  a branch and go silent). If blocked, reply with status=blocked and
  verbatim notes.
- When you receive a patch: mempalace_artifact_get, verify sha256,
  apply only with explicit user-visible intent, run the stated tests,
  then mempalace_event_ack with status=applied or failed.
- Events are append-only and verbatim. Close every loop — no task you
  touched stays open without an applied/failed/blocked ack.

<!-- mempalace-shared-brain:end -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
