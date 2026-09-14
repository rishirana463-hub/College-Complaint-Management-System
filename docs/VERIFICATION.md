# Verification

## Latest results

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

## Reproducing Lighthouse

Start `node tests/serve.js` from backend. In a frontend PowerShell terminal:

```powershell
$env:VITE_API_URL='http://127.0.0.1:5101/api'
npm run build -- --outDir dist-audit
npm run preview -- --host 127.0.0.1 --port 4174 --strictPort --outDir dist-audit
```

Run `npm run audit:lighthouse` from a separate frontend terminal. It signs into the isolated fixture API before auditing the real admin route. Reports are written to frontend/artifacts. On Windows, a locked temporary Chrome profile can be retained after the report has saved; that cleanup warning is not an audit failure.

