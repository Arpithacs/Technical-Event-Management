import React from "react";
import "./shared.css";
export default function ConfirmModal({ open, action, itemName, onConfirm, onClose }) {
  if (!open) return null;
  return <div className="confirm-backdrop" role="dialog" aria-modal="true"><div className="confirm-modal">
    <h2>Confirm action</h2><p>Are you sure you want to {action} <strong>{itemName}</strong>? This cannot be undone.</p>
    <div><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="delete-btn" onClick={onConfirm}>Confirm</button></div>
  </div></div>;
}
