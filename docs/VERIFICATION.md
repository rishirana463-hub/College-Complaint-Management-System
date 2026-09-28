# Verification

## Latest results: login identity and panel effects verified on 2026-09-28

Login now pairs a local cap/chat Campusdesk mark with Componentry's dithered particle treatment and React Bits WarpText. The existing book interaction and form remain independent. The priority desk, queue, and ticket workspace use an adapted React Bits BorderGlow with navy/violet colors. Existing dependencies and upstream licenses are retained.

- Frontend production build: passed; the large JavaScript chunk warning remains (approximately 1.25 MB before gzip for the shared login graphics chunk).
- Browser suite: 29 passed on the final complete run. Four added regressions cover pointer interaction, lost graphics-context fallback, live reduced-motion changes, missing logo artwork, and unobstructed ticket actions under the glow.
- The first full run exposed a command-search test race: it pressed Ctrl+K after the URL changed but before the lazy workspace mounted. The test now waits for the visible Quick search control before pressing the shortcut; the complete rerun passed.
- Backend suite: 15 passed with isolated temporary databases. No backend or authentication behavior changed.
- Visual review and final confirmation covered 1440px desktop, 768px tablet, 390px and 320px phones, both themes, and admin/faculty panels. Inspected states had no page errors, horizontal overflow, or violations of the tested axe WCAG A/AA rules. This is not a claim of complete accessibility conformance.
- WarpText retains readable text when WebGL is unavailable or lost. Touch/reduced-motion views keep a steady name and dithered mark; hidden surfaces release animation resources. The book-loading, keyboard focus, and login contrast checks still pass.
- `git diff --check`: passed. No dependencies or external configuration changed; no deployment was performed.

Ignored local artifacts: `frontend/artifacts/effects-final-*.png`, `effects-final-check.json`, and the initial `effects-visual-check.json`. Existing Three.js warnings remain. Lighthouse, dependency audits, and the separate simulated Google suite were not rerun for this visual change.

## Magnetic dock verified on 2026-09-28

The main navigation now uses a Componentry-derived magnetic bottom dock with role-specific destinations, active-page indicators, persistent captions, and unread inbox badges. Desktop pointer motion magnifies icons; touch and reduced-motion controls remain steady. The mobile drawer remains available, and the account menu contains sign-out. The upstream MIT license is retained in `frontend/src/components/ui/COMPONENTRY-LICENSE.md`; no runtime dependencies were added.

- Frontend production build: passed. The existing JavaScript chunk above 500 kB still produces a Vite warning.
- Frontend unit tests: 9 passed; backend tests: 15 passed.
- Browser workflow suite: 25 passed, including five dock regressions covering magnification, keyboard navigation, reduced motion, active detail routes, unread badges, account-menu focus, role-specific links, 320px layouts, and content clearance above the dock.
- Simulated Google browser suite: 4 passed, including sign-out and repeat sign-in through the updated account menu. This does not verify live Google consent or provider configuration.
- Visual review: desktop 1440px, tablet 768px, and phone 390px/320px across student, admin, and faculty views in light/dark modes. No horizontal overflow or page errors in the inspected states; automated axe checks reported no tested WCAG A/AA violations.
- Impeccable static scan of the dock implementation: no findings. `git diff --check`: passed.

Local screenshots are in `frontend/artifacts/dock-final-*.png`; the first visual-review results are in `frontend/artifacts/dock-visual-check.json`. These ignored artifacts use isolated fixtures. No external services, production data, deployment, or backend behavior changed. Existing Three.js/dependency warnings remain. Dependency audits and Lighthouse were not rerun for this navigation change.

## Earlier baseline results (not rerun for this change)

- Production build passed.
- 11 backend integration checks and 13 browser workflow checks passed.
- Backend production dependencies and all frontend dependencies: zero known npm audit vulnerabilities.
- Authenticated-admin Lighthouse: desktop performance 92, mobile performance 98; accessibility and best practices 100 on both.
- The previous search-button accessible-name advisory is fixed.
- SEO remains 63 because robots.txt deliberately blocks indexing of this private application.
- These are local Chrome/fixture results, not production-host or load-testing guarantees.

## Automated checks

From backend:

```sh
npm test
npm audit --omit=dev
```

From frontend:

```sh
npm run build
npm run test:e2e
npm audit
```

Playwright uses installed Chrome via channel: "chrome". For Playwright Chromium instead, remove that setting in playwright.config.js and install its browser with npx playwright install chromium.

Both suites use isolated MongoMemoryServer databases and do not load backend/.env or contact Atlas. Browser tests use ports 4173 and 5101. The first run may need a MongoDB binary download.

## Coverage

- Password registration/login, safe profiles, persisted sessions, role restrictions, and protection against public role escalation.
- Student/faculty/admin ticket scopes, private details, assignment validation, comments, and literal search.
- Mocked Google identity verification, provisioning, repeat sign-in, ownership-proven account linking, and role preservation.
- Deadlines, resolution timestamps, reopening, append-only ticket change records through update endpoints, malformed fields and filters.
- Inbox read persistence, per-user read isolation, and revocation of private activity access after reassignment.
- List/board layouts, persisted board status moves, saved views, filtered CSV downloads, confirmed bulk updates, and activity timelines.
- Deadline editing, overdue boards, inbox actions, reporting ranges, accessible chart data, and real-ticket command search.
- Submission and failure/retry paths, retained failed-reply drafts, URL filters, role-gated routes, sign-out, and refresh.
- Desktop light/dark, mobile navigation/focus restoration, overflow checks, reduced motion, and axe WCAG checks on overview, workspace, inbox, and insights.

Screenshots and Lighthouse reports are generated under frontend/artifacts and ignored by git. These use isolated fixtures, not the user's live application records.

## External setup and boundaries

The local app has no active MONGO_URI and uses temporary MongoMemoryServer data. It is not connected to Atlas. Set MONGO_URI in backend/.env to use persistent storage; .env files were not changed during this upgrade.

Live Google consent and redirects require a Supabase project and Google OAuth configuration. Provider mocks do not prove external account configuration. Follow GOOGLE-AUTH.md.

Email needs SMTP credentials and a real mailbox. Delivery is best-effort, with no durable retry queue. A delivery failure no longer misreports a saved ticket as failed.

Activity is an operational history embedded in tickets, not a tamper-proof compliance log. Deleting a ticket removes that history. Older records do not receive fabricated events or resolution times.

Bulk operations are independently authorized per ticket, not cross-ticket transactions. Lists and reports currently load the authorized ticket set; large deployments still need server-side pagination/aggregation, retention policies, and load tests.

Accessibility automation does not replace manual screen-reader testing. Deployment performance and Atlas network restrictions must be verified on the actual host.

## Design and dependency notes

See OPERATIONS-UPGRADE.md for workflows, permissions, and reporting definitions.

The interface uses React Bits Aurora, BlurText, CountUp, and SpotlightCard with retained upstream licensing and reduced-motion behavior. Aurora is lazy-loaded on the sign-in screen, uses OGL, and skips rendering while hidden/offscreen. The overview and operational screens do not require WebGL.

Routes and Supabase are lazy loaded. Fonts are self-hosted. React 18 and JavaScript are retained; TypeScript migration is not part of this change.

## Interface refinement verified on 2026-09-27

This pass improves the existing navy/violet student and staff interface. Dashboard actions lead directly to complaint creation, pending review, or the matching high-priority/overdue ticket set. Filters can be removed individually or reset without losing sort/layout preferences. Mobile ticket rows expose status, priority, category/author, and date without sideways scrolling. Staff checkbox columns stay compact on desktop. Complaint previews use the current identity and reflect whether required details are present.

Current-checkout results:

- Frontend production build: passed; Vite still reports a JavaScript chunk above 500 kB.
- Frontend unit tests: 9 passed.
- Backend tests: 15 passed, using isolated temporary databases.
- Browser suite: 20 passed against a fresh isolated fixture API. Includes three new regressions for priority count/destination agreement, mobile selection/filtering, and actionable student empty states.
- Visual inspection: desktop (1440px), tablet (768px), and phone (390px), light/dark themes, and student/admin/faculty screens. Confirmed no page or ticket-table horizontal overflow in the final inspected states. Keyboard, reduced-motion, theme, and existing login-book checks passed in the browser suite.
- Additional axe checks on final ticket and complaint screens: no violations of the tested WCAG A/AA rules. This does not establish complete accessibility conformance or manual screen-reader coverage.
- Impeccable's static scan reported only five Space Grotesk font warnings; the font is intentionally preserved under the owner's existing brand commitment.

Screenshots and the visual-check results are in `frontend/artifacts/final-*.png` and `frontend/artifacts/upgrade-final-check.json` (ignored local artifacts). No backend/API changes, dependencies, external configuration, deployment, or production-data operations were part of this pass. Build output and browser tests still emit Three.js/dependency warnings; these were not treated as test failures.

## Reproducing Lighthouse

Start `node tests/serve.js` from backend. In a frontend PowerShell terminal:

```powershell
$env:VITE_API_URL='http://127.0.0.1:5101/api'
npm run build -- --outDir dist-audit
npm run preview -- --host 127.0.0.1 --port 4174 --strictPort --outDir dist-audit
```

Run `npm run audit:lighthouse` from a separate frontend terminal. It signs into the isolated fixture API before auditing the real admin route. Reports are written to frontend/artifacts. On Windows, a locked temporary Chrome profile can be retained after the report has saved; that cleanup warning is not an audit failure.

