// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
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

    // Définir le cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });

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

    // DEBUG: Accès administrateur de secours
    // Ce bloc permet à l'admin de se connecter même si la base de données est vide
    // À RETIRER APRÈS LA PREMIÈRE CONNEXION SUCCÈS
    if (email === 'admin@es-parfumerie.com' && password === 'Admin123!') {
      console.log('⚠️  Utilisation du mode secours administrateur');
      
      // Vérifier si l'admin existe dans la base de données
      let user = await User.findByEmail(email);
      
      if (!user) {
        console.log('🔧 Création de l\'administrateur dans la base de données...');
        
        try {
          // Créer l'administrateur
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(password, 10);
          
          // Utiliser la méthode create du modèle User
          user = await User.create({
            name: 'Administrateur ES',
            email: email,
            password: hashedPassword,
            role: 'admin'
          });
          
          console.log('✅ Administrateur créé avec succès');
        } catch (createError) {
          console.error('❌ Erreur création admin:', createError);
          
          // Créer un utilisateur temporaire si la création échoue
          user = {
            id: 1,
            name: 'Administrateur ES',
            email: email,
            role: 'admin',
            is_active: true
          };
        }
      }
      
      // Générer le token
      const token = generateToken(user.id);

      // Mettre à jour la dernière connexion
      try {
        await User.updateLastLogin(user.id);
      } catch (error) {
        console.log('⚠️  Impossible de mettre à jour last_login');
      }

      // Définir le cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url
        },
        message: 'Connexion administrateur réussie'
      });
    }

    // CODE NORMAL D'AUTHENTIFICATION
    // Trouver l'utilisateur
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await User.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    // Générer le token
    const token = generateToken(user.id);

    // Mettre à jour la dernière connexion
    await User.updateLastLogin(user.id);

    // Définir le cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
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
    const isValid = await User.comparePassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    const bcrypt = require('bcryptjs');
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

// Fonction de secours pour créer un admin via API
const createAdmin = async (req, res) => {
  try {
    // Vérifier la clé secrète (à définir dans .env)
    const secretKey = process.env.ADMIN_SECRET_KEY || 'es-parfumerie-admin-2023';
    if (req.headers['x-admin-key'] !== secretKey) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const { email = 'admin@es-parfumerie.com', password = 'Admin123!', name = 'Administrateur ES' } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      // Mettre à jour le rôle et le mot de passe
      const bcrypt = require('bcryptjs');
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
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

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
    console.error('Erreur création admin:', error);
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
