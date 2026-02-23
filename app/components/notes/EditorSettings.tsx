import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";
import type { EditorPreferences } from "~/utils/editorPreferences";

interface EditorSettingsProps {
  preferences: EditorPreferences;
  onFontSizeChange: (size: number) => void;
  onTabSizeChange: (size: 2 | 4 | 8) => void;
  onLineWrappingChange: (enabled: boolean) => void;
}

export function EditorSettings({
  preferences,
  onFontSizeChange,
  onTabSizeChange,
  onLineWrappingChange,
}: EditorSettingsProps) {
  const handleFontSizeIncrease = () => {
    onFontSizeChange(Math.min(24, preferences.fontSize + 1));
  };

  const handleFontSizeDecrease = () => {
    onFontSizeChange(Math.max(10, preferences.fontSize - 1));
  };

  const handleTabSizeChange = (newSize: 2 | 4 | 8) => {
    onTabSizeChange(newSize);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
      {/* Font Size Control */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="font-size"
          className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          Font Size
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleFontSizeDecrease}
            disabled={preferences.fontSize <= 10}
            title="Decrease font size"
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
          >
            <MinusSmallIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <span
            id="font-size"
            className="text-sm font-mono text-gray-900 dark:text-gray-100 min-w-[28px] text-center"
          >
            {preferences.fontSize}px
          </span>
          <button
            type="button"
            onClick={handleFontSizeIncrease}
            disabled={preferences.fontSize >= 24}
            title="Increase font size"
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
          >
            <PlusSmallIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tab Size Control */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="tab-size"
          className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide"
        >
          Tab Size
        </label>
        <select
          id="tab-size"
          value={preferences.tabSize}
          onChange={(e) => handleTabSizeChange(parseInt(e.target.value) as 2 | 4 | 8)}
          className="text-sm px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
      </div>

      {/* Line Wrapping Toggle */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Wrap
        </label>
        <button
          type="button"
          onClick={() => onLineWrappingChange(!preferences.lineWrapping)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 ${
            preferences.lineWrapping
              ? "bg-gray-900 text-white dark:bg-gray-800 dark:text-gray-100"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
          title={
            preferences.lineWrapping
              ? "Disable line wrapping"
              : "Enable line wrapping"
          }
        >
          {preferences.lineWrapping ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
