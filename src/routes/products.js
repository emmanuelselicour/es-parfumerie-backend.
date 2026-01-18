// src/routes/products.js
const express = require('express');
const router = express.Router();

// Route temporaire pour les produits
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Route produits - À implémenter',
    products: []
  });
});

router.get('/:id', (req, res) => {
  res.json({
    success: true,
    message: `Détails produit ${req.params.id} - À implémenter`,
    product: null
  });
});

module.exports = router;
