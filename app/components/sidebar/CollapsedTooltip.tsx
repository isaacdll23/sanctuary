import { useState } from "react";

interface CollapsedTooltipProps {
  label: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}

export default function CollapsedTooltip({
  label,
  children,
  isCollapsed,
}: CollapsedTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isCollapsed) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {children}
      <div
        className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50"
        role="tooltip"
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
      </div>
    </div>
  );
}
