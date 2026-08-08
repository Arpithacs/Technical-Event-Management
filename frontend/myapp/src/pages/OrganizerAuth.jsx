import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../utils/useToast.js";
import "./ParticipantAuth.css"; // reuse same styles
import PageLayout from "../components/PageLayout.jsx";
import { API_URL } from "../utils/api.js";

const OrganizerAuth = () => {
  const navigate = useNavigate();
  const { login, role, loading } = useAuth();
  const { showToast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && role === "organizer") {
      navigate("/organizer/dashboard", { replace: true });
    }
  }, [loading, role, navigate]);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/api/organizer/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Organizer login successful");
        login(data.organizer, "organizer");
        navigate("/organizer/dashboard");
      } else {
        showToast(data.message || "Invalid credentials", "error");
        setLoginError(data.message || "Invalid credentials");
      }
    } catch {
      showToast("Server error. Please try again.", "error");
      setLoginError("Server error. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <PageLayout title="Organizer Login">
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Organizer Portal</h1>
          <p className="auth-subtitle">
            Log in with your admin-assigned account
          </p>

          <form className="auth-form" onSubmit={handleLogin}>
            {loginError && <p className="error-msg">{loginError}</p>}
            <input
              type="email"
              placeholder="Email Address"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({ ...loginData, email: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({ ...loginData, password: e.target.value })
              }
              required
            />
            <button type="submit" className="auth-submit-btn">
              Log In
            </button>
          </form>

          <p className="auth-note">
            Organizer accounts are created by the system administrator.
            <br />
            Contact admin if you need access.
          </p>

          <p className="auth-back-link">
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default OrganizerAuth;
