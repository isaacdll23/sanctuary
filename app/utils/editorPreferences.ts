// Editor preferences stored in localStorage
export interface EditorPreferences {
  fontSize: number;
  lineWrapping: boolean;
  tabSize: number;
}

const STORAGE_KEY = "sanctuary_editor_preferences";

const DEFAULT_PREFERENCES: EditorPreferences = {
  fontSize: 14,
  lineWrapping: true,
  tabSize: 2,
};

/**
 * Load editor preferences from localStorage
 * Returns default preferences if none are saved
 */
export function loadEditorPreferences(): EditorPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(stored);
    // Validate and merge with defaults to handle missing keys
    return {
      fontSize: validateFontSize(parsed.fontSize ?? DEFAULT_PREFERENCES.fontSize),
      lineWrapping: typeof parsed.lineWrapping === "boolean" ? parsed.lineWrapping : DEFAULT_PREFERENCES.lineWrapping,
      tabSize: validateTabSize(parsed.tabSize ?? DEFAULT_PREFERENCES.tabSize),
    };
  } catch (error) {
    console.error("Failed to load editor preferences:", error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save editor preferences to localStorage
 */
export function saveEditorPreferences(preferences: EditorPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const validated: EditorPreferences = {
      fontSize: validateFontSize(preferences.fontSize),
      lineWrapping: preferences.lineWrapping,
      tabSize: validateTabSize(preferences.tabSize),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error("Failed to save editor preferences:", error);
  }
}

/**
 * Validate font size is within acceptable bounds
 * Min: 10px, Max: 24px
 */
function validateFontSize(size: number): number {
  const parsed = typeof size === "number" ? size : 14;
  return Math.max(10, Math.min(24, parsed));
}

/**
 * Validate tab size is 2, 4, or 8
 */
function validateTabSize(size: number): number {
  const validSizes = [2, 4, 8];
  return validSizes.includes(size) ? size : 2;
}

export { DEFAULT_PREFERENCES };
