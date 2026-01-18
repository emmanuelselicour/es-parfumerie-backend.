// admin.js - Version corrigée
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'https://es-parfumerie-backend.onrender.com';
    let currentUser = null;
    let currentPage = 'dashboard';

    // Initialisation
    init();

    async function init() {
        console.log('Initialisation du panel admin...');
        await checkAuth();
        setupEventListeners();
    }

    async function checkAuth() {
        console.log('Vérification de l\'authentification...');
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
            console.log('Aucun token trouvé, affichage login');
            showLoginPage();
            return;
        }

        try {
            console.log('Tentative de vérification du token...');
            const response = await fetch(`${API_BASE_URL}/api/health`);
            
            if (!response.ok) {
                throw new Error('API non accessible');
            }

            // Vérifier si le token est valide en testant une route protégée
            const authResponse = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (authResponse.ok) {
                console.log('Authentification réussie');
                currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
                showAdminPanel();
                await loadPage(currentPage);
            } else {
                console.log('Token invalide ou expiré');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                showLoginPage();
            }
        } catch (error) {
            console.error('Erreur de vérification:', error);
            showLoginPage();
        }
    }

    function showLoginPage() {
        console.log('Affichage de la page de login');
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    function showAdminPanel() {
        console.log('Affichage du panel admin');
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'flex';
        
        if (currentUser && currentUser.name) {
            document.getElementById('adminName').textContent = currentUser.name;
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        console.log('Tentative de connexion...');
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        const loginAlert = document.getElementById('loginAlert');
        loginAlert.style.display = 'none';
        
        // Afficher un indicateur de chargement
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
        submitBtn.disabled = true;
        
        try {
            console.log('Envoi de la requête de login à:', `${API_BASE_URL}/api/auth/login`);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log('Réponse reçue:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Données reçues:', data);
                
                if (data.user && data.user.role === 'admin') {
                    // Sauvegarder les informations
                    localStorage.setItem('adminToken', data.token);
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    
                    currentUser = data.user;
                    showAdminPanel();
                    await loadPage('dashboard');
                    
                    showAlert('Connexion réussie!', 'success');
                } else {
                    throw new Error('Accès administrateur requis');
                }
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Erreur de serveur' }));
                throw new Error(errorData.message || `Erreur ${response.status}`);
            }
            
        } catch (error) {
            console.error('Erreur de connexion:', error);
            
            loginAlert.textContent = error.message || 'Erreur de connexion au serveur';
            loginAlert.className = 'alert alert-error';
            loginAlert.style.display = 'block';
            
            // Faire vibrer l'alerte pour attirer l'attention
            loginAlert.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginAlert.style.animation = '';
            }, 500);
            
        } finally {
            // Restaurer le bouton
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    function setupEventListeners() {
        console.log('Configuration des événements...');
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                currentUser = null;
                showLoginPage();
                showAlert('Déconnexion réussie', 'info');
            });
        }
        
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }
        
        // User menu
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', function() {
                document.getElementById('userDropdown').classList.toggle('active');
            });
        }
        
        // Navigation
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                navigateTo(page);
            });
        });
        
        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-menu')) {
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) dropdown.classList.remove('active');
            }
        });
    }

    async function navigateTo(page) {
        console.log('Navigation vers:', page);
        
        // Update active menu
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'products': 'Produits',
            'categories': 'Catégories',
            'orders': 'Commandes',
            'users': 'Utilisateurs',
            'settings': 'Paramètres'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = titles[page] || page;
        
        // Load page content
        await loadPage(page);
    }

    async function loadPage(page) {
        console.log('Chargement de la page:', page);
        currentPage = page;
        
        // Hide all pages
        document.querySelectorAll('#contentArea > div').forEach(div => {
            div.style.display = 'none';
        });
        
        // Show current page
        const pageElement = document.getElementById(`${page}Page`);
        if (pageElement) {
            pageElement.style.display = 'block';
            
            // Load specific content
            switch(page) {
                case 'dashboard':
                    await loadDashboard();
                    break;
                case 'products':
                    await loadProducts();
                    break;
                case 'categories':
                    await loadCategories();
                    break;
                case 'orders':
                    await loadOrders();
                    break;
                case 'users':
                    await loadUsers();
                    break;
                case 'settings':
                    loadSettings();
                    break;
            }
        }
    }

    async function loadDashboard() {
        console.log('Chargement du dashboard...');
        
        const dashboardPage = document.getElementById('dashboardPage');
        if (!dashboardPage) return;
        
        dashboardPage.innerHTML = `
            <div class="stats-grid" id="statsGrid">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i> Chargement des statistiques...
                </div>
            </div>
            
            <div class="recent-orders">
                <div class="table-container">
                    <div class="table-header">
                        <h3>Commandes récentes</h3>
                        <a href="#" data-page="orders" class="btn btn-secondary">Voir tout</a>
                    </div>
                    <div class="loading" style="min-height: 200px;">
                        <i class="fas fa-spinner fa-spin"></i> Chargement des commandes...
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener for "Voir tout"
        setTimeout(() => {
            const seeAllBtn = dashboardPage.querySelector('[data-page="orders"]');
            if (seeAllBtn) {
                seeAllBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('orders');
                });
            }
        }, 100);
        
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                throw new Error('Non authentifié');
            }
            
            console.log('Récupération des statistiques...');
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Statut réponse:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Données reçues:', data);
                renderDashboard(data);
            } else {
                throw new Error(`Erreur ${response.status}`);
            }
            
        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
            
            const statsGrid = document.getElementById('statsGrid');
            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>Impossible de charger les statistiques</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo"></i> Réessayer
                        </button>
                    </div>
                `;
            }
        }
    }

    function renderDashboard(data) {
        console.log('Rendu du dashboard avec:', data);
        
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid || !data.stats) return;
        
        const stats = data.stats;
        
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon users">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.totalUsers || 0}</h3>
                    <p>Utilisateurs</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon products">
                    <i class="fas fa-wine-bottle"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.totalProducts || 0}</h3>
                    <p>Produits</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon orders">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.totalOrders || 0}</h3>
                    <p>Commandes</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon revenue">
                    <i class="fas fa-euro-sign"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.totalRevenue || 0}€</h3>
                    <p>Revenu total</p>
                </div>
            </div>
        `;
        
        // Render recent orders if available
        const ordersContainer = document.querySelector('.recent-orders .table-container');
        if (ordersContainer && stats.recentOrders && stats.recentOrders.length > 0) {
            let ordersHtml = `
                <div class="table-header">
                    <h3>Commandes récentes</h3>
                    <a href="#" data-page="orders" class="btn btn-secondary">Voir tout</a>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Client</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            stats.recentOrders.forEach(order => {
                const date = new Date(order.created_at);
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                
                ordersHtml += `
                    <tr>
                        <td>${order.order_number || 'N/A'}</td>
                        <td>${order.customer_name || 'Anonyme'}</td>
                        <td>${order.total_amount || 0}€</td>
                        <td><span class="status ${order.status || 'pending'}">${order.status || 'En attente'}</span></td>
                        <td>${formattedDate}</td>
                    </tr>
                `;
            });
            
            ordersHtml += `</tbody></table>`;
            ordersContainer.innerHTML = ordersHtml;
            
            // Add event listener to "Voir tout" button
            const seeAllBtn = ordersContainer.querySelector('[data-page="orders"]');
            if (seeAllBtn) {
                seeAllBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('orders');
                });
            }
        } else if (ordersContainer) {
            ordersContainer.innerHTML = `
                <div class="table-header">
                    <h3>Commandes récentes</h3>
                    <a href="#" data-page="orders" class="btn btn-secondary">Voir tout</a>
                </div>
                <div style="padding: 40px; text-align: center; color: #666;">
                    <p>Aucune commande récente</p>
                </div>
            `;
            
            const seeAllBtn = ordersContainer.querySelector('[data-page="orders"]');
            if (seeAllBtn) {
                seeAllBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateTo('orders');
                });
            }
        }
    }

    async function loadProducts() {
        console.log('Chargement des produits...');
        
        const productsPage = document.getElementById('productsPage');
        if (!productsPage) return;
        
        productsPage.innerHTML = `
            <div class="table-container">
                <div class="table-header">
                    <h3>Produits</h3>
                    <button class="btn btn-primary" id="addProductBtn">
                        <i class="fas fa-plus"></i> Ajouter un produit
                    </button>
                </div>
                <div class="loading" style="min-height: 300px;">
                    <i class="fas fa-spinner fa-spin"></i> Chargement des produits...
                </div>
            </div>
        `;
        
        // Add product button
        setTimeout(() => {
            const addBtn = document.getElementById('addProductBtn');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    openProductModal();
                });
            }
        }, 100);
        
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) throw new Error('Non authentifié');
            
            const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                renderProducts(data.products || []);
            } else {
                throw new Error(`Erreur ${response.status}`);
            }
            
        } catch (error) {
            console.error('Erreur chargement produits:', error);
            productsPage.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>Erreur de chargement</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Fonctions restantes (loadCategories, loadOrders, etc.)...
    // Continuez avec les autres fonctions comme dans le code précédent

    function showAlert(message, type = 'info') {
        // Supprimer les alertes existantes
        const existingAlerts = document.querySelectorAll('.global-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Créer la nouvelle alerte
        const alert = document.createElement('div');
        alert.className = `global-alert alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            alert.style.backgroundColor = '#2ecc71';
        } else if (type === 'error') {
            alert.style.backgroundColor = '#e74c3c';
        } else {
            alert.style.backgroundColor = '#3498db';
        }
        
        document.body.appendChild(alert);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => alert.remove(), 300);
            }
        }, 3000);
    }

    // Ajouter les animations CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .error-message {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
            color: #721c24;
        }
    `;
    document.head.appendChild(style);
});
