import { useRef, useState, useEffect, useCallback } from "react";

interface SplitViewContainerProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  dividerPosition?: number; // percentage (0-100)
  onDividerPositionChange?: (position: number) => void;
  storageKey?: string; // localStorage key for persisting divider position
}

export function SplitViewContainer({
  leftPane,
  rightPane,
  dividerPosition = 50,
  onDividerPositionChange,
  storageKey = "splitViewDividerPosition",
}: SplitViewContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [currentPosition, setCurrentPosition] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      return saved ? parseInt(saved) : dividerPosition;
    }
    return dividerPosition;
  });
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

  // Handle divider dragging
  const handleMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain position between 20% and 80%
      const constrainedPosition = Math.max(20, Math.min(80, newPosition));

      setCurrentPosition(constrainedPosition);
      if (onDividerPositionChange) {
        onDividerPositionChange(constrainedPosition);
      }

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, String(constrainedPosition));
      }
    },
    [onDividerPositionChange, storageKey]
  );

  useEffect(() => {
    if (isDraggingRef.current) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "auto";
        document.body.style.userSelect = "auto";
      };
    }
  }, [handleMouseMove, handleMouseUp]);

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

  // Split view horizontally on larger screens
  return (
    <div
      ref={containerRef}
      className="flex h-full w-full gap-0 relative"
    >
      {/* Left Pane */}
      <div
        style={{
          width: `${currentPosition}%`,
          minWidth: "200px",
        }}
        className="flex-shrink-0 overflow-hidden"
      >
        {leftPane}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 flex-shrink-0 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 cursor-col-resize transition-colors duration-150 active:bg-gray-500 dark:active:bg-gray-400"
        role="separator"
        aria-label="Resize editor and preview"
        aria-orientation="vertical"
      />

      {/* Right Pane */}
      <div
        style={{
          width: `${100 - currentPosition}%`,
          minWidth: "200px",
        }}
        className="flex-grow overflow-hidden"
      >
        {rightPane}
      </div>
    </div>
  );
}
