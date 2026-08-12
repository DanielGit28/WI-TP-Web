/**
 * Mirrors src/events/entities/webhook-event.entity.ts on the backend.
 * Field names match the JSON the API actually returns (TypeORM/Nest
 * serializes camelCase property names, not the snake_case DB columns).
 */
export interface WebhookEvent {
  id: string;
  provider: string;
  deliveryId: string;
  eventType: string;
  action: string | null;
  repositoryName: string | null;
  repositoryId: string | null;
  senderLogin: string | null;
  summary: string | null;
  refName: string | null;
  rawPayload: Record<string, unknown>;
  receivedAt: string; // ISO timestamp
}

/** Mirrors EventTypeCount from src/events/events.service.ts */
export interface EventTypeCount {
  eventType: string;
  count: number;
}

/**
 * Mirrors the new GET /users/me response (see backend-additions/ — this
 * endpoint doesn't exist on main yet). accessToken is intentionally never
 * part of this type; the endpoint must not select it.
 */
export interface CurrentUser {
  id: string;
  githubLogin: string;
  avatarUrl: string | null;
}

/**
 * Mirrors PublicRepository in src/repositories/repositories.controller.ts
 * — the webhookSecret field is stripped server-side and never appears here.
 */
export type RepositoryVisibility = "public" | "private";

export interface Repository {
  id: string;
  ownerUserId: string;
  githubRepoId: number;
  fullName: string; // 'owner/repo'
  visibility: RepositoryVisibility;
  webhookId: number;
  createdAt: string;
}

/** Query params accepted by GET /events — mirrors FindEventsDto. */
export interface FindEventsParams {
  eventType?: string;
  repository?: string;
  limit?: number;
  before?: string; // ISO timestamp cursor
}

/** Shape of the NestJS global HttpExceptionFilter's error response body. */
export interface ApiErrorBody {
  statusCode: number;
  timestamp: string;
  message: string | string[];
}
