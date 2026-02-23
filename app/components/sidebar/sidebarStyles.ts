export const sidebarItemBaseClasses =
  "flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-150 group relative border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800";

export const sidebarItemActiveClasses =
  "bg-indigo-600 text-white shadow-md border-l-indigo-400 dark:bg-indigo-600 dark:text-white";

export const sidebarItemInactiveClasses =
  "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] border-l-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white";

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
  return `h-6 w-6 flex-shrink-0 ${isCollapsed ? "" : "mr-2.5"} transition-transform duration-150 group-hover:scale-110`;
}
