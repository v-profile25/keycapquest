# Keycap Quest — working notes

A single-page typing tutor game for kids. No build step, no backend —
`index.html` is the whole game (vanilla JS in one IIFE), plus `assets/`
for character art. See `README.md` for what it does.

## Running / testing locally

```
python3 -m http.server 8933
```
then `http://localhost:8933/index.html`. There's no test framework wired
into the repo — verification has been done ad hoc with Playwright
(`NODE_PATH=/opt/node22/lib/node_modules node script.js`, driving the UI
via real clicks/keyboard events). **Nothing in `index.html` is exposed on
`window`** — it's all closed over inside one IIFE — so a test script can't
call app functions directly via `page.evaluate`. Drive it through the DOM
(clicks, `keyboard.press`, reading rendered text) the same way a player
would, or read/write `localStorage['keycapQuest.v3']` directly to seed
test fixtures (fastest way to set up gold/gems/boss-clears without
grinding through the UI for real).

## Git / PR hygiene

This project has drifted into one long-lived PR (#1) that's absorbed the
entire build-out over many sessions and 20+ commits. That was fine for
the earliest bring-up, but it stopped being fine a while ago — a PR that
size isn't reviewable, and it never gets a "this chapter is done" moment.
Going forward:

- **Scope a PR to one feature or fix, not "everything since last time."**
  When starting a new chunk of work, check whether the current PR should
  be merged first rather than defaulting to "just add more commits."
- **Commit granularity should match the diff, not the chat message.** If
  a single user request produces several independent changes (e.g. "add
  X, Y, and Z"), that's several commits, not one commit with three
  paragraphs in the message.
- **Before ending a work session, flag PR state out loud**: is this PR
  done and mergeable, or genuinely still in progress? Don't let size be
  the only signal — a PR can be small and still done, or large and still
  correctly one unit of work (e.g. a big mechanical rename). Use
  judgment, but *say* what you think the state is rather than silently
  continuing to stack commits.

## Refactor / cleanup watchlist

`index.html` is 3000+ lines and growing. Single-file is a deliberate
choice (no build step) and shouldn't be "fixed" by fragmenting into a
build pipeline — but keep an eye on:

- **Balance/config data should stay declarative and centralized**, the
  way `DIFFICULTIES`, `AVATAR_UNLOCK_WORLD`, `GROWTH_TIERS` etc. already
  are. Resist scattering magic numbers into function bodies as new
  systems get added — new tunable values belong in a table near their
  siblings, not inline.
- **Save schema drift**: `player` objects have grown fields over many
  sessions (`characters[]`, `fingerStats`, `inventory`, `equippedX`...),
  each defaulted lazily at the point of use (`player.foo=player.foo||...`)
  rather than through one migration path. That's fine at this scale but
  worth consolidating if it keeps growing — a stale save missing a newer
  field should fail obviously, not silently.
- **Re-read a function before extending it a third time.** A few
  functions (`finishLevel`, `startLevel`, `renderCharacterScreen`) have
  had features bolted on repeatedly (gold, gems, badges, gear, avatars,
  finger stats, consumables...). If the next addition would make one of
  these harder to read top-to-bottom, that's the signal to split it
  before adding more, not after.

## QA

Ad hoc Playwright scripts get written and thrown away every session,
which means the same regression checks (level playthrough, result
screen, difficulty economy, unlocks, etc.) get reinvented from scratch
each time instead of accumulating. Prefer keeping a small set of
reusable smoke-test scripts checked into the repo (e.g. under `tests/`)
over one-off scratch scripts, so coverage compounds instead of resetting
— worth proposing to the user rather than doing unilaterally, since it
adds a tooling surface (Playwright as a dependency) to a project that's
otherwise dependency-free.
