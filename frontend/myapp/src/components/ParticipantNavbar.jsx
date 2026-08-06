import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./ParticipantNavbar.css";

const ParticipantNavbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  /* Derive initials from user name */
  const name = user?.fullname || user?.name || "User";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="participant-navbar">
      <div className="pnav-inner">
        {/* Logo */}
        <NavLink to="/participant/dashboard" className="pnav-logo">
          <span className="brand-badge">TF</span><span className="brand-wordmark">TechFest <small>Portal</small></span>
        </NavLink>

        {/* Nav links */}
        <ul className="pnav-links">
          <li>
            <NavLink
              to="/participant/dashboard"
              className={({ isActive }) =>
                isActive ? "pnav-link active" : "pnav-link"
              }
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/events"
              className={({ isActive }) =>
                isActive ? "pnav-link active" : "pnav-link"
              }
            >
              Browse Events
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? "pnav-link active" : "pnav-link"
              }
            >
              Contact
            </NavLink>
          </li>
        </ul>

        {/* Profile dropdown */}
        <div className="pnav-profile" ref={menuRef}>
          <button
            className="pnav-avatar-btn"
            onClick={() => setMenuOpen((v) => !v)}
            title={name}
          >
            <span className="pnav-avatar-circle">{initials}</span>
            <span className="pnav-profile-name">{name.split(" ")[0]}</span>
            <span className="pnav-caret">{menuOpen ? "▲" : "▼"}</span>
          </button>

          {menuOpen && (
            <div className="pnav-dropdown">
              <div className="pnav-dropdown-header">
                <span className="pnav-avatar-circle small">{initials}</span>
                <div>
                  <div className="pnav-dropdown-name">{name}</div>
                  <div className="pnav-dropdown-email">
                    {user?.email || ""}
                  </div>
                </div>
              </div>
              <button
                className="pnav-dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/participant/dashboard");
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                My Dashboard
              </button>
              <div className="pnav-dropdown-divider" />
              <button className="pnav-dropdown-item logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default ParticipantNavbar;
