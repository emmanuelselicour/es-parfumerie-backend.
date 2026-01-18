// src/routes/auth.js - FICHIER COMPLET
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  changePassword,
  createAdmin,
  debugAdmin
} = require('../controllers/authController');

// Import du middleware auth
const { auth } = require('../middleware/auth');

// Route de débogage
router.post('/debug-admin', debugAdmin);

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/create-admin', createAdmin);

// Routes protégées
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
