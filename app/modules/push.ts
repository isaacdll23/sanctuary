import { z } from "zod";

/**
 * Shared, environment-agnostic Web Push helpers and boundary schemas.
 *
 * This module is intentionally free of Node-only APIs and database access so
 * the settings UI can reuse the same validation and the VAPID key decoder that
 * the server uses. Persistence and delivery live in
 * `app/modules/services/PushNotificationService.ts`.
 */

/** Postgres column width for `push_subscriptions.endpoint`. */
export const PUSH_ENDPOINT_MAX_LENGTH = 2048;

/**
 * web-push refuses payloads over 4KB once encryption overhead is added, so the
 * plaintext JSON is capped below that. 3072 bytes leaves ample headroom.
 */
export const PUSH_MAX_PAYLOAD_BYTES = 3072;

/** One test notification per user per window; in-memory, so single-instance. */
export const PUSH_TEST_THROTTLE_MS = 10_000;

const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

function isHttpsEndpoint(value: string): boolean {
  return value.startsWith("https://");
}

function isPushTarget(value: string): boolean {
  return value.startsWith("/") || value.startsWith("https://");
}

/**
 * A browser `PushSubscription.toJSON()` value. Push services only ever expose
 * HTTPS endpoints, and the keys are unpadded base64url.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z
    .string()
    .min(1)
    .max(PUSH_ENDPOINT_MAX_LENGTH)
    .refine(isHttpsEndpoint, "endpoint must be an https URL")
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "endpoint must be a valid URL"),
  keys: z.object({
    p256dh: z.string().min(16).max(255).regex(base64UrlPattern, "invalid p256dh"),
    auth: z.string().min(8).max(255).regex(base64UrlPattern, "invalid auth"),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

/** Payload the service worker turns into `showNotification`. */
export const pushPayloadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  url: z
    .string()
    .max(PUSH_ENDPOINT_MAX_LENGTH)
    .refine(isPushTarget, "url must be site-relative or https")
    .optional(),
});

export type PushPayload = z.infer<typeof pushPayloadSchema>;

export type PushPayloadResult =
  | { ok: true; payload: PushPayload; json: string }
  | { ok: false; error: string };

/**
 * Validates a payload and serializes it, rejecting anything that would exceed
 * the delivery size budget. Returns a typed result instead of throwing so
 * callers can report a user-safe error.
 */
export function preparePushPayload(input: unknown): PushPayloadResult {
  const parsed = pushPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid push payload." };
  }

  const json = JSON.stringify(parsed.data);
  if (new TextEncoder().encode(json).byteLength > PUSH_MAX_PAYLOAD_BYTES) {
    return { ok: false, error: "Push payload is too large." };
  }

  return { ok: true, payload: parsed.data, json };
}

/**
 * Decodes an unpadded base64url VAPID public key into the byte array
 * `PushManager.subscribe({ applicationServerKey })` requires. Uses `atob`, so
 * it works in both the browser and Node without `Buffer`.
 */
export function decodeBase64UrlToUint8Array(
  value: string
): Uint8Array<ArrayBuffer> {
  const compact = value.trim();
  if (compact.length === 0 || !base64UrlPattern.test(compact)) {
    throw new Error("Invalid base64url value");
  }

  const base64 = compact.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Pure throttle decision for the settings "send test" button. A `null` last
 * send means the user has never run a test.
 */
export function isPushTestThrottled(
  lastSentAt: number | null,
  now: number,
  windowMs: number = PUSH_TEST_THROTTLE_MS
): boolean {
  if (lastSentAt === null) return false;
  return now - lastSentAt < windowMs;
}

/** Remaining throttle time, clamped at zero, for user-facing messages. */
export function pushTestRetryAfterMs(
  lastSentAt: number,
  now: number,
  windowMs: number = PUSH_TEST_THROTTLE_MS
): number {
  return Math.max(0, windowMs - (now - lastSentAt));
}
