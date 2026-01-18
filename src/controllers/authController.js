// src/controllers/authController.js - FICHIER SIMPLIFIÉ
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key-for-dev', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const register = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({ name, email, password });

    // Générer le token
    const token = generateToken(user.id);

    // Mettre à jour la dernière connexion
    await User.updateLastLogin(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    console.log(`🔑 Tentative de connexion pour: ${email}`);

    // MODE ADMIN DE SECOURS - SIMPLIFIÉ
    if (email === 'admin@es-parfumerie.com') {
      console.log('🔧 Mode admin détecté');
      
      let user = await User.findByEmail(email);
      
      if (!user) {
        console.log('👤 Création de l\'admin...');
        // Créer l'admin si n'existe pas
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        
        try {
          user = await User.create({
            name: 'Administrateur ES',
            email: email,
            password: hashedPassword,
            role: 'admin'
          });
          console.log('✅ Admin créé avec ID:', user.id);
        } catch (error) {
          console.error('❌ Erreur création admin:', error);
          // Utilisateur factice pour permettre la connexion
          user = {
            id: 1,
            name: 'Administrateur ES',
            email: email,
            role: 'admin',
            is_active: true
          };
        }
      }
      
      // Vérifier le mot de passe
      let isPasswordValid = false;
      
      if (user.password) {
        // Vérifier le mot de passe hashé
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        // Accepter le mot de passe par défaut
        isPasswordValid = (password === 'Admin123!');
      }
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }
      
      // Assurer le rôle admin
      if (user.role !== 'admin') {
        console.log('⚠️  Mise à jour du rôle en admin...');
        try {
          await User.update(user.id, { role: 'admin' });
          user.role = 'admin';
        } catch (error) {
          console.error('❌ Erreur mise à jour rôle:', error);
        }
      }
      
      // Générer le token
      const token = generateToken(user.id);
      
      // Mettre à jour last_login
      try {
        await User.updateLastLogin(user.id);
      } catch (error) {
        console.log('⚠️  Impossible de mettre à jour last_login');
      }
      
      console.log('✅ Connexion admin réussie');
      
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // CODE NORMAL POUR LES AUTRES UTILISATEURS
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    if (!user.is_active) {
      console.log('❌ Compte désactivé');
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    const token = generateToken(user.id);
    await User.updateLastLogin(user.id);

    console.log(`✅ Connexion réussie pour: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, country, postal_code } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (postal_code !== undefined) updates.postal_code = postal_code;

    const updatedUser = await User.update(req.user.id, updates);

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Vérifier le mot de passe actuel
    const user = await User.findByEmail(req.user.email);
    const isValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await User.update(req.user.id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    console.log('🔧 Création d\'admin via API');
    
    // Clé secrète simple pour développement
    const secretKey = process.env.ADMIN_SECRET_KEY || 'es-parfumerie-2023';
    const providedKey = req.headers['x-admin-key'] || req.body.secretKey;
    
    if (providedKey !== secretKey) {
      console.log('❌ Clé invalide fournie:', providedKey);
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { 
      email = 'admin@es-parfumerie.com', 
      password = 'Admin123!', 
      name = 'Administrateur ES' 
    } = req.body;

    console.log(`👤 Création admin: ${email}`);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    
    if (existingUser) {
      console.log('⚠️  Admin existe déjà, mise à jour...');
      // Mettre à jour
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const updatedUser = await User.update(existingUser.id, {
        password: hashedPassword,
        role: 'admin',
        is_active: true
      });

      return res.json({
        success: true,
        message: 'Administrateur mis à jour',
        user: updatedUser
      });
    }

    // Créer un nouvel administrateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Admin créé avec ID:', user.id);

    res.status(201).json({
      success: true,
      message: 'Administrateur créé avec succès',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  createAdmin
};
