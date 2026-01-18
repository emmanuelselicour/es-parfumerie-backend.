const User = require('../models/User');
const Product = require('../models/Product');
const { query } = require('../config/database');

// Dashboard statistiques
const getDashboardStats = async (req, res) => {
  try {
    // Statistiques générales
    const [usersCount, productsCount, ordersCount, revenue] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE role = $1', ['customer']),
      query('SELECT COUNT(*) FROM products'),
      query('SELECT COUNT(*) FROM orders'),
      query('SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = $1', ['completed'])
    ]);

    // Dernières commandes
    const recentOrders = await query(
      `SELECT o.*, u.name as customer_name, u.email 
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC 
       LIMIT 5`
    );

    // Produits les plus vendus
    const bestSellers = await query(
      `SELECT p.name, p.sku, SUM(oi.quantity) as total_sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name, p.sku
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    // Derniers utilisateurs inscrits
    const recentUsers = await query(
      `SELECT id, name, email, created_at 
       FROM users 
       WHERE role = 'customer'
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(usersCount.rows[0].count),
        totalProducts: parseInt(productsCount.rows[0].count),
        totalOrders: parseInt(ordersCount.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].coalesce),
        recentOrders: recentOrders.rows,
        bestSellers: bestSellers.rows,
        recentUsers: recentUsers.rows
      }
    });

  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Gestion des utilisateurs (admin)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let whereClause = '';
    const params = [];
    let paramCount = 1;

    if (role) {
      whereClause += `WHERE role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (search) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT id, name, email, role, phone, is_active, 
              email_verified, last_login, created_at 
       FROM users 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Empêcher la modification de son propre rôle
    if (req.user.id === parseInt(id) && updates.role) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    const updatedUser = await User.update(id, updates);

    res.json({
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Empêcher la suppression de soi-même
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    await User.delete(id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Gestion des produits (admin)
const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, in_stock } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      whereClause += ` AND c.slug = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (in_stock === 'true') {
      whereClause += ` AND p.quantity > 0`;
    } else if (in_stock === 'false') {
      whereClause += ` AND p.quantity <= 0`;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              (SELECT image_url FROM product_images 
               WHERE product_id = p.id AND is_primary = true 
               LIMIT 1) as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      products: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Validation basique
    if (!productData.name || !productData.price) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le prix sont obligatoires'
      });
    }

    // Générer un SKU automatique si non fourni
    if (!productData.sku) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      productData.sku = `PRD-${timestamp}-${random}`;
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du produit'
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProduct = await Product.update(id, updates);

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await Product.delete(id);

    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Gestion des commandes
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (o.order_number ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT o.*, u.name as customer_name, u.email, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      orders: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, notes } = req.body;

    const updates = { status };
    if (tracking_number) updates.tracking_number = tracking_number;
    if (notes) updates.notes = notes;

    if (status === 'delivered') {
      updates.delivered_at = new Date();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date();
    }

    const result = await query(
      `UPDATE orders 
       SET status = $1, 
           tracking_number = COALESCE($2, tracking_number),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, tracking_number, notes, id]
    );

    res.json({
      success: true,
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Gestion des catégories
const getCategories = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
       FROM categories c
       ORDER BY c.name ASC`
    );

    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, slug, parent_id } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le slug sont obligatoires'
      });
    }

    const result = await query(
      `INSERT INTO categories (name, description, slug, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, slug, parent_id]
    );

    res.status(201).json({
      success: true,
      category: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') { // Violation de contrainte d'unicité
      return res.status(400).json({
        success: false,
        message: 'Un catégorie avec ce slug existe déjà'
      });
    }
    
    console.error('Erreur création catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = {
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
};
