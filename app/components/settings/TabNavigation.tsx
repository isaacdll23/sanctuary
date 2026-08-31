interface TabNavigationProps {
  activeTab: "profile" | "features" | "calendar";
  onTabChange: (tab: "profile" | "features" | "calendar") => void;
}

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "features", label: "Features" },
  { id: "calendar", label: "Calendar" },
] as const;

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
