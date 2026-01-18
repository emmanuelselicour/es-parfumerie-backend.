const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const db = require('../models/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// GET tous les produits
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST créer un nouveau produit (Admin uniquement)
router.post('/', 
  authenticateToken,
  isAdmin,
  [
    check('name').notEmpty().withMessage('Le nom est requis'),
    check('description').notEmpty().withMessage('La description est requise'),
    check('price').isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
    check('stock').isInt({ min: 0 }).withMessage('Le stock doit être un entier positif'),
    check('category').isIn(['men', 'women', 'unisex']).withMessage('Catégorie invalide')
  ],
  async (req, res) => {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { name, description, price, stock, category, image_url, features } = req.body;

      const result = await db.query(
        `INSERT INTO products 
         (name, description, price, stock, category, image_url, features) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [name, description, price, stock, category, image_url, features || []]
      );

      res.status(201).json({
        success: true,
        message: 'Produit créé avec succès',
        product: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

// PUT mettre à jour un produit (Admin uniquement)
router.put('/:id',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Vérifier si le produit existe
      const checkResult = await db.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Produit non trouvé'
        });
      }

      // Construire la requête dynamique
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (['name', 'description', 'price', 'stock', 'category', 'image_url', 'features', 'is_active'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Aucune donnée valide à mettre à jour'
        });
      }

      values.push(id);
      const query = `
        UPDATE products 
        SET ${fields.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await db.query(query, values);

      res.json({
        success: true,
        message: 'Produit mis à jour avec succès',
        product: result.rows[0]
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

// DELETE supprimer un produit (Admin uniquement)
router.delete('/:id',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si le produit existe
      const checkResult = await db.query(
        'SELECT * FROM products WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Produit non trouvé'
        });
      }

      // Soft delete (désactiver le produit)
      await db.query(
        'UPDATE products SET is_active = false WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

module.exports = router;
