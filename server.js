// ES Parfumerie - Application JavaScript

// Configuration de l'API
const API_BASE_URL = 'https://es-parfumerie-backend.onrender.com';

// État global de l'application
const AppState = {
    currentUser: null,
    products: [],
    cart: [],
    language: 'fr',
    darkMode: false,
    currentSection: 'home',
    isLoading: false
};

// Dictionnaires de traduction
const translations = {
    fr: {
        // Navigation
        'nav.home': 'Accueil',
        'nav.about': 'À propos',
        'nav.products': 'Produits',
        'nav.contact': 'Contact',
        'nav.profile': 'Profil',
        'nav.cart': 'Panier',
        'nav.login': 'Connexion',
        'nav.signup': 'Inscription',
        
        // Hero
        'hero.title': 'L\'art de la fragrance',
        'hero.subtitle': 'Découvrez notre collection exclusive de parfums pour homme et femme. Des senteurs uniques qui racontent votre histoire.',
        'hero.shop': 'Découvrir la collection',
        'hero.learn': 'En savoir plus',
        
        // About
        'about.title': 'À propos de ES Parfumerie',
        'about.text1': 'Depuis 2010, ES Parfumerie offre une sélection rigoureuse des plus belles fragrances du monde. Notre passion pour les parfums nous pousse à rechercher constamment l\'excellence et l\'authenticité.',
        'about.text2': 'Nous collaborons avec les meilleurs nez et maisons de parfum pour vous proposer des senteurs uniques, alliant tradition et innovation.',
        'about.feature1.title': 'Qualité Premium',
        'about.feature1.text': 'Sélection des meilleurs ingrédients',
        'about.feature2.title': 'Ingrédients Naturels',
        'about.feature2.text': 'Formules respectueuses de l\'environnement',
        'about.feature3.title': 'Livraison Rapide',
        'about.feature3.text': 'Expédition sous 48h en France',
        
        // Products
        'products.title': 'Nos Parfums',
        'products.subtitle': 'Découvrez notre collection exclusive',
        'products.all': 'Tous',
        'products.men': 'Homme',
        'products.women': 'Femme',
        'products.unisex': 'Unisex',
        'products.empty': 'Aucun produit disponible',
        'products.emptyDesc': 'Notre collection sera bientôt disponible. Revenez plus tard !',
        'products.add': 'Ajouter un produit',
        'products.addToCart': 'Ajouter au panier',
        'products.viewDetails': 'Voir détails',
        'products.outOfStock': 'Rupture de stock',
        
        // Contact
        'contact.title': 'Contactez-nous',
        'contact.address': 'Adresse',
        'contact.phone': 'Téléphone',
        'contact.email': 'Email',
        'contact.hours': 'Horaires d\'ouverture',
        'contact.hoursDetail': 'Lun-Ven: 10h-19h<br>Samedi: 10h-20h<br>Dimanche: 11h-18h',
        'contact.formName': 'Nom complet',
        'contact.formEmail': 'Adresse email',
        'contact.formSubject': 'Sujet (optionnel)',
        'contact.formMessage': 'Votre message',
        'contact.send': 'Envoyer le message',
        
        // Login
        'login.title': 'Connexion',
        'login.email': 'Adresse email',
        'login.password': 'Mot de passe',
        'login.remember': 'Se souvenir de moi',
        'login.forgot': 'Mot de passe oublié?',
        'login.submit': 'Se connecter',
        'login.noAccount': 'Pas encore de compte?',
        'login.createAccount': 'Créer un compte',
        
        // Signup
        'signup.title': 'Créer un compte',
        'signup.firstName': 'Prénom',
        'signup.lastName': 'Nom',
        'signup.email': 'Adresse email',
        'signup.password': 'Mot de passe',
        'signup.confirm': 'Confirmer le mot de passe',
        'signup.terms': 'J\'accepte les <a href="#">conditions d\'utilisation</a>',
        'signup.submit': 'Créer mon compte',
        'signup.haveAccount': 'Vous avez déjà un compte?',
        'signup.login': 'Se connecter',
        
        // Footer
        'footer.description': 'Votre destination pour des parfums d\'exception depuis 2010.',
        'footer.links': 'Liens rapides',
        'footer.services': 'Services',
        'footer.service1': 'Conseils personnalisés',
        'footer.service2': 'Cadeaux & coffrets',
        'footer.service3': 'Échantillons gratuits',
        'footer.service4': 'Retours gratuits',
        'footer.contact': 'Contact',
        'footer.rights': 'Tous droits réservés.',
        'footer.privacy': 'Politique de confidentialité',
        'footer.terms': 'Conditions d\'utilisation',
        'footer.cookies': 'Politique des cookies'
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.products': 'Products',
        'nav.contact': 'Contact',
        'nav.profile': 'Profile',
        'nav.cart': 'Cart',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
        
        // Hero
        'hero.title': 'The Art of Fragrance',
        'hero.subtitle': 'Discover our exclusive collection of perfumes for men and women. Unique scents that tell your story.',
        'hero.shop': 'Discover the collection',
        'hero.learn': 'Learn more',
        
        // About
        'about.title': 'About ES Parfumerie',
        'about.text1': 'Since 2010, ES Parfumerie has offered a rigorous selection of the world\'s finest fragrances. Our passion for perfumes drives us to constantly seek excellence and authenticity.',
        'about.text2': 'We collaborate with the best perfumers and perfume houses to offer you unique scents, combining tradition and innovation.',
        'about.feature1.title': 'Premium Quality',
        'about.feature1.text': 'Selection of the finest ingredients',
        'about.feature2.title': 'Natural Ingredients',
        'about.feature2.text': 'Environmentally friendly formulas',
        'about.feature3.title': 'Fast Delivery',
        'about.feature3.text': 'Shipping within 48h in France',
        
        // Products
        'products.title': 'Our Perfumes',
        'products.subtitle': 'Discover our exclusive collection',
        'products.all': 'All',
        'products.men': 'Men',
        'products.women': 'Women',
        'products.unisex': 'Unisex',
        'products.empty': 'No products available',
        'products.emptyDesc': 'Our collection will be available soon. Come back later!',
        'products.addToCart': 'Add to cart',
        'products.viewDetails': 'View details',
        'products.outOfStock': 'Out of stock',
        
        // Contact
        'contact.title': 'Contact Us',
        'contact.address': 'Address',
        'contact.phone': 'Phone',
        'contact.email': 'Email',
        'contact.hours': 'Opening Hours',
        'contact.hoursDetail': 'Mon-Fri: 10am-7pm<br>Saturday: 10am-8pm<br>Sunday: 11am-6pm',
        'contact.formName': 'Full name',
        'contact.formEmail': 'Email address',
        'contact.formSubject': 'Subject (optional)',
        'contact.formMessage': 'Your message',
        'contact.send': 'Send message',
        
        // Login
        'login.title': 'Login',
        'login.email': 'Email address',
        'login.password': 'Password',
        'login.remember': 'Remember me',
        'login.forgot': 'Forgot password?',
        'login.submit': 'Login',
        'login.noAccount': 'Don\'t have an account?',
        'login.createAccount': 'Create account',
        
        // Signup
        'signup.title': 'Create Account',
        'signup.firstName': 'First name',
        'signup.lastName': 'Last name',
        'signup.email': 'Email address',
        'signup.password': 'Password',
        'signup.confirm': 'Confirm password',
        'signup.terms': 'I accept the <a href="#">terms of use</a>',
        'signup.submit': 'Create my account',
        'signup.haveAccount': 'Already have an account?',
        'signup.login': 'Login',
        
        // Footer
        'footer.description': 'Your destination for exceptional perfumes since 2010.',
        'footer.links': 'Quick Links',
        'footer.services': 'Services',
        'footer.service1': 'Personalized advice',
        'footer.service2': 'Gifts & sets',
        'footer.service3': 'Free samples',
        'footer.service4': 'Free returns',
        'footer.contact': 'Contact',
        'footer.rights': 'All rights reserved.',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Use',
        'footer.cookies': 'Cookie Policy'
    },
    es: {
        // Navigation
        'nav.home': 'Inicio',
        'nav.about': 'Acerca de',
        'nav.products': 'Productos',
        'nav.contact': 'Contacto',
        'nav.profile': 'Perfil',
        'nav.cart': 'Carrito',
        'nav.login': 'Iniciar sesión',
        'nav.signup': 'Registrarse',
        
        // Hero
        'hero.title': 'El arte de la fragancia',
        'hero.subtitle': 'Descubra nuestra exclusiva colección de perfumes para hombre y mujer. Aromas únicos que cuentan tu historia.',
        'hero.shop': 'Descubrir la colección',
        'hero.learn': 'Saber más',
        
        // About
        'about.title': 'Acerca de ES Parfumerie',
        'about.text1': 'Desde 2010, ES Parfumerie ofrece una selección rigurosa de las fragancias más finas del mundo. Nuestra pasión por los perfumes nos impulsa a buscar constantemente la excelencia y la autenticidad.',
        'about.text2': 'Colaboramos con los mejores perfumistas y casas de perfume para ofrecerle aromas únicos, combinando tradición e innovación.',
        'about.feature1.title': 'Calidad Premium',
        'about.feature1.text': 'Selección de los mejores ingredientes',
        'about.feature2.title': 'Ingredientes Naturales',
        'about.feature2.text': 'Fórmulas respetuosas con el medio ambiente',
        'about.feature3.title': 'Entrega Rápida',
        'about.feature3.text': 'Envío en 48h en Francia',
        
        // Products
        'products.title': 'Nuestros Perfumes',
        'products.subtitle': 'Descubra nuestra exclusiva colección',
        'products.all': 'Todos',
        'products.men': 'Hombre',
        'products.women': 'Mujer',
        'products.unisex': 'Unisex',
        'products.empty': 'No hay productos disponibles',
        'products.emptyDesc': 'Nuestra colección estará disponible pronto. ¡Vuelva más tarde!',
        'products.addToCart': 'Añadir al carrito',
        'products.viewDetails': 'Ver detalles',
        'products.outOfStock': 'Agotado',
        
        // Contact
        'contact.title': 'Contáctenos',
        'contact.address': 'Dirección',
        'contact.phone': 'Teléfono',
        'contact.email': 'Correo electrónico',
        'contact.hours': 'Horario de apertura',
        'contact.hoursDetail': 'Lun-Vie: 10h-19h<br>Sábado: 10h-20h<br>Domingo: 11h-18h',
        'contact.formName': 'Nombre completo',
        'contact.formEmail': 'Correo electrónico',
        'contact.formSubject': 'Asunto (opcional)',
        'contact.formMessage': 'Su mensaje',
        'contact.send': 'Enviar mensaje',
        
        // Login
        'login.title': 'Iniciar sesión',
        'login.email': 'Correo electrónico',
        'login.password': 'Contraseña',
        'login.remember': 'Recordarme',
        'login.forgot': '¿Olvidó su contraseña?',
        'login.submit': 'Iniciar sesión',
        'login.noAccount': '¿No tiene una cuenta?',
        'login.createAccount': 'Crear cuenta',
        
        // Signup
        'signup.title': 'Crear Cuenta',
        'signup.firstName': 'Nombre',
        'signup.lastName': 'Apellido',
        'signup.email': 'Correo electrónico',
        'signup.password': 'Contraseña',
        'signup.confirm': 'Confirmar contraseña',
        'signup.terms': 'Acepto los <a href="#">términos de uso</a>',
        'signup.submit': 'Crear mi cuenta',
        'signup.haveAccount': '¿Ya tiene una cuenta?',
        'signup.login': 'Iniciar sesión',
        
        // Footer
        'footer.description': 'Su destino para perfumes excepcionales desde 2010.',
        'footer.links': 'Enlaces rápidos',
        'footer.services': 'Servicios',
        'footer.service1': 'Consejos personalizados',
        'footer.service2': 'Regalos y juegos',
        'footer.service3': 'Muestras gratuitas',
        'footer.service4': 'Devoluciones gratuitas',
        'footer.contact': 'Contacto',
        'footer.rights': 'Todos los derechos reservados.',
        'footer.privacy': 'Política de privacidad',
        'footer.terms': 'Términos de uso',
        'footer.cookies': 'Política de cookies'
    }
};

// Fonction pour changer la langue
function changeLanguage(lang) {
    AppState.language = lang;
    document.documentElement.lang = lang;
    
    // Mettre à jour les textes avec data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });
    
    // Mettre à jour le sélecteur de langue
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) languageSelect.value = lang;
    
    // Sauvegarder la préférence
    localStorage.setItem('es-parfumerie-language', lang);
}

// Fonction pour basculer le mode sombre
function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    document.body.classList.toggle('dark-mode', AppState.darkMode);
    
    // Mettre à jour l'icône
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = AppState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
    
    // Sauvegarder la préférence
    localStorage.setItem('es-parfumerie-darkmode', AppState.darkMode);
}

// Fonction pour charger les produits depuis l'API
async function loadProducts() {
    if (AppState.isLoading) return;
    
    AppState.isLoading = true;
    const loadingEl = document.getElementById('products-loading');
    const productsGrid = document.getElementById('products-grid');
    
    try {
        console.log('🔄 Chargement des produits depuis l\'API...');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Chargement des produits...</h3>
                    <p>Veuillez patienter</p>
                </div>
            `;
        }
        
        // Ajouter un timestamp pour éviter le cache
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/api/products?t=${timestamp}`);
        
        if (response.ok) {
            const data = await response.json();
            AppState.products = data.products || [];
            console.log(`✅ ${AppState.products.length} produits chargés`);
            
            displayProducts();
            
            // Afficher le bouton admin si l'utilisateur est admin
            const adminActions = document.getElementById('admin-actions');
            if (adminActions && AppState.currentUser && AppState.currentUser.role === 'admin') {
                adminActions.style.display = 'block';
            }
            
            showNotification(`✅ ${AppState.products.length} produits chargés`, 'success');
            
        } else {
            console.error('❌ Erreur API:', response.status, response.statusText);
            AppState.products = [];
            
            if (productsGrid) {
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Erreur de connexion au serveur</h3>
                        <p>Impossible de charger les produits. Veuillez réessayer plus tard.</p>
                        <button onclick="loadProducts()" class="btn-primary">
                            <i class="fas fa-sync-alt"></i> Réessayer
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        AppState.products = [];
        
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-wifi-slash"></i>
                    <h3>Problème de connexion</h3>
                    <p>Impossible de se connecter au serveur. Vérifiez votre connexion internet.</p>
                    <button onclick="loadProducts()" class="btn-primary">
                        <i class="fas fa-sync-alt"></i> Réessayer
                    </button>
                </div>
            `;
        }
    } finally {
        AppState.isLoading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Fonction pour afficher les produits
function displayProducts(filter = 'all') {
    const productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) return;
    
    // Filtrer les produits
    let filteredProducts = AppState.products;
    if (filter !== 'all') {
        filteredProducts = AppState.products.filter(product => product.category === filter);
    }
    
    // Si aucun produit
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-box-open"></i>
                <h3 data-i18n="products.empty">Aucun produit disponible</h3>
                <p data-i18n="products.emptyDesc">Notre collection sera bientôt disponible. Revenez plus tard !</p>
                ${AppState.products.length === 0 ? `
                    <button onclick="loadProducts()" class="btn-primary">
                        <i class="fas fa-sync-alt"></i> Actualiser
                    </button>
                ` : ''}
            </div>
        `;
        
        // Réappliquer les traductions
        changeLanguage(AppState.language);
        return;
    }
    
    // Générer les cartes de produits
    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-category="${product.category}">
            <div class="product-image">
                <img src="${product.image_url || product.image || 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=ES+Parfumerie'">
            </div>
            <div class="product-info">
                <span class="product-category">
                    ${product.category === 'men' ? 'Homme' : 
                      product.category === 'women' ? 'Femme' : 'Unisex'}
                </span>
                <h3>${product.name}</h3>
                <p>${(product.description || '').substring(0, 100)}${product.description && product.description.length > 100 ? '...' : ''}</p>
                <div class="product-price">${parseFloat(product.price).toFixed(2)} €</div>
                <div class="product-stock" style="font-size: 0.9rem; color: ${product.stock > 10 ? '#2ecc71' : product.stock > 0 ? '#f39c12' : '#e74c3c'}; margin: 5px 0;">
                    ${product.stock > 10 ? '🟢 En stock' : 
                     product.stock > 0 ? '🟡 Stock limité' : '🔴 Rupture de stock'}
                </div>
                <div class="product-actions">
                    ${product.stock > 0 ? 
                        `<button class="btn-primary add-to-cart" data-id="${product.id}" data-i18n="products.addToCart">Ajouter au panier</button>` : 
                        `<button class="btn-outline" disabled data-i18n="products.outOfStock">Rupture de stock</button>`
                    }
                    <button class="btn-outline view-details" data-id="${product.id}" data-i18n="products.viewDetails">Voir détails</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Réappliquer les traductions
    changeLanguage(AppState.language);
    
    // Ajouter les événements aux boutons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });
}

// Fonction pour ajouter au panier
function addToCart(productId) {
    const product = AppState.products.find(p => p.id == productId);
    
    if (!product) {
        showNotification('Produit non trouvé', 'error');
        return;
    }
    
    // Vérifier le stock
    if (product.stock <= 0) {
        showNotification('Ce produit est en rupture de stock', 'error');
        return;
    }
    
    // Ajouter au panier
    const cartItem = AppState.cart.find(item => item.product.id == productId);
    
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
        } else {
            showNotification('Stock insuffisant pour ce produit', 'error');
            return;
        }
    } else {
        AppState.cart.push({
            product: product,
            quantity: 1
        });
    }
    
    // Mettre à jour le compteur du panier
    updateCartCount();
    
    // Sauvegarder le panier dans localStorage
    saveCartToLocalStorage();
    
    // Afficher une notification
    showNotification(`${product.name} a été ajouté au panier`, 'success');
}

// Fonction pour mettre à jour le compteur du panier
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = AppState.cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Fonction pour sauvegarder le panier dans localStorage
function saveCartToLocalStorage() {
    const cartData = {
        items: AppState.cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        })),
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('es-parfumerie-cart', JSON.stringify(cartData));
}

// Fonction pour charger le panier depuis localStorage
function loadCartFromLocalStorage() {
    const cartData = localStorage.getItem('es-parfumerie-cart');
    
    if (cartData) {
        try {
            const parsedData = JSON.parse(cartData);
            
            // Pour chaque élément du panier, trouver le produit correspondant
            parsedData.items.forEach(item => {
                const product = AppState.products.find(p => p.id == item.productId);
                if (product) {
                    AppState.cart.push({
                        product: product,
                        quantity: item.quantity
                    });
                }
            });
        } catch (error) {
            console.error('Erreur lors du chargement du panier:', error);
        }
    }
    
    updateCartCount();
}

// Fonction pour afficher une notification
function showNotification(message, type = 'success') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Fermer la notification
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Fonction pour gérer la connexion
async function handleLogin(email, password, rememberMe) {
    try {
        showNotification('Connexion en cours...', 'info');
        
        // Simulation de succès
        setTimeout(() => {
            AppState.currentUser = {
                id: 1,
                email: email,
                firstName: 'Jean',
                lastName: 'Dupont',
                role: email === 'admin@esparfumerie.com' ? 'admin' : 'user'
            };
            
            // Mettre à jour l'interface
            updateUserInterface();
            
            // Fermer le modal
            closeModal('login-modal');
            
            // Afficher une notification
            showNotification('Connexion réussie !', 'success');
            
            // Sauvegarder dans localStorage si "Se souvenir de moi"
            if (rememberMe) {
                localStorage.setItem('es-parfumerie-user', JSON.stringify(AppState.currentUser));
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showNotification('Échec de la connexion. Veuillez vérifier vos identifiants.', 'error');
    }
}

// Fonction pour gérer l'inscription
async function handleSignup(firstName, lastName, email, password) {
    try {
        showNotification('Création du compte en cours...', 'info');
        
        setTimeout(() => {
            // Simulation de succès
            AppState.currentUser = {
                id: 1,
                email: email,
                firstName: firstName,
                lastName: lastName,
                role: 'user'
            };
            
            // Mettre à jour l'interface
            updateUserInterface();
            
            // Fermer le modal
            closeModal('signup-modal');
            
            // Afficher une notification
            showNotification('Compte créé avec succès !', 'success');
            
            // Sauvegarder dans localStorage
            localStorage.setItem('es-parfumerie-user', JSON.stringify(AppState.currentUser));
        }, 1000);
        
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        showNotification('Échec de la création du compte. Veuillez réessayer.', 'error');
    }
}

// Fonction pour mettre à jour l'interface utilisateur
function updateUserInterface() {
    const authButtons = document.querySelector('.auth-buttons');
    const adminActions = document.getElementById('admin-actions');
    
    if (AppState.currentUser) {
        // Masquer les boutons de connexion/inscription
        if (authButtons) authButtons.style.display = 'none';
        
        // Afficher le bouton admin si l'utilisateur est admin
        if (adminActions && AppState.currentUser.role === 'admin') {
            adminActions.style.display = 'block';
        }
    } else {
        // Afficher les boutons de connexion/inscription
        if (authButtons) authButtons.style.display = 'flex';
        
        // Masquer le bouton admin
        if (adminActions) adminActions.style.display = 'none';
    }
}

// Fonction pour ouvrir un modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Fonction pour fermer un modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser l'année dans le footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Charger les préférences utilisateur
    const savedLanguage = localStorage.getItem('es-parfumerie-language') || 'fr';
    const savedDarkMode = localStorage.getItem('es-parfumerie-darkmode') === 'true';
    const savedUser = localStorage.getItem('es-parfumerie-user');
    
    // Appliquer les préférences
    AppState.language = savedLanguage;
    AppState.darkMode = savedDarkMode;
    
    if (savedUser) {
        try {
            AppState.currentUser = JSON.parse(savedUser);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
    }
    
    // Appliquer le mode sombre
    if (AppState.darkMode) {
        document.body.classList.add('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
        }
    }
    
    // Appliquer la langue
    changeLanguage(AppState.language);
    
    // Mettre à jour l'interface utilisateur
    updateUserInterface();
    
    // Charger les produits
    loadProducts();
    
    // Charger le panier (après le chargement des produits)
    setTimeout(() => {
        loadCartFromLocalStorage();
    }, 1000);
    
    // Navigation mobile
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('open');
        });
    }
    
    if (closeMenu && mobileMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    }
    
    // Fermer le menu mobile en cliquant sur un lien
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
        });
    });
    
    // Basculer le mode sombre
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Changer la langue
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = AppState.language;
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
    
    // Navigation entre sections
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                
                // Mettre à jour la navigation active
                document.querySelectorAll('.nav-links a').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                this.classList.add('active');
                
                // Scroll vers la section
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
                
                // Fermer le menu mobile
                if (mobileMenu) {
                    mobileMenu.classList.remove('open');
                }
            }
        });
    });
    
    // Modals
    const modals = document.querySelectorAll('.modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    // Ouvrir les modals
    document.getElementById('login-btn')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('signup-btn')?.addEventListener('click', () => openModal('signup-modal'));
    document.getElementById('mobile-login-btn')?.addEventListener('click', () => openModal('login-modal'));
    document.getElementById('mobile-signup-btn')?.addEventListener('click', () => openModal('signup-modal'));
    document.getElementById('switch-to-signup')?.addEventListener('click', () => {
        closeModal('login-modal');
        openModal('signup-modal');
    });
    document.getElementById('switch-to-login')?.addEventListener('click', () => {
        closeModal('signup-modal');
        openModal('login-modal');
    });
    
    // Fermer les modals
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Fermer les modals en cliquant à l'extérieur
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            
            handleLogin(email, password, rememberMe);
        });
    }
    
    // Formulaire d'inscription
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('signup-firstname').value;
            const lastName = document.getElementById('signup-lastname').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm').value;
            
            // Validation basique
            if (password !== confirmPassword) {
                showNotification('Les mots de passe ne correspondent pas.', 'error');
                return;
            }
            
            if (password.length < 6) {
                showNotification('Le mot de passe doit contenir au moins 6 caractères.', 'error');
                return;
            }
            
            handleSignup(firstName, lastName, email, password);
        });
    }
    
    // Formulaire de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulation d'envoi
            showNotification('Votre message a été envoyé avec succès !', 'success');
            this.reset();
        });
    }
    
    // Filtrage des produits
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            this.classList.add('active');
            
            // Filtrer les produits
            const filter = this.getAttribute('data-filter');
            displayProducts(filter);
        });
    });
    
    // Bouton de rafraîchissement des produits
    const refreshBtn = document.getElementById('refresh-products');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.disabled = true;
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            
            loadProducts();
            
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = originalHTML;
            }, 2000);
        });
    }
    
    // Écouter les messages depuis le panel admin
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'RELOAD_PRODUCTS') {
            console.log('🔄 Rechargement des produits demandé depuis le panel admin');
            showNotification('Nouveaux produits disponibles !', 'info');
            loadProducts();
        }
    });
    
    // Rafraîchir les produits toutes les 60 secondes
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadProducts();
        }
    }, 60000);
    
    // Ajouter les styles pour les notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--bg-color);
            color: var(--text-color);
            border-radius: var(--radius);
            box-shadow: var(--shadow-hover);
            padding: var(--space-md);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            z-index: 1003;
            transform: translateX(100%);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            border-left: 4px solid #4CAF50;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.error {
            border-left-color: #f44336;
        }
        
        .notification.info {
            border-left-color: #2196F3;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: var(--space-sm);
            flex-grow: 1;
        }
        
        .notification-content i {
            font-size: 1.5rem;
        }
        
        .notification.success .notification-content i {
            color: #4CAF50;
        }
        
        .notification.error .notification-content i {
            color: #f44336;
        }
        
        .notification.info .notification-content i {
            color: #2196F3;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: var(--text-light);
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            margin-left: var(--space-sm);
        }
        
        @media (max-width: 768px) {
            .notification {
                left: 20px;
                right: 20px;
                min-width: auto;
                max-width: none;
            }
        }
    `;
    document.head.appendChild(style);
});
