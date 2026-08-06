import React, { useState } from "react";
import "./LoginForm.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

const LoginForm = ({ userType, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // ⭐ CHOOSE CORRECT API BASED ON USER TYPE
    const url =
      userType === "organizer"
        ? "http://localhost:5000/api/organizer/login"
        : "http://localhost:5000/api/login";

    try {
      const res = await axios.post(
        url,
        { email, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Login successful!");

        if (userType === "participant") {
          navigate("/participant/dashboard");
        } else {
          navigate("/organizer/dashboard");
        }

        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-box">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <h2>
          {userType === "organizer" ? "Organizer Login" : "Participant Login"}
        </h2>

        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
