const pool = require("../db");

async function createProduct(name, description, price, image) {
  const res = await pool.query(
    "INSERT INTO products (name, description, price, image) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, description, price, image]
  );
  return res.rows[0];
}

async function getAllProducts() {
  const res = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
  return res.rows;
}

async function getProductById(id) {
  const res = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  return res.rows[0];
}

async function updateProduct(id, name, description, price, image) {
  const res = await pool.query(
    "UPDATE products SET name=$1, description=$2, price=$3, image=$4 WHERE id=$5 RETURNING *",
    [name, description, price, image, id]
  );
  return res.rows[0];
}

async function deleteProduct(id) {
  await pool.query("DELETE FROM products WHERE id=$1", [id]);
}

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
