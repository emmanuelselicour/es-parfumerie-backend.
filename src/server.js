// src/server.js - FICHIER CORRIGÉ
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

// Route d'urgence pour créer un admin - DOIT ÊTRE ICI, APRÈS LA DÉCLARATION DE APP
app.post('/api/emergency-admin', async (req, res) => {
  try {
    console.log('🚨 Route d\'urgence admin appelée');
    
    const { Pool } = require('pg');
    const bcrypt = require('bcryptjs');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const email = 'admin@es-parfumerie.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Vérifier si la table existe
    try {
      await pool.query('SELECT 1 FROM users LIMIT 1');
    } catch (error) {
      console.log('📊 Table users n\'existe pas, création...');
      // Créer la table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'customer',
          phone VARCHAR(20),
          address TEXT,
          city VARCHAR(100),
          country VARCHAR(100),
          postal_code VARCHAR(20),
          avatar_url VARCHAR(500),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Créer ou mettre à jour l'admin
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active, email_verified, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (email) DO UPDATE 
       SET password = EXCLUDED.password, 
           role = EXCLUDED.role, 
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role, is_active, created_at`,
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
      user: result.rows[0],
      note: 'Utilisez ces identifiants pour vous connecter au panel admin'
    });
    
  } catch (error) {
    console.error('❌ Erreur emergency admin:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
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
  console.error('❌ Erreur serveur:', err.stack);
  
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
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                🚀 ES PARFUMERIE BACKEND                 ║
╠══════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                             ║
║ Environnement: ${process.env.NODE_ENV || 'development'}   ║
║ Frontend: ${process.env.FRONTEND_URL || 'Non défini'}     ║
║ Database: ${process.env.DATABASE_URL ? 'Connecté' : 'Non configuré'} ║
╠══════════════════════════════════════════════════════════╣
║ 📍 Routes disponibles:                                   ║
║   • GET  /api/health           → Vérifier l'état de l'API║
║   • POST /api/emergency-admin  → Créer admin d'urgence   ║
║   • POST /api/auth/login       → Connexion               ║
║   • POST /api/auth/create-admin→ Créer admin             ║
╚══════════════════════════════════════════════════════════╝
  `);
});
