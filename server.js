require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'ES Parfumerie API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      auth: '/api/auth',
      users: '/api/users'
    }
  });
});

// Route pour les produits
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour ajouter un produit (protégée)
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body;
    
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, category, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, stock, category, image]
    );
    
    res.status(201).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
