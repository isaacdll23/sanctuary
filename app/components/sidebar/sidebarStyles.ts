export const sidebarItemBaseClasses =
  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 group relative border-l-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900";

export const sidebarItemActiveClasses =
  "bg-gray-800 text-gray-100 border-l-gray-300";

export const sidebarItemInactiveClasses =
  "text-gray-400 hover:bg-gray-900 hover:text-gray-200 border-l-transparent";

export function getSidebarItemClasses({
  isActive,
  isCollapsed,
  className,
}: {
  isActive: boolean;
  isCollapsed?: boolean;
  className?: string;
}) {
  return [
    sidebarItemBaseClasses,
    isCollapsed ? "justify-center" : "",
    isActive ? sidebarItemActiveClasses : sidebarItemInactiveClasses,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getSidebarItemIconClasses(isCollapsed?: boolean) {
  return `h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-2"} transition-colors duration-150`;
}
