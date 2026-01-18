const { query } = require('./database');

async function createTables() {
  try {
    console.log('Création des tables...');

    // Table des utilisateurs
    await query(`
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

    // Table des catégories
    await query(`
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

    // Table des produits
    await query(`
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

    // Table des images produits
    await query(`
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

    // Table des commandes
    await query(`
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

    // Table des items de commande
    await query(`
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

    // Table des avis
    await query(`
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

    // Table des favoris
    await query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    // Table du panier
    await query(`
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

    console.log('Tables créées avec succès!');

    // Créer l'admin initial
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    await query(
      'INSERT INTO users (name, email, password, role, email_verified) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      ['Administrateur', process.env.ADMIN_EMAIL, hashedPassword, 'admin', true]
    );

    console.log('Admin initial créé avec succès!');
    console.log(`Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`Mot de passe: ${process.env.ADMIN_PASSWORD}`);

    // Insérer des catégories par défaut
    const defaultCategories = [
      { name: 'Femme', slug: 'femme', description: 'Parfums pour femmes' },
      { name: 'Homme', slug: 'homme', description: 'Parfums pour hommes' },
      { name: 'Unisex', slug: 'unisex', description: 'Parfums unisexes' },
      { name: 'Niche', slug: 'niche', description: 'Parfums de niche' }
    ];

    for (const category of defaultCategories) {
      await query(
        'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [category.name, category.slug, category.description]
      );
    }

    console.log('Catégories par défaut créées!');

  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  } finally {
    process.exit();
  }
}

createTables();
