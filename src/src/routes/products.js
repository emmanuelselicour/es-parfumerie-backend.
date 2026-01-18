const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');

// Récupérer tous les produits (avec filtres)
router.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      gender: req.query.gender,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      search: req.query.search,
      is_featured: req.query.featured === 'true',
      is_best_seller: req.query.bestSeller === 'true',
      is_new: req.query.new === 'true',
      sort: req.query.sort,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 12
    };

    const result = await Product.findAll(filters);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Récupérer les images
    const images = await Product.getImages(req.params.id);
    product.images = images;

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Erreur récupération produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les produits vedettes
router.get('/featured/products', async (req, res) => {
  try {
    const result = await Product.findAll({
      is_featured: true,
      limit: 8
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur récupération produits vedettes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Récupérer les nouveautés
router.get('/new/products', async (req, res) => {
  try {
    const result = await Product.findAll({
      is_new: true,
      limit: 8
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur récupération nouveautés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
