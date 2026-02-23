import React from "react";
import ToastItem from "./ToastItem";
import type { ToastMessage } from "./ToastItem";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      className="fixed top-4 right-4 z-[100] w-full max-w-xs sm:max-w-sm"
      style={{
        top: "calc(var(--safe-area-inset-top) + 1rem)",
        right: "calc(var(--safe-area-inset-right) + 1rem)",
      }}
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
