import * as webpush from "web-push";
import { and, eq, sql } from "drizzle-orm";
import { db } from "~/db";
import { pushSubscriptionsTable } from "~/db/schema";
import {
  isPushTestThrottled,
  preparePushPayload,
  pushSubscriptionSchema,
  pushTestRetryAfterMs,
  type PushSubscriptionInput,
} from "~/modules/push";

/**
 * Server-only Web Push delivery and subscription storage.
 *
 * VAPID details are configured lazily on first send instead of at import time,
 * so a deployment without keys boots normally and simply reports
 * `isPushConfigured() === false` (the same pattern as RESEND_API_KEY and
 * OPENAI_API_KEY). Endpoints and keys are never logged.
 */

type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

const DEFAULT_VAPID_SUBJECT = "mailto:notifications@sanctuary.isaacdelalama.dev";

function readVapidConfig(): VapidConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;

  const subject = process.env.VAPID_SUBJECT?.trim() || DEFAULT_VAPID_SUBJECT;
  return { publicKey, privateKey, subject };
}

let configuredPublicKey: string | null = null;

/**
 * Applies VAPID details once per key pair. Throws only when web-push rejects
 * the key material; callers catch that and report "not configured".
 */
function configureWebPush(config: VapidConfig): void {
  if (configuredPublicKey === config.publicKey) return;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  configuredPublicKey = config.publicKey;
}

export function isPushConfigured(): boolean {
  return readVapidConfig() !== null;
}

export function getVapidPublicKey(): string | null {
  return readVapidConfig()?.publicKey ?? null;
}

export type SavePushSubscriptionResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeUserAgent(userAgent: string | null): string | null {
  const trimmed = userAgent?.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 512);
}

/**
 * Upserts on the globally unique endpoint. Ownership moves to the user who
 * subscribed most recently: the same browser profile can be used by a second
 * account, and leaving the old `user_id` would deliver the previous user's
 * notifications to the new user's screen.
 */
export async function savePushSubscription({
  userId,
  subscription,
  userAgent,
}: {
  userId: number;
  subscription: unknown;
  userAgent: string | null;
}): Promise<SavePushSubscriptionResult> {
  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { ok: false, error: "Invalid push subscription." };
  }

  const input: PushSubscriptionInput = parsed.data;

  await db
    .insert(pushSubscriptionsTable)
    .values({
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: normalizeUserAgent(userAgent),
    })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: {
        userId,
        p256dh: sql`excluded.p256dh`,
        auth: sql`excluded.auth`,
        userAgent: sql`excluded.user_agent`,
        failureCount: 0,
        lastUsedAt: null,
      },
    });

  return { ok: true };
}

export async function removePushSubscription(
  userId: number,
  endpoint: string
): Promise<number> {
  const deleted = await db
    .delete(pushSubscriptionsTable)
    .where(
      and(
        eq(pushSubscriptionsTable.userId, userId),
        eq(pushSubscriptionsTable.endpoint, endpoint)
      )
    )
    .returning({ id: pushSubscriptionsTable.id });

  return deleted.length;
}

export async function countPushSubscriptionsForUser(
  userId: number
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  return rows[0]?.count ?? 0;
}

export type PushSendSummary = {
  sent: number;
  pruned: number;
  failed: number;
};

function webPushStatusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const statusCode = Reflect.get(error, "statusCode");
  return typeof statusCode === "number" ? statusCode : null;
}

/**
 * Delivers one payload to every subscription owned by `userId`.
 *
 * A single endpoint failure never rejects the whole send: push services answer
 * 404/410 for subscriptions that are gone (those rows are pruned) and other
 * statuses increment `failure_count` so persistently broken endpoints stand
 * out. Returns counts only — no endpoint or key material is logged.
 */
export async function sendPushToUser(
  userId: number,
  payload: unknown
): Promise<PushSendSummary> {
  const summary: PushSendSummary = { sent: 0, pruned: 0, failed: 0 };

  const config = readVapidConfig();
  if (!config) {
    console.warn("[PushNotificationService] send skipped: VAPID not configured");
    return summary;
  }

  const prepared = preparePushPayload(payload);
  if (!prepared.ok) {
    console.warn(`[PushNotificationService] send skipped: ${prepared.error}`);
    return summary;
  }

  try {
    configureWebPush(config);
  } catch (error) {
    console.error(
      "[PushNotificationService] invalid VAPID configuration:",
      error instanceof Error ? error.message : "unknown error"
    );
    return summary;
  }

  const subscriptions = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userId, userId));

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        prepared.json,
        { TTL: 60 }
      );

      summary.sent += 1;
      await db
        .update(pushSubscriptionsTable)
        .set({ lastUsedAt: new Date(), failureCount: 0 })
        .where(eq(pushSubscriptionsTable.id, subscription.id));
    } catch (error) {
      const statusCode = webPushStatusCode(error);
      if (statusCode === 404 || statusCode === 410) {
        summary.pruned += 1;
        await db
          .delete(pushSubscriptionsTable)
          .where(
            and(
              eq(pushSubscriptionsTable.id, subscription.id),
              eq(pushSubscriptionsTable.userId, userId)
            )
          );
        continue;
      }

      summary.failed += 1;
      await db
        .update(pushSubscriptionsTable)
        .set({ failureCount: sql`${pushSubscriptionsTable.failureCount} + 1` })
        .where(
          and(
            eq(pushSubscriptionsTable.id, subscription.id),
            eq(pushSubscriptionsTable.userId, userId)
          )
        );
    }
  }

  console.log("[PushNotificationService] send summary", {
    userId,
    subscriptionCount: subscriptions.length,
    ...summary,
  });

  return summary;
}

/**
 * Per-user "send test" throttle. In-memory and therefore single-instance; a
 * restart resets it, which is acceptable for a manual test button.
 */
const lastPushTestAt = new Map<number, number>();

export type PushTestSlot =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

export function beginPushTest(userId: number, now: number = Date.now()): PushTestSlot {
  const lastSentAt = lastPushTestAt.get(userId) ?? null;
  if (lastSentAt !== null && isPushTestThrottled(lastSentAt, now)) {
    return {
      ok: false,
      retryAfterMs: pushTestRetryAfterMs(lastSentAt, now),
    };
  }

  lastPushTestAt.set(userId, now);
  return { ok: true };
}

export type PushSettingsActionData = {
  success: boolean;
  message: string;
};

function parseSubscriptionJson(raw: FormDataEntryValue | null): unknown {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Handles the `pushSubscribe` / `pushUnsubscribe` / `pushTest` intents for the
 * settings action. The caller has already authenticated `userId`.
 */
export async function handlePushSettingsAction({
  userId,
  formData,
}: {
  userId: number;
  formData: FormData;
}): Promise<PushSettingsActionData> {
  const intent = formData.get("intent");

  if (intent === "pushSubscribe") {
    const saved = await savePushSubscription({
      userId,
      subscription: parseSubscriptionJson(formData.get("subscription")),
      userAgent: formData.get("userAgent")?.toString() ?? null,
    });

    return saved.ok
      ? { success: true, message: "Push notifications enabled on this device." }
      : { success: false, message: saved.error };
  }

  if (intent === "pushUnsubscribe") {
    const endpoint = formData.get("endpoint");
    if (typeof endpoint !== "string" || endpoint.length === 0 || endpoint.length > 2048) {
      return { success: false, message: "Invalid push subscription." };
    }

    const removed = await removePushSubscription(userId, endpoint);
    return {
      success: true,
      message: removed > 0 ? "Push notifications disabled." : "Subscription was already removed.",
    };
  }

  if (intent === "pushTest") {
    if (!isPushConfigured()) {
      return { success: false, message: "Push notifications are not configured." };
    }

    const slot = beginPushTest(userId);
    if (!slot.ok) {
      const seconds = Math.ceil(slot.retryAfterMs / 1000);
      return {
        success: false,
        message: `Please wait ${seconds}s before sending another test notification.`,
      };
    }

    const summary = await sendPushToUser(userId, {
      title: "Sanctuary",
      body: "Push notifications are working.",
      url: "/settings",
    });

    if (summary.sent === 0 && summary.pruned === 0 && summary.failed === 0) {
      return {
        success: false,
        message: "No push subscription found. Enable notifications on this device first.",
      };
    }

    return {
      success: summary.sent > 0,
      message:
        summary.sent > 0
          ? "Test notification sent."
          : "The test notification could not be delivered. Try re-enabling notifications.",
    };
  }

  return { success: false, message: "Unknown action" };
}
