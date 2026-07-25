import express from "express";
import bcrypt from "bcrypt";
import pool, { sql } from "../db.js";

const router = express.Router();

const SALT_ROUNDS = 10;

router.post("/", async (req, res) => {
  const { fullname, email, password, phone, college_name } = req.body;

  if (!fullname || !email || !password || !phone) {
    return res.status(400).json({ message: "All fields are required (college_name is optional)." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await pool
      .request()
      .input("fullname", sql.VarChar, fullname)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .input("phone", sql.VarChar, phone)
      .input("college_name", sql.VarChar, college_name || null)
      .query(
        "INSERT INTO users (fullname, email, password, phone, college_name) VALUES (@fullname, @email, @password, @phone, @college_name)"
      );

    res.status(200).json({ message: "Signup successful!" });
  } catch (err) {
    console.error("SQL Server Error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
