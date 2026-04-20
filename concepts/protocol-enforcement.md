---
type: concept
tags:
  - meta
  - protocol
  - learning-system
  - ai-bias
  - enforcement
created: '2026-04-17'
---
# Protocol Enforcement

## What it is
The systemic AI drift toward "ship artifact, claim done" at the expense of the protocols that make the Janus system compound over time — memory capture, session handoffs, verification before claiming completion, inline learning writes.

## Why it matters
Across 30 days of operation (113 commits, ~42 memories) the system produced enormous build output but only one /evolve session created durable institutional knowledge. The correction memories below all describe the same failure mode dressed up in different symptoms:

- Memory **6a0df030** — AI skipped CLAUDE.md session protocols for 30 days
- Memory **fbcef958** — "Build sessions produce artifacts but NOT learnings"
- Memory **396d5cee** — Started new session without end-of-session protocol
- Memory **787e4713** — Context ended without handoff, lost continuity
- Memory **b1374193** — Claimed credentials saved when placeholders were written
- Memory **b1dc5de5** — /evolve produces 10x the institutional knowledge of a build session

Single root cause: **the AI's default instinct is to produce a visible artifact (code, a reply, a "done") and route around the invisible work (memory writes, verification, handoff snapshots).** When pressure mounts — context filling, task almost done, user waiting — the invisible work is what gets cut. It feels efficient in the moment and compounds to disaster over weeks.

## The enforcement rules (non-negotiable)

1. **Inline capture beats batched capture.** Write memories the moment the trigger fires (correction, surprise, decision), not at end-of-session. Batched capture doesn't happen.
2. **Verify before claiming.** "Credential saved" requires: value written (no placeholders), committed, pushed. "Feature works" requires: server runs, endpoint returns expected status, UI state updates, backend state confirms. No shortcut.
3. **Session context ~80% → STOP and snapshot** as `most-recent-context` with a handoff doc. This is the highest-priority interrupt, higher than finishing the task in flight.
4. **End-of-session protocol is not optional.** Even if the user seems done, run the summary + push + verify-memories-stored steps before closing.
5. **If you feel pressure to skip a protocol — that pressure is YOUR instinct, not Jano's preference.** He explicitly cares about the learning system working. Corrections 6a0df030 and fbcef958 make this direct: he has never told you to skip protocols.
6. **Schedule /evolve weekly.** One /evolve session consolidated 10 concepts, discovered 5+ MCPs, fixed RLS across all tables, and rewrote the financial agent. This ratio is not an accident — consolidation work is where leverage lives.

## How this compounds

The Janus system's thesis is that solo-founder leverage comes from **memory across sessions** and **patterns across projects**. Every missed protocol write is a sliver of compounding lost. After 30 days, the gap between "working memory" and "actual artifacts shipped" becomes the diagnostic signal. The pre-flight hook now surfaces `last memory written` and gap warnings precisely because this drift is invisible otherwise.

## How to recognize the drift (meta-signals)

- You're about to say "stored X" — did you actually read the file back to confirm? No? Stop.
- You're at 75% context and the task is "almost done" — it isn't. Snapshot first.
- Session has run for 30+ minutes with zero memory writes — something was worth capturing and wasn't.
- You catch yourself framing a protocol as "slowing things down" — that framing is the bias. Protocols exist because skipping them lost work.

## Links
- [[CLAUDE]] — dispatch protocol + context management rules
- [[concepts/test-harness-first]] — specific case of verify-before-claim
- [[learnings/patterns]] — cross-project behavioral patterns
- [[agents/core/evolve]] — the consolidation agent this concept most directly serves
