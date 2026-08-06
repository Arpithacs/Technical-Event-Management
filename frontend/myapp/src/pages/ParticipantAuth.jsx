import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import "./ParticipantAuth.css";

const ParticipantAuth = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { login, role, loading } = useAuth();
  const { showToast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && role === "participant") {
      navigate("/participant/dashboard", { replace: true });
    }
  }, [loading, role, navigate]);

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [signupData, setSignupData] = useState({
    fullname: "",
    email: "",
    password: "",
    phone: "",
    college_name: "",
  });
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Login successful");
        login(data.user, "participant");
        navigate("/participant/dashboard");
      } else {
        showToast(data.message || "Login failed", "error");
        setLoginError(data.message || "Login failed");
      }
    } catch (err) {
      setLoginError("Server error. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess("");
    try {
      const res = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Account created. You can now log in.");
        setSignupSuccess("Account created! You can now log in.");
        setSignupData({ fullname: "", email: "", password: "", phone: "", college_name: "" });
        setTimeout(() => setActiveTab("login"), 1500);
      } else {
        showToast(data.message || "Signup failed", "error");
        setSignupError(data.message || "Signup failed");
      }
    } catch (err) {
      setSignupError("Server error. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Participant Portal</h1>
          <p className="auth-subtitle">Log in or create a new account</p>

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Log In
            </button>
            <button
              className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === "login" && (
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
          )}

          {/* SIGNUP FORM */}
          {activeTab === "signup" && (
            <form className="auth-form" onSubmit={handleSignup}>
              {signupError && <p className="error-msg">{signupError}</p>}
              {signupSuccess && (
                <p className="success-msg">{signupSuccess}</p>
              )}
              <input
                type="text"
                placeholder="Full Name"
                value={signupData.fullname}
                onChange={(e) =>
                  setSignupData({ ...signupData, fullname: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={signupData.phone}
                onChange={(e) =>
                  setSignupData({ ...signupData, phone: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="College / University Name"
                value={signupData.college_name}
                onChange={(e) =>
                  setSignupData({ ...signupData, college_name: e.target.value })
                }
              />
              <button type="submit" className="auth-submit-btn">
                Create Account
              </button>
            </form>
          )}

          <p className="auth-back-link">
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ParticipantAuth;
