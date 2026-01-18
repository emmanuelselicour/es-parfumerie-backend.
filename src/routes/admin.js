const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  updateOrderStatus,
  getCategories,
  createCategory
} = require('../controllers/adminController');

// Toutes les routes admin nécessitent l'authentification et les droits admin
router.use(auth, admin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Utilisateurs
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Produits
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Commandes
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Catégories
router.get('/categories', getCategories);
router.post('/categories', createCategory);

module.exports = router;
