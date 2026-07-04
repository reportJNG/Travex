# Travex

Travex is a Vite React app with a Hono/tRPC API, Drizzle ORM, and Supabase Postgres.

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Create `.env.local` from `.env.example` and set:

```bash
SESSION_SECRET=
DATABASE_URL=
```

3. Run the app:

```bash
npm run dev
```

## Checks

```bash
npm run check
npm run lint
npm test
npm run build
```

## Vercel

Set `SESSION_SECRET` and `DATABASE_URL` in Vercel environment variables. The project uses `vercel.json` to build the Vite app into `dist/public`, route `/api/*` to the Hono function, and route all other paths to the SPA entry.
