# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development server (uses --webpack flag)
npm run build    # Production build (uses --webpack flag)
npm run lint     # ESLint
npm start        # Start production server
```

There are no automated tests. Verify changes manually in the browser.

## Architecture Overview

**Meu Treino** is a mobile-first PWA for strength training, targeting Brazilian Portuguese speakers. All UI text is in pt-BR; code, variable names, and comments are in English.

### SPA with a single view-switcher

`src/app/page.tsx` is the entire application shell. It renders one of four feature views (`plans`, `workout`, `history`, `evolution`) based on a `view` state string. All hooks must be called before any early return — the app uses conditional rendering, not separate routes.

### Data flow: localStorage-first, Supabase-second

- **localStorage** is the source of truth during a session.
- On login, `useWorkoutData` loads remote data from Supabase via Server Actions and replaces local state.
- All mutations update local state immediately, then fire a Server Action to sync. On first login ever, local data is uploaded to Supabase first.
- Offline mutations are queued in `src/utils/syncQueue.ts` (localStorage-backed) and processed when the connection is restored.

### Hook composition in `useWorkoutData`

`useWorkoutData` (`src/hooks/useWorkoutData.ts`) is the top-level data orchestrator. It composes:
- `usePlans` — CRUD for plans and exercises
- `useHistory` — read/write of workout records
- `useWorkoutSession` — active session state (set confirmation, weight updates)
- `useFirestoreSync` — sync queue processing and Supabase write coordination

`page.tsx` also uses `useRestTimer`, `useFinishedPlans`, `useWorkoutDerivedState`, and `useProfile` independently.

### Server Actions pattern

All Server Actions live in `src/app/actions/`. Every action calls `requireUser()` first to enforce auth. Actions use `createClient()` from `src/lib/supabase/server.ts`. The naming convention for the mapping helpers is `rowToPlan` / `rowToRecord` (snake_case DB columns → camelCase TS types).

### Supabase clients

Three distinct clients — never interchange them:
- `src/lib/supabase/client.ts` — browser (any `'use client'` component or hook)
- `src/lib/supabase/server.ts` — Server Actions and RSC
- `src/lib/supabase/middleware.ts` — `middleware.ts` only

### Key conventions

- Import alias `@/*` maps to `src/*` — use it for all cross-directory imports.
- `'use client'` is required on every file that uses browser APIs, React state, or custom hooks.
- IDs are generated with `crypto.randomUUID()` on the client.
- Timestamps are ISO 8601 strings (`new Date().toISOString()`).
- `setProgress` (daily set-by-set progress) and `substituteExercises` are both stored in a single `workoutSetProgress` localStorage key, keyed by today's date in `pt-BR` locale (`toLocaleDateString('pt-BR')`). Data resets when the date changes.

### Styling

- Tailwind CSS v4 with a dark-only theme. Base background: `#08060f`. Accent: purple (`#7c3aed` / `#9333ea`).
- Global CSS variables and utility classes (`.card`, `.card-elevated`) are defined in `src/app/globals.css`.
- Design is mobile-first: fixed bottom `TabBar`, no horizontal scroll, `pb-24` on main content to clear the tab bar.

### Database schema (Supabase)

Migrations in `supabase/migrations/` in numerical order. Key tables: `workout_programs`, `workout_plans` (exercises stored as JSONB), `workout_history`, `workout_sessions`, `user_profiles`, and an `avatars` storage bucket. All tables have a `user_id` FK and RLS policies — always filter by `user_id` in queries.

### Workout session lifecycle

1. `startWorkout(plan)` — creates a `WorkoutDraft` in localStorage
2. User confirms sets via `confirmSet` / `unconfirmSet`; weights update via `updateExerciseWeight`
3. `commitSession()` — saves records to history (local + Supabase) and clears the draft
4. If the app restarts with a draft present, a recovery modal asks the user to continue or discard

The `WorkoutDraft` contains the in-progress `WorkoutRecord[]` that accumulates as exercises are completed.
