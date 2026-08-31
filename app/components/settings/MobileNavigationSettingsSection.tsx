import { useState } from "react";
import { useFetcher } from "react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { MOBILE_TAB_LIMIT } from "~/modules/navigation";

interface MobileTabOption {
  pageId: string;
  label: string;
}

interface MobileNavigationSettingsSectionProps {
  /** Pinnable pages the user can actually access. */
  options: readonly MobileTabOption[];
  /** Current pinned tabs (ordered, already intersected with access). */
  initialTabIds: readonly string[];
}

interface NavigationActionFailure {
  success: false;
  message: string;
}

function isNavigationActionFailure(
  data: unknown
): data is NavigationActionFailure {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    data.success === false &&
    "message" in data &&
    typeof data.message === "string"
  );
}

export default function MobileNavigationSettingsSection({
  options,
  initialTabIds,
}: MobileNavigationSettingsSectionProps) {
  const fetcher = useFetcher();
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialTabIds.filter((pageId) =>
      options.some((option) => option.pageId === pageId)
    )
  );

  const isPending = fetcher.state !== "idle";
  const isFull = selectedIds.length >= MOBILE_TAB_LIMIT;

  function toggleTab(pageId: string) {
    setSelectedIds((current) =>
      current.includes(pageId)
        ? current.filter((id) => id !== pageId)
        : current.length < MOBILE_TAB_LIMIT
          ? [...current, pageId]
          : current
    );
  }

  function moveTab(pageId: string, direction: -1 | 1) {
    setSelectedIds((current) => {
      const index = current.indexOf(pageId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section aria-labelledby="mobile-navigation-settings-heading">
      <h2
        id="mobile-navigation-settings-heading"
        className="text-xl font-semibold mb-2"
      >
        Mobile navigation
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Choose up to {MOBILE_TAB_LIMIT} pages pinned to the bottom bar on
        mobile. Everything else stays in the “More” sheet.
      </p>

      {isNavigationActionFailure(fetcher.data) && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {fetcher.data.message}
        </p>
      )}
      {fetcher.data &&
        typeof fetcher.data === "object" &&
        "success" in fetcher.data &&
        fetcher.data.success === true && (
          <p role="status" className="mb-4 text-sm text-emerald-400">
            {String(
              (fetcher.data as { message?: string }).message ?? "Saved."
            )}
          </p>
        )}

      <fetcher.Form method="post" className="max-w-xl">
        <input type="hidden" name="intent" value="updateMobileTabs" />
        <input type="hidden" name="tabIds" value={selectedIds.join(",")} />

        <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.pageId);
            const order = selectedIds.indexOf(option.pageId) + 1;
            const isDisabled = !isSelected && isFull;

            return (
              <li
                key={option.pageId}
                className="flex items-center justify-between gap-4 p-4"
              >
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTab(option.pageId)}
                    disabled={isDisabled || isPending}
                    className="h-4 w-4 rounded border-gray-300 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                  {isSelected && (
                    <span className="rounded bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      Tab {order}
                    </span>
                  )}
                </label>

                {isSelected && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveTab(option.pageId, -1)}
                      disabled={order === 1 || isPending}
                      aria-label={`Move ${option.label} tab up`}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                      <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTab(option.pageId, 1)}
                      disabled={order === selectedIds.length || isPending}
                      aria-label={`Move ${option.label} tab down`}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    >
                      <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || selectedIds.length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save tabs"}
          </button>
          <p aria-live="polite" className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.length}/{MOBILE_TAB_LIMIT} tabs selected
          </p>
        </div>
      </fetcher.Form>
    </section>
  );
}
