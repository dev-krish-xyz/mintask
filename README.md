# mintask

A minimal task tracker for execution. No dashboards, no noise.

## What it does

- Sign in with Clerk; data is stored in Neon Postgres
- Day-based workspaces on a calendar
- Nested sub-tasks with progress
- Quick notes via ⌘I, saved to Ideas

## Setup

1. Link the project and install Marketplace integrations:

```bash
npx vercel link --yes --project mintask --scope <your-team>
npx vercel integration add neon --yes --no-claim
npx vercel integration add clerk --yes --no-claim
npx vercel env pull .env.local --yes
```

2. Add Clerk routing URLs if they are not already in Vercel:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

3. Push the schema and run the app:

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Press `n` for a task, `⌘I` for a note.
