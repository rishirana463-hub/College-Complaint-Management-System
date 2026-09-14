# College Complaint & Ticket Management System

Full-stack web application for handling college complaints and support tickets using React, Node.js, Express, and MongoDB.

## Project Structure

```text
CCMS/
  backend/
  frontend/
  README.md
```

## Features

- Student registration and student/faculty/admin login with JWT authentication
- Optional Google sign-in through Supabase Auth, with server-verified identities and MongoDB profiles
- Role-based dashboards
- Complaint submission with title, description, and category
- Ticket tracking with status and priority
- Comment/reply system for ticket conversations
- Search and filter by status, category, priority, and keywords
- Shared responsive dashboard shell, persisted light/dark themes, keyboard command palette (Ctrl/Cmd+K)
- Priority-desk overview, Kanban board, bulk status updates, saved views, and safe CSV export
- Ticket locations, deadlines, overdue filtering, recorded activity timelines, and an inbox with persisted read state
- 7/30/90-day insights, resolution-time reporting, accessible chart data, and real ticket search in the command palette
- React Bits Aurora, BlurText, CountUp, and SpotlightCard with reduced-motion support
- Skeleton loading, actionable empty/error states, mutation notifications, and reduced-motion support
- Optional email notification support for status changes

## Backend Setup

Use Node.js 22.12+ and npm. The frontend lives in `frontend`; the Express API lives in `backend`.
For Google sign-in and deployment configuration, see [the setup guide](docs/GOOGLE-AUTH.md).
For verification commands and scope, see [the verification guide](docs/VERIFICATION.md).
For new workflows, data behavior, and limitations, see [the operations upgrade guide](docs/OPERATIONS-UPGRADE.md).

1. Open a terminal in `backend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and update the values.
4. Start the backend with `npm run dev`.

### Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/college-complaint-system
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
EMAIL_ENABLED=false
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_password
EMAIL_FROM=College Complaint System <no-reply@example.com>
```

## Frontend Setup

1. Open a terminal in `frontend`.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Start the frontend with `npm run dev`.

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
```

Google sign-in is optional and uses Supabase Auth as the identity provider.
Follow [the Google Auth setup guide](docs/GOOGLE-AUTH.md) to enable the Google
provider, configure OAuth redirect URLs, and set the matching frontend and
backend environment variables. Never add a Supabase secret/service-role key
to the frontend or commit any `.env` file.

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/profile`

### Tickets

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `POST /api/tickets/:id/comments`
- `GET /api/tickets/summary/admin`
- `GET /api/tickets/activity`
- `GET /api/tickets/inbox`
- `POST /api/tickets/inbox/read` with an `ids` array of accessible event IDs

## Sample Test Data

The seed command below is for a disposable development database. It replaces existing users and tickets.

Run the seed script from `backend` after MongoDB is ready:

```bash
npm run seed
```

Demo users:

- Admin: `admin@college.com` / `admin123`
- Student: `rahul@student.com` / `student123`
- Student: `priya@student.com` / `student123`

## Workflow

1. Login or register as a student.
2. Submit a complaint.
3. Track status and add comments from the student panel.
4. Login as admin.
5. Filter tickets, update status, change priority, and reply.

## Optional Email Notifications

Set `EMAIL_ENABLED=true` and configure SMTP values in `backend/.env` to email students when a complaint status changes.
