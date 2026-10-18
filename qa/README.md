# Integration QA

Captured upstream baseline: `a78b1bb56faa4b0306bcc5e9aae6136c573550ef`.
All `integration-*-results.json` files describe the final build, not the original dashboard.

- `integration_api.py`: real production APIs against disposable local PostgreSQL 17 on port 3002. Auth, policy/profile, canonical knowledge, commerce, CASIO scoring, editable CASIO report metadata, generic analyzer authoring/execution/reporting, preview/real-session isolation and revocation.
- `integration_browser.py`: production internal preview on port 3001. 96 module/locale/viewport cases, themes, mobile navigation, cookie-free simulated HTTPS iframe, captures and profile.
- `integration_live_browser.py`: normal password login over a simulated HTTPS origin, real secure HttpOnly JWT cookie, listing creation/editing, analyzer creation/question editing, and member report with two-step onboarding.
- `preservation_check.py`: byte comparison of original portrait/fonts and captured upstream services/migrations. Requires the three workspace source directories plus both local servers.
- `export_analyzer_fixture.cjs`: exports 38 reproducible answers and expected scores using the existing TypeScript dependency.
- `seed_local_db.cjs`: **destructive fixture reset**, hard-locked to localhost/127.0.0.1 and the exact database name `hadiran_integration_qa`. Never run against production. Test-only password is not a production credential.

Prerequisites: existing npm dependencies (`npm ci`), PostgreSQL 17 for the API suite, Python Playwright + Chromium for browser suites. No Playwright/npm dependency was added to this project. In the current workspace, run Python suites with `PYTHONPATH=/tmp/hadiran-qa PLAYWRIGHT_BROWSERS_PATH=/home/user/.cache/pw-browsers`.

Run the API suite after resetting the disposable fixtures; run the live browser suite after the API suite. The preview browser suite is independent. Production build is required for all suites. Session cookies in production are Secure; the live browser suite uses a routed HTTPS test origin, not a live deployment. The iframe test is simulated too, not evidence of an external Arena/E2B host test.

Limitations: no production DB was accessed; no SMS was sent; no real funds were moved. Shop payment remains out-of-band exactly as in upstream. New analyzer definitions and shop writes deliberately require a DB; preview captures/answers/profile are isolated temporary state, not public production data. Test snapshots may be shown in Persian even when the administrative shell is English, because assessment content retains its authored language.

## Navigation/profile iteration

`navigation_browser.py` targets the no-DB preview (3001): 10 behavioral groups and 59 layout cases. `avatar_api.py` targets real local PostgreSQL APIs (3002); `profile_live_browser.py` targets the same server through simulated HTTPS: 134 public/member layout and text-zoom cases. These final scripts do not inject implementation CSS. Run the avatar API suite before the member browser suite. The existing DB rate limiter also applies to successful test logins: repeated suite runs can correctly return HTTP 429; reset ONLY the disposable local fixtures or wait for its window. Do not weaken production throttling for QA. Five upstream public content pages need a DB and are therefore covered by the DB-backed suite, not by pretending an error page is a valid no-DB layout. See `docs/navigation-profile-responsive.md` for storage limitations and deployment.

## Upstream sync through ccc98d6

- `sync_upstream_api.py`: 13 groups with real local JWT/PostgreSQL: author role, access grants/revocation, response visibility, referral isolation/cycles, discounts, bot owner isolation and denied webhook/connection prerequisites. No outbound Telegram calls.
- `sync_upstream_browser.py`: 80 layouts across new modules, owner/author, 320/390/768/1440 px and light/dark. Also RTL/LTR sidebar, mobile close and response/access tabs. A simulated HTTPS origin fronts the real local DB build.
- `sync_telegram_mock.cjs`: 8 groups using real disposable PostgreSQL and entirely mocked Telegram HTTP: AES-GCM, proxy normalization, malformed/group updates, commands/consent, strict contact ownership, answer scoring, submission/replay. Uses existing TypeScript, no new dependency.
- `sync_migration_upgrade.cjs`: upgrade from both `289e3a6` and `ccc98d6` to the combined 20 migrations, followed by a second all-skip pass. Uses two separately provisioned local QA databases only. Original migration filenames are retained, including both distinct 0015 files.
- `sync-preservation-results.json`: byte comparison of original portrait/font/avatar/brand assets, dependencies, disclosure animation and all old/new SQL migrations.

The `sync_*` scripts use intentionally fake local-only fixture credentials. Never run these scripts on production. The bot mock is not evidence of real Telegram/Cloudflare/Liara/SMS/payment delivery. Author access is not a general personal workspace for every member: the original member restriction remains.

## Local review sync through 1ed9ea7 (Drive approval pending)

The next local sync adds five upstream commits after ccc98d6, including Next.js/eslint-config-next 16.4.1. Existing portrait/avatar build scripts stay; there is no new direct npm dependency.

New checks:
- `node qa/sync_latest_unit.cjs`: 7 pure groups for templates/aliases/fallback/sanitization, gate bands, webhook routing/pending update retention and both Worker directions (fully mocked HTTP).
- `python qa/sync_latest_api.py`: 3 local DB/API groups for author interpretation snapshots, member template persistence and missing/wrong/valid webhook secret diagnostics. Run after both existing API suites; it leaves the author CASIO grant used by the new browser suite.
- `python qa/sync_latest_preservation.py`: 11 preservation groups, explicitly allowing the two upstream package version upgrades.
- `sync_upstream_browser.py` now checks 112 light/dark/viewport cases, including interpretation as owner/author and member-only summary, plus member onboarding. Requires the three API suites in order on a fresh local fixture DB.
- `navigation_browser.py` now has 11 groups/59 layouts, including page-scroll dismissal and internal scrolling without accidental dismissal.

The previous 12-group API, 13-group upstream API, 4-group avatar API, 8-group mocked Telegram and 96-layout browser suites also pass on this sync. Run browser suites sequentially in this memory-limited sandbox; a parallel run initially hit the 5-second UI-ready assertion under contention, and the unchanged navigation test passed sequentially. Rate limits remain enabled: repeated fixture logins may require waiting or resetting rate buckets only in the exact disposable local QA database. Never relax production limits for QA.

No production Telegram, Cloudflare, SMS/payment or deployment is certified by these tests. Detailed report visibility is an interface distinction; the member attempt API retains the upstream score-snapshot contract. Google Drive must remain unchanged until the user approves the local review.

## Workspace baseline cb20276

Current local evidence is indexed in `workspace-baseline.json`. `workspace_foundation_api.py` covers delegated members, independent permission flags, owner-only role assignment, revocation and retake history. `workspace_telegram_mock.cjs` covers the independent hub, registration without web JWT, strict contact ownership, guides, scored answers, restart, chat cleanup and custom service; all outbound HTTP is mocked. The updated pure/preservation scripts write `workspace-*-results.json` rather than relabel historical results.

All 22 migrations applied on the disposable local PostgreSQL database; the repeat pass skipped all 22. Current browser results cover 59 public/navigation and 116 DB-backed layouts. The bot conversation tab is explicitly opened before checking its content. A QA-only rate bucket reset was needed after repeated logins; production limits are unchanged. No live SMS, Telegram, Worker, payment or deployment is certified. `docs/workspace-contract.md` defines the next-stage boundaries and pending decisions; it does not claim future dashboards, graph or financial aggregates are implemented.
