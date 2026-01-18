// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Toutes les routes admin nécessitent l'authentification
router.use(auth);

// Route temporaire pour le dashboard
router.get('/dashboard/stats', (req, res) => {
  // Vérifier le rôle admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé. Droits administrateur requis.'
    });
  }
  
  res.json({
    success: true,
    stats: {
      totalUsers: 1,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      recentOrders: [],
      bestSellers: [],
      recentUsers: []
    },
    user: req.user
  });
});

module.exports = router;
