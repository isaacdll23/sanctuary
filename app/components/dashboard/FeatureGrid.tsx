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
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-800 bg-gray-900">
            <SparklesIcon className="h-6 w-6 text-gray-500" />
          </div>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-100">
          No Accessible Features
        </h3>
        <p className="mx-auto max-w-md text-sm text-gray-400">
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
          <h2 className="mb-1.5 text-xl font-semibold text-gray-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400">
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
