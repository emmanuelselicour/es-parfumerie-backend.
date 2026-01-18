// Route de débogage
router.post('/debug-admin', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findByEmail(email || 'admin@es-parfumerie.com');
    
    if (!user) {
      return res.json({
        exists: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier les permissions
    const canAccessAdmin = user.role === 'admin' && user.is_active === true;
    
    res.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      },
      canAccessAdmin: canAccessAdmin,
      message: canAccessAdmin ? 'Peut accéder au panel admin' : 'Ne peut pas accéder au panel admin'
    });
    
  } catch (error) {
    console.error('Erreur débogage:', error);
    res.status(500).json({
      error: error.message
    });
  }
});
