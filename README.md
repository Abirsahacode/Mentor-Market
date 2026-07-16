# Mentor Market

Mentor Market is a complete full-stack EdTech marketplace where students find tutors, tutors find students, and both roles manage the learning relationship from discovery through review. It is designed as a university-level software engineering project with a React frontend, an Express MVC API, MySQL, JWT role authorization, seed data, and a Postman collection.

The implementation prioritizes a runnable, easy-to-read MVP. Messages are database-backed, files are represented by URLs, and payments are deliberately simulated—no real money or file storage service is involved.

## Features

- Student, tutor, and admin registration/login flows with bcrypt password hashing and JWT sessions
- Role-protected frontend routes and Express middleware
- Student profiles, tutor profiles, profile completion, search filters, saved tutors, and verified mentor badges
- Student tutor requests, tutor service posts, proposals, application decisions, bookings, and schedule status changes
- Media-rich tutor services with custom thumbnails, locally playable demo reels, and profile video previews
- Personalized post-login student discovery feed with hover previews, subject filters, course sorting, tutor saving, and a responsive Pinterest-style masonry layout
- Account-synced saved courses and recently viewed history, interest-based recommendations, advanced mode/trial/price filters, progressive loading, and three-way course comparison
- Dedicated cinematic course pages with subject-aware learning paths, mentor reviews, native video controls, and direct trial or regular-class booking
- Student mobile bottom navigation with a searchable quick-jump sheet, plus a tutor creator studio with a live thumbnail/video card preview
- Database-backed conversations, unread messages, notifications, reviews, ratings, and safety reports
- Study materials, assignments/submissions/grading, quizzes/automatic scoring, and derived progress analytics
- Mock payment ledger, 10% platform commission, tutor earnings, and withdrawal requests
- Admin analytics, user suspension, tutor verification, reports, and marketplace management tables
- Responsive public marketplace, mobile dashboard navigation, validated forms, loading states, empty states, and API error feedback
- Normalized MySQL schema, representative seed dataset, API smoke tests, and a ready-to-import Postman collection

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router, Axios, Vite, Inter variable font, plain responsive CSS |
| Backend | Node.js, Express.js, MVC modules |
| Database | MySQL 8 with `mysql2` connection pooling |
| Security | JWT, bcryptjs (bcrypt-compatible hashing), Helmet, CORS, rate limiting, input validation |
| Testing | Node test runner, Supertest, Postman |
| Tooling | Git/GitHub-ready, Visual Studio Code-friendly |

## Project structure

```text
Mentor Market/
├── backend/
│   ├── database/
│   │   ├── migrations/     # Additive, idempotent local database upgrades
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── src/
│   │   ├── config/          # MySQL pool
│   │   ├── controllers/     # Request handlers and domain workflows
│   │   ├── middleware/      # JWT, roles, validation, shared errors
│   │   ├── models/          # SQL data-access models
│   │   ├── routes/          # REST resource routers
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/media/       # Bundled service posters and demo-video fixtures
│   └── .env.example
├── postman/
│   └── Mentor-Market.postman_collection.json
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm 10+
- MySQL Server 8+, or MariaDB 12+ for the project-local development database
- Visual Studio Code
- Postman (optional, for API exercises)

## Run locally in Visual Studio Code

1. Open the project folder in VS Code:

   ```bash
   code "/path/to/Mentor Market"
   ```

2. Create local environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Replace `JWT_SECRET` with a long random string for any shared or deployed environment. The included database password is only for the isolated local development instance.

3. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

4. Ensure MariaDB tools are available. On CachyOS/Arch Linux:

   ```bash
   sudo pacman -S mariadb
   ```

   The system MariaDB service does not need to be enabled. Mentor Market runs an isolated, user-owned instance on `127.0.0.1:3307`.

5. Start the local database, backend, and frontend:

   ```bash
   npm run dev
   ```

   On its first run, this command initializes `backend/.mariadb-data`, creates the schema, loads seed data, and creates the application database user. Later runs preserve your data and apply additive SQL files from `backend/database/migrations`.

6. Open `http://localhost:5173`. The API runs at `http://localhost:5000/api`; its health check is `http://localhost:5000/api/health`.

   Student accounts land on `/student/discover`, where all active tutor services can be searched, filtered, previewed, and saved. Tutor and admin accounts continue to open their role dashboards.

Useful database commands:

```bash
npm run db:start   # start only the local database
npm run db:stop    # stop it cleanly
npm run db:reset   # reload schema.sql and seed.sql (deletes local changes)
```

### Using an external MySQL 8 server

Change the `DB_*` values in `backend/.env`, load the SQL files using your MySQL administrator, then skip the project-local database launcher:

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql

npm run dev:external-db
```

## Environment variables

Backend variables are documented in [backend/.env.example](backend/.env.example):

- `PORT` — Express port, default `5000`
- `FRONTEND_URL` — allowed CORS origin; comma-separated values are supported
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL credentials
- `DB_CONNECTION_LIMIT` — pool size, default `10`
- `JWT_SECRET`, `JWT_EXPIRES_IN` — token signing configuration
- `PLATFORM_COMMISSION_RATE` — decimal commission rate; `0.10` means 10%

Frontend configuration is in [frontend/.env.example](frontend/.env.example). `VITE_API_URL` should point to the Express `/api` base URL.

## Demo accounts

All seeded users use the password `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@mentormarket.test` |
| Student | `ayesha@mentormarket.test` |
| Student | `rafi@mentormarket.test` |
| Tutor (verified) | `farhan@mentormarket.test` |
| Tutor (pending verification) | `mehjabin@mentormarket.test` |

These credentials are demonstration-only. Never reuse them in production.

## REST API overview

All responses use either a success envelope (`success`, `message`, `data`, optional `meta`) or a consistent error envelope (`error.code`, `error.message`, optional details, `request_id`). Send protected requests with `Authorization: Bearer <token>`.

| Resource | Key routes |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profiles | `GET/PUT /api/students/profile`, `GET/PUT /api/tutors/profile`, `GET /api/tutors` |
| Listings | CRUD `/api/tutor-posts`, CRUD `/api/student-requests` |
| Course engagement | `GET/PUT/DELETE /api/course-engagement/saved`, `POST /api/course-engagement/views`, `GET /api/course-engagement/recent` |
| Applications | `GET/POST /api/applications`, `PATCH /api/applications/:id/status` |
| Bookings | `GET/POST /api/bookings`, `PATCH /api/bookings/:id` |
| Messages | `GET /api/messages/conversations`, `GET /api/messages/conversation/:userId`, `POST /api/messages` |
| Reviews/payments | `/api/reviews`, `/api/payments`, `PATCH /api/payments/:id/pay` |
| Learning | `/api/study-materials`, `/api/assignments`, `/api/quizzes`, `/api/students/progress` |
| Activity/safety | `/api/notifications`, `/api/verifications`, `/api/reports` |
| Tutor finances | `GET /api/tutors/earnings`, `POST /api/tutors/withdrawals` |
| Administration | `GET /api/admin/dashboard`, `/api/admin/users`, `/api/admin/:resource` |

List endpoints use bounded page/limit inputs where pagination is relevant. The default page size is 12 and the maximum is 100.

## API testing with Postman

1. Import [postman/Mentor-Market.postman_collection.json](postman/Mentor-Market.postman_collection.json) into Postman.
2. Start the API and load `schema.sql` plus `seed.sql`.
3. Run **Login Student**, **Login Tutor**, and **Login Admin** first. Their test scripts store JWTs in collection variables.
4. Run profile/listing requests or follow the workflow folders in order. Create requests save returned IDs into collection variables automatically.

The collection contains register, login, profile updates, tutor post, student request, proposal, booking, message, review, mock payment, course details/saves/history, tutor verification, assignment creation/submission, quiz creation, notifications, and admin analytics requests.

## Verification and build commands

```bash
# Backend API smoke tests
npm test --prefix backend

# Frontend production build
npm run build --prefix frontend

# Both checks
npm test
```

The backend test suite intentionally does not require a live database for its health/error-envelope smoke tests. Domain endpoint testing requires the configured MySQL database or the Postman workflow.

## MVC and security notes

- Routes define HTTP contracts and apply authentication, roles, and field validation.
- Controllers enforce ownership and domain state transitions.
- Models own reusable MySQL access and whitelist write/filter fields to prevent SQL identifier injection.
- Password hashes never appear in API responses.
- Public registration cannot create an admin; the admin is database-seeded.
- JWT logout is stateless: the frontend removes the token. A production system could add refresh-token rotation and a revocation store.
- Monetary values are MySQL `DECIMAL`, and the backend computes commission instead of trusting client-supplied values.
- Dates are exchanged as ISO-compatible values; production deployments should standardize the MySQL/session timezone to UTC.

## Git and GitHub workflow

The repository is ready for normal GitHub Flow development:

```bash
git checkout -b feat/short-feature-name
git add .
git commit -m "feat(scope): describe the change"
git push -u origin feat/short-feature-name
```

Do not commit `.env`, `node_modules`, or build output; they are covered by `.gitignore`.

## Future improvements

- Socket.IO chat, typing indicators, and delivery receipts
- S3/Cloudinary-backed certificate, assignment, and material uploads
- Real payment gateway integration with server-side webhooks and idempotency keys
- Calendar recurrence, timezone-aware availability, and video-meeting provider integration
- Email/SMS/push notification delivery and background queues
- Refresh tokens, password reset, email verification, audit logs, and stricter rate limits
- Rich multi-question quiz builder, topic-level analytics, and attendance records
- Automated MySQL integration tests, React component tests, OpenAPI documentation, CI/CD, and container deployment

## License

This project is provided for educational use.
# mentor-market
