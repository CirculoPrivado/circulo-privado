const soloAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso solo para administradores" });
  }

  return next();
};

module.exports = soloAdmin;
