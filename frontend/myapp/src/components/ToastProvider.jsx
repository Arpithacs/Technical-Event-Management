import React from "react";
import { Toaster } from "react-hot-toast";
import "./shared.css";

export const ToastProvider = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
        },
        success: { iconTheme: { primary: "var(--color-success)", secondary: "#fff" } },
        error: { iconTheme: { primary: "var(--color-error)", secondary: "#fff" } },
      }}
    />
  </>
);
