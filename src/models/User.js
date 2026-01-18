
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, role = 'customer' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, role]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, phone, address, city, 
              country, postal_code, avatar_url, is_active, 
              email_verified, last_login, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
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
      UPDATE users 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, name, email, role, phone, address, city, 
                country, postal_code, avatar_url, is_active, 
                email_verified, last_login, created_at
    `;

    const result = await query(queryStr, values);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async getAll(page = 1, limit = 10, role = null) {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];
    let paramCount = 2;

    if (role) {
      whereClause = `WHERE role = $${++paramCount}`;
      params.push(role);
    }

    const result = await query(
      `SELECT id, name, email, role, phone, 
              is_active, email_verified, last_login, created_at 
       FROM users 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      role ? [role] : []
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
  }

  static async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;
