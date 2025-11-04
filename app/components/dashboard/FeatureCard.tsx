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

// Color mappings for feature cards
const colorClasses: Record<string, { bg: string; icon: string; border: string; hover: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    hover: "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-950/50",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    hover: "hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md hover:shadow-purple-200 dark:hover:shadow-purple-950/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    hover: "hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-200 dark:hover:shadow-amber-950/50",
  },
  green: {
    bg: "bg-green-50 dark:bg-green-950/20",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    hover: "hover:border-green-300 dark:hover:border-green-700 hover:shadow-md hover:shadow-green-200 dark:hover:shadow-green-950/50",
  },
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    icon: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200 dark:border-indigo-800",
    hover: "hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-200 dark:hover:shadow-indigo-950/50",
  },
  gray: {
    bg: "bg-gray-50 dark:bg-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-700",
    hover: "hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md hover:shadow-gray-200 dark:hover:shadow-gray-900/50",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    hover: "hover:border-red-300 dark:hover:border-red-700 hover:shadow-md hover:shadow-red-200 dark:hover:shadow-red-950/50",
  },
};

export default function FeatureCard({ feature }: FeatureCardProps) {
  const IconComponent = iconMap[feature.icon];
  const colors = colorClasses[feature.color];

  return (
    <Link
      to={feature.route}
      className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${colors.bg} ${colors.border} ${colors.hover}`}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Icon Container */}
        <div className="mb-4">
          <div className={`inline-flex p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
            {IconComponent && <IconComponent className={`w-6 h-6 ${colors.icon}`} />}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow">
          {feature.description}
        </p>

        {/* Footer with arrow */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
            Open
          </span>
          <ArrowRightIcon className={`w-4 h-4 ${colors.icon} transform group-hover:translate-x-1 transition-transform duration-200`} />
        </div>
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10" />
    </Link>
  );
}
