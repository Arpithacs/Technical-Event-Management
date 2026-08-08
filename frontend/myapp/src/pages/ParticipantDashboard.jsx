import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticipantNavbar from "../components/ParticipantNavbar";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useToast } from "../utils/useToast.js";
import "./ParticipantDashboard.css";
import PageLayout from "../components/PageLayout.jsx";
import { QRCodeSVG } from "qrcode.react";
import { API_URL } from "../utils/api.js";

const ParticipantDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);
  const { showToast } = useToast();

  const fetchRegistrations = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/participant/registrations`,
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

        setStats({ total: regs.length, upcoming: upc, completed: comp });
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
        `${API_URL}/api/participant/registrations/${regId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (res.ok) {
        showToast("Registration cancelled");
        setRegistrations((current) => {
          const remaining = current.filter((registration) => registration.id !== regId);
          const now = new Date();
          const upcoming = remaining.filter((registration) => registration.event_date && new Date(registration.event_date) >= now).length;
          setStats({ total: remaining.length, upcoming, completed: remaining.length - upcoming });
          return remaining;
        });
      } else {
        showToast(data.message || "Failed to cancel registration", "error");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      showToast("Server error. Please try again.", "error");
    }
  };

  const downloadTicket = (reg) => {
    const qr = document.getElementById(`ticket-qr-${reg.id}`);
    if (!qr) {
      showToast("Unable to generate the event ticket.", "error");
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([qr.outerHTML], { type: "image/svg+xml" }));
    link.download = `techfest-ticket-${reg.id}.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Ticket QR code downloaded");
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "100px" }}>Loading...</p>;

  return (
    <>
      <ParticipantNavbar />
      <PageLayout title="Participant Dashboard">
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
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">🎟️</div>
              <p>You haven't registered for any events yet</p>
              <Link to="/events" className="browse-more-btn">Browse Events</Link>
            </div>
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
                    <div className="ticket-qr" aria-label={`QR code for registration ${reg.id}`}>
                      <QRCodeSVG id={`ticket-qr-${reg.id}`} value={String(reg.id)} size={88} />
                    </div>
                    <button
                      className="cancel-btn"
                      onClick={() => setPendingCancel(reg)}
                    >
                      Cancel Registration
                    </button>
                    <button className="update-btn" onClick={() => downloadTicket(reg)}>Download Ticket</button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
      </PageLayout>
      <ConfirmModal
        isOpen={!!pendingCancel}
        title="Cancel registration"
        message={`Are you sure you want to cancel registration for ${pendingCancel?.event_name}?`}
        onCancel={() => setPendingCancel(null)}
        onConfirm={() => { handleCancel(pendingCancel.id); setPendingCancel(null); }}
      />
    </>
  );
};

export default ParticipantDashboard;
