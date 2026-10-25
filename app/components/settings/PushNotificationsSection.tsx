import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { decodeBase64UrlToUint8Array } from "~/modules/push";

interface PushNotificationsSectionProps {
  /** Base64url VAPID public key, or null when the server has no keys. */
  vapidPublicKey: string | null;
  pushConfigured: boolean;
  /** Rows stored server-side for this user (all devices). */
  pushSubscriptionCount: number;
}

type PushActionResult = { success: boolean; message: string };

type SupportState =
  | { kind: "checking" }
  | { kind: "unsupported"; reason: string }
  | { kind: "ready" };

type SubscriptionState =
  | { kind: "unknown" }
  | { kind: "none" }
  | { kind: "subscribed"; endpoint: string };

type StatusMessage = { tone: "success" | "error"; message: string };

function isPushActionResult(value: unknown): value is PushActionResult {
  if (typeof value !== "object" || value === null) return false;
  const success = Reflect.get(value, "success");
  const message = Reflect.get(value, "message");
  return typeof success === "boolean" && typeof message === "string";
}

function browserSupportsPush(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isIosDevice(): boolean {
  const userAgent = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  // iPadOS 13+ reports a desktop Safari user agent.
  return /Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1;
}

function isStandalonePwa(): boolean {
  // Safari exposes `navigator.standalone`; other browsers use display-mode.
  if (Reflect.get(navigator, "standalone") === true) return true;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Push notification preferences for the current device. Every state is derived
 * from the browser on mount and refreshed after an action; the buttons are
 * plain `<button>`s so the flow is keyboard accessible.
 */
export default function PushNotificationsSection({
  vapidPublicKey,
  pushConfigured,
  pushSubscriptionCount,
}: PushNotificationsSectionProps) {
  const fetcher = useFetcher<PushActionResult>();
  const [support, setSupport] = useState<SupportState>({ kind: "checking" });
  const [subscription, setSubscription] = useState<SubscriptionState>({
    kind: "unknown",
  });
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [needsHomeScreenInstall, setNeedsHomeScreenInstall] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!browserSupportsPush()) {
      setSupport({
        kind: "unsupported",
        reason:
          "This browser does not support Web Push. Try Chrome, Edge, Firefox, or an installed Safari web app on iOS 16.4+.",
      });
      return;
    }

    setSupport({ kind: "ready" });
    setPermission(Notification.permission);
    setNeedsHomeScreenInstall(isIosDevice() && !isStandalonePwa());

    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((existing) => {
        if (cancelled) return;
        setSubscription(
          existing
            ? { kind: "subscribed", endpoint: existing.endpoint }
            : { kind: "none" }
        );
      })
      .catch(() => {
        if (!cancelled) setSubscription({ kind: "none" });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  // Re-read the browser subscription after the server confirms a change.
  useEffect(() => {
    if (!isPushActionResult(fetcher.data)) return;
    setRefreshToken((token) => token + 1);
  }, [fetcher.data]);

  const isPending = fetcher.state !== "idle";
  const actionResult = isPushActionResult(fetcher.data) ? fetcher.data : null;
  const visibleStatus: StatusMessage | null =
    status ??
    (actionResult
      ? {
          tone: actionResult.success ? "success" : "error",
          message: actionResult.message,
        }
      : null);

  async function handleSubscribe() {
    if (!vapidPublicKey) {
      setStatus({
        tone: "error",
        message: "Push notifications are not configured on this server.",
      });
      return;
    }

    setStatus(null);
    // iOS requires requestPermission() to run inside the user gesture, so it is
    // invoked synchronously before the first `await`.
    const permissionRequest = Notification.requestPermission();

    try {
      const granted = await permissionRequest;
      setPermission(granted);
      if (granted !== "granted") {
        setStatus({
          tone: "error",
          message:
            "Notification permission was not granted. Allow notifications in your browser settings and try again.",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscribed =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeBase64UrlToUint8Array(vapidPublicKey),
        }));
      const json = subscribed.toJSON();

      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        setStatus({
          tone: "error",
          message: "The browser returned an incomplete push subscription.",
        });
        return;
      }

      const formData = new FormData();
      formData.set("intent", "pushSubscribe");
      formData.set("subscription", JSON.stringify(json));
      fetcher.submit(formData, { method: "post" });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not enable push notifications on this device.",
      });
    }
  }

  async function handleUnsubscribe() {
    setStatus(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const endpoint =
        existing?.endpoint ??
        (subscription.kind === "subscribed" ? subscription.endpoint : null);

      if (!endpoint) {
        setSubscription({ kind: "none" });
        setStatus({
          tone: "success",
          message: "Push notifications are disabled on this device.",
        });
        return;
      }

      const formData = new FormData();
      formData.set("intent", "pushUnsubscribe");
      formData.set("endpoint", endpoint);
      fetcher.submit(formData, { method: "post" });
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not disable push notifications on this device.",
      });
    }
  }

  function handleSendTest() {
    setStatus(null);
    const formData = new FormData();
    formData.set("intent", "pushTest");
    fetcher.submit(formData, { method: "post" });
  }

  const isSubscribed = subscription.kind === "subscribed";
  const isBlocked = permission === "denied";

  return (
    <section aria-labelledby="push-notifications-heading">
      <h2 id="push-notifications-heading" className="text-xl font-semibold mb-2">
        Push notifications
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Get Sanctuary notifications on this device through the installed web
        app. Notifications are never silent: the browser always shows them.
      </p>

      {visibleStatus && (
        <p
          role={visibleStatus.tone === "error" ? "alert" : "status"}
          className={`mb-4 text-sm ${
            visibleStatus.tone === "error" ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {visibleStatus.message}
        </p>
      )}

      {support.kind === "checking" && (
        <p role="status" className="text-sm text-gray-500 dark:text-gray-400">
          Checking this browser…
        </p>
      )}

      {support.kind === "unsupported" && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 text-sm text-gray-600 dark:text-gray-300">
          <p>{support.reason}</p>
        </div>
      )}

      {support.kind === "ready" && (
        <div className="space-y-4">
          {!pushConfigured && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
              Push notifications are not configured on this server, so this
              device cannot subscribe yet.
            </p>
          )}

          {needsHomeScreenInstall && (
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-4 text-sm text-gray-200">
              <p className="mb-2 font-medium">
                Add Sanctuary to your Home Screen first
              </p>
              <p className="mb-2 text-gray-300">
                iOS only delivers Web Push to web apps added to the Home Screen
                (iOS 16.4+). In Safari:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-300">
                <li>Tap the Share button.</li>
                <li>Choose “Add to Home Screen”.</li>
                <li>Open Sanctuary from the Home Screen icon.</li>
                <li>Return to Settings → Notifications to enable push.</li>
              </ol>
            </div>
          )}

          {isBlocked && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              Notifications are blocked for this site. Re-enable them in your
              browser’s site settings, then reload this page.
            </p>
          )}

          <dl className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Server configuration
              </dt>
              <dd>{pushConfigured ? "Configured" : "Not configured"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Permission
              </dt>
              <dd>{permission}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                This device
              </dt>
              <dd>
                {isSubscribed
                  ? "Subscribed"
                  : subscription.kind === "unknown"
                    ? "Checking…"
                    : "Not subscribed"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">
                Subscribed devices
              </dt>
              <dd>{pushSubscriptionCount}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            {!isSubscribed && (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={
                  !pushConfigured ||
                  isPending ||
                  needsHomeScreenInstall ||
                  isBlocked
                }
                className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Enabling…" : "Enable notifications"}
              </button>
            )}

            {isSubscribed && (
              <>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={!pushConfigured || isPending}
                  className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition-colors hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Sending…" : "Send test notification"}
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={isPending}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Disable on this device
                </button>
              </>
            )}
          </div>

          {isSubscribed && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Test notifications are limited to one per 10 seconds.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
