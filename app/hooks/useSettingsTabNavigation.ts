import { useState } from "react";

type SettingsTab = "profile" | "calendar";

interface UseSettingsTabNavigationReturn {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

/**
 * Hook for managing settings page tab navigation state
 */
export function useSettingsTabNavigation(): UseSettingsTabNavigationReturn {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  return {
    activeTab,
    setActiveTab,
  };
}
