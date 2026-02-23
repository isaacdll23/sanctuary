import React, { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastItemProps extends ToastMessage {
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const toastStyles: Record<ToastType, string> = {
  success:
    "bg-emerald-500/15 border-emerald-500/35 text-emerald-100 backdrop-blur-sm",
  error: "bg-red-500/15 border-red-500/35 text-red-100 backdrop-blur-sm",
  info: "bg-gray-700/55 border-gray-600 text-gray-100 backdrop-blur-sm",
  warning:
    "bg-amber-500/15 border-amber-500/35 text-amber-100 backdrop-blur-sm",
};

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  message,
  type,
  duration = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for animation to complete before removing
      setTimeout(() => onDismiss(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const Icon = icons[type];

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); // Wait for animation
  };

  return (
    <div
      className={`
        flex items-center p-3 mb-2.5 rounded-md shadow-md
        border transition-all duration-300 ease-in-out
        ${toastStyles[type]}
        ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        }
      `}
      role="alert"
    >
      <Icon className="h-5 w-5 mr-2.5 flex-shrink-0" />
      <div className="flex-grow mr-3 text-sm">{message}</div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-gray-500/70"
        aria-label="Dismiss toast"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ToastItem;
