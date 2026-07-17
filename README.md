# Meridian — Student Management Portal

A full-stack web application for managing student course enrollments, built for BAI12153 Web Programming.

## Project Description

Meridian lets students browse and enroll in courses, and lets administrators (registrar staff) manage the course catalog and approve/reject/grade enrollment requests. It demonstrates authentication with role-based access control, full CRUD operations, relational data modeling, search/filter, and both client- and server-side validation.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS (custom), EJS templating |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | Session-based (express-session), bcrypt password hashing |
| Validation | express-validator (server-side) + HTML5 (client-side) |

## Features

- **Authentication**: Registration, login, logout, bcrypt-hashed passwords, two roles (admin, student)
- **CRUD**: Admin can create/read/update/delete courses; students can create/withdraw enrollments
- **Search & Filter**: Courses searchable by keyword (title/code) and department; enrollments filterable by status and keyword
- **Dashboards**: Admin dashboard (student/course/enrollment stats + recent activity); Student dashboard (personal enrollment summary)
- **Relational Data**: `users` → `enrollments` ← `courses` (many-to-many via join table with extra fields)
- **Validation**: Both client-side (HTML5 required/min/max/type) and server-side (express-validator) on all forms

## Database Schema (ER Overview)

```
users (id, name, email, password, role, student_id, department)
   │ 1
   │
   │ *
enrollments (id, user_id FK, course_id FK, status, grade, enrolled_at)
   │ *
   │
   │ 1
courses (id, code, title, department, credits, capacity, semester)
```

- One user can have many enrollments.
- One course can have many enrollments.
- `enrollments` is the join table connecting students to courses, carrying enrollment-specific data (status, grade).

## Setup Instructions

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the app**
   ```bash
   node app.js
   ```
   The database (`db/portal.db`) is created and seeded automatically on first run.

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## Test / Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@portal.edu | Admin@123 |
| Student | alice@portal.edu | Student@123 |
| Student | ben@portal.edu | Student@123 |
| Student | chloe@portal.edu | Student@123 |

You can also register a new student account via the **Register** link on the login page.

## Project Structure

```
student-portal/
├── app.js                 # Express app entry point
├── db/
│   └── init.js             # Schema + seed data
├── middleware/
│   └── auth.js              # Auth/role guards, flash locals
├── routes/
│   ├── auth.js               # Register/login/logout
│   ├── dashboard.js           # Role-based dashboard
│   ├── courses.js              # Course CRUD + search/filter
│   └── enrollments.js           # Enrollment CRUD + approval workflow
├── views/                    # EJS templates (auth, admin, student, partials)
└── public/css/style.css        # Stylesheet
```

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds) before storage — never stored in plaintext.
- Sessions are used for auth state; protected routes check `req.session.user`.
- Role-based middleware (`isAdmin`, `isStudent`) prevents privilege escalation (e.g. a student cannot access `/courses/manage`).
- All form inputs are validated server-side with express-validator in addition to HTML5 client-side validation, preventing malformed or malicious submissions even if JavaScript is disabled.
