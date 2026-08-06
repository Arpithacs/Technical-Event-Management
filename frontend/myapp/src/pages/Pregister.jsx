import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import ParticipantNavbar from "../components/ParticipantNavbar";
import "./pregister.css";

const Pregister = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    college_name: "",
    event_id: "",
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // "success" | "error"

  useEffect(() => {
    // Pre-fill from auth context if available
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullname: user.fullname || "",
        email: user.email || "",
        phone: user.phone || "",
        college_name: user.college_name || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    fetch("http://localhost:5000/api/organizer/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
        // Pre-select event from query param
        const preselectedId = searchParams.get("event");
        if (preselectedId) {
          setFormData((prev) => ({ ...prev, event_id: preselectedId }));
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    setMsgType("");

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          event_id: parseInt(formData.event_id, 10),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Registration successful!");
        navigate("/participant/dashboard", { replace: true });
      } else {
        showToast(data.message || "Registration failed. Please try again.", "error");
        setSubmitMsg(data.message || "Registration failed. Please try again.");
        setMsgType("error");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitMsg("Server error, please try again later.");
      setMsgType("error");
    }
  };

  return (
    <>
      <ParticipantNavbar />

      <div className="register-page">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 className="register-form-title">Event Registration</h2>
          <p className="register-form-subtitle">
            Fill in the details below to register for a technical event
          </p>

          <label>Full Name *</label>
          <input
            type="text"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            required
          />

          <label>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>College / University</label>
          <input
            type="text"
            name="college_name"
            value={formData.college_name}
            onChange={handleChange}
            placeholder="Your college or university name"
          />

          <label>Select Event *</label>
          <select
            name="event_id"
            value={formData.event_id}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading events..." : "-- Select an Event --"}
            </option>
            {events.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.event_name}
                {ev.date ? ` — ${new Date(ev.date).toLocaleDateString()}` : ""}
                {ev.event_scope ? ` (${ev.event_scope})` : ""}
                {ev.seats_left != null && ev.capacity
                  ? ` [${ev.seats_left}/${ev.capacity} seats]`
                  : ""}
              </option>
            ))}
          </select>

          <button type="submit" className="submit-btn">
            Submit Registration
          </button>

          {submitMsg && (
            <div className={`register-msg ${msgType}`}>
              {msgType === "success" ? "✅ " : "❌ "}
              {submitMsg}
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default Pregister;
