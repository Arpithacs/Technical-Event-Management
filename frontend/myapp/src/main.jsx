import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ToastProvider.jsx";
import Footer from "./components/Footer.jsx";

import App from "./App.jsx";
import Events from "./pages/Events.jsx";
import ParticipantAuth from "./pages/ParticipantAuth.jsx";
import OrganizerAuth from "./pages/OrganizerAuth.jsx";
import Contact from "./pages/Contact.jsx";
import Pregister from "./pages/Pregister.jsx";
import ParticipantDashboard from "./pages/ParticipantDashboard.jsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider><AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<App />} />
          <Route path="/events" element={<Events />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth */}
          <Route path="/participant/auth" element={<ParticipantAuth />} />
          <Route path="/organizer/auth" element={<OrganizerAuth />} />

          {/* Participant (authenticated) */}
          <Route path="/pregister" element={<Pregister />} />
          <Route
            path="/participant/dashboard"
            element={<ParticipantDashboard />}
          />

          {/* Organizer (authenticated) */}
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        </Routes>
        <Footer />
      </AuthProvider></ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
