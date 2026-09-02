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

## macOS app (Tauri)

The Mac app is a thin window around the live site at [mintask.vercel.app](https://mintask.vercel.app). Clerk and Neon stay in the cloud.

1. Install Rust (once):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

2. Install JS deps and generate icons from `src-tauri/icons/icon.png`:

```bash
npm install
npx tauri icon src-tauri/icons/icon.png
```

3. Run it:

```bash
npm run tauri:dev
```

4. Ship a `.app` / `.dmg`:

```bash
npm run tauri:build
```

The build lands in `src-tauri/target/release/bundle/macos/` and `.../bundle/dmg/`. To give it to other people, join the [Apple Developer Program](https://developer.apple.com/programs/) and notarize the app (`npx tauri build` does not notarize by itself).

## iPhone (Add to Home Screen)

There is no App Store build. On iPhone, install the live site as a standalone app:

1. Open [mintask.vercel.app](https://mintask.vercel.app) in **Safari** (Chrome cannot add home-screen web apps on iOS).
2. Tap Share → **Add to Home Screen**.
3. Open the mintask icon. Sign in there if Safari was already signed in — the home-screen app has its own session.
