import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar";
import "./index.css";

const App = () => {
  const navigate = useNavigate();
  const { role, loading } = useAuth();

  // If already logged in, redirect to the appropriate dashboard
  useEffect(() => {
    if (!loading && role === "participant") {
      navigate("/participant/dashboard", { replace: true });
    } else if (!loading && role === "organizer") {
      navigate("/organizer/dashboard", { replace: true });
    }
  }, [loading, role, navigate]);

  return (
    <div>
      <Navbar />
      <section className="landing-page">
        <div className="landing-container">
          <h1 className="landing-title">Welcome to TechFest Portal</h1>
          <p className="landing-subtitle">
            Choose how you'd like to continue
          </p>

          <div className="landing-grid">
            {/* Participant Card */}
            <div
              className="landing-card"
              onClick={() => navigate("/participant/auth")}
            >
              <div className="landing-icon participant">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="48"
                  height="48"
                >
                  <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.5c-3.3 0-9.9 1.7-9.9 4.9v2.4h19.8v-2.4c0-3.2-6.6-4.9-9.9-4.9z" />
                </svg>
              </div>
              <h2>Continue as Participant</h2>
              <p>
                Register for events, track your entries, and view results
              </p>
              <button className="landing-btn participant-btn">
                Get Started →
              </button>
            </div>

            {/* Organizer Card */}
            <div
              className="landing-card"
              onClick={() => navigate("/organizer/auth")}
            >
              <div className="landing-icon organizer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="48"
                  height="48"
                >
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.83-3.23 9.36-7 10.57-3.77-1.21-7-5.74-7-10.57V6.3l7-3.12z" />
                  <path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l5.59-5.59L17 8.5l-7 7z" />
                </svg>
              </div>
              <h2>Continue as Organizer</h2>
              <p>
                Manage events, view registrations, and publish results
              </p>
              <button className="landing-btn organizer-btn">
                Sign In →
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
