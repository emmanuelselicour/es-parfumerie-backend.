const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserById } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;

async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await createUser(email, passwordHash);

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({ token });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
}

async function me(req, res) {
  const user = await findUserById(req.userId);
  res.json(user);
}

module.exports = {
  register,
  login,
  me
};
