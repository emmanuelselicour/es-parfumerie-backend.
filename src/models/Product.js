const { query } = require('../config/database');

class Product {
  static async create(productData) {
    const fields = [];
    const values = [];
    const placeholders = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(productData)) {
      if (value !== undefined) {
        fields.push(key);
        values.push(value);
        placeholders.push(`$${paramCount}`);
        paramCount++;
      }
    }

    const queryStr = `
      INSERT INTO products (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await query(queryStr, values);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              (SELECT image_url FROM product_images 
               WHERE product_id = p.id AND is_primary = true 
               LIMIT 1) as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let whereClause = 'WHERE p.is_active = true';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      whereClause += ` AND c.slug = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.gender) {
      whereClause += ` AND p.gender = $${paramCount}`;
      params.push(filters.gender);
      paramCount++;
    }

    if (filters.minPrice) {
      whereClause += ` AND p.price >= $${paramCount}`;
      params.push(filters.minPrice);
      paramCount++;
    }

    if (filters.maxPrice) {
      whereClause += ` AND p.price <= $${paramCount}`;
      params.push(filters.maxPrice);
      paramCount++;
    }

    if (filters.search) {
      whereClause += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    if (filters.is_featured) {
      whereClause += ` AND p.is_featured = true`;
    }

    if (filters.is_best_seller) {
      whereClause += ` AND p.is_best_seller = true`;
    }

    if (filters.is_new) {
      whereClause += ` AND p.is_new = true`;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;

    const sortMap = {
      'newest': 'p.created_at DESC',
      'price_asc': 'p.price ASC',
      'price_desc': 'p.price DESC',
      'name_asc': 'p.name ASC',
      'name_desc': 'p.name DESC',
      'best_selling': 'p.is_best_seller DESC, p.created_at DESC'
    };

    const sortBy = sortMap[filters.sort] || 'p.created_at DESC';

    const result = await query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug,
              (SELECT image_url FROM product_images 
               WHERE product_id = p.id AND is_primary = true 
               LIMIT 1) as primary_image,
              (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = true) as review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${sortBy}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}`,
      params
    );

    return {
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const queryStr = `
      UPDATE products 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await query(queryStr, values);
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM products WHERE id = $1', [id]);
  }

  static async addImage(productId, imageData) {
    const { image_url, alt_text, is_primary = false } = imageData;
    
    // Si c'est l'image principale, désactiver les autres images principales
    if (is_primary) {
      await query(
        'UPDATE product_images SET is_primary = false WHERE product_id = $1',
        [productId]
      );
    }

    const result = await query(
      `INSERT INTO product_images (product_id, image_url, alt_text, is_primary)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, image_url, alt_text, is_primary]
    );

    return result.rows[0];
  }

  static async getImages(productId) {
    const result = await query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order ASC',
      [productId]
    );
    return result.rows;
  }

  static async updateStock(id, quantity) {
    const result = await query(
      'UPDATE products SET quantity = quantity + $1 WHERE id = $2 RETURNING quantity',
      [quantity, id]
    );
    return result.rows[0];
  }
}

module.exports = Product;
