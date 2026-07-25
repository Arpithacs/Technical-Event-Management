import express from "express";
import pool, { sql } from "../db.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
  const { fullname, email, phone, event_id, college_name } = req.body;
  const userId = req.session.user.id;

  if (!fullname || !email || !phone || !event_id) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("eventId", sql.Int, event_id)
      .input("fullname", sql.VarChar, fullname)
      .input("email", sql.VarChar, email)
      .input("phone", sql.VarChar, phone)
      .input("college_name", sql.VarChar, college_name || req.session.user.college_name || null)
      .query(`
        INSERT INTO registrations (user_id, event_id, fullname, email, phone, college_name)
        VALUES (@userId, @eventId, @fullname, @email, @phone, @college_name)
      `);

    res.status(200).json({ message: "Registration successful!" });
  } catch (err) {
    // Duplicate registration — caught by DB-level UNIQUE constraint
    // Error 2627 = unique constraint violation, 2601 = unique index violation
    // Also match constraint name as backstop
    if (
      err.number === 2627 ||
      err.number === 2601 ||
      (err.message && err.message.includes("UQ_user_event"))
    ) {
      return res.status(409).json({ message: "You have already registered for this event." });
    }
    console.error("Error inserting registration:", err);
    return res.status(500).json({ message: "Database error." });
  }
});

export default router;
