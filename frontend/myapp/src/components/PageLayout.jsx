import React from "react";
import "./shared.css";

export default function PageLayout({ title, children, className = "" }) {
  return (
    <div className={`page-layout ${className}`}>
      <header className="page-band">
        <div className="page-container">
          <h1>{title}</h1>
        </div>
      </header>
      <main className="page-container page-content">{children}</main>
    </div>
  );
}
