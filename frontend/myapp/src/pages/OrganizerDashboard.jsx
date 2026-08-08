import React, { useEffect, useState } from "react";
import OrganizerNavbar from "../components/OrganizerNavbar.jsx";
import { useToast } from "../utils/useToast.js";
import ConfirmModal from "../components/ConfirmModal.jsx";
import "./OrganizerDashboard.css";
import { API_URL } from "../utils/api.js";
import PageLayout from "../components/PageLayout.jsx";
import ThemedDatePicker from "../components/ThemedDatePicker.jsx";

const toDateValue = (value) => (value ? new Date(`${value}T00:00:00`) : null);
const formatDateValue = (value) => value.toISOString().slice(0, 10);
const formatTimeValue = (value) => value.toTimeString().slice(0, 5);

export default function OrganizerDashboard() {
  const { showToast } = useToast();
  const [confirmation, setConfirmation] = useState(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [participantPage, setParticipantPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
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
  const [eventFormError, setEventFormError] = useState("");
  const [editEventError, setEditEventError] = useState("");
  const [judgeFormError, setJudgeFormError] = useState("");

  /* -------------------- Fetch Summary ------------------ */
  useEffect(() => {
    fetch(`${API_URL}/api/organizer/summary`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch((err) => console.error("Summary fetch error:", err));
  }, []);

  /* -------------------- Fetch Participants ------------------ */
  useEffect(() => {
    if (selected === "participants") {
      fetch(`${API_URL}/api/organizer/registrations`, {
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
      fetch(`${API_URL}/api/organizer/events`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setEvents(data.events || []))
        .catch((err) => console.error("Events fetch error:", err));
    }
  }, [selected]);

  useEffect(() => {
    if (selected !== "judges") return;

    Promise.all([
      fetch(`${API_URL}/api/organizer/judges`, { credentials: "include" }).then((res) => res.json()),
      fetch(`${API_URL}/api/organizer/events`, { credentials: "include" }).then((res) => res.json()),
    ])
      .then(([judgeData, eventData]) => {
        setJudges(judgeData.judges || []);
        setEvents(eventData.events || []);
      })
      .catch((err) => console.error("Judge fetch error:", err));
  }, [selected]);

  /* -------------------- Fetch My Events (Dashboard) ------------------ */
  useEffect(() => {
    if (selected === "dashboard") {
      fetch(`${API_URL}/api/organizer/my-events`, {
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
    setEventFormError("");
    if (!Number.isFinite(Number(eventForm.capacity)) || Number(eventForm.capacity) <= 0) {
      setEventFormError("Capacity must be a number greater than 0.");
      return;
    }
    if (eventForm.registration_deadline && `${eventForm.registration_deadline}T00:00` >= `${eventForm.date}T${eventForm.time}`) {
      setEventFormError("Registration deadline must be before the event date and time.");
      return;
    }

    fetch(`${API_URL}/api/organizer/add-event`, {
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
        showToast("Failed to add event", "error");
      });
  };

  /* -------------------- Delete Event ------------------ */
  const deleteEvent = (id) => {

    fetch(`${API_URL}/api/organizer/delete-event/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        showToast(data.message || "Event deleted");

        fetch(`${API_URL}/api/organizer/my-events`, {
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
    fetch(`${API_URL}/api/organizer/judges`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setJudges(data.judges || []));
  };

  const handleAddJudge = (e) => {
    e.preventDefault();
    setJudgeFormError("");
    if (!judgeForm.name.trim() || !judgeForm.contact_no.trim() || !judgeForm.expertise_area.trim()) {
      setJudgeFormError("Name, contact number, and expertise area are required.");
      return;
    }
    if (!/^\d{10}$/.test(judgeForm.contact_no)) {
      setJudgeFormError("Contact number must contain exactly 10 digits.");
      return;
    }
    fetch(`${API_URL}/api/organizer/judges${editingJudgeId ? `/${editingJudgeId}` : ""}`, {
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
      .catch((err) => showToast(err.message, "error"));
  };

  const deleteJudge = (id) => {
    fetch(`${API_URL}/api/organizer/judges/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to remove judge");
        refreshJudges(); showToast("Judge removed");
      })
      .catch((err) => showToast(err.message, "error"));
  };

  const editJudge = (judge) => {
    setEditingJudgeId(judge.judge_id);
    setJudgeForm({ name: judge.name, contact_no: judge.contact_no, expertise_area: judge.expertise_area, event_id: String(judge.event_id) });
  };

  const filteredParticipants = participants.filter((p) => `${p.fullname} ${p.email} ${p.college_name || ""} ${p.event_name}`.toLowerCase().includes(participantSearch.toLowerCase()));
  const filteredEvents = events.filter((e) => `${e.event_name} ${e.location || ""}`.toLowerCase().includes(eventSearch.toLowerCase()));
  const pageSize = 10;
  const participantPageCount = Math.max(1, Math.ceil(filteredParticipants.length / pageSize));
  const eventPageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const visibleParticipants = filteredParticipants.slice((participantPage - 1) * pageSize, participantPage * pageSize);
  const visibleEvents = filteredEvents.slice((eventPage - 1) * pageSize, eventPage * pageSize);
  useEffect(() => {
    setParticipantPage((page) => Math.min(page, participantPageCount));
  }, [participantPageCount]);
  useEffect(() => {
    setEventPage((page) => Math.min(page, eventPageCount));
  }, [eventPageCount]);
  const rangeLabel = (page, total) => {
    if (total === 0) return "Showing 0–0 of 0";
    const start = (page - 1) * pageSize + 1;
    return `Showing ${start}–${Math.min(page * pageSize, total)} of ${total}`;
  };
  const exportParticipants = () => {
    const headers = ["ID", "Full Name", "Email", "Phone", "College", "Event", "Scope", "Registered On"];
    const rows = filteredParticipants.map((p) => [
      p.registration_id, p.fullname, p.email, p.phone, p.college_name || "",
      p.event_name, p.event_scope || "", p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "participants.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("CSV exported");
  };

  /* -------------------- OPEN EDIT POPUP ------------------ */
  const openEdit = (ev) => {
    setEditEvent({ ...ev });
    setEditPopup(true);
  };

  /* -------------------- UPDATE EVENT ------------------ */
  const updateEvent = () => {
    setEditEventError("");
    if (!Number.isFinite(Number(editEvent.capacity)) || Number(editEvent.capacity) <= 0) {
      setEditEventError("Capacity must be a number greater than 0.");
      return;
    }
    if (editEvent.registration_deadline && `${editEvent.registration_deadline}T00:00` >= `${editEvent.date}T${editEvent.time}`) {
      setEditEventError("Registration deadline must be before the event date and time.");
      return;
    }
    let cleanDate = editEvent.date;
    if (cleanDate && cleanDate.includes("T")) {
      cleanDate = cleanDate.split("T")[0];
    }

    let cleanTime = editEvent.time;
    if (cleanTime && cleanTime.length > 5) {
      cleanTime = cleanTime.substring(0, 5);
    }

    fetch(
      `${API_URL}/api/organizer/update-event/${editEvent.event_id}`,
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

        fetch(`${API_URL}/api/organizer/my-events`, {
          credentials: "include",
        })
          .then((res) => res.json())
          .then((data) => setMyEvents(data.events || []));
      });
  };

  return (
    <div>
      <OrganizerNavbar selected={selected} setSelected={setSelected} />

      <PageLayout title="Organizer Dashboard">
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

            {/* ---------------- EVENT OVERVIEW TABLE ---------------- */}
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
                          ? `${Math.min(Number(ev.registered_count ?? (ev.capacity - (ev.seats_left || 0))), Number(ev.capacity))}/${ev.capacity}`
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
            <div className="table-tools">
              <input value={participantSearch} onChange={(e) => { setParticipantSearch(e.target.value); setParticipantPage(1); }} placeholder="Search by name, email, college, or event" />
              <button className="secondary-btn" onClick={exportParticipants}>Export CSV</button>
            </div>

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
                  visibleParticipants.map((p) => (
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
            <div className="pagination-controls">
            <span>{rangeLabel(participantPage, filteredParticipants.length)}</span>
            <button className="secondary-btn" disabled={participantPage === 1} onClick={() => setParticipantPage((page) => page - 1)}>Previous</button>
            <button className="secondary-btn" disabled={participantPage >= participantPageCount} onClick={() => setParticipantPage((page) => page + 1)}>Next</button>
            </div>
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
                <ThemedDatePicker selected={toDateValue(eventForm.date)} value={eventForm.date} onChange={(value) => setEventForm({ ...eventForm, date: value ? formatDateValue(value) : "" })} placeholderText="Select event date" required />

                <label>Event Start Time</label>
                <ThemedDatePicker value={eventForm.time ? `1970-01-01T${eventForm.time}` : ""} onChange={(value) => setEventForm({ ...eventForm, time: value ? formatTimeValue(value) : "" })} showTimeSelect showTimeSelectOnly placeholderText="Select start time" required />

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
                <ThemedDatePicker value={eventForm.registration_deadline} onChange={(value) => setEventForm({ ...eventForm, registration_deadline: value ? formatDateValue(value) : "" })} placeholderText="Select registration deadline" />
                {eventFormError && <p className="inline-error">{eventFormError}</p>}

                <button type="submit" className="add-btn">
                  Add Event
                </button>
              </form>
            </div>

            {/* RIGHT EVENTS TABLE */}
            <div className="event-list-section">
              <h2>All Events</h2>
              <div className="table-tools">
                <input value={eventSearch} onChange={(e) => { setEventSearch(e.target.value); setEventPage(1); }} placeholder="Search by event name or location" />
              </div>

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
                    visibleEvents.map((ev) => (
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
                            ? `${Math.min(Number(ev.registered_count ?? (ev.capacity - (ev.seats_left || 0))), Number(ev.capacity))}/${ev.capacity}`
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
              <div className="pagination-controls">
                <span>{rangeLabel(eventPage, filteredEvents.length)}</span>
                <button className="secondary-btn" disabled={eventPage === 1} onClick={() => setEventPage((page) => page - 1)}>Previous</button>
                <button className="secondary-btn" disabled={eventPage >= eventPageCount} onClick={() => setEventPage((page) => page + 1)}>Next</button>
              </div>
            </div>
          </div>
        )}

        {selected === "judges" && (
          <div className="content-box judges-layout">
            <section className="event-form-section">
              <h2>{editingJudgeId ? "Edit Judge Assignment" : "Assign a Judge"}</h2>
              <form className="event-form" onSubmit={handleAddJudge}>
                <label>Judge Name</label>
                <input value={judgeForm.name} onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })} placeholder="Full name" />
                <label>Contact Number</label>
                <input type="tel" inputMode="numeric" value={judgeForm.contact_no} onChange={(e) => setJudgeForm({ ...judgeForm, contact_no: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Contact number" />
                <label>Expertise Area</label>
                <input value={judgeForm.expertise_area} onChange={(e) => setJudgeForm({ ...judgeForm, expertise_area: e.target.value })} placeholder="e.g. Artificial Intelligence" />
                <label>Assigned Event</label>
                <select required value={judgeForm.event_id} onChange={(e) => setJudgeForm({ ...judgeForm, event_id: e.target.value })}>
                  <option value="">Select an event</option>
                  {events.map((event) => <option key={event.event_id} value={event.event_id}>{event.event_name}</option>)}
                </select>
                <button type="submit" className="add-btn">{editingJudgeId ? "Save Judge" : "Assign Judge"}</button>
                {judgeFormError && <p className="inline-error">{judgeFormError}</p>}
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

              <ThemedDatePicker value={editEvent.date} onChange={(value) => setEditEvent({ ...editEvent, date: value ? formatDateValue(value) : "" })} placeholderText="Select event date" />

              <ThemedDatePicker value={editEvent.time ? `1970-01-01T${editEvent.time}` : ""} onChange={(value) => setEditEvent({ ...editEvent, time: value ? formatTimeValue(value) : "" })} showTimeSelect showTimeSelectOnly placeholderText="Select start time" />

              <input
                type="text"
                value={editEvent.location || ""}
                onChange={(e) =>
                  setEditEvent({ ...editEvent, location: e.target.value })
                }
              />

              <label className="form-label-small">Registration Deadline</label>
              <ThemedDatePicker value={editEvent.registration_deadline} onChange={(value) => setEditEvent({ ...editEvent, registration_deadline: value ? formatDateValue(value) : "" })} placeholderText="Select registration deadline" />
              {editEventError && <p className="inline-error">{editEventError}</p>}

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
      </PageLayout>
      <ConfirmModal
        isOpen={!!confirmation}
        title={confirmation?.type === "judge" ? "Remove judge" : "Delete event"}
        message={confirmation?.type === "judge"
          ? `Are you sure you want to remove ${confirmation?.name}?`
          : `Are you sure you want to delete ${confirmation?.name}? This action cannot be undone.`}
        confirmLabel={confirmation?.type === "judge" ? "Remove" : "Delete"}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => { if (confirmation.type === "judge") deleteJudge(confirmation.id); else deleteEvent(confirmation.id); setConfirmation(null); }}
      />
    </div>
  );
}
