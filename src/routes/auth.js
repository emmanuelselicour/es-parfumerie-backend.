// src/routes/auth.js - FICHIER CORRIGÉ
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  register, 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  changePassword,
  createAdmin 
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const User = require('../models/User'); // Ajouter cette ligne

// Validation
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
];

// Route de débogage (DOIT ÊTRE APRÈS LA DÉCLARATION DU ROUTER)
router.post('/debug-admin', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findByEmail(email || 'admin@es-parfumerie.com');
    
    if (!user) {
      return res.json({
        exists: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier les permissions
    const canAccessAdmin = user.role === 'admin' && user.is_active === true;
    
    res.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      },
      canAccessAdmin: canAccessAdmin,
      message: canAccessAdmin ? 'Peut accéder au panel admin' : 'Ne peut pas accéder au panel admin'
    });
    
  } catch (error) {
    console.error('Erreur débogage:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Routes publiques
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/create-admin', createAdmin); // Route de secours

// Routes protégées
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

module.exports = router;
