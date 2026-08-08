import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../utils/useToast.js";
import "./OrganizerNavbar.css";

const OrganizerNavbar = ({ selected, setSelected }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    showToast("Logged out successfully");
    navigate("/");
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Derive initials */
  const name = user?.name || user?.fullname || "Organizer";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "events", label: "Events" },
    { key: "participants", label: "Participants" },
    { key: "judges", label: "Judges" },
  ];

  return (
    <nav className="org-nav">
      <div className="org-nav-inner">
        {/* Logo */}
        <div className="org-nav-left">
          <span className="brand-badge">TF</span>
          <span className="brand-wordmark">TechFest <small>Portal</small></span>

          <div className="org-nav-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`org-nav-tab ${selected === tab.key ? "active" : ""}`}
                onClick={() => setSelected(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile dropdown */}
        <div className="org-profile" ref={menuRef}>
          <button
            className="org-avatar-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title={name}
          >
            <span className="org-avatar-circle">{initials}</span>
            <span className="org-profile-name">{name.split(" ")[0]}</span>
            <span className="org-caret">{menuOpen ? "▲" : "▼"}</span>
          </button>

          {menuOpen && (
            <div className="org-dropdown">
              <div className="org-dropdown-header">
                <span className="org-avatar-circle small">{initials}</span>
                <div>
                  <div className="org-dropdown-name">{name}</div>
                  <div className="org-dropdown-email">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
              <div className="org-dropdown-divider" />
              <button
                className="org-dropdown-item logout"
                onClick={handleLogout}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default OrganizerNavbar;
