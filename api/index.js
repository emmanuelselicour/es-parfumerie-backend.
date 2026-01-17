const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// Register
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hash });

  try {
    await newUser.save();
    res.status(201).json({ message: "Compte créé" });
  } catch (err) {
    res.status(400).json({ message: "Email déjà utilisé" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { name: user.name, email: user.email } });
});

app.listen(3000, () => console.log("Server running"));
