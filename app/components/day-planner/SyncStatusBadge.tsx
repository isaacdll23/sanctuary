import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface SyncStatusBadgeProps {
  status: "synced" | "pending" | "conflict" | undefined;
  conflictResolution?: string | null;
  tooltipText?: string;
}

export default function SyncStatusBadge({
  status,
  conflictResolution,
  tooltipText,
}: SyncStatusBadgeProps) {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case "synced":
        return {
          icon: CheckCircleIcon,
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          label: "Synced",
        };
      case "pending":
        return {
          icon: ClockIcon,
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          label: "Pending",
        };
      case "conflict":
        return {
          icon: ExclamationTriangleIcon,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          label: "Conflict",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="group relative inline-flex">
      <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bgColor}`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>

      {(tooltipText || conflictResolution) && (
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap pointer-events-none transition-opacity z-10">
          {tooltipText || `Resolution: ${conflictResolution}`}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}
