const db = require("../config/db");

const obtenerResumenComunidad = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS totalUsuarios
    FROM usuarios
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error al obtener resumen de comunidad:", err);
      return res.status(500).json({ message: "Error al obtener el resumen de la comunidad" });
    }

    return res.json({
      totalUsuarios: Number(rows?.[0]?.totalUsuarios || 0),
    });
  });
};

module.exports = {
  obtenerResumenComunidad,
};
