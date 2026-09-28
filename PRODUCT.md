# Campusdesk

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students and staff have equal priority in product decisions, confirmed by the project owner on 2026-09-27.

- Students submit college complaints, track progress, and discuss their tickets with staff.
- Faculty handle only Faculty-category tickets assigned to them.
- Administrators triage and manage tickets across the college.

## Product Purpose

Campusdesk is a college project for managing complaints and support tickets. It brings submission, conversations, status tracking, and staff resolution into one workspace. Success means that students can report issues and understand their progress while staff can identify, respond to, and resolve the work that needs attention.

The owner confirmed the project context; real institutional adoption, a production rollout, and measured outcomes are not established.

## Operating Context

The existing application supports responsive web use with role-specific navigation. Students submit a complaint with a title, description, and category, then track status and add comments. Staff use lists or a board to review accessible tickets, update status and priority, reply, and manage deadlines. Inbox, activity, and insights help users follow changes within their access scope.

The frontend and Node API run separately. Local development commands and demonstration accounts are documented in README.md. Local storage may be temporary; a demonstration must not imply persistent production storage.

## Capabilities and Constraints

- Preserve backend-enforced access: students see their own tickets; faculty see only assigned Faculty-category tickets; administrators see all tickets. Public signup must never grant staff roles.
- Existing workflows include search and filters, browser-local saved views, CSV export, ticket locations, deadlines, recorded activity, inbox read state, and reporting periods. These are documented capabilities, not a new verification of this checkout.
- Use the existing complaint categories: Hostel, IT, Faculty, Infrastructure, Library, Canteen, Campus, and Other. Preserve the Pending, In Progress, and Resolved workflow.
- Bulk updates can partially fail and must report actual outcomes. Conflicting edits must not silently overwrite another user's work.
- Recorded activity is operational history, not an immutable compliance log. Reports must not fabricate missing history or resolution timestamps.
- MongoDB is the application database. MongoMemoryServer provides temporary local development storage. Automatic demo seeding is limited to temporary storage; persistent development seeding requires explicit confirmation and is disabled in production.
- Google sign-in and status emails are optional integrations. Provider setup, delivery, persistent storage, scale, and production readiness require separate verification.
- Preserve the existing React 18 frontend and Node/Express backend. Reuse installed dependencies; ask before adding unrequested dependencies or changing the stack.
- Open decisions: institution-specific policies, deployment plans, scale requirements, and numerical success targets have not been established.

## Brand Commitments

The product name is Campusdesk. The project owner's existing instructions bind future work to the navy/violet identity, accessible lavender highlights, self-hosted Space Grotesk and DM Sans, and consistent light/dark modes. These are preserved commitments, not a new visual direction.

Preserve the login book's existing behavior when doing unrelated work. Decorative graphics must never block sign-in. The older visual description in docs/OPERATIONS-UPGRADE.md is not authority over the owner's current instructions or current implementation.

## Evidence on Hand

- README.md: product overview, local commands, and demonstration accounts.
- docs/OPERATIONS-UPGRADE.md: workflows, access rules, reporting definitions, and deliberate limitations; its visual-system prose predates the current identity.
- docs/GOOGLE-AUTH.md: optional sign-in configuration guidance, not evidence that a provider is configured.
- backend/utils/demoData.js: labeled example complaints for demonstrations, not real institutional outcomes.
- frontend/src/App.jsx and frontend/src/lib/navigation.js: existing routes, role-specific navigation, and categories.
- frontend/tests/theme.spec.js and docs/VERIFICATION.md: verification resources; historical results do not prove the current checkout passes.

No confirmed customer testimonials, adoption metrics, or performance benchmarks were supplied. Do not invent them.

## Product Principles

1. Give student reporting and staff resolution equal weight.
2. Make ticket progress and the next available action understandable.
3. Keep private information within each user's authorized scope.
4. Report saved changes, failures, conflicts, and data limitations honestly.
5. Preserve usable core workflows when visual effects or optional integrations are unavailable.

## Accessibility & Inclusion

Preserve keyboard access, visible focus, responsive layouts, loading and error states, and reduced-motion fallbacks. Keep accessible alternatives for charts and pointer interactions. Decorative motion must not be required to understand or complete a task. No additional institution-specific accessibility standard or language requirement has been confirmed.
