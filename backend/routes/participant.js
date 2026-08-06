import express from "express";
import pool, { sql } from "../db.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /me — return current user from session (or 401)
router.get("/me", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.status(401).json({ loggedIn: false });
});

// Fetch ALL registrations of the logged-in user (joined with events)
router.get("/registrations", isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT 
          r.id,
          r.event_id,
          e.event_name,
          e.date AS event_date,
          e.time AS event_time,
          e.event_scope,
          e.location,
          r.fullname,
          r.email,
          r.phone,
          r.college_name,
          r.created_at
        FROM registrations r
        JOIN events e ON r.event_id = e.event_id
        WHERE r.user_id = @userId
        ORDER BY r.created_at DESC
      `);

    return res.json({
      success: true,
      total: result.recordset.length,
      registrations: result.recordset,
    });
  } catch (err) {
    console.error("DB Error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Delete a registration
router.delete("/registrations/:id", isAuthenticated, async (req, res) => {
  const regId = req.params.id;
  const userId = req.session.user.id;

  try {
    const result = await pool
      .request()
      .input("regId", sql.Int, regId)
      .input("userId", sql.Int, userId)
      .query("DELETE FROM registrations WHERE id = @regId AND user_id = @userId");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Registration not found" });
    }
    return res.json({ success: true, message: "Registration cancelled" });
  } catch (err) {
    console.error("Delete registration error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

export default router;
