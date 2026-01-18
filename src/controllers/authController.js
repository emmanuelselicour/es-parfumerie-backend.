const login = async (req, res) => {
  try {
    console.log('📨 Tentative de connexion:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // DEBUG: Log pour voir ce qui se passe
    console.log('🔍 Email reçu:', email);
    
    // ACCÈS ADMIN DE SECOURS - FORCER L'ACCÈS
    if (email === 'admin@es-parfumerie.com') {
      console.log('🔧 Mode admin détecté');
      
      // 1. D'abord essayer de trouver l'utilisateur
      let user = await User.findByEmail(email);
      console.log('🔍 Utilisateur trouvé en base:', user ? 'OUI' : 'NON');
      
      if (user) {
        console.log('📋 Infos utilisateur:', {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        });
      }
      
      // 2. Si l'utilisateur n'existe pas, le créer
      if (!user) {
        console.log('👤 Création de l\'admin...');
        try {
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(password, 10);
          
          user = await User.create({
            name: 'Administrateur ES',
            email: email,
            password: hashedPassword,
            role: 'admin'
          });
          console.log('✅ Admin créé avec ID:', user.id);
        } catch (createError) {
          console.error('❌ Erreur création admin:', createError);
          
          // Utilisateur temporaire
          user = {
            id: 1,
            name: 'Administrateur ES',
            email: email,
            role: 'admin',
            is_active: true,
            password: 'hashed' // Placeholder
          };
        }
      }
      
      // 3. Vérifier si le mot de passe est correct
      let passwordValid = false;
      
      if (user.password && user.password !== 'hashed') {
        // Vérifier le mot de passe hashé
        const bcrypt = require('bcryptjs');
        passwordValid = await bcrypt.compare(password, user.password);
      } else {
        // Accepter le mot de passe par défaut
        passwordValid = (password === 'Admin123!');
      }
      
      console.log('🔑 Mot de passe valide:', passwordValid);
      
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }
      
      // 4. Vérifier et forcer le rôle admin
      if (user.role !== 'admin') {
        console.log('⚠️  Rôle non admin détecté, mise à jour...');
        try {
          await User.update(user.id, { role: 'admin' });
          user.role = 'admin';
        } catch (error) {
          console.error('❌ Erreur mise à jour rôle:', error);
        }
      }
      
      // 5. Générer le token
      const token = generateToken(user.id);
      
      // 6. Mettre à jour last_login
      try {
        await User.updateLastLogin(user.id);
      } catch (error) {
        console.log('⚠️  Impossible de mettre à jour last_login');
      }
      
      console.log('✅ Connexion admin réussie, token généré');
      
      // 7. Répondre avec succès
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: 'Connexion administrateur réussie'
      });
      
    }

    // CODE NORMAL POUR LES AUTRES UTILISATEURS
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    const token = generateToken(user.id);
    await User.updateLastLogin(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};
