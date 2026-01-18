import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/database.js";

const router = express.Router();

/* ADMIN LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
  if (!admin) return res.status(400).json({ message: "Admin non trouvé" });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(400).json({ message: "Mot de passe incorrect" });

  const token = jwt.sign(
    { id: admin.id, role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export default router;

