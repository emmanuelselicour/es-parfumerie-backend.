const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, getUserByEmail } = require("../models/userModel");

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const userExist = await getUserByEmail(email);
  if (userExist) return res.status(400).json({ message: "Email already used" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser(name, email, hashedPassword);
  res.json({ user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;
