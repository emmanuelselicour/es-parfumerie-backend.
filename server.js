require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connecté à la base de données PostgreSQL');
    
    // Créer les tables si elles n'existent pas
    createTables(client)
      .then(() => {
        console.log('✅ Tables vérifiées/créées');
        return checkAndInsertAdminUser(client);
      })
      .then(() => {
        console.log('✅ Compte admin vérifié');
        return checkAndInsertDemoProducts(client);
      })
      .then(() => {
        console.log('✅ Produits de démonstration vérifiés');
      })
      .catch(error => {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      })
      .finally(() => {
        release();
      });
  }
});

async function createTables(client) {
  // Table users
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      role VARCHAR(50) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      preferences JSONB DEFAULT '{}',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table products
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      category VARCHAR(50),
      image_url TEXT,
      features TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function checkAndInsertAdminUser(client) {
  // Vérifier si un admin existe
  const adminCheck = await client.query(
    "SELECT id FROM users WHERE email = 'admin@esparfumerie.com'"
  );

  if (adminCheck.rows.length === 0) {
    // Hasher le mot de passe admin123
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin@esparfumerie.com', hashedPassword, 'Admin', 'System', 'admin']
    );
    console.log('👤 Compte admin créé: admin@esparfumerie.com / admin123');
  }
}

async function checkAndInsertDemoProducts(client) {
  const productCheck = await client.query('SELECT COUNT(*) FROM products');
  const count = parseInt(productCheck.rows[0].count);

  if (count === 0) {
    const demoProducts = [
      {
        name: 'Parfum Élégance',
        description: 'Un parfum élégant et raffiné pour les occasions spéciales',
        price: 89.99,
        stock: 50,
        category: 'unisex',
        image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        features: ['Notes florales', 'Longue tenue', 'Bouteille en verre recyclé']
      },
      {
        name: 'Essence de Nuit',
        description: 'Un parfum mystérieux et envoûtant pour la soirée',
        price: 75.50,
        stock: 30,
        category: 'men',
        image_url: 'https://images.unsplash.com/photo-1590736969956-6d9c2a8d6977?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        features: ['Notes boisées', 'Tenue moyenne', 'Édition limitée']
      },
      {
        name: 'Fleur de Printemps',
        description: 'Un parfum frais et floral pour le quotidien',
        price: 65.00,
        stock: 100,
        category: 'women',
        image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        features: ['Notes fruitées', 'Tenue légère', 'Ingrédients naturels']
      }
    ];

    for (const product of demoProducts) {
      await client.query(
        `INSERT INTO products (name, description, price, stock, category, image_url, features) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT DO NOTHING`,
        [product.name, product.description, product.price, product.stock, 
         product.category, product.image_url, product.features]
      );
    }
    console.log('🎁 3 produits de démonstration insérés');
  }
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-par-defaut', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier si admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis'
    });
  }

  next();
};

// ==================== ROUTES API ====================

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: '🎉 ES Parfumerie API Backend',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      products: '/api/products',
      auth: {
        login: '/api/auth/login (POST)',
        register: '/api/auth/register (POST)',
        adminLogin: '/api/auth/admin/login (POST)'
      }
    },
    database: 'PostgreSQL',
    frontend: process.env.FRONTEND_URL || 'https://es-parfumerie.netlify.app'
  });
});

// Route de santé
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ==================== ROUTES AUTHENTIFICATION ====================

// POST Connexion utilisateur
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe sont requis'
      });
    }

    // Chercher l'utilisateur dans la base de données
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Mettre à jour la date de dernière connexion
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET || 'votre-secret-par-defaut',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST Inscription utilisateur
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe sont requis'
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur
    const result = await pool.query(
      `INSERT INTO users 
       (email, password_hash, first_name, last_name, phone, role) 
       VALUES ($1, $2, $3, $4, $5, 'user') 
       RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, firstName || '', lastName || '', phone || '']
    );

    const user = result.rows[0];

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET || 'votre-secret-par-defaut',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST Connexion admin
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe sont requis'
      });
    }

    // Chercher l'admin dans la base de données
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2 AND is_active = true',
      [email, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants admin incorrects'
      });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants admin incorrects'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: 'Administrateur ES Parfumerie',
        isAdmin: true
      },
      process.env.JWT_SECRET || 'votre-secret-par-defaut',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion admin réussie',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: 'Administrateur',
        role: user.role,
        permissions: ['all']
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==================== ROUTES PRODUITS ====================

// GET tous les produits
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let query = 'SELECT * FROM products WHERE is_active = true';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND price >= $${paramCount}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET un produit par ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// GET produits avec IDs spécifiques
app.post('/api/products/by-ids', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({
        success: true,
        products: []
      });
    }

    const result = await pool.query(
      'SELECT * FROM products WHERE id = ANY($1) AND is_active = true',
      [ids]
    );

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// POST créer un nouveau produit (Admin uniquement)
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url, features } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        error: 'Nom, description, prix et catégorie sont requis'
      });
    }

    const result = await pool.query(
      `INSERT INTO products 
       (name, description, price, stock, category, image_url, features) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, description, parseFloat(price), parseInt(stock || 0), 
       category, image_url || '', features || []]
    );

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur: ' + error.message
    });
  }
});

// PUT mettre à jour un produit (Admin uniquement)
app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Vérifier si le produit existe
    const checkResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // Construire la requête dynamique
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (['name', 'description', 'price', 'stock', 'category', 'image_url', 'features', 'is_active'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        
        // Convertir les types si nécessaire
        if (key === 'price') {
          values.push(parseFloat(updates[key]));
        } else if (key === 'stock') {
          values.push(parseInt(updates[key]));
        } else {
          values.push(updates[key]);
        }
        
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée valide à mettre à jour'
      });
    }

    values.push(id);
    const query = `
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// DELETE supprimer un produit (Admin uniquement)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le produit existe
    const checkResult = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Produit non trouvé'
      });
    }

    // Soft delete (désactiver le produit)
    await pool.query(
      'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==================== ROUTES UTILISATEURS ====================

// GET informations utilisateur
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, address, city, postal_code, country, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// PUT mettre à jour le profil utilisateur
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    const { first_name, last_name, phone, address, city, postal_code, country } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           postal_code = COALESCE($6, postal_code),
           country = COALESCE($7, country),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, email, first_name, last_name, phone, address, city, postal_code, country`,
      [first_name, last_name, phone, address, city, postal_code, country, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==================== GESTION DES ERREURS ====================

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue sur le serveur' 
      : err.message
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🌍 Frontend: ${process.env.FRONTEND_URL || 'https://es-parfumerie.netlify.app'}`);
  console.log(`🗄️  Base de données: PostgreSQL (Render)`);
  console.log(`👤 Compte admin: admin@esparfumerie.com / admin123`);
  console.log('========================================');
});
