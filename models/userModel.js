const pool = require("../db");

async function createUser(email, passwordHash) {
  const result = await pool.query(
    "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
    [email, passwordHash]
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query(
    "SELECT id, email FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
