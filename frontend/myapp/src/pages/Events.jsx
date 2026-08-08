import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar";
import ParticipantNavbar from "../components/ParticipantNavbar";
import OrganizerNavbar from "../components/OrganizerNavbar";
import PageLayout from "../components/PageLayout.jsx";
import "./Events.css";
import { API_URL } from "../utils/api.js";

const Events = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/api/organizer/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (role !== "participant") return;
    fetch(`${API_URL}/api/participant/registrations`, { credentials: "include" })
      .then((res) => res.json()).then((data) => setRegisteredIds((data.registrations || []).map((r) => r.event_id)));
  }, [role]);

  const filteredEvents = events.filter((event) => (scope === "all" || event.event_scope === scope) && event.event_name.toLowerCase().includes(query.toLowerCase()));

  const handleRegisterClick = (event) => {
    if (role === "participant") {
      navigate(`/pregister?event=${event.event_id}`);
    } else {
      navigate("/participant/auth");
    }
  };

  // Pick navbar based on auth state
  const renderNavbar = () => {
    if (authLoading) return <Navbar />;
    if (role === "participant") return <ParticipantNavbar />;
    if (role === "organizer") return <OrganizerNavbar selected="" setSelected={() => {}} />;
    return <Navbar />;
  };

  // Map scope to CSS class for badge color
  const scopeClass = (scope) => {
    if (!scope) return "scope-general";
    const s = scope.toLowerCase();
    if (s === "intra-college") return "scope-intra";
    if (s === "inter-college") return "scope-inter";
    if (s === "zonal") return "scope-zonal";
    return "scope-general";
  };

  return (
    <>
      {renderNavbar()}
      <PageLayout title="Browse Events">
      <div className="events-page">
        <div className="events-container">
          <div className="events-header">
            <h1>Technical Events</h1>
            <p>Explore our exciting technical competitions</p>
          </div>
          {loading ? (
            <p style={{ textAlign: "center", marginTop: "60px" }}>
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: "60px" }}>
              📅 No events are open right now — please check back soon.
            </p>
          ) : (
            <><div className="event-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events" />{[["all","All"],["intra-college","Intra-College"],["inter-college","Inter-College"],["zonal","Zonal"]].map(([value,label]) => <button key={value} onClick={() => setScope(value)} className={scope === value ? "filter-active" : ""}>{label}</button>)}</div><div className="events-grid">
              {filteredEvents.map((event) => {
                const isFull = Number(event.seats_left) === 0;
                const isRegistered = registeredIds.some((id) => String(id) === String(event.event_id));

                return (
                  <div
                    key={event.event_id}
                    className={`event-card ${isFull ? "event-full" : ""}`}
                  >
                    <span className={`event-category ${scopeClass(event.event_scope)}`}>
                      {event.event_scope || "General"}
                    </span>
                    <h2>{event.event_name}</h2>
                    <p className="event-description">{event.description}</p>

                    <div className="event-info">
                      {event.date && (
                        <div>
                          📅 {new Date(event.date).toLocaleDateString(undefined, {
                            weekday: "short", year: "numeric", month: "short", day: "numeric",
                          })}
                        </div>
                      )}
                      {event.time && <div>⏰ {event.time}</div>}
                      {event.location && <div>📍 {event.location}</div>}
                      {event.capacity && (
                        <div className={isFull ? "seats-full" : ""}>
                          👥 {Math.min(Number(event.registered_count ?? (event.capacity - (event.seats_left || 0))), Number(event.capacity))} / {event.capacity} seats
                          {isFull && " — Full"}
                        </div>
                      )}
                      {event.organizers && <div>👤 {event.organizers}</div>}
                    </div>

                    <button
                      className={`register-btn ${isRegistered ? "registered" : ""} ${isFull && !isRegistered ? "disabled" : ""}`}
                      disabled={isFull || isRegistered}
                      onClick={() => handleRegisterClick(event)}
                    >
                      {isRegistered ? "Registered" : isFull
                        ? "Sold Out"
                        : role === "participant"
                          ? "Register"
                          : "Register Now"}
                    </button>
                  </div>
                );
              })}</div></>
          )}
        </div>
      </div>
      </PageLayout>
    </>
  );
};

export default Events;
