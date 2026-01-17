import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/database.js";

const router = express.Router();

/* REGISTER */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(email);

    if (existing) {
      return res.status(400).json({ message: "Utilisateur déjà existant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    ).run(name, email, hashedPassword);

    res.status(201).json({ message: "Compte créé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).get(email);

    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
