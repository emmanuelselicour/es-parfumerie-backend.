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
    
    // Vérifier si la table products existe, sinon la créer
    client.query(`
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
    `).then(() => {
      console.log('✅ Table products vérifiée/créée');
      
      // Vérifier si des produits existent
      return client.query('SELECT COUNT(*) FROM products');
    }).then(result => {
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        console.log('📦 Aucun produit trouvé, insertion des produits de démonstration...');
        
        // Insérer quelques produits de démonstration
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
        
        const insertPromises = demoProducts.map(product => {
          return client.query(
            `INSERT INTO products (name, description, price, stock, category, image_url, features) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT DO NOTHING`,
            [product.name, product.description, product.price, product.stock, 
             product.category, product.image_url, product.features]
          );
        });
        
        return Promise.all(insertPromises);
      }
      return Promise.resolve();
    }).then(() => {
      console.log(`✅ ${count || 3} produits disponibles`);
    }).catch(err => {
      console.error('❌ Erreur lors de la vérification des produits:', err);
    }).finally(() => {
      release();
    });
  }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Pour les routes publiques, on peut continuer sans user
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

// POST créer un nouveau produit (Admin uniquement)
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url, features } = req.body;

    // Validation simple
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
      [name, description, price, stock || 0, category, image_url || '', features || []]
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
      error: 'Erreur serveur'
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
        values.push(updates[key]);
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
      'UPDATE products SET is_active = false WHERE id = $1',
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

    // Pour le moment, simulation simple
    // En production, vérifier dans la base de données
    
    if (email === 'admin@esparfumerie.com' && password === 'admin123') {
      // Créer un token JWT pour l'admin
      const token = jwt.sign(
        { 
          id: 1, 
          email: email, 
          role: 'admin',
          name: 'Administrateur' 
        },
        process.env.JWT_SECRET || 'votre-secret-par-defaut',
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Connexion réussie',
        token: token,
        user: {
          id: 1,
          email: email,
          name: 'Administrateur',
          role: 'admin'
        }
      });
    }

    // Pour les utilisateurs normaux, simulation
    const token = jwt.sign(
      { 
        id: 2, 
        email: email, 
        role: 'user',
        name: email.split('@')[0] 
      },
      process.env.JWT_SECRET || 'votre-secret-par-defaut',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token,
      user: {
        id: 2,
        email: email,
        name: email.split('@')[0],
        role: 'user'
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
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe sont requis'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // En production, insérer dans la base de données
    // Pour le moment, simulation
    
    const token = jwt.sign(
      { 
        id: Date.now(), 
        email: email, 
        role: 'user',
        name: firstName || email.split('@')[0] 
      },
      process.env.JWT_SECRET || 'votre-secret-par-defaut',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token: token,
      user: {
        id: Date.now(),
        email: email,
        name: firstName || email.split('@')[0],
        firstName: firstName,
        lastName: lastName,
        role: 'user'
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

// POST Connexion admin (spécial)
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification des identifiants admin
    if (email === 'admin@esparfumerie.com' && password === 'admin123') {
      // Créer un token JWT pour l'admin
      const token = jwt.sign(
        { 
          id: 1, 
          email: email, 
          role: 'admin',
          name: 'Administrateur ES Parfumerie',
          isAdmin: true
        },
        process.env.JWT_SECRET || 'votre-secret-par-defaut',
        { expiresIn: '24h' } // Token plus court pour l'admin
      );

      return res.json({
        success: true,
        message: 'Connexion admin réussie',
        token: token,
        user: {
          id: 1,
          email: email,
          name: 'Administrateur',
          role: 'admin',
          permissions: ['all']
        }
      });
    }

    res.status(401).json({
      success: false,
      error: 'Identifiants admin incorrects'
    });

  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

// ==================== ROUTES DASHBOARD ====================

// GET Statistiques du dashboard
app.get('/api/dashboard/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Compter les produits
    const productsResult = await pool.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(productsResult.rows[0].count);

    // Compter les produits actifs
    const activeProductsResult = await pool.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    const activeProducts = parseInt(activeProductsResult.rows[0].count);

    // Calculer la valeur du stock
    const stockValueResult = await pool.query(`
      SELECT SUM(price * stock) as total_value 
      FROM products 
      WHERE is_active = true
    `);
    const stockValue = parseFloat(stockValueResult.rows[0].total_value) || 0;

    // Produits bas stock (moins de 10 unités)
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) 
      FROM products 
      WHERE stock < 10 AND stock > 0 AND is_active = true
    `);
    const lowStockProducts = parseInt(lowStockResult.rows[0].count);

    // Produits en rupture de stock
    const outOfStockResult = await pool.query(`
      SELECT COUNT(*) 
      FROM products 
      WHERE stock = 0 AND is_active = true
    `);
    const outOfStockProducts = parseInt(outOfStockResult.rows[0].count);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        stockValue: Math.round(stockValue * 100) / 100,
        lowStockProducts,
        outOfStockProducts,
        categories: {
          men: await countProductsByCategory('men'),
          women: await countProductsByCategory('women'),
          unisex: await countProductsByCategory('unisex')
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

async function countProductsByCategory(category) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM products WHERE category = $1 AND is_active = true',
    [category]
  );
  return parseInt(result.rows[0].count);
}

// ==================== GESTION DES ERREURS ====================

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    availableEndpoints: {
      products: {
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:id',
        create: 'POST /api/products (admin)',
        update: 'PUT /api/products/:id (admin)',
        delete: 'DELETE /api/products/:id (admin)'
      },
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        adminLogin: 'POST /api/auth/admin/login'
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats (admin)'
      }
    }
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('🔥 Erreur serveur:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue sur le serveur' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
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
