import React, { createContext, useContext, useState } from "react";
import "./shared.css";

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
export const useToast = () => useContext(ToastContext);
