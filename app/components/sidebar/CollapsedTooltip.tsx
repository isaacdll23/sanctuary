import { useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CollapsedTooltipProps {
  label: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
}

/**
 * Labels an icon-only nav item when the sidebar is collapsed. The tooltip is
 * portaled to `document.body` and positioned with `position: fixed` so the
 * nav's `overflow-y-auto` container cannot clip it.
 */
export default function CollapsedTooltip({
  label,
  children,
  isCollapsed,
}: CollapsedTooltipProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  if (!isCollapsed) {
    return <>{children}</>;
  }

  function showTooltip() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  function hideTooltip() {
    setPosition(null);
  }

  return (
    <div
      ref={anchorRef}
      className="relative"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {position &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              transform: "translateY(-50%)",
            }}
            className="z-50 whitespace-nowrap rounded-md bg-gray-700 px-2 py-1 text-sm font-medium text-white shadow-md pointer-events-none"
          >
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-700" />
          </div>,
          document.body
        )}
    </div>
  );
}
