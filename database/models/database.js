const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20, // Nombre maximum de clients dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connecté à la base de données PostgreSQL');
    release();
  }
});

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('❌ Erreur inattendue du pool de connexions:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  getClient: async () => {
    const client = await pool.connect();
    const query = client.query;
    const release = client.release;
    
    // Monkey patch pour garder une trace des requêtes
    client.query = (...args) => {
      console.log('📝 Requête SQL:', args[0]);
      return query.apply(client, args);
    };
    
    client.release = () => {
      console.log('🔓 Client libéré');
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    
    return client;
  }
};
