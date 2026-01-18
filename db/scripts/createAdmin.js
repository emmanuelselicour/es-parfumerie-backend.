import bcrypt from "bcryptjs";
import db from "../db/database.js";

const email = "admin@es.com";
const password = "admin123";

const hash = await bcrypt.hash(password, 10);

db.prepare("INSERT INTO admins (email, password) VALUES (?, ?)").run(email, hash);
console.log("Admin créé");
