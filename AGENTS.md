# AGENTS.md — myhomework working notes

## Project

Static homework dashboard for GitHub Pages.

- Repository: https://github.com/tsurezurecoding/myhomework
- Published app: https://tsurezurecoding.github.io/myhomework/
- Master data source: Google Spreadsheet ID in `generate_app_data.py`

## Data Update Workflow

- For "latest spreadsheet data" requests, run `python generate_app_data.py` to regenerate `app/src/features/app-data.js`.
- Usually commit only `app/src/features/app-data.js` for data-only updates.
- Validate generated data count and today's planned/completed counts with a small Node script when useful.
- If tests exist for the current branch, run them. If a test references files not present on the branch, report that clearly instead of treating it as a data-generation failure.

## Git / Release Notes

- The user prefers local commits only until they explicitly ask to release or push.
- When the user says "リリース", push to GitHub so GitHub Pages can deploy from `main`.
- Codex sandbox may make `.git` look read-only during normal commands. This is a sandbox permission issue, not necessarily a Windows file attribute issue. Use approved/escalated git commands for `git add`, `git commit`, and `git push` when needed.
- If Git reports stale `index.lock` or `HEAD.lock`, first check running Git processes. Only remove old zero-byte lock files when no active writer is using the repo.
- If local `main` has unpublished commits and remote `main` moved ahead, avoid force-pushing. Prefer creating a release branch from `origin/main`, apply the requested data update there, then push that branch to `main`.

## Data Semantics

- `app/src/features/app-data.js` is generated output. Do not hand-edit it for normal data updates.
- Planned dates come from the spreadsheet date column.
- Completion comes from the completion/check column. Values like `〇`, `○`, and date-plus-check values should be treated as completed by the generator/parser.
- "今日やるやつ" should include today's planned items, including items already completed today.
