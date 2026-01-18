// init-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

console.log('🚀 Initialisation de l\'administrateur ES Parfumerie\n');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTables() {
  try {
    console.log('📊 Création des tables si elles n\'existent pas...');
    
    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
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

    console.log('✅ Table "users" créée/vérifiée');

    // Table des catégories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        slug VARCHAR(100) UNIQUE NOT NULL,
        image_url VARCHAR(500),
        parent_id INTEGER REFERENCES categories(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "categories" créée/vérifiée');

    // Table des produits
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        short_description VARCHAR(500),
        brand VARCHAR(100),
        category_id INTEGER REFERENCES categories(id),
        price DECIMAL(10, 2) NOT NULL,
        compare_price DECIMAL(10, 2),
        cost DECIMAL(10, 2),
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        quantity INTEGER DEFAULT 0,
        weight DECIMAL(10, 2),
        volume VARCHAR(50),
        gender VARCHAR(20) CHECK (gender IN ('homme', 'femme', 'unisex', 'enfant')),
        top_notes TEXT,
        middle_notes TEXT,
        base_notes TEXT,
        concentration VARCHAR(50),
        rating DECIMAL(3, 2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_best_seller BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        meta_title VARCHAR(200),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "products" créée/vérifiée');

    // Table des images produits
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(200),
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "product_images" créée/vérifiée');

    // Table des commandes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        shipping_amount DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        billing_address TEXT,
        shipping_method VARCHAR(100),
        payment_method VARCHAR(100),
        payment_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        tracking_number VARCHAR(100),
        estimated_delivery DATE,
        delivered_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "orders" créée/vérifiée');

    // Table des items de commande
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(200) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "order_items" créée/vérifiée');

    // Table des avis
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        title VARCHAR(200),
        comment TEXT,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Table "reviews" créée/vérifiée');

    // Table des favoris
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    console.log('✅ Table "wishlists" créée/vérifiée');

    // Table du panier
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    console.log('✅ Table "cart_items" créée/vérifiée');

    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error.message);
    return false;
  }
}

async function createAdminUser() {
  try {
    const email = 'admin@es-parfumerie.com';
    const password = 'Admin123!';
    const name = 'Administrateur ES';
    
    console.log('\n👤 Création de l\'utilisateur administrateur...');
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Vérifier si l'utilisateur existe déjà
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  L\'administrateur existe déjà. Mise à jour du mot de passe...');
      
      // Mettre à jour le mot de passe et le rôle
      await pool.query(
        `UPDATE users 
         SET password = $1, role = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE email = $3`,
        [hashedPassword, 'admin', email]
      );
      
      console.log('✅ Mot de passe administrateur mis à jour!');
    } else {
      // Insérer l'utilisateur admin
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, role`,
        [name, email, hashedPassword, 'admin', true]
      );
      
      console.log('✅ Administrateur créé avec succès!');
    }
    
    console.log('\n📋 Informations de connexion:');
    console.log('   Email:', email);
    console.log('   Mot de passe:', password);
    console.log('   Nom:', name);
    
    // Ajouter des catégories par défaut
    console.log('\n📁 Ajout des catégories par défaut...');
    
    const defaultCategories = [
      { name: 'Femme', slug: 'femme', description: 'Parfums pour femmes' },
      { name: 'Homme', slug: 'homme', description: 'Parfums pour hommes' },
      { name: 'Unisex', slug: 'unisex', description: 'Parfums unisexes' },
      { name: 'Niche', slug: 'niche', description: 'Parfums de niche' },
      { name: 'Floral', slug: 'floral', description: 'Parfums floraux' },
      { name: 'Boisé', slug: 'boise', description: 'Parfums boisés' },
      { name: 'Oriental', slug: 'oriental', description: 'Parfums orientaux' },
      { name: 'Frais', slug: 'frais', description: 'Parfums frais' }
    ];

    for (const category of defaultCategories) {
      await pool.query(
        `INSERT INTO categories (name, slug, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (slug) DO NOTHING`,
        [category.name, category.slug, category.description]
      );
    }
    
    console.log('✅ Catégories ajoutées!');
    
    // Ajouter quelques produits de démonstration
    console.log('\n🛍️  Ajout de produits de démonstration...');
    
    const demoProducts = [
      {
        name: 'Noir Essentiel',
        description: 'Un parfum bois-ambré intense et mystérieux. Notes de tête: bergamote, poivre noir. Notes de cœur: rose, patchouli. Notes de fond: ambre, musc, bois de santal.',
        short_description: 'Fragrance boisée et ambrée pour homme',
        brand: 'ES Signature',
        price: 89.99,
        compare_price: 109.99,
        quantity: 50,
        gender: 'homme',
        top_notes: 'Bergamote, Poivre noir',
        middle_notes: 'Rose, Patchouli',
        base_notes: 'Ambre, Musc, Bois de santal',
        concentration: 'Eau de Parfum',
        is_featured: true,
        is_new: true,
        sku: 'ES-NOIR-001'
      },
      {
        name: 'Fleur de Soie',
        description: 'Une fragrance florale délicate et raffinée. Notes de tête: mandarine, pêche. Notes de cœur: jasmin, rose, muguet. Notes de fond: vanille, musc blanc.',
        short_description: 'Fragrance florale délicate pour femme',
        brand: 'ES Signature',
        price: 94.99,
        compare_price: null,
        quantity: 35,
        gender: 'femme',
        top_notes: 'Mandarine, Pêche',
        middle_notes: 'Jasmin, Rose, Muguet',
        base_notes: 'Vanille, Musc blanc',
        concentration: 'Eau de Parfum',
        is_featured: true,
        is_best_seller: true,
        sku: 'ES-FLEUR-002'
      },
      {
        name: 'Oud Impérial',
        description: 'Un mélange rare d\'oud et d\'épices orientales. Notes de tête: safran, cardamome. Notes de cœur: oud, rose de Taïf. Notes de fond: bois de cèdre, ambre gris.',
        short_description: 'Mélange rare d\'oud et d\'épices orientales',
        brand: 'ES Luxe',
        price: 149.99,
        compare_price: 179.99,
        quantity: 20,
        gender: 'unisex',
        top_notes: 'Safran, Cardamome',
        middle_notes: 'Oud, Rose de Taïf',
        base_notes: 'Bois de cèdre, Ambre gris',
        concentration: 'Extrait de Parfum',
        is_featured: true,
        sku: 'ES-OUD-003'
      },
      {
        name: 'Citron Vert',
        description: 'Une explosion fraîche et zestée d\'agrumes. Notes de tête: citron vert, pamplemousse. Notes de cœur: menthe, basilic. Notes de fond: mousse de chêne, musc.',
        short_description: 'Explosion fraîche d\'agrumes',
        brand: 'ES Nature',
        price: 79.99,
        compare_price: null,
        quantity: 40,
        gender: 'unisex',
        top_notes: 'Citron vert, Pamplemousse',
        middle_notes: 'Menthe, Basilic',
        base_notes: 'Mousse de chêne, Musc',
        concentration: 'Eau de Toilette',
        is_new: true,
        sku: 'ES-CITRON-004'
      }
    ];

    // Récupérer l'ID de la catégorie Homme
    const categoryResult = await pool.query(
      'SELECT id FROM categories WHERE slug = $1',
      ['homme']
    );
    
    const categoryId = categoryResult.rows[0]?.id || 2;

    for (const product of demoProducts) {
      await pool.query(
        `INSERT INTO products (
          name, description, short_description, brand, category_id, 
          price, compare_price, quantity, gender, top_notes, middle_notes, 
          base_notes, concentration, is_featured, is_new, is_best_seller, sku
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
        ON CONFLICT (sku) DO NOTHING`,
        [
          product.name, product.description, product.short_description, product.brand, categoryId,
          product.price, product.compare_price, product.quantity, product.gender, 
          product.top_notes, product.middle_notes, product.base_notes, product.concentration,
          product.is_featured || false, product.is_new || false, product.is_best_seller || false, product.sku
        ]
      );
    }
    
    console.log('✅ Produits de démonstration ajoutés!');
    
    console.log('\n🎉 Initialisation terminée avec succès!');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe admin après la première connexion!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔗 Connexion à la base de données...');
  
  try {
    // Tester la connexion
    await pool.query('SELECT NOW()');
    console.log('✅ Connecté à PostgreSQL avec succès!');
    
    // Créer les tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.log('⚠️  Certaines tables existent peut-être déjà');
    }
    
    // Créer l'admin
    const adminCreated = await createAdminUser();
    if (!adminCreated) {
      console.log('❌ Échec de la création de l\'admin');
      process.exit(1);
    }
    
    console.log('\n✨ L\'application est maintenant prête à être utilisée!');
    console.log('\n🔗 URLs:');
    console.log('   Site: https://es-parfumerie.netlify.app');
    console.log('   Admin: https://es-parfumerie.netlify.app/admin.html');
    console.log('   API: https://es-parfumerie-backend.onrender.com');
    
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    console.log('\n🔧 Vérifiez vos variables d\'environnement:');
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   DB_NAME:', process.env.DB_NAME);
    console.log('   DB_USER:', process.env.DB_USER);
    console.log('\n💡 Assurez-vous que:');
    console.log('   1. La base de données PostgreSQL existe');
    console.log('   2. Les variables d\'environnement sont correctes');
    console.log('   3. La base de données est accessible depuis Render');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Lancer le script
main();
