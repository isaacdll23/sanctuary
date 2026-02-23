import { Link } from "react-router";
import {
  CheckCircleIcon,
  CalendarIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CommandLineIcon,
  Cog8ToothIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import type { FeatureCard as FeatureCardType } from "~/types/dashboard.types";

interface FeatureCardProps {
  feature: FeatureCardType;
}

// Map icon names to actual icon components
const iconMap: Record<string, React.ElementType> = {
  CheckCircleIcon,
  CalendarIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  CommandLineIcon,
  Cog8ToothIcon,
  ShieldCheckIcon,
};

export default function FeatureCard({ feature }: FeatureCardProps) {
  const IconComponent = iconMap[feature.icon];

  return (
    <Link
      to={feature.route}
      className="group relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/70 transition-all duration-150 hover:border-gray-700 hover:bg-gray-900"
    >
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <div className="inline-flex rounded-md border border-gray-800 bg-gray-900 px-3 py-3">
            {IconComponent && (
              <IconComponent className="h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-100" />
            )}
          </div>
        </div>

        <h3 className="mb-2 text-base font-semibold text-gray-100 transition-colors group-hover:text-white">
          {feature.title}
        </h3>

        <p className="mb-6 flex-grow text-sm text-gray-400">
          {feature.description}
        </p>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Open
          </span>
          <ArrowRightIcon className="h-4 w-4 text-gray-500 transition-all duration-150 group-hover:translate-x-1 group-hover:text-gray-300" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 bg-gradient-to-br from-white/[0.02] to-transparent" />
    </Link>
  );
}
