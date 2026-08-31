import { useEffect, useState } from "react";

/**
 * Fixed banner shown while the device is offline. Positioned below the iOS
 * status bar area so it stays clear of the notch/dynamic island.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-40 bg-gray-800 text-gray-200 text-sm text-center py-1.5 px-3 border-b border-gray-700"
      style={{ top: "var(--safe-area-inset-top)" }}
    >
      You're offline — Sanctuary requires an internet connection
    </div>
  );
}
