import React from "react";
import { Link } from "react-router-dom";
import "./shared.css";
export default function Footer() { return <footer className="site-footer"><span><b>TF</b> TechFest Portal</span><span><Link to="/events">Events</Link><Link to="/contact">Contact</Link></span><small>© 2026 TechFest Portal</small></footer>; }
