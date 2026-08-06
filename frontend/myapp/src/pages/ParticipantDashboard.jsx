import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticipantNavbar from "../components/ParticipantNavbar";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import "./ParticipantDashboard.css";

const ParticipantDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  const { showToast } = useToast();

  const fetchRegistrations = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/participant/registrations",
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        const regs = data.registrations || [];
        setRegistrations(regs);

        // Compute upcoming vs completed from event dates
        const now = new Date();
        let upc = 0;
        let comp = 0;
        regs.forEach((r) => {
          if (r.event_date) {
            const eventDate = new Date(r.event_date);
            if (eventDate >= now) upc++;
            else comp++;
          }
        });

        setStats({ total: data.total || regs.length, upcoming: upc, completed: comp });
      } else {
        console.log("Not logged in or unauthorized");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  /* Cancel registration */
  const handleCancel = async (regId) => {

    try {
      const res = await fetch(
        `http://localhost:5000/api/participant/registrations/${regId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        showToast("Registration cancelled");
        fetchRegistrations(); // refresh
      } else {
        alert(data.message || "Failed to cancel registration");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Server error. Please try again.");
    }
  };

  const downloadTicket = (reg) => {
    const content = `TECHFEST PORTAL\n\nEVENT PASS\nRegistration ID: #${reg.id}\nParticipant: ${reg.fullname}\nEvent: ${reg.event_name}\nDate: ${new Date(reg.event_date).toLocaleDateString()}\nVenue: ${reg.location}`;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" })); link.download = `techfest-pass-${reg.id}.txt`; link.click(); URL.revokeObjectURL(link.href); showToast("Event pass downloaded");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "100px" }}>Loading...</p>;

  return (
    <>
      <ParticipantNavbar />
      <div className="dashboard-container">
        <section className="dashboard-content">
          <h1 className="dashboard-title">Participant Dashboard</h1>
          <p className="dashboard-subtitle">
            View and manage your registered events
          </p>

          {/* STATS */}
          <div className="stats-container">
            <div className="stat-card pink">
              <h3>Total Registrations</h3>
              <p className="stat-number">{stats.total}</p>
              <span className="stat-icon">📅</span>
            </div>

            <div className="stat-card purple">
              <h3>Upcoming Events</h3>
              <p className="stat-number">{stats.upcoming}</p>
              <span className="stat-icon">⏱️</span>
            </div>

            <div className="stat-card blue">
              <h3>Completed Events</h3>
              <p className="stat-number">{stats.completed}</p>
              <span className="stat-icon">🏅</span>
            </div>
          </div>

          {/* My Registered Events */}
          <h2 className="section-heading">My Registered Events</h2>

          <div className="browse-more-section">
            <Link to="/events" className="browse-more-btn">
              Browse More Events →
            </Link>
          </div>

          {registrations.length === 0 ? (
            <p className="empty-state">🎟️ No registrations yet — browse events to get started!</p>
          ) : (
            registrations.map((reg) => {
              const isUpcoming = reg.event_date && new Date(reg.event_date) >= new Date();

              return (
                <div className="event-card" key={reg.id}>
                  <div className="event-header">
                    <h3>{reg.event_name}</h3>
                    <span className={`status-badge ${isUpcoming ? "upcoming" : "completed"}`}>
                      {isUpcoming ? "Upcoming" : "Completed"}
                    </span>
                  </div>

                  <p className="event-id">
                    Registration ID: <b>#{reg.id}</b> • Registered on{" "}
                    {new Date(reg.created_at).toLocaleDateString()}
                  </p>

                  <div className="event-details">
                    <div className="event-details-col">
                      {reg.event_date && (
                        <p>📅 {new Date(reg.event_date).toLocaleDateString(undefined, {
                          weekday: "short", year: "numeric", month: "short", day: "numeric",
                        })}</p>
                      )}
                      {reg.event_time && <p>⏰ {reg.event_time}</p>}
                      {reg.location && <p>📍 {reg.location}</p>}
                      {reg.event_scope && (
                        <p>🏷️ <span className="scope-tag">{reg.event_scope}</span></p>
                      )}
                    </div>
                    <div className="event-details-col">
                      <p>📞 {reg.phone}</p>
                      <p>📧 {reg.email}</p>
                      {reg.college_name && <p>🎓 {reg.college_name}</p>}
                    </div>
                  </div>

                  <div className="event-actions">
                    <button
                      className="cancel-btn"
                      onClick={() => setPendingCancel(reg)}
                    >
                      Cancel Registration
                    </button>
                    <button className="update-btn" onClick={() => downloadTicket(reg)}>Download Ticket / Pass</button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
      <ConfirmModal open={!!pendingCancel} action="cancel registration for" itemName={pendingCancel?.event_name} onClose={() => setPendingCancel(null)} onConfirm={() => { handleCancel(pendingCancel.id); setPendingCancel(null); }} />
    </>
  );
};

export default ParticipantDashboard;
