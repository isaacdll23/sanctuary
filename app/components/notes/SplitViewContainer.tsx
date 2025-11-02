import { useRef, useState, useEffect } from "react";

interface SplitViewContainerProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  dividerPosition?: number; // percentage (0-100), default 50
  showRightPane?: boolean; // toggle right pane visibility
}

export function SplitViewContainer({
  leftPane,
  rightPane,
  dividerPosition = 50,
  showRightPane = true,
}: SplitViewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResponsive, setIsResponsive] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768; // md breakpoint
    }
    return false;
  });

  // Handle window resize to detect responsive mode
  useEffect(() => {
    const handleResize = () => {
      setIsResponsive(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isResponsive) {
    // Stack vertically on smaller screens
    return (
      <div
        ref={containerRef}
        className="flex flex-col h-full w-full gap-4"
      >
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
          {leftPane}
        </div>
        <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
          {rightPane}
        </div>
      </div>
    );
  }

  // Split view horizontally on larger screens (fixed, not draggable)
  return (
    <div
      ref={containerRef}
      className="flex h-full w-full gap-0 relative"
    >
      {/* Left Pane */}
      <div
        style={{
          width: showRightPane ? `${dividerPosition}%` : "100%",
        }}
        className="flex-shrink-0 overflow-hidden"
      >
        {leftPane}
      </div>

      {/* Divider */}
      {showRightPane && (
        <div
          className="w-1 flex-shrink-0 bg-gray-300 dark:bg-gray-600 transition-colors duration-150"
          role="separator"
          aria-label="Divider between editor and preview"
          aria-orientation="vertical"
        />
      )}

      {/* Right Pane */}
      {showRightPane && (
        <div
          style={{
            width: `${100 - dividerPosition}%`,
          }}
          className="flex-grow overflow-hidden"
        >
          {rightPane}
        </div>
      )}
    </div>
  );
}
