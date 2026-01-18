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
      success: false
