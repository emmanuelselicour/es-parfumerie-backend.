// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findUserById(id) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erreur findUserById:', error);
    return null;
  }
}

const auth = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      throw new Error();
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'es-parfumerie-dev-secret-2023');
    
    // Trouver l'utilisateur
    const user = await findUserById(decoded.id);
    
    if (!user || !user.is_active) {
      throw new Error();
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Veuillez vous authentifier' 
    });
  }
};

module.exports = { auth };
