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
      className="toast-offset fixed inset-x-3 z-[100] w-auto max-w-none md:inset-x-auto md:w-full md:max-w-sm"
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
