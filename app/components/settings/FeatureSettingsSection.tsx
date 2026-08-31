import { useFetcher } from "react-router";
import type { FeatureSetting } from "~/modules/services/FeatureSettingsService";

interface FeatureSettingsSectionProps {
  settings: FeatureSetting[];
}

interface FeatureActionFailure {
  success: false;
  message: string;
}

function isFeatureActionFailure(data: unknown): data is FeatureActionFailure {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    data.success === false &&
    "message" in data &&
    typeof data.message === "string"
  );
}

export default function FeatureSettingsSection({
  settings,
}: FeatureSettingsSectionProps) {
  const fetcher = useFetcher();

  const pendingFeatureId =
    fetcher.state !== "idle"
      ? String(fetcher.formData?.get("featureId") ?? "")
      : "";

  return (
    <section aria-labelledby="features-settings-heading">
      <h2 id="features-settings-heading" className="text-xl font-semibold mb-2">
        Features
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Turn optional features on or off for your account. Disabled features are
        hidden from navigation and cannot be opened by URL. Your choices take
        precedence over the platform default.
      </p>

      {isFeatureActionFailure(fetcher.data) && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {fetcher.data.message}
        </p>
      )}

      <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        {settings.map((feature) => {
          const isPending =
            fetcher.state !== "idle" && pendingFeatureId === feature.id;
          const nextOverride = feature.isEnabled ? "disabled" : "enabled";

          return (
            <li
              key={feature.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </span>
                  {feature.isOverridden && (
                    <span className="rounded bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
              <fetcher.Form method="post">
                <input
                  type="hidden"
                  name="intent"
                  value="updateFeatureVisibility"
                />
                <input type="hidden" name="featureId" value={feature.id} />
                <input
                  type="hidden"
                  name="override"
                  value={nextOverride}
                />
                <button
                  type="submit"
                  role="switch"
                  aria-checked={feature.isEnabled}
                  aria-label={
                    feature.isEnabled
                      ? `Hide ${feature.title}`
                      : `Show ${feature.title}`
                  }
                  disabled={isPending}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-60 ${
                    feature.isEnabled
                      ? "bg-indigo-600"
                      : "bg-gray-600 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      feature.isEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </fetcher.Form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
