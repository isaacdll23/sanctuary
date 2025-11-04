import { useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getGoogleOAuthUrl } from "~/modules/auth.server";
import ProfileSettingsSection from "~/components/settings/ProfileSettingsSection";
import CalendarSettingsSection from "~/components/settings/CalendarSettingsSection";
import TabNavigation from "~/components/settings/TabNavigation";
import { useSettingsTabNavigation } from "~/hooks/useSettingsTabNavigation";

export function meta() {
  return [{ title: "Settings" }];
}

export const loader = pageAccessLoader("settings", async (user, request) => {
  const { getGoogleCalendarAccount, getCalendarPreferences } = await import(
    "~/modules/services/GoogleCalendarService"
  );

  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const calendarPreferences = await getCalendarPreferences(user.id);
  const oauthUrl = getGoogleOAuthUrl();

  return {
    user,
    googleCalendarAccount,
    calendarPreferences,
    oauthUrl,
  };
});

export const action = async ({ request }: any) => {
  // Clone the request so we can read the body to check intent
  const clonedRequest = request.clone();
  const formData = await clonedRequest.formData();
  const intent = formData.get("intent");

  if (intent?.startsWith("profile")) {
    const { handleProfileAction } = await import(
      "~/modules/services/ProfileService"
    );
    return handleProfileAction(request);
  } else if (intent?.startsWith("calendar") || intent?.startsWith("update") || intent?.startsWith("disconnect") || intent?.startsWith("manualSync") || intent === "resolveSyncConflict") {
    const { handleGoogleCalendarAction } = await import(
      "~/modules/services/GoogleCalendarService"
    );
    return handleGoogleCalendarAction(request);
  }

  return { success: false, message: "Unknown action" };
};

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
  oauthUrl: string;
};

export default function Settings() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, googleCalendarAccount, calendarPreferences, oauthUrl } = loaderData;
  const { activeTab, setActiveTab } = useSettingsTabNavigation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "profile" && <ProfileSettingsSection user={user} />}
        {activeTab === "calendar" && (
          <CalendarSettingsSection
            googleCalendarAccount={googleCalendarAccount}
            calendarPreferences={calendarPreferences}
            oauthUrl={oauthUrl}
          />
        )}
      </div>
    </div>
  );
}
