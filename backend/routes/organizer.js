import express from "express";
import bcrypt from "bcrypt";
import pool, { sql } from "../db.js";
import { isOrganizer } from "../middleware/organizerAuth.js";

const router = express.Router();

/* --------------------------------------
   GET /me — return current organizer from session (or 401)
--------------------------------------- */
router.get("/me", (req, res) => {
  if (req.session && req.session.organizer) {
    return res.json({ loggedIn: true, organizer: req.session.organizer });
  }
  return res.status(401).json({ loggedIn: false });
});

/* --------------------------------------
   ORGANIZER LOGIN
--------------------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM organizer WHERE email = @email");

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const organizer = result.recordset[0];
    const match = await bcrypt.compare(password, organizer.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    req.session.organizer = {
      id: organizer.organizer_id,
      name: organizer.name,
      email: organizer.email,
      dept: organizer.department,
    };

    return res.json({
      success: true,
      message: "Organizer Login Successful",
      organizer: req.session.organizer,
    });
  } catch (err) {
    return res.status(500).json({ message: "Database error", err: err.message });
  }
});

/* --------------------------------------
   DASHBOARD SUMMARY  (uses event_organizer junction)
--------------------------------------- */
router.get("/summary", isOrganizer, async (req, res) => {
  const organizerId = req.session.organizer.id;

  try {
    const r1 = await pool
      .request()
      .input("organizerId", sql.Int, organizerId)
      .query("SELECT COUNT(*) AS totalEvents FROM event_organizer WHERE organizer_id = @organizerId");

    const r2 = await pool.request()
      .query("SELECT COUNT(*) AS totalParticipants FROM registrations");

    const r3 = await pool.request()
      .query("SELECT COUNT(*) AS upcoming FROM events WHERE [date] > GETDATE()");

    const r4 = await pool.request()
      .query("SELECT COUNT(*) AS completed FROM events WHERE [date] < GETDATE()");

    const r5 = await pool.request().query("SELECT COUNT(*) AS totalJudges FROM judge");

    return res.json({
      success: true,
      totalEvents: r1.recordset[0]?.totalEvents || 0,
      totalParticipants: r2.recordset[0]?.totalParticipants || 0,
      upcoming: r3.recordset[0]?.upcoming || 0,
      completed: r4.recordset[0]?.completed || 0,
      totalJudges: r5.recordset[0]?.totalJudges || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* --------------------------------------
   GET ALL REGISTRATIONS  (joined with events)
--------------------------------------- */
router.get("/registrations", isOrganizer, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        r.id AS registration_id,
        r.event_id,
        e.event_name,
        e.event_scope,
        r.fullname,
        r.email,
        r.phone,
        r.college_name,
        r.created_at
      FROM registrations r
      JOIN events e ON r.event_id = e.event_id
      ORDER BY r.id DESC
    `);

    return res.json({ success: true, participants: result.recordset });
  } catch (err) {
    console.error("REGISTRATION FETCH ERROR:", err);
    return res.status(500).json({ success: false, message: "DB Error" });
  }
});

/* --------------------------------------
   ADD EVENT  (transaction: events + event_organizer junction)
--------------------------------------- */
router.post("/add-event", isOrganizer, async (req, res) => {
  const {
    event_name, description, date, time, location,
    event_scope, capacity, registration_deadline,
  } = req.body;
  const organizerId = req.session.organizer.id;

  if (!event_name || !date || !time || !location) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const insertResult = await new sql.Request(transaction)
      .input("event_name", sql.VarChar, event_name)
      .input("description", sql.VarChar, description || "")
      .input("date", sql.Date, new Date(date))
      .input("time", sql.VarChar, time)
      .input("location", sql.VarChar, location)
      .input("event_scope", sql.VarChar, event_scope || null)
      .input("capacity", sql.Int, capacity || null)
      .input("registration_deadline", sql.Date, registration_deadline ? new Date(registration_deadline) : null)
      .query(`
        INSERT INTO events (event_name, description, [date], [time], location, event_scope, capacity, registration_deadline)
        OUTPUT INSERTED.event_id
        VALUES (@event_name, @description, @date, @time, @location, @event_scope, @capacity, @registration_deadline)
      `);

    const newEventId = insertResult.recordset[0].event_id;

    await new sql.Request(transaction)
      .input("event_id", sql.Int, newEventId)
      .input("organizer_id", sql.Int, organizerId)
      .input("role", sql.VarChar, "lead")
      .query(`
        INSERT INTO event_organizer (event_id, organizer_id, role)
        VALUES (@event_id, @organizer_id, @role)
      `);

    await transaction.commit();
    return res.json({ success: true, message: "Event added successfully!", event_id: newEventId });
  } catch (err) {
    await transaction.rollback().catch(() => {});
    console.error("EVENT INSERT ERROR:", err);
    return res.status(500).json({ success: false, message: "DB Error" });
  }
});

/* --------------------------------------
   GET ALL EVENTS  (includes new fields)
--------------------------------------- */
router.get("/events", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        e.event_id, e.event_name, e.description,
        e.date, e.time, e.location,
        e.event_scope, e.capacity, e.registration_deadline,
        ISNULL(rc.reg_count, 0) AS registered_count,
        CASE WHEN e.capacity - ISNULL(rc.reg_count, 0) < 0 THEN 0
             ELSE e.capacity - ISNULL(rc.reg_count, 0) END AS seats_left,
        STRING_AGG(o.name, ', ') AS organizers
      FROM events e
      LEFT JOIN event_organizer eo ON e.event_id = eo.event_id
      LEFT JOIN organizer o ON eo.organizer_id = o.organizer_id
      LEFT JOIN (
        SELECT event_id, COUNT(*) AS reg_count
        FROM registrations
        GROUP BY event_id
      ) rc ON e.event_id = rc.event_id
      GROUP BY e.event_id, e.event_name, e.description,
               e.date, e.time, e.location,
               e.event_scope, e.capacity, e.registration_deadline,
               rc.reg_count
      ORDER BY e.event_id DESC
    `);

    return res.json({ success: true, events: result.recordset });
  } catch (err) {
    console.error("EVENTS FETCH ERROR:", err);
    return res.status(500).json({ success: false, message: "DB Error" });
  }
});

/* --------------------------------------
   MY EVENTS  (via event_organizer junction)
--------------------------------------- */
router.get("/my-events", isOrganizer, async (req, res) => {
  const organizerId = req.session.organizer.id;

  try {
    const result = await pool
      .request()
      .input("organizerId", sql.Int, organizerId)
      .query(`
        SELECT e.event_id, e.event_name, e.description,
               e.date, e.time, e.location,
               e.event_scope, e.capacity, e.registration_deadline,
               ISNULL(rc.reg_count, 0) AS registered_count,
               CASE WHEN e.capacity - ISNULL(rc.reg_count, 0) < 0 THEN 0
                    ELSE e.capacity - ISNULL(rc.reg_count, 0) END AS seats_left,
               eo.role
        FROM events e
        JOIN event_organizer eo ON e.event_id = eo.event_id
        LEFT JOIN (
          SELECT event_id, COUNT(*) AS reg_count
          FROM registrations
          GROUP BY event_id
        ) rc ON e.event_id = rc.event_id
        WHERE eo.organizer_id = @organizerId
        ORDER BY e.date ASC
      `);

    res.json({ success: true, events: result.recordset });
  } catch (err) {
    return res.status(500).json({ success: false, err: err.message });
  }
});

/* --------------------------------------
   DELETE EVENT
--------------------------------------- */
router.delete("/delete-event/:id", isOrganizer, async (req, res) => {
  const eventId = req.params.id;

  try {
    await pool
      .request()
      .input("eventId", sql.Int, eventId)
      .query("DELETE FROM events WHERE event_id = @eventId");

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, err: err.message });
  }
});

/* --------------------------------------
   UPDATE EVENT  (includes new fields)
--------------------------------------- */
router.put("/update-event/:id", isOrganizer, async (req, res) => {
  const eventId = req.params.id;
  const {
    event_name, description, date, time, location,
    event_scope, capacity, registration_deadline,
  } = req.body;

  try {
    await pool
      .request()
      .input("event_name", sql.VarChar, event_name)
      .input("description", sql.VarChar, description || "")
      .input("date", sql.Date, new Date(date))
      .input("time", sql.VarChar, time)
      .input("location", sql.VarChar, location)
      .input("event_scope", sql.VarChar, event_scope || null)
      .input("capacity", sql.Int, capacity || null)
      .input("registration_deadline", sql.Date, registration_deadline ? new Date(registration_deadline) : null)
      .input("eventId", sql.Int, eventId)
      .query(`
        UPDATE events 
        SET event_name = @event_name, description = @description,
            [date] = @date, [time] = @time, location = @location,
            event_scope = @event_scope, capacity = @capacity,
            registration_deadline = @registration_deadline
        WHERE event_id = @eventId
      `);

    res.json({ success: true, message: "Event updated successfully!" });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return res.status(500).json({ success: false, message: "DB Error", err: err.message });
  }
});

/* ======================================================
   SPONSORS  (standalone CRUD + event linking)
====================================================== */

// List all sponsors
router.get("/sponsors", isOrganizer, async (req, res) => {
  try {
    const result = await pool.request().query("SELECT * FROM sponsor ORDER BY sponsor_id DESC");
    res.json({ success: true, sponsors: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

// Add sponsor
router.post("/sponsors", isOrganizer, async (req, res) => {
  const { name, company, contact_email, contact_phone, amount } = req.body;
  if (!name) return res.status(400).json({ success: false, message: "Name is required" });

  try {
    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("company", sql.VarChar, company || null)
      .input("contact_email", sql.VarChar, contact_email || null)
      .input("contact_phone", sql.VarChar, contact_phone || null)
      .input("amount", sql.Decimal(12, 2), amount || null)
      .query(`
        INSERT INTO sponsor (name, company, contact_email, contact_phone, amount)
        VALUES (@name, @company, @contact_email, @contact_phone, @amount)
      `);
    res.json({ success: true, message: "Sponsor added" });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

// Link sponsor to event
router.post("/event-sponsor", isOrganizer, async (req, res) => {
  const { event_id, sponsor_id, contribution } = req.body;
  if (!event_id || !sponsor_id) return res.status(400).json({ success: false, message: "event_id and sponsor_id required" });

  try {
    await pool
      .request()
      .input("event_id", sql.Int, event_id)
      .input("sponsor_id", sql.Int, sponsor_id)
      .input("contribution", sql.VarChar, contribution || null)
      .query(`
        INSERT INTO event_sponsor (event_id, sponsor_id, contribution)
        VALUES (@event_id, @sponsor_id, @contribution)
      `);
    res.json({ success: true, message: "Sponsor linked to event" });
  } catch (err) {
    if (err.message && err.message.includes("UQ_event_sponsor")) {
      return res.status(409).json({ message: "This sponsor is already linked to this event." });
    }
    res.status(500).json({ success: false, err: err.message });
  }
});

// Get sponsors for an event
router.get("/event-sponsors/:eventId", isOrganizer, async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("eventId", sql.Int, req.params.eventId)
      .query(`
        SELECT s.*, es.contribution
        FROM sponsor s
        JOIN event_sponsor es ON s.sponsor_id = es.sponsor_id
        WHERE es.event_id = @eventId
      `);
    res.json({ success: true, sponsors: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

/* ======================================================
   JUDGES  (organizer-only private directory)
====================================================== */

router.get("/judges", isOrganizer, async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT j.judge_id, j.name, j.expertise_area, j.contact_no, j.event_id,
             e.event_name AS assigned_event
      FROM judge j
      LEFT JOIN events e ON e.event_id = j.event_id
      ORDER BY j.judge_id DESC
    `);
    res.json({ success: true, judges: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

router.post("/judges", isOrganizer, async (req, res) => {
  const { name, expertise_area, contact_no, event_id } = req.body;
  if (!name || !contact_no || !expertise_area || !event_id) {
    return res.status(400).json({ success: false, message: "Name, contact, expertise area, and assigned event are required" });
  }

  try {
    await pool
      .request()
      .input("name", sql.VarChar, name)
      .input("expertise_area", sql.VarChar, expertise_area || null)
      .input("contact_no", sql.VarChar, contact_no || null)
      .input("event_id", sql.Int, event_id)
      .query(`
        INSERT INTO judge (name, expertise_area, contact_no, event_id)
        VALUES (@name, @expertise_area, @contact_no, @event_id)
      `);
    res.json({ success: true, message: "Judge added" });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

router.put("/judges/:id", isOrganizer, async (req, res) => {
  const { name, expertise_area, contact_no, event_id } = req.body;
  if (!name || !contact_no || !expertise_area || !event_id) {
    return res.status(400).json({ success: false, message: "Name, contact, expertise area, and assigned event are required" });
  }
  try {
    await pool.request()
      .input("judgeId", sql.Int, req.params.id)
      .input("name", sql.VarChar, name)
      .input("expertise_area", sql.VarChar, expertise_area)
      .input("contact_no", sql.VarChar, contact_no)
      .input("event_id", sql.Int, event_id)
      .query(`UPDATE judge SET name = @name, expertise_area = @expertise_area,
              contact_no = @contact_no, event_id = @event_id WHERE judge_id = @judgeId`);
    res.json({ success: true, message: "Judge updated" });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

router.delete("/judges/:id", isOrganizer, async (req, res) => {
  try {
    await pool
      .request()
      .input("judgeId", sql.Int, req.params.id)
      .query("DELETE FROM judge WHERE judge_id = @judgeId");
    res.json({ success: true, message: "Judge removed" });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

/* ======================================================
   RESULTS  (one per participant per event)
====================================================== */

// Get results for an event
router.get("/results/:eventId", isOrganizer, async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("eventId", sql.Int, req.params.eventId)
      .query(`
        SELECT r.result_id, r.position, r.score, r.remarks,
               u.fullname AS participant_name, u.email
        FROM results r
        JOIN users u ON r.user_id = u.id
        WHERE r.event_id = @eventId
        ORDER BY r.position ASC
      `);
    res.json({ success: true, results: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

// Add / update result
router.post("/results", isOrganizer, async (req, res) => {
  const { event_id, user_id, position, score, remarks } = req.body;
  if (!event_id || !user_id) return res.status(400).json({ success: false, message: "event_id and user_id required" });

  try {
    // Upsert: update if exists, insert if not
    const existing = await pool
      .request()
      .input("event_id", sql.Int, event_id)
      .input("user_id", sql.Int, user_id)
      .query("SELECT result_id FROM results WHERE event_id = @event_id AND user_id = @user_id");

    if (existing.recordset.length > 0) {
      await pool
        .request()
        .input("result_id", sql.Int, existing.recordset[0].result_id)
        .input("position", sql.Int, position || null)
        .input("score", sql.Decimal(8, 2), score || null)
        .input("remarks", sql.VarChar, remarks || null)
        .query("UPDATE results SET position = @position, score = @score, remarks = @remarks WHERE result_id = @result_id");
    } else {
      await pool
        .request()
        .input("event_id", sql.Int, event_id)
        .input("user_id", sql.Int, user_id)
        .input("position", sql.Int, position || null)
        .input("score", sql.Decimal(8, 2), score || null)
        .input("remarks", sql.VarChar, remarks || null)
        .query(`
          INSERT INTO results (event_id, user_id, position, score, remarks)
          VALUES (@event_id, @user_id, @position, @score, @remarks)
        `);
    }

    res.json({ success: true, message: "Result saved" });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

export default router;
