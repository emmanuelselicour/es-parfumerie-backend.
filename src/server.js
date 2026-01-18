// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();








// Route d'urgence pour créer un admin
app.post('/api/emergency-admin', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const bcrypt = require('bcryptjs');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const email = 'admin@es-parfumerie.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Créer ou mettre à jour l'admin
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE 
       SET password = $3, role = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role`,
      ['Administrateur ES', email, hashedPassword, 'admin', true, true]
    );
    
    await pool.end();
    
    res.json({
      success: true,
      message: 'Admin créé/mis à jour avec succès',
      credentials: {
        email: email,
        password: password
      },
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur emergency admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



















// Import des routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
});
app.use('/api/', limiter);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes de base
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ES Parfumerie API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);

// Route 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route API non trouvée'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Défini' : 'Non défini - utilisation fallback'}`);
});
