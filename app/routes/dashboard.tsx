import { useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getAccessibleFeatures } from "~/modules/services/DashboardFeatureAccessService";
import { SparklesIcon } from "@heroicons/react/24/outline";
import FeatureGrid from "~/components/dashboard/FeatureGrid";
import type { DashboardLoaderData } from "~/types/dashboard.types";

export function meta() {
  return [{ title: "Dashboard - Sanctuary" }];
}

export const loader = pageAccessLoader("dashboard", async (user, request) => {
  // Get accessible features for the user
  const features = await getAccessibleFeatures(user.id, user.role === "admin");

  return {
    features,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
});

export default function Dashboard() {
  const loaderData = useLoaderData<DashboardLoaderData>();
  const { features } = loaderData;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10">
              <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base ml-14 max-w-2xl">
            Access all your productivity tools in one place.
          </p>
        </header>

        {/* Features Grid */}
        <FeatureGrid
          features={features}
          title="Your Features"
          subtitle="Click on any feature to get started"
          showEmptyState={true}
        />
      </div>
    </div>
  );
}
