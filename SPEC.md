# REzurge Web — Specification

Frontend for the REzurge fitness tracker. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui.

A separate repo from the API (`../api`). It is built to be used **mid-workout on a phone**: one hand, between sets, often on a bad connection. Every screen decision below follows from that.

---

## Architecture

The browser never talks to the Express API. The Next.js server sits in between.

```
Browser ──── cookie (httpOnly) ────▶ Next.js server ──── Authorization: Bearer ────▶ Express API
                                     Server Components (reads)                       :8800
                                     Server Actions   (writes)
```

- **Reads** happen in Server Components, which call the API server-to-server and render HTML.
- **Writes** happen in Server Actions, called from `<form action={...}>`. After a write, the action calls `revalidatePath` for the affected page, or `redirect`s to the next screen.
- **The JWT lives in an httpOnly cookie** named `token`. Browser JavaScript can't read it, so an XSS bug can't steal it.
- **No CORS.** Because every API call is server-to-server, the API's `cors` package stays unmounted, and `API_URL` is a server-only variable with no `NEXT_PUBLIC_` prefix.

No client-side data library (TanStack Query, SWR). Server Components fetch, Server Actions mutate, and Next.js re-renders. Client Components are only for interactivity the server can't do: pending states on buttons, dialogs, and `useActionState` for showing form errors.

---

## User Flow

The screens map onto what actually happens in a gym:

1. **Arrive** → `/sessions` → *Start session* → pick PUSH, PULL or LEGS → land on the new session.
2. **Pick an exercise** → *Add exercise* on the session → choose from your library → land straight on that exercise's logging screen.
3. **Log a set** → enter reps and weight → *Add set*. The form stays on the page and **keeps the last weight and reps filled in**, because most sets repeat them. Repeat.
4. **Next exercise** → back to the session → *Add exercise* → step 3 again.
5. **Mistake** → tap a set to fix its reps or weight, or swap the exercise if the wrong one was picked; the sets already logged stay attached.

---

## Pages

<!-- prettier-ignore -->
| Path | Auth | Purpose |
|---|---|---|
| `/` | — | Redirects to `/sessions` if signed in, `/login` if not. |
| `/login` | No | Username + password. On success sets the cookie and redirects to `/sessions`. |
| `/register` | No | Name, username, email, password. On success **signs the user straight in** — the API returns a token on registration — and redirects to `/sessions`. |
| `/sessions` | Yes | All sessions, newest first: type, date, note, and how many exercises each has. *Start session* button. |
| `/sessions/[id]` | Yes | One session: type, date, editable note, and the list of exercises done (name + muscle group, **no sets**). *Add exercise*, *Edit*, *Delete session*. |
| `/sessions/[id]/exercises/[weId]` | Yes | **The logging screen.** Exercise name, its sets in order, the add-set form, edit/delete per set, *Swap exercise*, *Remove from session*. |
| `/exercises` | Yes | The exercise library: add, rename, change muscle group, delete. |

Signed-in pages share a layout with a header showing the user's name (from `GET /verify`) and a *Log out* button.

The logging screen nests under its session (`/sessions/[id]/exercises/[weId]`) rather than living at `/workoutExercises/[weId]` because the API's PATCH and DELETE for a workout exercise both need the `sessionId`, and because it keeps *back* meaning "back to the session".

---

## API Integration

Which API calls each page and action makes. Every call goes through `lib/api.ts`.

<!-- prettier-ignore -->
| Page / action | API calls |
|---|---|
| Layout header | `GET /verify` |
| `/sessions` | `GET /sessions` |
| Start session | `POST /sessions` → redirect to `/sessions/[id]` |
| `/sessions/[id]` | `GET /sessions/:id` |
| Edit session | `PATCH /sessions/:id` |
| Delete session | `DELETE /sessions/:id` → redirect to `/sessions` |
| Add exercise to session | `GET /exercises` for the picker, then `POST /sessions/:id/workoutExercises` → redirect to the logging screen |
| Logging screen | `GET /sessions/:id` **and** `GET /workoutExercises/:weId/sets`, in parallel |
| Add set | `POST /workoutExercises/:weId/sets` |
| Edit set | `PATCH /workoutExercises/:weId/sets/:setId` |
| Delete set | `DELETE /workoutExercises/:weId/sets/:setId` |
| Swap exercise | `GET /exercises` for the picker, then `PATCH /sessions/:id/workoutExercises/:weId` |
| Remove from session | `DELETE /sessions/:id/workoutExercises/:weId` → redirect to `/sessions/[id]` |
| `/exercises` | `GET /exercises` |
| Add / edit / delete exercise | `POST /exercises`, `PATCH /exercises/:id`, `DELETE /exercises/:id` |
| Log in | `POST /login` → set cookie |
| Register | `POST /users` → set cookie |
| Log out | none — deletes the cookie |

**Why the logging screen makes two calls.** `GET /workoutExercises/:weId/sets` returns only the sets, not which exercise they belong to. The exercise name for the header comes from `GET /sessions/:id`, by finding `weId` in its `workoutExercises`. If `weId` isn't in that session, the page is a `404` — which also stops a URL from pairing a session with another session's workout exercise.

---

## Data Types

The shapes the API actually returns, defined once in `lib/types.ts`. Dates arrive as ISO strings, not `Date` objects.

```typescript
type User = {
    id: number
    name: string
    email: string
    username: string
    createdAt: string
}

type Exercise = {
    id: number
    name: string           // always uppercase — the API uppercases it
    muscleGroup: string
    userId: number
}

type Session = {
    id: number
    sessionType: string    // "PUSH" | "PULL" | "LEGS" by convention; the API doesn't enforce it
    note: string | null
    date: string
    userId: number
}

type SessionSummary = Session & {
    _count: { workoutExercises: number }
}

type WorkoutExercise = {
    id: number
    sessionId: number
    exerciseId: number
}

type SessionDetail = Session & {
    workoutExercises: (WorkoutExercise & { exercise: Exercise })[]
}

type WorkoutSet = {
    id: number
    setNumber: number      // assigned by the server; never sent
    reps: number           // integer, 1 or more
    weight: number         // float, 0 or more — 7.5 is valid, 0 is bodyweight
    workoutExerciseId: number
}

type ApiError = { msg: string }
```

<!-- prettier-ignore -->
| Endpoint | Returns |
|---|---|
| `POST /login` | `{ safeUser: User, token: string }` |
| `POST /users` | `{ safeUser: User, token: string }` — the same as login |
| `GET /verify` | `User` |
| `GET /sessions` | `SessionSummary[]` |
| `GET /sessions/:id` | `SessionDetail` |
| `GET /workoutExercises/:id/sets` | `WorkoutSet[]` |
| Any create / update / delete | The affected record |
| Any failure | `ApiError`, except a failure Express itself produces before reaching a route |

---

## Auth

**Signing in.** The login and register Server Actions call `POST /login` or `POST /users`, which both return `{ safeUser, token }`, then set the cookie:

<!-- prettier-ignore -->
| Attribute | Value | Why |
|---|---|---|
| `httpOnly` | `true` | Unreadable from browser JavaScript |
| `secure` | `true` in production | Never sent over plain HTTP |
| `sameSite` | `lax` | Sent on normal navigation, not on cross-site POSTs |
| `path` | `/` | Every page needs it |
| `maxAge` | 30 days | Matches the token's own 30-day expiry |

**Checking it.** `proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects to `/login` when a protected path is requested with no `token` cookie, and away from `/login` and `/register` when one exists. Every path is protected unless it's one of those two auth pages — protected by default, so a page added later can't be left open by forgetting to list it. `/signout` always passes through untouched, since it has to run whether or not a cookie is present. Its matcher excludes `_next/static`, `_next/image` and `favicon.ico`, or the redirect would block CSS and JS from loading on the login page.

This is an **optimistic** check — it only looks for the cookie's presence, so it's for routing, not security. In particular it doesn't protect Server Actions: those are POSTs to whatever page they're used on, and Next.js's own docs warn against relying on Proxy to guard them. What actually protects every read and write is that `lib/api.ts` sends the cookie's token and the API verifies it. A request with no valid token gets nothing from the API, whichever path it arrived by.

**When the API rejects it.** The API answers `401` for a missing, invalid or expired token. `lib/api.ts` treats any `401` as "signed out" and redirects to `/signout`, a Route Handler that deletes the cookie and redirects on to `/login`. The detour is needed because Next.js only allows deleting a cookie in a Server Action or Route Handler — not while a Server Component renders, which is where most API calls happen. Deleting it matters: if the stale cookie survived, `proxy.ts` would see it, bounce `/login` back to `/sessions`, and the user would loop. Because the cookie and the token both last 30 days, the usual way a session ends is the cookie simply disappearing; the `401` path catches the rest.

**Signing out.** A Server Action deletes the cookie and redirects to `/login`.

**What logging out can't do.** The API has no revocation, so deleting the cookie ends the session *in this browser*, but the token itself stays valid until its 30 days run out. Anyone who had copied it could keep using it until then. That's an API-side limit; see API Gaps.

---

## Key Patterns

**One way to reach the API.** `lib/api.ts` is the only file that calls `fetch` against `API_URL`. It starts with `import "server-only"`, so importing it into a Client Component is a build error rather than a token leak. It reads the cookie, adds the `Authorization` header, parses JSON, and turns failures into the outcomes below. Requests use `cache: "no-store"`, because every response belongs to one user and must never be served to another.

`api<T>(path, { method, body, auth })` returns the parsed JSON typed as `T`. That type is a promise the caller makes, not something checked at runtime, which is why `lib/types.ts` has to match what the API actually returns. Login and register pass `auth: false`: no token is sent, and a `401` comes back as an error to show — "invalid username or password" — instead of being taken as a sign-out.

`redirect()` and `notFound()` both work by throwing, so `lib/api.ts` calls them outside any `try` block, and callers must not wrap `api()` in a `try/catch` that swallows them. A caller that catches should check for `ApiError` and rethrow everything else.

**Failures map to one outcome each.**

<!-- prettier-ignore -->
| API answer | What the user sees |
|---|---|
| `400` | An `ApiError` carrying the API's `msg`, shown inline next to the form that caused it |
| `401` | Sent to `/signout`, which deletes the cookie, then to `/login`. Except with `auth: false`, where it's an `ApiError` like a `400` |
| `404` on a read (`GET`) | Next.js `notFound()` — the page's 404 screen, since the thing the page shows doesn't exist |
| `404` on a write | An `ApiError` with the API's `msg`, shown inline — e.g. "exercise not found" from the exercise picker is a form error, not a missing page |
| `500` or network failure | The nearest `error.tsx` boundary, with a retry button |

**The API is the source of truth for validation.** Forms use native HTML constraints for instant feedback — `required`, `min="1"` and `step="1"` on reps, `min="0"` and `step="any"` on weight — but nothing is re-implemented in JavaScript. Whatever the API rejects comes back as a `400` with a `msg`, and `useActionState` puts that message under the form. A rule only has to be written once.

**Form values are strings; the API wants numbers.** `FormData` gives every field as a string, and the API rejects `"10"` where it expects `10`. Server Actions convert with `Number()` — but `Number("")` is `0`, so an empty weight field would silently become a bodyweight set. An empty string is treated as *missing* before converting, never as zero:

```typescript
function readNumber(form: FormData, field: string): number | undefined {
    const raw = form.get(field)
    if (typeof raw !== "string" || raw.trim() === "") return undefined
    return Number(raw)
}
```

`undefined` is then left out of the request body, and the API answers with its own "required" `400`.

**Weights display the way people say them.** `7.5`, not `7.50`; `60`, not `60.0`. Bodyweight sets (`weight: 0`) show as **BW** rather than `0 kg`.

**Ids come from the API, never from string building.** A link is only ever built from an id the API returned. The API answers `404` to a non-numeric id, and a URL like `/sessions/undefined` — what a missing variable produces — would otherwise reach it.

**Session types are a fixed choice in the UI.** The API stores any string and uppercases it, but the spec names three types. The start-session form offers exactly PUSH, PULL and LEGS as a select, so free text can never reach the API from this app.

**Mobile first, one-handed.** Layouts are designed at 375 px wide and scaled up, not down. Primary actions sit at the bottom of the screen within thumb reach, and tap targets are at least 44 px. The add-set form is the most-used control in the app and gets the most space on the logging screen.

**Destructive actions confirm.** Deleting a session, an exercise or a set opens a shadcn `AlertDialog` first. Deleting a session also says that its exercises and sets go with it, since the API cascades.

**Cache Components is on, so session reads stream.** Next.js 16.4 enables `cacheComponents` by default. A page renders a static shell — layout, header frame, headings — that appears instantly, and anything that calls the API (which reads the `token` cookie) sits inside a `<Suspense>` boundary with a skeleton fallback and streams in. Reading cookies outside a boundary is a **build error**, not just slower. Two rules follow:

- Never `await` the API at the top level of a layout. That holds the whole segment, `{children}` included, behind the request. Put the read in a small async component inside the layout's boundary instead, as the signed-in header does with the user's name.
- In a page, keep the heading outside the boundary and the data inside it, so the page has a recognisable shape on a slow connection. Skeletons match the layout of what they stand in for.

This is the spec's "bad signal mid-workout" premise paying off: on a slow connection you see the page immediately rather than a frozen screen. `next build` reports such routes as **◐ Partial Prerender**.

**`params` is a promise.** Since Next.js 15, a page's `params` must be awaited — `const { id } = await params` — and so must `cookies()`.

---

## Project Structure (planned)

```
app/
  layout.tsx                 # root: html, body, fonts, Toaster
  page.tsx                   # redirects to /sessions or /login
  login/page.tsx
  register/page.tsx
  (signed-in)/               # route group: shares the header layout, adds nothing to the URL
    layout.tsx               # header with user name and Log out
    sessions/
      page.tsx
      [id]/
        page.tsx
        exercises/[weId]/page.tsx
    exercises/page.tsx
  actions/                   # Server Actions, one file per resource
    auth.ts
    sessions.ts
    workoutExercises.ts
    sets.ts
    exercises.ts
  signout/route.ts           # deletes the cookie, then redirects to /login
components/
  ui/                        # shadcn/ui components — generated, owned by this repo
lib/
  api.ts                     # server-only API client
  types.ts                   # response types above
  format.ts                  # weight and date formatting
proxy.ts                     # optimistic auth redirects
```

shadcn/ui components expected: `button`, `input`, `label`, `card`, `select`, `dialog`, `alert-dialog`, `sonner` (toasts).

---

## Environment

`.env.local` (gitignored), copied from a tracked `.env.example`:

```
# Base URL of the Express API. Server-only: no NEXT_PUBLIC_ prefix,
# because the browser never calls the API directly.
API_URL=http://localhost:8800
```

The API runs on `8800` and this app on Next.js's default `3000`, so both can run at once.

---

## API Gaps

Things in the API that this app works around or that limit it. None block building the app.

- **No token revocation.** Logging out deletes the cookie, but the token stays valid until its 30-day expiry.
- **Duplicate email reads as duplicate username.** Registering with an email that's already in use returns "username already taken". The register form shows the API's message as-is, so the user may be told the wrong field is the problem.
- **No set counts on the session list.** `GET /sessions` includes an exercise count but not a set count, which would need a second query on the API side.
- **No account editing.** There's no API for changing name, email, username or password, so there's no settings page.

---

## Setup

```bash
# 1. Start the API first — see ../api/README.md
cd ../api && npm run dev

# 2. Then this app
cd ../web
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

---

## Built So Far

- Next.js app scaffolded, with shadcn/ui initialised
- `lib/api.ts` — the server-only API client, and `lib/types.ts`
- `/signout` — the Route Handler a `401` redirects to
- `/login` — page, form and the `login` / `logout` Server Actions
- `/` — redirects to `/sessions`
- Signed-in layout — header with the user's name and *Log out*, streamed
- `/sessions` — the list only, streamed behind a skeleton; no *Start session* yet
- `proxy.ts` — redirects signed-out requests to `/login` before anything renders, and signed-in ones away from the auth pages

## Not Yet Built

- Everything above
- Optimistic set logging with `useOptimistic`, so a set appears the instant it's tapped rather than after the round trip
- Offline logging — gyms are often basements with no signal; sets would queue locally and sync later
- Streak and attendance views, once the API supports them
- A settings page, once the API supports account editing
