import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./Register.css";
import { useToast } from "../utils/useToast.js";
import { API_URL } from "../utils/api.js";

const Register = () => {
  const { showToast } = useToast();
  const [phoneError, setPhoneError] = useState("");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    event: "",
  });

  const events = [
    "Hackathon",
    "Code Sprint",
    "AI Innovate",
    "Robo Race",
    "E-Sports Showdown",
    "UI/UX Challenge",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.phone)) {
      setPhoneError("Phone number must contain exactly 10 digits.");
      return;
    }
    setPhoneError("");

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Registration successful");
        setFormData({ fullname: "", email: "", phone: "", event: "" });
      } else {
        showToast(data.message || "Something went wrong!", "error");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      showToast("Server error, please try again later.", "error");
    }
  };

  return (
    <>
      <Navbar />
      <div className="register-page">
        <div className="register-header">
          <h1>Event Registration</h1>
          <p>Fill in the details below to register for a technical event</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            Full Name <span>*</span>
          </label>
          <input
            type="text"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label>
            Email Address <span>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />

          <label>
            Phone Number <span>*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            placeholder="Enter your phone number"
            required
          />
          {phoneError && <p className="error-msg">{phoneError}</p>}

          <label>
            Select Event <span>*</span>
          </label>
          <select
            name="event"
            value={formData.event}
            onChange={handleChange}
            required
          >
            <option value="">-- Select an Event --</option>
            {events.map((ev, index) => (
              <option key={index} value={ev}>
                {ev}
              </option>
            ))}
          </select>

          <button type="submit" className="submit-btn">
            Submit Registration
          </button>
        </form>
      </div>
    </>
  );
};

export default Register;
