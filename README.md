# WI-TP Console

Frontend for the [Webhook Ingestion & Transformation Pipeline](https://github.com/DanielGit28/WI-TP) backend. Next.js 16 (App Router) + TypeScript + Tailwind v4 + React Three Fiber, built against the design direction from the approved Claude Design mockup (`WI-TP_Console.html`).

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_API_URL with your Cloud Run URL
npm run dev
npm run test (future)
```

Opens on `http://localhost:3000`. Sign-in redirects to the backend's `/auth/github`, which redirects back to `/auth/callback#token=...` — that only works if the backend's `FRONTEND_URL` env var points at this app's origin (`http://localhost:3000` locally, your Vercel URL once deployed), since that's what the OAuth callback uses to build the redirect and what CORS is scoped to.

## Backend addition required

`GET /users/me` doesn't exist on `main` yet — the sidebar's "signed in as" display needs it. The full patch (`UsersController` + the one-line `UsersModule` change) is in `backend-addition/`, already verified against the real backend repo (`npm run build` and `npm run lint` both pass clean with it added). Drop `users.controller.ts` into the backend's `src/users/`, apply the `users.module.ts` diff, and this frontend picks it up automatically — `getCurrentUser()` in `lib/api.ts` already calls it, and gracefully degrades (shows "Signed in" with no avatar) if it 404s, so nothing breaks in the meantime.

## What's built

- **`/`** — the pipeline hero (real R3F/WebGL — not the mockup's static SVG) + condensed live feed + a right-rail that's either your repos or a sign-in prompt
- **`/stats`** — hand-built SVG radial breakdown of `GET /events/stats`
- **`/repositories`** — register/list/remove, plus the public registry
- **`/deliveries`** — full filterable, cursor-paginated event list
- **`/deliveries/[id]`** — single delivery with the raw JSON payload

Auth: token lands in the URL fragment from the backend redirect, gets captured by `/auth/callback`, stored in `localStorage`, sent as `Authorization: Bearer` on every authenticated call — no cookie handling needed since the backend never expected any.

"Live" is an 8s poll (`refetchInterval` via TanStack Query), not a websocket — the backend doesn't expose one yet. New rows in each poll spawn a particle that travels the pipeline curve; existing rows on first load don't (otherwise loading the page with 900 historical events fires 900 particles at once). Stats/events queries share query keys across components (sidebar health check, feed, pipeline, radial chart) so TanStack Query dedupes concurrent pollers into one request instead of firing one per component. The anonymous marketing page fetches once (`poll: false`) rather than polling, since it's decorative rather than a console someone's actively watching.

## Known simplifications vs. the mockup

- The sidebar's "API health" is a real signal (is our own poll currently succeeding), not the mockup's p99/uptime numbers — the backend doesn't instrument that yet.
- No duplicate-delivery counter anywhere — the backend logs duplicates server-side (`EventsService.ingestGithubEvent`) but doesn't expose a count via any endpoint. Fabricating one felt worse than leaving it out.
- `/deliveries/[id]` fetches the API's max page (200 events) and finds the match client-side — there's no `GET /events/:id`. Fine at this scale; a real single-event endpoint reusing `applyVisibilityScope` would be the cleaner v2 (noted in `lib/api.ts`).
- The mockup's annotated build-spec frame and the pixel-exact tablet/mobile breakpoints weren't built as literal screens — they were the spec for building this, not additional UI surface.

## Deploying

Push this to its own repo (kept separate from `WI-TP` deliberately — the backend's Cloud Run deploy does `source: .` against that repo's root, no reason to risk it with a monorepo restructure), then import it on Vercel. Set `NEXT_PUBLIC_API_URL` there, and update the backend's `FRONTEND_URL` secret to the resulting `*.vercel.app` URL (or custom domain) once you have it — CORS is wide open right now specifically because that's unset.
