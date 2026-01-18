// reset-admin.js - Script de réinitialisation de l'administrateur
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

console.log('🔄 RÉINITIALISATION DE L\'ADMINISTRATEUR ES PARFUMERIE\n');
console.log('📡 Connexion à la base de données...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // 1. Tester la connexion
    await pool.query('SELECT NOW()');
    console.log('✅ Connecté à PostgreSQL');
    
    // 2. Vérifier si la table users existe
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ Table "users" n\'existe pas');
        console.log('📋 Création de la table...');
        
        await pool.query(`
          CREATE TABLE users (
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
        
        console.log('✅ Table "users" créée');
      }
    } catch (error) {
      console.log('ℹ️  Table check:', error.message);
    }
    
    // 3. Vérifier l'admin existant
    console.log('\n🔍 Recherche de l\'admin existant...');
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@es-parfumerie.com']
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin trouvé, suppression...');
      console.log('📋 Infos actuelles:');
      console.log('   ID:', existingAdmin.rows[0].id);
      console.log('   Rôle:', existingAdmin.rows[0].role);
      console.log('   Actif:', existingAdmin.rows[0].is_active);
      
      await pool.query(
        'DELETE FROM users WHERE email = $1',
        ['admin@es-parfumerie.com']
      );
      console.log('✅ Ancien admin supprimé');
    } else {
      console.log('✅ Aucun admin existant trouvé');
    }
    
    // 4. Créer le nouvel admin
    console.log('\n👤 Création du nouvel administrateur...');
    
    const email = 'admin@es-parfumerie.com';
    const password = 'Admin123!';
    const name = 'Administrateur ES';
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insérer le nouvel admin
    const result = await pool.query(
      `INSERT INTO users (
        name, email, password, role, 
        is_active, email_verified, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING id, name, email, role, is_active, created_at`,
      [name, email, hashedPassword, 'admin', true, true]
    );
    
    const newAdmin = result.rows[0];
    
    console.log('\n🎉 ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !');
    console.log('======================================');
    console.log('📋 INFORMATIONS DE CONNEXION :');
    console.log('   Email    :', newAdmin.email);
    console.log('   Password :', password);
    console.log('   Nom      :', newAdmin.name);
    console.log('\n🔧 INFORMATIONS TECHNIQUES :');
    console.log('   ID       :', newAdmin.id);
    console.log('   Rôle     :', newAdmin.role);
    console.log('   Actif    :', newAdmin.is_active);
    console.log('   Créé le  :', newAdmin.created_at);
    
    // 5. Vérification finale
    console.log('\n🔍 VÉRIFICATION FINALE...');
    
    const verify = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE email = $1',
      [email]
    );
    
    if (verify.rows.length > 0) {
      const admin = verify.rows[0];
      console.log('✅ Admin vérifié dans la base:');
      console.log('   Email:', admin.email);
      console.log('   Rôle:', admin.role);
      console.log('   Actif:', admin.is_active);
      
      if (admin.role === 'admin' && admin.is_active === true) {
        console.log('\n✨ PRÊT À UTILISER !');
        console.log('\n🌐 URLs :');
        console.log('   Panel Admin : https://es-parfumerie.netlify.app/admin.html');
        console.log('   API Backend : https://es-parfumerie-backend.onrender.com');
        console.log('\n⚠️  IMPORTANT :');
        console.log('   Changez le mot de passe après la première connexion !');
      } else {
        console.log('\n⚠️  PROBLÈME DÉTECTÉ :');
        console.log('   Le rôle ou l\'état n\'est pas correct');
      }
    } else {
      console.log('❌ ERREUR : Admin non trouvé après création');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR CRITIQUE :', error.message);
    console.log('\n🔧 DÉPANNAGE :');
    console.log('   1. Vérifiez les variables d\'environnement DATABASE_URL');
    console.log('   2. Vérifiez que la base de données PostgreSQL est active');
    console.log('   3. Vérifiez les permissions de connexion');
    
    if (error.code === '28P01') {
      console.log('   ➡️  Erreur d\'authentification PostgreSQL');
      console.log('   ➡️  Vérifiez DB_USER et DB_PASSWORD');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   ➡️  Connexion refusée à la base de données');
      console.log('   ➡️  Vérifiez DB_HOST et DB_PORT');
    }
  } finally {
    await pool.end();
    console.log('\n🔚 Script terminé');
  }
}

// Exécuter le script
main();
