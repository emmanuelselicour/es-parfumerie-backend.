-- ES Parfumerie - Script de création de la base de données
-- PostgreSQL

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(50),
    image_url TEXT,
    features TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer quelques produits de démonstration
INSERT INTO products (name, description, price, stock, category, image_url, features) VALUES
(
    'Parfum Élégance',
    'Un parfum élégant et raffiné pour les occasions spéciales',
    89.99,
    50,
    'unisex',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ARRAY['Notes florales', 'Longue tenue', 'Bouteille en verre recyclé']
),
(
    'Essence de Nuit',
    'Un parfum mystérieux et envoûtant pour la soirée',
    75.50,
    30,
    'men',
    'https://images.unsplash.com/photo-1590736969956-6d9c2a8d6977?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ARRAY['Notes boisées', 'Tenue moyenne', 'Édition limitée']
),
(
    'Fleur de Printemps',
    'Un parfum frais et floral pour le quotidien',
    65.00,
    100,
    'women',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ARRAY['Notes fruitées', 'Tenue légère', 'Ingrédients naturels']
) ON CONFLICT DO NOTHING;

-- Créer un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
