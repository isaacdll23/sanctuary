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
  success: "bg-green-500 border-green-600",
  error: "bg-red-500 border-red-600",
  info: "bg-blue-500 border-blue-600",
  warning: "bg-yellow-500 border-yellow-600",
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
        flex items-center p-4 mb-3 rounded-md shadow-lg text-white
        border-l-4 transition-all duration-300 ease-in-out
        ${toastStyles[type]}
        ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        }
      `}
      role="alert"
    >
      <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
      <div className="flex-grow mr-4">{message}</div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Dismiss toast"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ToastItem;
