import { useLoaderData } from "react-router";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getGoogleOAuthUrl, isGoogleOAuthConfigured } from "~/modules/auth.server";
import { getUserAccessiblePages } from "~/modules/services/PageAccessService";
import ProfileSettingsSection from "~/components/settings/ProfileSettingsSection";
import CalendarSettingsSection from "~/components/settings/CalendarSettingsSection";
import FeatureSettingsSection from "~/components/settings/FeatureSettingsSection";
import TabNavigation from "~/components/settings/TabNavigation";
import MobileNavigationSettingsSection from "~/components/settings/MobileNavigationSettingsSection";
import { useSettingsTabNavigation } from "~/hooks/useSettingsTabNavigation";
import type { FeatureSetting } from "~/modules/services/FeatureSettingsService";
import {
  getFeatureSettingsForUser,
  handleFeatureSettingsAction,
} from "~/modules/services/FeatureSettingsService";
import { PINNABLE_PAGE_IDS } from "~/modules/navigation";
import { adminNavItem, navItems } from "~/components/navigation/navConfig";
import {
  getNavigationPreferencesForUser,
  handleNavigationPreferencesAction,
} from "~/modules/services/NavigationPreferencesService";

export const meta = () => {
  return [{ title: "Settings" }];
};

const navItemLabelById = new Map(
  [...navItems, adminNavItem].map((item) => [item.pageId, item.label])
);

export const loader = pageAccessLoader("settings", async (user, request) => {
  const { getGoogleCalendarAccount, getCalendarPreferences } = await import(
    "~/modules/services/GoogleCalendarService"
  );

  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const calendarPreferences = await getCalendarPreferences(user.id);
  const googleOAuthEnabled = isGoogleOAuthConfigured();
  const oauthUrl = googleOAuthEnabled ? getGoogleOAuthUrl() : null;

  const [accessiblePages, navigationPreferences] = await Promise.all([
    getUserAccessiblePages(user.id),
    getNavigationPreferencesForUser(user.id),
  ]);

  // Effective pinned tabs: stored order minus pages the user cannot access.
  const accessiblePageSet = new Set(accessiblePages);
  const mobileTabIds = navigationPreferences.mobileTabIds.filter((pageId) =>
    accessiblePageSet.has(pageId)
  );

  return {
    user,
    googleCalendarAccount,
    calendarPreferences,
    oauthUrl,
    googleOAuthEnabled,
    featureSettings: getFeatureSettingsForUser(user),
    accessiblePages,
    mobileTabIds,
  };
});

export const action = pageAccessAction("settings", async (_user, request) => {
  // Clone the request so we can read the body to check intent
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const intent = String(formData.get("intent") || "");

  if (intent.startsWith("profile")) {
    const { handleProfileAction } = await import(
      "~/modules/services/ProfileService"
    );
    return handleProfileAction(request);
  }

  if (intent === "updateFeatureVisibility") {
    return handleFeatureSettingsAction(request);
  }

  if (intent === "updateMobileTabs") {
    return handleNavigationPreferencesAction(request);
  } else if (intent.startsWith("calendar") || intent.startsWith("update") || intent.startsWith("disconnect") || intent.startsWith("manualSync") || intent === "resolveSyncConflict") {
    const isCalendarViewPreference = intent === "updateCalendarPreferences";
    if (!isCalendarViewPreference && !isGoogleOAuthConfigured()) {
      return { success: false, message: "Google Calendar integration is not configured." };
    }
    const { handleGoogleCalendarAction } = await import(
      "~/modules/services/GoogleCalendarService"
    );
    return handleGoogleCalendarAction(request);
  }

  return { success: false, message: "Unknown action" };
});

type User = {
  id: number;
  username: string;
  email: string;
  timeZone: string;
};

type GoogleCalendarAccount = {
  id: string;
  userId: number;
  googleAccountEmail: string;
  googleCalendarId: string;
  isSyncEnabled: number;
  syncDirection: "pull-only" | "push-only" | "bidirectional";
  lastSyncAt: Date | null;
  connectedAt: Date;
  disconnectedAt: Date | null;
};

type CalendarPreferences = {
  id: string;
  userId: number;
  calendarViewStartTime: string;
  calendarViewEndTime: string;
  createdAt: Date;
  updatedAt: Date;
};

type LoaderData = {
  user: User;
  googleCalendarAccount: GoogleCalendarAccount | null;
  calendarPreferences: CalendarPreferences | null;
  oauthUrl: string | null;
  googleOAuthEnabled: boolean;
  featureSettings: FeatureSetting[];
  accessiblePages: string[];
  mobileTabIds: string[];
};

export default function Settings() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, googleCalendarAccount, calendarPreferences, oauthUrl, googleOAuthEnabled, featureSettings, accessiblePages, mobileTabIds } = loaderData;
  const { activeTab, setActiveTab } = useSettingsTabNavigation();

  return (
    <div className="min-h-screen bg-transparent text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "profile" && <ProfileSettingsSection user={user} />}
        {activeTab === "features" && <FeatureSettingsSection settings={featureSettings} />}
        {activeTab === "navigation" && (
          <MobileNavigationSettingsSection
            key={mobileTabIds.join(",")}
            options={PINNABLE_PAGE_IDS.filter((pageId) =>
              accessiblePages.includes(pageId)
            ).map((pageId) => ({
              pageId,
              label: navItemLabelById.get(pageId) ?? pageId,
            }))}
            initialTabIds={mobileTabIds}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarSettingsSection
            googleCalendarAccount={googleCalendarAccount}
            calendarPreferences={calendarPreferences}
            oauthUrl={oauthUrl}
            googleOAuthEnabled={googleOAuthEnabled}
          />
        )}
      </div>
    </div>
  );
}
