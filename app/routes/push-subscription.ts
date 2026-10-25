import type { Route } from "./+types/push-subscription";
import { getUserFromSession } from "~/modules/auth.server";
import { pushSubscriptionSchema } from "~/modules/push";
import { savePushSubscription } from "~/modules/services/PushNotificationService";

/**
 * Session-authenticated endpoint the service worker calls when the browser
 * rotates a push subscription (`pushsubscriptionchange`). Returns status codes
 * only; no subscription data is echoed back.
 */

function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export async function loader(): Promise<Response> {
  return methodNotAllowed();
}

export async function action({ request }: Route.ActionArgs): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed();

  let userId: number;
  try {
    const user = await getUserFromSession(request);
    userId = user.id;
  } catch {
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const saved = await savePushSubscription({
    userId,
    subscription: parsed.data,
    userAgent: request.headers.get("user-agent"),
  });

  return saved.ok
    ? new Response(null, { status: 204 })
    : new Response(null, { status: 400 });
}
