// Route temporaire pour créer un admin
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Vérifier si c'est une demande autorisée
    const secretKey = process.env.ADMIN_CREATION_KEY || 'temp-secret-key-2023';
    if (req.headers['x-admin-key'] !== secretKey) {
      return res.status(401).json({ success: false, message: 'Non autorisé' });
    }
    
    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insérer dans la base de données
    const result = await query(
      `INSERT INTO users (name, email, password, role, email_verified) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE 
       SET password = $3, role = $4, updated_at = CURRENT_TIMESTAMP 
       RETURNING id, name, email, role`,
      [name || 'Administrateur', email, hashedPassword, 'admin', true]
    );
    
    res.json({
      success: true,
      message: 'Admin créé avec succès',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Erreur création admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
