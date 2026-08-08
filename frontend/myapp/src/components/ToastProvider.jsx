import React, { createContext, useContext, useState } from "react";
import "./shared.css";
import { notifyError, notifyInfo, notifySuccess } from "../utils/toast.js";

const ToastContext = createContext(null);
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, type }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3500);
  };
  return <ToastContext.Provider value={{ showToast }}>
    {children}<div className="toast-stack">{toasts.map((toast) => <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>)}</div>
  </ToastContext.Provider>;
};
export const useToast = () => ({
  showToast: (message, type = "success") => {
    if (type === "error") return notifyError(message);
    if (type === "info") return notifyInfo(message);
    return notifySuccess(message);
  },
});
