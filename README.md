# College Complaint & Ticket Management System

Full-stack web application for handling college complaints and support tickets using React, Node.js, Express, and MongoDB.

## Project Structure

```text
alexproj2/
  backend/
  frontend/
  README.md
```

## Features

- Student and admin registration/login with JWT authentication
- Role-based dashboards
- Complaint submission with title, description, and category
- Ticket tracking with status and priority
- Comment/reply system for ticket conversations
- Search and filter by status, category, priority, and keywords
- Responsive UI with sidebar, cards, and status badges
- Optional email notification support for status changes

## Backend Setup

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
```

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Tickets

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `POST /api/tickets/:id/comments`
- `GET /api/tickets/summary/admin`

## Sample Test Data

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
