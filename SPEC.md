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
- **Writes** happen in Server Actions, called from `<form action={...}>`. After a write, the action either `redirect`s to the next screen or calls `refresh()` from `next/cache` to re-render the current page. Not `revalidatePath`: that clears cached data, and nothing here is cached — every API call is `no-store`.
- **The JWT lives in an httpOnly cookie** named `token`. Browser JavaScript can't read it, so an XSS bug can't steal it.
- **No CORS.** Because every API call is server-to-server, the API's `cors` package stays unmounted, and `API_URL` is a server-only variable with no `NEXT_PUBLIC_` prefix.

No client-side data library (TanStack Query, SWR). Server Components fetch, Server Actions mutate, and Next.js re-renders. Client Components are only for interactivity the server can't do: pending states on buttons, dialogs, and `useActionState` for showing form errors.

---

## User Flow

The screens map onto what actually happens in a gym:

1. **Arrive** → the home page at `/`, which greets you by name → tap **Start a session** → `/sessions/new`, where you choose PUSH, PULL or LEGS and the first exercise — from your library, or a new one typed in on the spot → land straight on that exercise's logging screen. A note can be added afterwards on the session page.
2. **Pick an exercise** → *＋ Add exercise* on the session page → choose from your library, or type in a new one → land straight on that exercise's logging screen.
3. **Log a set** → enter reps and weight → *Add set*. The form stays on the page and **keeps the last weight and reps filled in**, because most sets repeat them. Repeat.
4. **Next exercise** → tap *Next exercise* at the bottom of the logging screen → *Add an exercise* for the same session → step 3 again. A session holds as many exercises as you do.
5. **Mistake** → tap a set to fix its reps or weight, or swap the exercise if the wrong one was picked; the sets already logged stay attached.

---

## Pages

<!-- prettier-ignore -->
| Path | Auth | Purpose |
|---|---|---|
| `/` | Yes | **The home page.** Below the app bar: *Welcome, {name}*, a full-width *Start a session* button that links to `/sessions/new`, then *Recent sessions*: the **five** newest, each with its type, date (with weekday), exercise count and note, and a *Show all* link beside the heading. Signed-out visitors are sent to `/login` by `proxy.ts`. |
| `/login` | No | Username + password. On success sets the cookie and redirects to `/`. |
| `/register` | No | Name, username, email, password. On success **signs the user straight in** — the API returns a token on registration — and redirects to `/`. |
| `/sessions` | Yes | Every session, newest first, in the same cards as the home page, with a *Home* back link. Reached from *Show all*. |
| `/sessions/new` | Yes | **Start a session.** PUSH, PULL or LEGS as three large choices, then the first exercise from a picker grouped by muscle group, with *＋ New exercise…* at the end, which opens fields for a name and a muscle group. A user with an empty library sees those fields open from the start. Submitting creates the session and lands on its page. |
| `/sessions/[id]` | Yes | **Built (view only).** One session in full: type, the date written out, the note, a count of exercises and sets, then every exercise with its muscle group and a table of its sets — set number, reps, weight. Reached by tapping any session card; *All sessions* goes back. An *＋ Add exercise* button under the list opens `/sessions/[id]/exercises/new`. Still to add: *Edit* note, *Delete session*. |
| `/sessions/[id]/exercises/new` | Yes | **Add an exercise** to an existing session. The same picker as *Start a session* — the library grouped by muscle group, or *＋ New exercise…* — with a *So far: …* line naming the exercises already in the session. Lands on the new exercise's logging screen. Reached from *＋ Add exercise* on the session page and *Next exercise* on the logging screen. |
| `/sessions/[id]/exercises/[weId]` | Yes | **The logging screen. Built: logging sets.** The exercise name and muscle group, then large *Reps* and *Weight (kg)* fields and an *Add set N* button, then the sets so far. After each set the fields keep its reps and weight, so a repeated set is one tap. Start session lands here, and each exercise card on the session page opens it. A back link returns to the session, and *Next exercise* under the sets adds the next one. Still to add: edit and delete a set, *Swap exercise*, *Remove from session*. |
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
| `/` (home) | `GET /verify` for the welcome line and `GET /sessions?limit=5` for the list, so only five sessions are ever fetched. The `/verify` call is shared with the header — see *One user lookup per request* |
| `/sessions/new` | `GET /exercises` for the picker |
| Start session | `POST /exercises` first if it's a new exercise, then `POST /sessions`, then `POST /sessions/:id/workoutExercises` → redirect to that exercise's logging screen. If the last call fails, `DELETE /sessions/:id` removes the session it just made |
| `/sessions/[id]` | `GET /sessions/:id` |
| Edit session | `PATCH /sessions/:id` |
| Delete session | `DELETE /sessions/:id` → redirect to `/` |
| `/sessions/[id]/exercises/new` | `GET /sessions/:id` (for the back link and *So far*) and `GET /exercises` (for the picker), in parallel |
| Add exercise to session | `POST /exercises` first if it's a new exercise, then `POST /sessions/:id/workoutExercises` → redirect to the logging screen |
| Logging screen | `GET /sessions/:id`, which now carries every exercise's sets |
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

**The logging screen reads its exercise out of the session.** `GET /sessions/:id` returns every exercise with its sets, so the logging screen finds `weId` among the session's `workoutExercises` instead of making a second call. If `weId` isn't in that session, the page is a `404` — which also stops a URL from pairing a session with another session's workout exercise.

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
    workoutExercises: (WorkoutExercise & {
        exercise: Exercise
        sets: WorkoutSet[]        // in setNumber order
    })[]
}

type WorkoutSet = {
    id: number
    setNumber: number      // assigned by the server; never sent
    reps: number           // integer, 1 or more
    weight: number         // float, 0 or more — 7.5 is valid, 0 is bodyweight
    workoutExerciseId: number
}

type AuthResponse = {
    safeUser: User
    token: string
}
```

Error bodies are `{ msg: string }`. They aren't a type in `lib/types.ts`: `lib/api.ts` turns them into an `ApiError` **class**, which carries the HTTP `status` as well as the message, so callers can tell a `400` from a `404`.

<!-- prettier-ignore -->
| Endpoint | Returns |
|---|---|
| `POST /login` | `AuthResponse` |
| `POST /users` | `AuthResponse` — the same as login |
| `GET /verify` | `User` |
| `GET /sessions` | `SessionSummary[]` |
| `GET /sessions/:id` | `SessionDetail` |
| `GET /workoutExercises/:id/sets` | `WorkoutSet[]` |
| Any create / update / delete | The affected record |
| Any failure | `{ msg }`, thrown by `lib/api.ts` as an `ApiError` |

---

## Auth

**Signing in.** The login and register Server Actions call `POST /login` or `POST /users`, which both return `{ safeUser, token }`, then set the cookie through `startSession`, a helper in `app/actions/auth.ts` that is deliberately **not exported**. In a `"use server"` file every export can be called from the browser, so exporting it would let anyone set an arbitrary token cookie. The cookie:

<!-- prettier-ignore -->
| Attribute | Value | Why |
|---|---|---|
| `httpOnly` | `true` | Unreadable from browser JavaScript |
| `secure` | `true` in production | Never sent over plain HTTP |
| `sameSite` | `lax` | Sent on normal navigation, not on cross-site POSTs |
| `path` | `/` | Every page needs it |
| `maxAge` | 30 days | Matches the token's own 30-day expiry |

**Checking it.** `proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects to `/login` when a protected path is requested with no `token` cookie, and away from `/login` and `/register` to the home page `/` when one exists. Every path is protected unless it's one of those two auth pages — protected by default, so a page added later can't be left open by forgetting to list it. `/signout` always passes through untouched, since it has to run whether or not a cookie is present. Its matcher excludes `_next/static`, `_next/image` and `favicon.ico`, or the redirect would block CSS and JS from loading on the login page.

This is an **optimistic** check — it only looks for the cookie's presence, so it's for routing, not security. In particular it doesn't protect Server Actions: those are POSTs to whatever page they're used on, and Next.js's own docs warn against relying on Proxy to guard them. What actually protects every read and write is that `lib/api.ts` sends the cookie's token and the API verifies it. A request with no valid token gets nothing from the API, whichever path it arrived by.

**When the API rejects it.** The API answers `401` for a missing, invalid or expired token. `lib/api.ts` treats any `401` as "signed out" and redirects to `/signout`, a Route Handler that deletes the cookie and redirects on to `/login`. The detour is needed because Next.js only allows deleting a cookie in a Server Action or Route Handler — not while a Server Component renders, which is where most API calls happen. Deleting it matters: if the stale cookie survived, `proxy.ts` would see it, bounce `/login` back to `/`, and the user would loop. Because the cookie and the token both last 30 days, the usual way a session ends is the cookie simply disappearing; the `401` path catches the rest.

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
| `500` or network failure | The nearest `error.tsx` boundary, with a retry button. **Not built yet** — until it is, the user gets Next.js's default error page, e.g. when the API isn't running |

**The API is the source of truth for validation.** Forms use native HTML constraints for instant feedback — `required`, `min="1"` and `step="1"` on reps, `min="0"` and `step="any"` on weight — but nothing is re-implemented in JavaScript. Whatever the API rejects comes back as a `400` with a `msg`, and `useActionState` puts that message under the form. A rule only has to be written once.

**Form values are strings; the API wants numbers.** `FormData` gives every field as a string, and the API rejects `"10"` where it expects `10`. Server Actions convert with `Number()` — but `Number("")` is `0`, so an empty weight field would silently become a bodyweight set. `readNumber` in `lib/form-data.ts` treats an empty string as *missing* before converting, never as zero:

```typescript
function readNumber(form: FormData, field: string): number | undefined {
    const raw = form.get(field)
    if (typeof raw !== "string" || raw.trim() === "") return undefined
    return Number(raw)
}
```

`undefined` is then left out of the request body, and the API answers with its own "required" `400`.

**Weights display the way people say them.** `formatWeight` in `lib/format.ts` writes `7.5 kg`, not `7.50`; `60 kg`, not `60.0`; and float noise like `0.30000000000000004` as `0.3 kg`. Bodyweight sets (`weight: 0`) show as **BW** rather than `0 kg`. Dates go through the same file, so every page writes them the same way.

**Ids come from the API, never from string building.** A link is only ever built from an id the API returned. The API answers `404` to a non-numeric id, and a URL like `/sessions/undefined` — what a missing variable produces — would otherwise reach it.

**An id from the URL is checked before it reaches the API.** A page like `/sessions/[id]` puts its `id` into an API path, and `fetch` resolves `..` in a URL: an id of `..` — even run through `encodeURIComponent`, which leaves dots alone — turns `/sessions/..` into a request for the API's root instead of a session. So the page accepts only digits and calls `notFound()` for anything else, before any request is made.

**A streamed 404 answers 200.** When `notFound()` runs inside a `<Suspense>` boundary, the page's shell — and its `200` status — has already been sent, so Next swaps in the 404 page and adds a `noindex` tag rather than changing the status. Users see the right page and search engines skip it; only the raw HTTP status is off.

**Session types are a fixed choice.** The API stores any string and uppercases it, but the spec names three types. They're defined once in `lib/session-types.ts` — not in the actions file, because a `"use server"` file may only export async functions. `/sessions/new` offers exactly those three, and the `createSession` action checks the submitted value against the same list, since a Server Action is a public endpoint that can be called without the form.

**Muscle groups are a fixed list too.** `lib/muscle-groups.ts` holds Chest, Back, Shoulders, Arms, Legs and Core — the names the seed data already uses — so a library doesn't end up with "Chest", "chest" and "Pecs" as three groups. A new exercise's muscle group is a picker from that list, checked again in the action.

**One exercise picker, one resolver.** *Start a session* and *Add an exercise* both choose an exercise the same way, so both use `components/exercise-picker.tsx` on the page and `resolveExercise()` in `lib/exercise-choice.ts` in the action. `resolveExercise` returns the chosen exercise's id, creating the exercise first when the user typed in a new one. It lives in a plain `server-only` module rather than a `"use server"` file, because every export of a `"use server"` file can be called from the browser, and this one creates exercises.

**Two API calls, one session.** Starting a session with its first exercise takes `POST /sessions` and then `POST /sessions/:id/workoutExercises`. If the second fails, the action deletes the session the first created, so the user is never left with an empty session they didn't ask for. A new exercise is created *before* the session for the same reason: if its name is rejected, nothing else has been made yet. The order is the safeguard.

**Forms rebuild their fields after a failed attempt.** React resets a form after every action, returning each field to its *default*. A field showing what the user just typed is therefore wiped unless its default is that value. Forms with more than text inputs — `/sessions/new` has radios and two pickers — render their fields in a child component keyed by an `attempt` counter, which the action's state carries and bumps on every result. Each failed attempt re-mounts the fields with the values just submitted as their defaults, so React's reset restores exactly them. Two details make it work, each found by a test failing:

- The counter lives **in the action's state**, not in a separate `useState`. A separate counter updates first, re-mounting the fields with the *previous* state's values.
- Every field is **uncontrolled**. A controlled `<select>` (`value=` plus `onChange`) is sent to its first option by the reset and React never corrects it, so the screen and React's state disagree — on this page, a picker showing one exercise while the form would submit another. `onChange` is still used, only to show or hide the new-exercise fields.

**Text in form fields is at least 16 px.** iPhone Safari zooms the whole page when a field with smaller text is focused, which on a phone mid-workout means the layout jumps every time a picker is tapped.

**Submit buttons guard against a double tap.** `disabled={pending}` only takes effect after React re-renders, and a second tap that lands before then submits again — a second session, or on the logging screen a duplicate set — measured at 54 ms apart. Every form whose action creates something passes `useSubmitGuard(pending)` from `lib/use-submit-guard.ts` to its `onSubmit`: a `useRef` flag set on the first submit, cancelling further submits with `preventDefault()`, cleared once `pending` goes false.

**The add-set form starts from the last set.** Its fields re-mount with a `key` of the set count plus the attempt counter. After a set is logged the count changes, so the fields start from that set's reps and weight — most sets repeat the last one, so the next is a single tap. After an error the attempt changes instead, and the fields keep what was typed. Reps and weight use `inputMode="numeric"` and `"decimal"`, so phones show a number pad, with a decimal point for weights like 62.5.

**Mobile first, one-handed.** Layouts are designed at 375 px wide and scaled up, not down. Tap targets are at least 44 px. The add-set form is the most-used control in the app and gets the most space on the logging screen.

**One session list, two pages.** `components/session-list.tsx` renders the cards for both the home page and `/sessions`. The home page passes `limit={5}`, which becomes `GET /sessions?limit=5` — the limit is applied by the API, not by slicing a full list in the browser. `/sessions` passes none. Sharing it means the two can't drift apart in how a session is shown.

**Navigation is a link, not a button.** *Start a session* is a `<Link>` styled with `buttonVariants`, not a `<Button>` with a click handler. It looks the same, but it's a real link: Next can prefetch the page behind it, and a long-press opens it in a new tab.

**One user lookup per request.** The app bar and the home page's welcome both need the current user. `getCurrentUser()` in `lib/user.ts` wraps `GET /verify` in React's `cache()`, which shares one result across everything rendered for the same request, so the API is called once however many components ask.

**Form field ids come from `useId()`.** With Cache Components, navigating away from a page keeps it mounted but hidden, so it keeps its state if you come back. After going from `/login` to `/register`, both forms are in the document at once. Hard-coded ids like `id="username"` would then appear twice, and a label's `htmlFor` targets the first match in the document, which can be the hidden form's input. Each form calls `useId()` and prefixes its ids with it, so they never collide.

**Destructive actions confirm.** Deleting a session, an exercise or a set opens a shadcn `AlertDialog` first. Deleting a session also says that its exercises and sets go with it, since the API cascades.

**Cache Components is on, so session reads stream.** `create-next-app` 16.4 turned on `cacheComponents` and `partialPrefetching` in `next.config.ts`, and the app is written for them. A page renders a static shell — layout, header frame, headings — that appears instantly, and anything that calls the API (which reads the `token` cookie) sits inside a `<Suspense>` boundary with a skeleton fallback and streams in. Reading cookies outside a boundary is a **build error**, not just slower. Two rules follow:

- Never `await` the API at the top level of a layout. That holds the whole segment, `{children}` included, behind the request. Put the read in a small async component inside the layout's boundary instead, as the signed-in header does with the user's name.
- In a page, keep static headings outside the boundary and the data inside it, so the page has a recognisable shape on a slow connection. A heading that itself needs data — the home page's *Welcome, {name}* — gets its own small boundary. Skeletons match the layout of what they stand in for.

This is the spec's "bad signal mid-workout" premise paying off: on a slow connection you see the page immediately rather than a frozen screen. `next build` reports such routes as **◐ Partial Prerender**.

**`params` is a promise.** Since Next.js 15, a page's `params` must be awaited — `const { id } = await params` — and so must `cookies()`.

---

## Project Structure

Files marked *(planned)* don't exist yet.

```
app/
  layout.tsx                 # root: html, body, font, title template
  login/
    page.tsx
    login-form.tsx           # Client Component: useActionState form
  register/
    page.tsx
    register-form.tsx
  (signed-in)/               # route group: shares the header layout, adds nothing to the URL
    layout.tsx               # header with user name and Log out
    page.tsx                 # the home page, served at /
    sessions/
      page.tsx               # every session
      new/
        page.tsx             # loads the exercise library
        new-session-form.tsx # Client Component: type, exercise, new exercise
      [id]/
        page.tsx             # one session, every set
        exercises/
          new/
            page.tsx         # add an exercise to this session
            add-exercise-form.tsx
          [weId]/
            page.tsx         # the logging screen
            add-set-form.tsx # Client Component: reps, weight, Add set
    exercises/page.tsx       # (planned)
  actions/                   # Server Actions, one file per resource
    auth.ts                  # login, register, logout
    sessions.ts              # createSession — session plus its first exercise
    workoutExercises.ts      # addExercise
    sets.ts                  # addSet
    exercises.ts             # (planned)
  signout/route.ts           # deletes the cookie, then redirects to /login
components/
  session-list.tsx           # session cards, shared by / and /sessions
  exercise-picker.tsx        # exercise select plus New exercise fields, shared by both forms
  set-table.tsx              # a table of sets, shared by the session page and logging screen
  ui/                        # shadcn/ui components — generated, owned by this repo
lib/
  api.ts                     # server-only API client and ApiError
  types.ts                   # response types above
  user.ts                    # getCurrentUser(), one GET /verify per request
  session-types.ts           # PUSH, PULL, LEGS
  muscle-groups.ts           # Chest, Back, Shoulders, Arms, Legs, Core
  exercise-groups.ts         # groups and sorts a library for the picker
  exercise-choice.ts         # server-only: read and resolve the picker's choice
  utils.ts                   # cn(), generated by shadcn
  form-data.ts               # readNumber and readString for Server Actions
  use-submit-guard.ts        # double-tap guard for forms
  format.ts                  # weight and date formatting
proxy.ts                     # optimistic auth redirects
```

shadcn/ui components installed: `button`, `card`, `input`, `label`, `skeleton`. Still to add as the pages need them: `select`, `alert-dialog` (destructive confirms) and `sonner` (toasts).

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
- **No set counts on the session list.** `GET /sessions` includes an exercise count but not a set count, which would need a second query on the API side.
- **No account editing.** There's no API for changing name, email, username or password, so there's no settings page.

---

## Setup

```bash
# 1. Start the API first, in its own terminal — see ../api/README.md
cd ../api && npm run dev

# 2. Then this app, in a second terminal
cd ../web
npm install
cp .env.example .env.local
npm run dev    # http://localhost:3000
```

`npm run typecheck` runs `next typegen` before `tsc`. Next 16 generates route types such as `LayoutProps` into `.next/`, so a bare `tsc` fails on a fresh checkout.

---

## Built So Far

- Next.js 16.4.2 app scaffolded, with shadcn/ui initialised
- `lib/api.ts` — the server-only API client, and `lib/types.ts`
- `/signout` — the Route Handler a `401` redirects to
- `/login` — page, form and the `login` / `logout` Server Actions
- `/register` — page, form and the `register` Server Action; links between the two auth pages
- Signed-in layout — header with the user's name and *Log out*, streamed
- `/` — the home page: a welcome line with the user's name, a *Start a session* link to `/sessions/new`, and the five most recent sessions with a *Show all* link, each part streamed behind its own skeleton. The link opens `/sessions/new`
- `/sessions` — every session, reached from *Show all*
- `/sessions/[id]` — one session in full, with every exercise and its sets; opened by tapping any session card
- `lib/format.ts` — `formatWeight` (`7.5 kg`, **BW**) and the date formats
- `proxy.ts` — redirects signed-out requests to `/login` before anything renders, and signed-in ones away from the auth pages
- `lib/user.ts` — `getCurrentUser()`, shared by the header and the welcome line
- `/sessions/new` — choose the type and the first exercise, or create a new exercise on the spot, then land on its logging screen
- The logging screen, `/sessions/[id]/exercises/[weId]` — log sets one at a time; the fields keep the last set's reps and weight
- `/sessions/[id]/exercises/new` — add as many exercises to a session as you do, from the session page or with *Next exercise*

## Not Yet Built

- Editing on `/sessions/[id]` — the note, deleting the session
- On the logging screen — edit and delete a set, swap the exercise, remove it from the session
- `/exercises` — the exercise library
- `error.tsx` — a friendly error page with a retry button
- Optimistic set logging with `useOptimistic`, so a set appears the instant it's tapped rather than after the round trip
- Offline logging — gyms are often basements with no signal; sets would queue locally and sync later
- Streak and attendance views, once the API supports them
- A settings page, once the API supports account editing
