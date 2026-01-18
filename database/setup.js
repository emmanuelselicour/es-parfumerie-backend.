require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

async function setupDatabase() {
  console.log('🔧 Démarrage de la configuration de la base de données...');
  
  // Créer un pool de connexion
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { 
      rejectUnauthorized: false 
    } : false
  });

  try {
    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'setup.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Exécuter les commandes SQL
    console.log('📝 Exécution du script SQL...');
    await pool.query(sql);
    
    console.log('✅ Base de données configurée avec succès !');
    console.log('📊 Tables créées :');
    console.log('   - users');
    console.log('   - products');
    console.log('   - orders');
    console.log('   - order_items');
    console.log('   - wishlists');
    console.log('   - reviews');
    console.log('   - user_sessions');
    console.log('');
    console.log('👤 Compte administrateur créé :');
    console.log('   Email: admin@esparfumerie.com');
    console.log('   Mot de passe: admin123');
    console.log('');
    console.log('🎁 3 produits de démonstration ajoutés');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
