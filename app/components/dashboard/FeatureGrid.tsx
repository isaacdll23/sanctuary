import { SparklesIcon } from "@heroicons/react/24/outline";
import FeatureCard from "./FeatureCard";
import type { FeatureCard as FeatureCardType } from "~/types/dashboard.types";

interface FeatureGridProps {
  features: FeatureCardType[];
  title?: string;
  subtitle?: string;
  showEmptyState?: boolean;
}

export default function FeatureGrid({
  features,
  title = "Your Features",
  subtitle,
  showEmptyState = true,
}: FeatureGridProps) {
  if (features.length === 0 && showEmptyState) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <SparklesIcon className="h-6 w-6 text-gray-400 dark:text-gray-600" />
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Accessible Features
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Your administrator hasn't granted you access to any features yet. Contact them to request access.
        </p>
      </div>
    );
  }

  if (features.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <div>
      {/* Header */}
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
}
