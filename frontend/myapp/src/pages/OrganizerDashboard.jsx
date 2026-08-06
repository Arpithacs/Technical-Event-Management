import React, { useEffect, useState } from "react";
import OrganizerNavbar from "../components/OrganizerNavbar.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import "./OrganizerDashboard.css";

export default function OrganizerDashboard() {
  const { showToast } = useToast();
  const [confirmation, setConfirmation] = useState(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [selected, setSelected] = useState("dashboard");

  // SUMMARY
  const [summary, setSummary] = useState({
    totalParticipants: 0,
    totalEvents: 0,
    upcoming: 0,
    completed: 0,
  });

  // PARTICIPANTS
  const [participants, setParticipants] = useState([]);

  // EVENTS LIST (all events)
  const [events, setEvents] = useState([]);

  // MY EVENTS (dashboard personal events)
  const [myEvents, setMyEvents] = useState([]);
  const [judges, setJudges] = useState([]);
  const [judgeForm, setJudgeForm] = useState({
    name: "",
    contact_no: "",
    expertise_area: "",
    event_id: "",
  });
  const [editingJudgeId, setEditingJudgeId] = useState(null);

  // ADD EVENT FORM
  const [eventForm, setEventForm] = useState({
    event_name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    event_scope: "",
    capacity: "",
    registration_deadline: "",
  });

  // EDIT POPUP
  const [editPopup, setEditPopup] = useState(false);
  const [editEvent, setEditEvent] = useState({});

  /* -------------------- Fetch Summary ------------------ */
  useEffect(() => {
    fetch("http://localhost:5000/api/organizer/summary", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error("Summary fetch error:", err));
  }, []);

  /* -------------------- Fetch Participants ------------------ */
  useEffect(() => {
    if (selected === "participants") {
      fetch("http://localhost:5000/api/organizer/registrations", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setParticipants(data.participants || []))
        .catch((err) => console.error("Registrations fetch error:", err));
    }
  }, [selected]);

  /* -------------------- Fetch Events (All Events) ------------------ */
  useEffect(() => {
    if (selected === "events") {
      fetch("http://localhost:5000/api/organizer/events", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setEvents(data.events || []))
        .catch((err) => console.error("Events fetch error:", err));
    }
  }, [selected]);

  useEffect(() => {
    if (selected !== "allotment") return;

    Promise.all([
      fetch("http://localhost:5000/api/organizer/judges", { credentials: "include" }).then((res) => res.json()),
      fetch("http://localhost:5000/api/organizer/events", { credentials: "include" }).then((res) => res.json()),
    ])
      .then(([judgeData, eventData]) => {
        setJudges(judgeData.judges || []);
        setEvents(eventData.events || []);
      })
      .catch((err) => console.error("Allotment fetch error:", err));
  }, [selected]);

  /* -------------------- Fetch My Events (Dashboard) ------------------ */
  useEffect(() => {
    if (selected === "dashboard") {
      fetch("http://localhost:5000/api/organizer/my-events", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setMyEvents(data.events || []))
        .catch((err) => console.error("My-events fetch error:", err));
    }
  }, [selected]);

  /* -------------------- Add Event ------------------ */
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (Number(eventForm.capacity) <= 0) return showToast("Capacity must be greater than 0", "error");
    if (eventForm.registration_deadline && eventForm.registration_deadline >= eventForm.date) return showToast("Registration deadline must be before the event date", "error");

    fetch("http://localhost:5000/api/organizer/add-event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...eventForm,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity, 10) : null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message, data.success ? "success" : "error");

        if (data.success) {
          setEventForm({
            event_name: "",
            description: "",
            date: "",
            time: "",
            location: "",
            event_scope: "",
            capacity: "",
            registration_deadline: "",
          });

          setSelected("events");
        }
      })
      .catch((err) => {
        console.error("Add event error:", err);
        alert("Failed to add event");
      });
  };

  /* -------------------- Delete Event ------------------ */
  const deleteEvent = (id) => {

    fetch(`http://localhost:5000/api/organizer/delete-event/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message || "Event deleted");

        fetch("http://localhost:5000/api/organizer/my-events", {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setMyEvents(data.events || []))
          .catch((err) => console.error("Refresh my-events error:", err));
      })
      .catch((err) => {
        console.error("Delete event error:", err);
        showToast("Delete failed", "error");
      });
  };

  const refreshJudges = () => {
    fetch("http://localhost:5000/api/organizer/judges", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setJudges(data.judges || []));
  };

  const handleAddJudge = (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(judgeForm.contact_no)) return showToast("Contact number must be exactly 10 digits", "error");
    fetch(`http://localhost:5000/api/organizer/judges${editingJudgeId ? `/${editingJudgeId}` : ""}`, {
      method: editingJudgeId ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...judgeForm, event_id: Number(judgeForm.event_id) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to add judge");
        setJudgeForm({ name: "", contact_no: "", expertise_area: "", event_id: "" });
        setEditingJudgeId(null);
        refreshJudges(); showToast(editingJudgeId ? "Judge updated" : "Judge assigned");
      })
      .catch((err) => alert(err.message));
  };

  const deleteJudge = (id) => {
    fetch(`http://localhost:5000/api/organizer/judges/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to remove judge");
        refreshJudges(); showToast("Judge removed");
      })
      .catch((err) => alert(err.message));
  };

  const editJudge = (judge) => {
    setEditingJudgeId(judge.judge_id);
    setJudgeForm({ name: judge.name, contact_no: judge.contact_no, expertise_area: judge.expertise_area, event_id: String(judge.event_id) });
  };

  const filteredParticipants = participants.filter((p) => `${p.fullname} ${p.email} ${p.college_name || ""} ${p.event_name}`.toLowerCase().includes(participantSearch.toLowerCase()));
  const filteredEvents = events.filter((e) => `${e.event_name} ${e.description || ""} ${e.location}`.toLowerCase().includes(eventSearch.toLowerCase()));
  const exportParticipants = () => { const lines = [["ID","Name","Email","Phone","College","Event"], ...filteredParticipants.map((p) => [p.registration_id,p.fullname,p.email,p.phone,p.college_name || "",p.event_name])].map((row) => row.map((v) => `"${String(v).replaceAll('"','""')}"`).join(",")); const link=document.createElement("a"); link.href=URL.createObjectURL(new Blob([lines.join("\n")],{type:"text/csv"})); link.download="participants.csv"; link.click(); showToast("CSV exported"); };

  /* -------------------- OPEN EDIT POPUP ------------------ */
  const openEdit = (ev) => {
    setEditEvent({ ...ev });
    setEditPopup(true);
  };

  /* -------------------- UPDATE EVENT ------------------ */
  const updateEvent = () => {
    let cleanDate = editEvent.date;
    if (cleanDate && cleanDate.includes("T")) {
      cleanDate = cleanDate.split("T")[0];
    }

    let cleanTime = editEvent.time;
    if (cleanTime && cleanTime.length > 5) {
      cleanTime = cleanTime.substring(0, 5);
    }

    fetch(
      `http://localhost:5000/api/organizer/update-event/${editEvent.event_id}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editEvent,
          date: cleanDate,
          time: cleanTime,
          capacity: editEvent.capacity ? parseInt(editEvent.capacity, 10) : null,
        }),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message, data.success ? "success" : "error");
        setEditPopup(false);

        fetch("http://localhost:5000/api/organizer/my-events", {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setMyEvents(data.events || []));
      });
  };

  return (
    <div>
      <OrganizerNavbar selected={selected} setSelected={setSelected} />

      <div className="org-dashboard">
        {/* ---------------- DASHBOARD ---------------- */}
        {selected === "dashboard" && (
          <>
            <h1>Organizer Dashboard</h1>

            <div className="stats-box">
              <div className="stat-card pink">
                <h3>Total Participants</h3>
                <p>{summary.totalParticipants}</p>
              </div>

              <div className="stat-card purple">
                <h3>Total Events</h3>
                <p>{summary.totalEvents}</p>
              </div>

              <div className="stat-card blue">
                <h3>Upcoming</h3>
                <p>{summary.upcoming}</p>
              </div>

              <div className="stat-card green">
                <h3>Completed</h3>
                <p>{summary.completed}</p>
              </div>

              <div className="stat-card amber">
                <h3>Total Judges</h3>
                <p>{summary.totalJudges || 0}</p>
              </div>
            </div>

            {/* ---------------- YOUR EVENTS TABLE ---------------- */}
            <h2 style={{ marginTop: "40px" }}>Event Overview</h2>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Scope</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {myEvents.length > 0 ? (
                  myEvents.map((ev) => (
                    <tr key={ev.event_id}>
                      <td>{ev.event_id}</td>
                      <td>{ev.event_name}</td>
                      <td>{ev.description}</td>
                      <td>
                        {ev.event_scope ? (
                          <span className={`scope-pill scope-${ev.event_scope.toLowerCase().replace(/\s+/g, "-")}`}>
                            {ev.event_scope}
                          </span>
                        ) : "—"}
                      </td>
                      <td>{ev.date ? new Date(ev.date).toLocaleDateString() : ""}</td>
                      <td>{ev.location}</td>
                      <td>
                        {ev.capacity
                          ? `${ev.seats_left ?? ev.capacity}/${ev.capacity}`
                          : "—"}
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => openEdit(ev)}>
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => setConfirmation({ type: "event", id: ev.event_id, name: ev.event_name })}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      📅 No events created yet — add your first event in the Events tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* ---------------- PARTICIPANTS ---------------- */}
        {selected === "participants" && (
          <div className="content-box">
            <h1>All Participants</h1>
            <div className="table-tools"><input value={participantSearch} onChange={(e) => setParticipantSearch(e.target.value)} placeholder="Search participants" /><button className="secondary-btn" onClick={exportParticipants}>Export CSV</button></div>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>College</th>
                  <th>Event</th>
                  <th>Scope</th>
                  <th>Registered On</th>
                </tr>
              </thead>

              <tbody>
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.slice(0, 10).map((p) => (
                    <tr key={p.registration_id}>
                      <td>{p.registration_id}</td>
                      <td>{p.fullname}</td>
                      <td>{p.email}</td>
                      <td>{p.phone}</td>
                      <td>{p.college_name || "—"}</td>
                      <td>{p.event_name}</td>
                      <td>
                        {p.event_scope ? (
                          <span className={`scope-pill scope-${p.event_scope.toLowerCase().replace(/\s+/g, "-")}`}>
                            {p.event_scope}
                          </span>
                        ) : "—"}
                      </td>
                      <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      👥 No participants registered yet — registrations will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- EVENTS PAGE ---------------- */}
        {selected === "events" && (
          <div className="content-box event-layout">
            {/* LEFT FORM */}
            <div className="event-form-section">
              <h2>Add Event</h2>

              <form className="event-form" onSubmit={handleAddEvent}>
                <label>Event Name</label>
                <input
                  type="text"
                  placeholder="Event Name"
                  value={eventForm.event_name}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, event_name: e.target.value })
                  }
                  required
                />

                <label>Description</label>
                <textarea
                  placeholder="Description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                ></textarea>

                <label>Event Scope</label>
                <select
                  value={eventForm.event_scope}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, event_scope: e.target.value })
                  }
                >
                  <option value="">Select Scope</option>
                  <option value="intra-college">Intra-College</option>
                  <option value="inter-college">Inter-College</option>
                  <option value="zonal">Zonal</option>
                </select>

                <label>Capacity (max participants)</label>
                <input
                  type="number"
                  placeholder="Capacity (max participants)"
                  value={eventForm.capacity}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, capacity: e.target.value })
                  }
                  min="1"
                />

                <label>Event Date</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, date: e.target.value })
                  }
                  required
                />

                <label>Event Start Time</label>
                <input
                  type="time"
                  value={eventForm.time}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, time: e.target.value })
                  }
                  required
                />

                <label>Venue / Location</label>
                <input
                  type="text"
                  placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, location: e.target.value })
                  }
                  required
                />

                <label className="form-label-small">Registration Deadline</label>
                <input
                  type="date"
                  value={eventForm.registration_deadline}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, registration_deadline: e.target.value })
                  }
                />

                <button type="submit" className="add-btn">
                  Add Event
                </button>
              </form>
            </div>

            {/* RIGHT EVENTS TABLE */}
            <div className="event-list-section">
              <h2>All Events</h2>
              <div className="table-tools"><input value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} placeholder="Search events" /><span>Showing {Math.min(filteredEvents.length, 10)} of {filteredEvents.length}</span></div>

              <table className="styled-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event</th>
                    <th>Description</th>
                    <th>Scope</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Seats</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length > 0 ? (
                    filteredEvents.slice(0, 10).map((ev) => (
                      <tr key={ev.event_id}>
                        <td>{ev.event_id}</td>
                        <td>{ev.event_name}</td>
                        <td>{ev.description || "—"}</td>
                        <td>
                          {ev.event_scope ? (
                            <span className={`scope-pill scope-${ev.event_scope.toLowerCase().replace(/\s+/g, "-")}`}>
                              {ev.event_scope}
                            </span>
                          ) : "—"}
                        </td>
                        <td>{ev.date ? new Date(ev.date).toLocaleDateString() : ""}</td>
                        <td>{ev.location}</td>
                        <td>
                          {ev.capacity
                            ? `${ev.seats_left ?? ev.capacity}/${ev.capacity}`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        📅 No events yet — add one using the form on the left.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected === "allotment" && (
          <div className="content-box allotment-layout">
            <section className="event-form-section">
              <h2>{editingJudgeId ? "Edit Judge Assignment" : "Assign a Judge"}</h2>
              <form className="event-form" onSubmit={handleAddJudge}>
                <label>Judge Name</label>
                <input required value={judgeForm.name} onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })} placeholder="Full name" />
                <label>Contact Number</label>
                <input required type="tel" value={judgeForm.contact_no} onChange={(e) => setJudgeForm({ ...judgeForm, contact_no: e.target.value })} placeholder="Contact number" />
                <label>Expertise Area</label>
                <input required value={judgeForm.expertise_area} onChange={(e) => setJudgeForm({ ...judgeForm, expertise_area: e.target.value })} placeholder="e.g. Artificial Intelligence" />
                <label>Assigned Event</label>
                <select required value={judgeForm.event_id} onChange={(e) => setJudgeForm({ ...judgeForm, event_id: e.target.value })}>
                  <option value="">Select an event</option>
                  {events.map((event) => <option key={event.event_id} value={event.event_id}>{event.event_name}</option>)}
                </select>
                <button type="submit" className="add-btn">{editingJudgeId ? "Save Judge" : "Assign Judge"}</button>
                {editingJudgeId && <button type="button" className="secondary-btn" onClick={() => { setEditingJudgeId(null); setJudgeForm({ name: "", contact_no: "", expertise_area: "", event_id: "" }); }}>Cancel</button>}
              </form>
            </section>
            <section className="event-list-section">
              <h2>Judges Directory</h2>
              <table className="styled-table">
                <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Expertise Area</th><th>Assigned Event</th><th>Actions</th></tr></thead>
                <tbody>
                  {judges.length ? judges.map((judge) => (
                    <tr key={judge.judge_id}>
                      <td>{judge.judge_id}</td><td>{judge.name}</td><td>{judge.contact_no}</td><td>{judge.expertise_area}</td><td>{judge.assigned_event || "—"}</td>
                      <td><button className="edit-btn" onClick={() => editJudge(judge)}>Edit</button><button className="delete-btn" onClick={() => setConfirmation({ type: "judge", id: judge.judge_id, name: judge.name })}>Delete</button></td>
                    </tr>
                  )) : <tr><td colSpan="6" className="no-data">⚖️ No judges assigned yet — add one above ↑</td></tr>}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {/* ---------------- EDIT POPUP ---------------- */}
        {editPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>Edit Event</h2>

              <input
                type="text"
                value={editEvent.event_name || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, event_name: e.target.value })
                }
              />

              <textarea
                value={editEvent.description || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, description: e.target.value })
                }
              ></textarea>

              <select
                value={editEvent.event_scope || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, event_scope: e.target.value })
                }
              >
                <option value="">Select Scope</option>
                <option value="intra-college">Intra-College</option>
                <option value="inter-college">Inter-College</option>
                <option value="zonal">Zonal</option>
              </select>

              <input
                type="number"
                placeholder="Capacity"
                value={editEvent.capacity || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, capacity: e.target.value })
                }
                min="1"
              />

              <input
                type="date"
                value={editEvent.date ? editEvent.date.split("T")[0] : ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, date: e.target.value })
                }
              />

              <input
                type="time"
                value={editEvent.time || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, time: e.target.value })
                }
              />

              <input
                type="text"
                value={editEvent.location || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, location: e.target.value })
                }
              />

              <label className="form-label-small">Registration Deadline</label>
              <input
                type="date"
                value={editEvent.registration_deadline ? editEvent.registration_deadline.split("T")[0] : ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, registration_deadline: e.target.value })
                }
              />

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button className="save-btn" onClick={updateEvent}>
                  Save Changes
                </button>

                <button
                  className="close-btn"
                  onClick={() => setEditPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal open={!!confirmation} action={confirmation?.type === "judge" ? "remove" : "delete"} itemName={confirmation?.name} onClose={() => setConfirmation(null)} onConfirm={() => { if (confirmation.type === "judge") deleteJudge(confirmation.id); else deleteEvent(confirmation.id); setConfirmation(null); }} />
    </div>
  );
}
