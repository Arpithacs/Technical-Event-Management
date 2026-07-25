import express from "express";
import bcrypt from "bcrypt";
import pool, { sql } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM users WHERE email = @email");

    if (result.recordset.length > 0) {
      const user = result.recordset[0];

      // Compare plaintext input against bcrypt hash
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Save user session
      req.session.user = {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        college_name: user.college_name,
      };

      console.log("Session Created:", req.session.user);

      return res.json({
        success: true,
        message: "Login successful",
        user: req.session.user,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out" });
  });
});

export default router;
