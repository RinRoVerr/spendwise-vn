# SpendWise VN

Vietnamese personal finance tracker built with Next.js, Neon Managed Auth, and Neon Postgres.

## Features
- Email/password sign-up and sign-in through Neon Managed Auth.
- Server-side transaction access restricted to the signed-in user.
- Income/expense records, category/date, delete action and monthly/all-time summaries.
- Health endpoint at `/api/health`.

## Server environment
- `DATABASE_URL`: Neon Postgres connection string (server only).
- `NEON_AUTH_BASE_URL`: Managed Auth URL for the Neon branch.
- `NEON_AUTH_COOKIE_SECRET`: random secret, at least 32 characters, stored encrypted in Vercel.

See `.env.example` for names only. Never commit real credentials.

## Database
Apply `db/migrations/001_initial.sql` through a reviewed migration workflow. The app does not create tables during requests.
