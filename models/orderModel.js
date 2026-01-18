const pool = require("../db");

async function createOrder(user_id, products, total) {
  const res = await pool.query(
    "INSERT INTO orders (user_id, products, total) VALUES ($1,$2,$3) RETURNING *",
    [user_id, products, total]
  );
  return res.rows[0];
}

async function getAllOrders() {
  const res = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
  return res.rows;
}

module.exports = {
  createOrder,
  getAllOrders
};
