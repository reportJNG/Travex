# Travex

Travex is a Vite React app with a Hono/tRPC API backed by Supabase Auth, RLS tables, Storage, Realtime, and SQL RPCs from `db/db.sql`.

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Create `.env` from `.env.example` and set:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
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

Set the Supabase environment variables in Vercel. The project uses `vercel.json` to build the Vite app into `dist/public`, route `/api/*` to the Hono function, and route all other paths to the SPA entry.
