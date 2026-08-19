# Mentor Market

Mentor Market is a tutoring marketplace built for a university software engineering course. Students browse and book tutors, tutors post services and manage bookings, and admins moderate the platform. It's a React frontend talking to an Express/MySQL API with JWT auth.

Payments and file storage are simulated for this project — there's a mock payment ledger instead of a real payment gateway, and media is served from local URLs rather than an object storage service.

## What it does

- Registration/login for students, tutors, and admins with bcrypt + JWT
- Tutor profiles, service posts, and a searchable discovery feed with filters, saved tutors, and course comparison
- Student requests, tutor proposals, applications, bookings, and reschedule/waitlist handling
- Messaging, notifications, reviews, and safety reports, all backed by MySQL
- Study materials, assignments, quizzes with auto-scoring, and basic progress tracking
- A mock payment flow with platform commission and tutor withdrawals
- Admin dashboard for analytics, user suspension, tutor verification, and reports

## Stack

- **Frontend**: React 19, React Router, Axios, Vite
- **Backend**: Node/Express, MVC-style modules
- **Database**: MySQL 8 (via `mysql2`)
- **Auth/security**: JWT, bcryptjs, Helmet, CORS, rate limiting
- **Testing**: Node's built-in test runner, Supertest, Postman

## Project layout

```text
Mentor Market/
├── backend/
│   ├── database/          # schema.sql, seed.sql, migrations/
│   ├── src/
│   │   ├── config/         # MySQL pool
│   │   ├── controllers/    # request handlers
│   │   ├── middleware/     # auth, roles, validation
│   │   ├── models/         # SQL data access
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── styles/
├── postman/
└── package.json
```

## Getting it running

You'll need Node 20.19+ (or 22.12+), npm 10+, and MySQL 8 or MariaDB 12+.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

npm install
npm run install:all
```

Replace `JWT_SECRET` in `backend/.env` if you're running this anywhere other than your own machine.

On Arch/CachyOS you'll need the MariaDB client tools:

```bash
sudo pacman -S mariadb
```

You don't need to enable the system MariaDB service — the project runs its own isolated instance on `127.0.0.1:3307`.

Then just:

```bash
npm run dev
```

First run sets up `backend/.mariadb-data`, creates the schema, and loads seed data. After that it just starts everything up and applies any new migrations.

Open `http://localhost:5173`. The API is at `http://localhost:5000/api` (health check at `/api/health`). Students land on `/student/discover` after logging in; tutors and admins go to their own dashboards.

Other database commands:

```bash
npm run db:start   # start the local database only
npm run db:stop
npm run db:reset    # reloads schema.sql + seed.sql, wipes local data
```

### Using your own MySQL server instead

Point the `DB_*` vars in `backend/.env` at your server, load the SQL yourself, and run:

```bash
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seed.sql
npm run dev:external-db
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example`. The main ones:

- `PORT`, `FRONTEND_URL` — server port and allowed CORS origin(s)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CONNECTION_LIMIT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PLATFORM_COMMISSION_RATE` — e.g. `0.10` for 10%
- `VITE_API_URL` (frontend) — should point at the `/api` base URL

## Demo accounts

Password for all of these is `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@mentormarket.test` |
| Student | `ayesha@mentormarket.test` |
| Student | `rafi@mentormarket.test` |
| Tutor (verified) | `farhan@mentormarket.test` |
| Tutor (pending verification) | `mehjabin@mentormarket.test` |

Demo credentials only — don't reuse these anywhere real.

## API

Responses come back as either `{ success, message, data, meta? }` or an error envelope with `error.code` / `error.message`. Protected routes expect `Authorization: Bearer <token>`.

| Resource | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profiles | `GET/PUT /api/students/profile`, `GET/PUT /api/tutors/profile`, `GET /api/tutors` |
| Listings | `/api/tutor-posts`, `/api/student-requests` |
| Course engagement | `/api/course-engagement/saved`, `/api/course-engagement/views`, `/api/course-engagement/recent` |
| Applications | `/api/applications`, `PATCH /api/applications/:id/status` |
| Bookings | `/api/bookings`, `PATCH /api/bookings/:id` |
| Messages | `/api/messages/conversations`, `/api/messages/conversation/:userId`, `POST /api/messages` |
| Reviews/payments | `/api/reviews`, `/api/payments`, `PATCH /api/payments/:id/pay` |
| Learning | `/api/study-materials`, `/api/assignments`, `/api/quizzes`, `/api/students/progress` |
| Activity/safety | `/api/notifications`, `/api/verifications`, `/api/reports` |
| Tutor finances | `/api/tutors/earnings`, `/api/tutors/withdrawals` |
| Admin | `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/:resource` |

List endpoints paginate with page/limit params (default page size 12, max 100).

## Postman

Import `postman/Mentor-Market.postman_collection.json`, run the schema/seed SQL, then run **Login Student**, **Login Tutor**, and **Login Admin** first — their scripts save JWTs into collection variables that the rest of the requests use.

## Tests

```bash
npm test --prefix backend     # backend smoke tests
npm run build --prefix frontend
npm test                      # both
```

The backend smoke tests don't need a live database. Anything that touches actual data needs MySQL running (or use the Postman collection).

## A few implementation notes

- Models whitelist which fields can be written/filtered, so nothing user-supplied ends up in a raw SQL identifier.
- Password hashes never go out in API responses.
- You can't register as an admin — the admin account is seeded directly into the database.
- Logout is stateless (frontend just drops the token); there's no refresh-token rotation or revocation list.
- Commission is computed server-side, not trusted from the client.
- Dates are ISO strings; if you deploy this for real, pin the DB/session timezone to UTC.

## What's missing / would come next

- Real-time chat (Socket.IO), typing indicators, read receipts
- Actual file storage (S3/Cloudinary) instead of local media URLs
- A real payment gateway with webhooks
- Timezone-aware scheduling and a video call provider
- Email/SMS notifications and a background job queue
- Password reset, email verification, refresh tokens, audit logging
- CI/CD and containerized deployment

## License

Educational use only.
