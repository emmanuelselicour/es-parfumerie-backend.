const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accès non autorisé. Droits administrateur requis.' 
    });
  }
  next();
};

module.exports = admin;
