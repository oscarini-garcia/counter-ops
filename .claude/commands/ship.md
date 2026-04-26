Prepare a release commit and push to remote. Steps:

1. Run `git status --short` and `git diff --stat` to understand what has changed.
2. Read the current `README.md` version history table (the `## Version History` section) to find the last released version.
3. Determine the next version number by incrementing the last entry's patch or minor. Use minor bump for user-visible features; patch bump for fixes and polish.
4. **Summary row** — Add a new row at the top of the version history table in `README.md`. One line, one sentence: the headline of what shipped. No detail here.
5. **Detail section** — Prepend a new `### vX.Y — YYYY-MM-DD — Detail` block at the top of `RELEASES.md` (after the intro paragraph, before the topmost existing entry). Use numbered bold subheadings (`**1. …**`, `**2. …**`) when the release bundles multiple changes; use a single subheading when it's one coherent change. Follow the existing voice: terse, specific, name the files/functions/tokens that moved. End the block with a `---` separator.
6. Update the requirements or architecture sections in `README.md` only if the changes affect them.
7. Stage tracked files explicitly by name with `git add`. Do NOT use `git add -A` or `git add data/` — the `data/` directory is gitignored and also gets staged modifications that must not be committed.
8. Stage any new untracked files in `app/`, `agents/`, `.claude/`, or the repo root that should be committed (again by name).
9. Commit with a concise message following the existing style (`feat:`, `fix:`, `docs:`, etc.). The first line of the commit should mirror the summary-row wording.
10. Push to `origin/main`.
11. Report the version, the files committed, and the push result.

Do NOT run the calendar sync — that is `/sync-calendar`. Do NOT commit files under `data/`.
