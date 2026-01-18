// reset-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
  try {
    console.log('🔄 Réinitialisation de l\'administrateur...\n');
    
    // 1. Supprimer l'admin existant
    await pool.query(`DELETE FROM users WHERE email = $1`, ['admin@es-parfumerie.com']);
    console.log('✅ Ancien admin supprimé');
    
    // 2. Créer un nouvel admin
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role`,
      ['Administrateur ES', 'admin@es-parfumerie.com', hashedPassword, 'admin', true, true]
    );
    
    console.log('\n🎉 NOUVEL ADMIN CRÉÉ !');
    console.log('📋 Informations:');
    console.log('   Email: admin@es-parfumerie.com');
    console.log('   Mot de passe: Admin123!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Rôle:', result.rows[0].role);
    
    // 3. Vérifier
    const check = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@es-parfumerie.com']
    );
    
    console.log('\n🔍 Vérification:');
    console.log('   Existe:', check.rows.length > 0 ? '✅ OUI' : '❌ NON');
    console.log('   Rôle:', check.rows[0]?.role);
    console.log('   Actif:', check.rows[0]?.is_active);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();
