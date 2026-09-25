# Campusdesk Project Context

## Stack
- College complaint/ticket management app; JavaScript ES modules throughout.
- Frontend: React 18, Vite, React Router, Axios, Framer Motion, custom CSS/Tailwind tooling, adapted React Bits components.
- Login graphics: Three.js, React Three Fiber 8, Drei 9, and React Spring Three 9. Keep renderer dependencies compatible with React 18.
- Backend: Node.js, Express, Mongoose/MongoDB, bcrypt, JWT; optional Supabase Google authentication and Nodemailer email.
- Deployment structure: static frontend and separate Node API. MongoMemoryServer is temporary development storage, not persistent production storage.

## Conventions
- `frontend/src/pages` owns screens; `components` reusable UI; `context` auth/theme/toasts; `hooks` data loading; `services` API/auth integration.
- Use functional components and hooks, retaining existing class-based error boundaries. Follow existing naming and formatting.
- Preserve the user-supplied navy/violet theme, accessible lavender highlights, and self-hosted Space Grotesk/DM Sans typography. `product.css` overrides the base styles; keep both color modes and login graphics consistent.
- Prefer CSS classes and design tokens; use inline styles only for genuinely dynamic values. Keep heavy visual features isolated and respect reduced motion.
- `backend/routes` wires endpoints, `controllers` handles requests, `models` defines data, and middleware enforces permissions.

## Guardrails
- Read current code and git status before edits. Preserve unrelated work; do not reset, stage, or commit it.
- Keep tasks narrowly scoped. Reuse installed dependencies; ask before adding unrequested dependencies or changing the stack.
- Enforce access on the backend: students see their own tickets; faculty see only assigned Faculty-category tickets; admins see all tickets. Public signup must never grant staff roles.
- Never expose secrets, commit `.env`, run destructive seeds against real data, or change external services without the requested scope.
- Do not claim Google/SMTP/Atlas configuration, persistence, or production readiness without verification. Old test reports are not proof of the current checkout.
- Preserve keyboard access, focus behavior, responsive layouts, loading/error states, and reduced-motion fallbacks. Decorative graphics must never block login.

## Working Habits And Verification
- Establish the context, scope, constraints, and acceptance criteria before implementation; keep stable conventions here and task-specific details in the current request.
- Give auth, privacy, concurrency, schema changes, and unexplained failures extra scrutiny. Check actual behavior rather than relying on visual polish.
- Frontend: `npm run build` and `npm run test:e2e` from `frontend`; backend: `npm test` from `backend`.
- For UI changes, inspect relevant desktop/mobile states and keyboard/reduced-motion behavior. For API changes, test permissions and failures as well as success.
- Review the task diff and run `git diff --check`. Keep verified chunks suitable for focused commits; summarize outcomes, checks, and remaining limitations with concise logs.

## Reference Docs
- `README.md`: project overview, local commands, and demo accounts.
- `docs/OPERATIONS-UPGRADE.md`: workflows, access rules, reporting definitions, and limitations.
- `docs/GOOGLE-AUTH.md`: Google/Supabase integration and deployment configuration.
- `docs/VERIFICATION.md`: test setup and previously recorded results.

## Current Focus
- Navy/violet theme, Google callback fixes, and additive demo complaints, checked on 2026-09-25.
- Demo fixtures live in `backend/utils/demoData.js`; automatic seeding is limited to temporary local storage. Persistent development seeding requires `npm run seed -- --confirm-demo` and is disabled in production. Preserve existing data and edits.
- `frontend/tests/theme.spec.js` checks login contrast, keyboard focus, and mobile layout. Google browser tests use a simulated provider; passing tests do not establish real Google consent or provider configuration.
- The login book lives in `frontend/src/components/login/CampusBook.jsx`; preserve its existing behavior when doing unrelated work.
- Update this section when the feature or phase changes; prefer current source/configuration over stale narrative notes.
