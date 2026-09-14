# Campusdesk Operations Upgrade

## Working features

- Priority-desk overview with live role-scoped counts, a triage queue, service-area drill-downs, and recent recorded activity.
- List and Kanban workspaces. Staff can drag tickets between stages or use a keyboard-accessible status menu. Students get a read-only board.
- Bulk status updates with a confirmation dialog, independently authorized writes, honest partial-failure results, and failed selections retained for retry.
- URL-based search, category/status/priority filters, overdue filtering, four sort orders, and up to eight named saved views per account/browser.
- CSV exports of the currently filtered results. User-controlled cells are quoted and spreadsheet-formula prefixes are neutralized.
- Optional ticket locations and staff-managed deadlines in local time. Overdue flags are based on deadline and current status.
- A persisted per-ticket activity timeline and a role-scoped activity page. Events identify the actor, action, and time.
- A database-backed inbox read state. The inbox shows other people's activity and refreshes every 30 seconds while the page is visible.
- An insights page with 7/30/90-day reporting, daily-volume chart and keyboard-accessible data table, category breakdowns, resolution rate, and recorded resolution time.
- Command palette search now finds real accessible tickets as well as pages and actions.

## Visual system

The shared shell uses warm paper surfaces, graphite navigation, citrus accents, self-hosted Space Grotesk headings, and DM Sans body text. The overview is organized around work that needs attention rather than decorative charts.

The following upstream React Bits components are adapted locally:

- [Aurora](https://reactbits.dev/backgrounds/aurora): lazy-loaded OGL sign-in background, with a static fallback, no rendering offscreen/while hidden, and no WebGL initialization for reduced-motion users.
- [BlurText](https://reactbits.dev/text-animations/blur-text): word-by-word overview heading entrance, accessible heading name, and a static reduced-motion presentation.
- [CountUp](https://reactbits.dev/text-animations/count-up): overview metrics, with static screen-reader values and reduced-motion support.
- [SpotlightCard](https://reactbits.dev/components/spotlight-card): pointer-reactive priority desk and complaint preview.

The React Bits MIT + Commons Clause license remains in frontend/src/components/reactbits/LICENSE.md. These are source adaptations, not a claim of original authorship.

## Data and access rules

MongoDB remains the application database. Existing records need no destructive migration: location, deadline, resolution timestamp, and activity are additive fields. Existing comments remain intact. Old tickets do not acquire fabricated historical events.

Students can see only their own tickets. Faculty can see only Faculty-category tickets assigned to them. Administrators can see all tickets. Inbox and activity aggregation re-evaluate this scope on every request, including when marking events read. Reassignment therefore removes access to past private events for the previous faculty member.

Ticket writes use Mongoose optimistic concurrency. A conflicting edit returns HTTP 409 instead of silently overwriting another person's change. Invalid staff fields, malformed filters, missing faculty assignments, and invalid dates fail validation.

Resolution time is recorded when a ticket becomes Resolved and cleared on reopening. Reports explicitly exclude old resolved tickets without a recorded timestamp.

## Deliberate boundaries

- This is an operational activity history, not an immutable compliance log. Deleting a ticket also removes its embedded history. Inbox read receipts do not preserve deleted ticket content.
- Saved views are browser-local, not synchronized across devices. Inbox read state is stored in MongoDB.
- Bulk actions are per-ticket operations, not one cross-ticket transaction. The interface reports partial failures.
- The inbox shows the latest 100 accessible events from other people; the activity page shows the latest 200 events.
- Lists and analytics currently load the authorized ticket set. Large deployments should add server-side pagination/aggregation and load testing.
- Status emails are best-effort. A delivery failure does not report a successfully saved ticket as failed. There is no durable email retry queue.
- Live Google sign-in still requires Supabase/Google configuration. See GOOGLE-AUTH.md.
- Without MONGO_URI, the local app uses temporary MongoMemoryServer data. Restarting recreates its demo workspace. Use Atlas or another persistent MongoDB instance for real records.

## Try it

1. Sign in and open All tickets or My tickets.
2. Switch to Board. As staff, move a card using its status menu or drag it to another stage.
3. In List view, select tickets and use Apply status, then confirm the change.
4. Open a ticket, set a deadline, and inspect its Activity timeline.
5. Sign in as the ticket owner and check Inbox. Mark the updates read and refresh.
6. Open Insights and change the reporting period or expand its data table.
7. Apply filters and Save view. Refresh and reopen that saved view, or Export CSV.

Local demo accounts are documented in README.md. Staff permissions are assigned through the trusted role-management script, never public registration.

