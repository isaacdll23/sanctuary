import React, { createContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import ToastContainer from "~/components/toast/ToastContainer";
import type { ToastMessage, ToastType } from "~/components/toast/ToastItem";

interface ToastContextType {
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType, duration?: number) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prevToasts) => [
        ...prevToasts,
        { id, message, type, duration },
      ]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};
