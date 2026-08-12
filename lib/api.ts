import type {
  ApiErrorBody,
  CurrentUser,
  EventTypeCount,
  FindEventsParams,
  Repository,
  WebhookEvent,
} from "./types";

// Trim a trailing slash so callers can set NEXT_PUBLIC_API_URL either way.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

if (!API_URL && typeof window !== "undefined") {
  // Fails loudly in the browser console rather than silently hitting
  // relative paths that happen to 404 — NEXT_PUBLIC_API_URL is required,
  // there's no same-origin fallback since the API is a separate Cloud Run
  // service, not a route inside this Next.js app.
  // eslint-disable-next-line no-console
  console.error(
    "NEXT_PUBLIC_API_URL is not set — API calls will fail. Add it to .env.local.",
  );
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `Request failed with status ${status}`);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body, query } = options;

  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  // The backend's HttpExceptionFilter always returns a JSON body, even
  // on 4xx/5xx, so this is safe to attempt before checking res.ok.
  const data = (await res.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!res.ok) {
    throw new ApiError(res.status, data as ApiErrorBody | null);
  }

  return data as T;
}

// ---- events -----------------------------------------------------------

export function getEvents(params: FindEventsParams = {}, token?: string) {
  return request<WebhookEvent[]>("/events", {
    token,
    query: {
      eventType: params.eventType,
      repository: params.repository,
      limit: params.limit,
      before: params.before,
    },
  });
}

/**
 * There's no GET /events/:id on the backend — findEvents() is the only
 * read path. This fetches the largest page the API allows (200, its own
 * MAX_PAGE_SIZE) and finds the match client-side. That's fine at this
 * project's scale and it inherits the API's visibility scoping for free
 * (a private event just won't be in the results for a non-owner), but a
 * real GET /events/:id — reusing EventsService.applyVisibilityScope,
 * 404 if absent-or-not-visible — would be the cleaner v2 over paging
 * through everything to find one row.
 */
export async function findEventById(id: string, token?: string) {
  const events = await request<WebhookEvent[]>("/events", { token, query: { limit: 200 } });
  return events.find((e) => e.id === id) ?? null;
}

export function getEventStats(token?: string) {
  return request<EventTypeCount[]>("/events/stats", { token });
}

// ---- repositories -------------------------------------------------------

export function getMyRepositories(token: string) {
  return request<Repository[]>("/repositories/mine", { token });
}

export function getPublicRepositories() {
  return request<Repository[]>("/repositories/public");
}

export function registerRepository(repoUrl: string, token: string) {
  return request<Repository>("/repositories", {
    method: "POST",
    token,
    body: { repoUrl },
  });
}

export function removeRepository(id: string, token: string) {
  return request<void>(`/repositories/${id}`, { method: "DELETE", token });
}

// ---- auth ---------------------------------------------------------------

/** Browser-redirect URL for "Continue with GitHub" — never fetch() this. */
export function githubSignInUrl(): string {
  return `${API_URL}/auth/github`;
}

/**
 * GET /users/me — see backend-additions/users.controller.ts. If that
 * hasn't been deployed yet this 404s; AuthProvider treats a 404 here as
 * "still signed in, just no profile to show" rather than signing out,
 * so the rest of the app works before that endpoint ships.
 */
export function getCurrentUser(token: string) {
  return request<CurrentUser>("/users/me", { token });
}
