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
