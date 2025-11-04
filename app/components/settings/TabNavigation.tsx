interface TabNavigationProps {
  activeTab: "profile" | "calendar";
  onTabChange: (tab: "profile" | "calendar") => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8">
      <button
        onClick={() => onTabChange("profile")}
        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
          activeTab === "profile"
            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        Profile
      </button>
      <button
        onClick={() => onTabChange("calendar")}
        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
          activeTab === "calendar"
            ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
            : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        Calendar
      </button>
    </div>
  );
}
