import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_REASONING_EFFORT } from "~/modules/assistant/conversation";
import {
  loadReasoningEffort,
  saveReasoningEffort,
} from "./assistantPreferences";

const STORAGE_KEY = "sanctuary_assistant_reasoning_effort";

interface FakeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/**
 * Installs a minimal `window`/`localStorage` so the browser code paths can run
 * under `node:test`, and returns a restore function so each test cleans up.
 */
function withBrowserStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;

  const storage: FakeStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };

  Object.defineProperty(globalThis, "window", {
    value: {},
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });

  return {
    store,
    restore() {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: originalStorage,
        configurable: true,
      });
    },
  };
}

/** Runs a body with `window` undefined to emulate the server render. */
function withoutWindow(body: () => void) {
  const originalWindow = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    value: undefined,
    configurable: true,
  });
  try {
    body();
  } finally {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
    });
  }
}

describe("assistant reasoning preferences", () => {
  it("returns the default when there is no window (server render)", () => {
    withoutWindow(() => {
      assert.equal(loadReasoningEffort(), DEFAULT_REASONING_EFFORT);
    });
  });

  it("reads a stored valid effort", () => {
    const { restore } = withBrowserStorage({ [STORAGE_KEY]: "high" });
    try {
      assert.equal(loadReasoningEffort(), "high");
    } finally {
      restore();
    }
  });

  it("falls back to the default for a corrupt stored value", () => {
    const { restore } = withBrowserStorage({ [STORAGE_KEY]: "turbo" });
    try {
      assert.equal(loadReasoningEffort(), DEFAULT_REASONING_EFFORT);
    } finally {
      restore();
    }
  });

  it("persists a valid effort", () => {
    const { store, restore } = withBrowserStorage();
    try {
      saveReasoningEffort("low");
      assert.equal(store.get(STORAGE_KEY), "low");
    } finally {
      restore();
    }
  });
});
