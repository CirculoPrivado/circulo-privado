const jwt = require("jsonwebtoken");
const db = require("../config/db");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    db.query(
      `
        SELECT id, email, role, COALESCE(activo, 1) AS activo
        FROM usuarios
        WHERE id = ?
        LIMIT 1
      `,
      [decoded.id],
      (error, rows) => {
        if (error) {
          console.error("Error validando sesión:", error);
          return res.status(500).json({ message: "Error al validar sesión" });
        }

        if (!rows.length) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const usuario = rows[0];

        if (Number(usuario.activo) !== 1) {
          return res.status(403).json({ message: "Tu acceso ha sido bloqueado" });
        }

        req.user = {
          id: usuario.id,
          email: usuario.email,
          role: usuario.role,
          activo: Number(usuario.activo) === 1,
        };

        return next();
      }
    );
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = verificarToken;
