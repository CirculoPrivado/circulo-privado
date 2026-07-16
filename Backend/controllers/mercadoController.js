const db = require("../config/db");
const { subirArchivo } = require("../services/integrations/almacenamientoService");

const obtenerPublicaciones = (req, res) => {
  const sql = `
    SELECT mv.*, u.name AS nombre_usuario, u.telefono
    FROM mercado_vecinal mv
    LEFT JOIN usuarios u ON mv.user_id = u.id
    ORDER BY mv.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener publicaciones:", err);
      return res.status(500).json({ message: "Error al obtener publicaciones" });
    }

    return res.json(results);
  });
};

const obtenerPublicacionPorId = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT mv.*, u.name AS nombre_usuario, u.telefono
    FROM mercado_vecinal mv
    LEFT JOIN usuarios u ON mv.user_id = u.id
    WHERE mv.id = ?
    LIMIT 1
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener publicación:", err);
      return res.status(500).json({ message: "Error al obtener publicación" });
    }

    if (!results.length) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    return res.json(results[0]);
  });
};

const crearPublicacion = async (req, res) => {
  try {
    const { titulo, descripcion, precio, categoria, stock } = req.body;
    const userId = req.user?.id;

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    console.log("USER:", req.user);

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!titulo || !descripcion || !categoria) {
      return res.status(400).json({
        message: "Título, descripción y categoría son obligatorios",
      });
    }

    let imagen = null;

    if (req.file) {
      console.log("Subiendo archivo a Cloudinary:", req.file.path);
      const resultado = await subirArchivo(req.file.path);
      console.log("Cloudinary OK:", resultado.secure_url);
      imagen = resultado.secure_url;
    }

    const sql = `
      INSERT INTO mercado_vecinal
      (user_id, titulo, descripcion, precio, categoria, imagen, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const datos = [
      userId,
      titulo,
      descripcion,
      precio || null,
      categoria,
      imagen,
      Number(stock) || 1,
    ];

    console.log("Datos para insertar:", datos);

    db.query(sql, datos, (err, result) => {
      if (err) {
        console.error("❌ Error SQL al crear publicación:", err);
        return res.status(500).json({
          message: "Error al crear publicación",
          detail: err.sqlMessage || err.message,
        });
      }

      return res.status(201).json({
        message: "Publicación creada correctamente",
        id: result.insertId,
        imagen,
      });
    });
  } catch (error) {
    console.error("❌ Error en crearPublicacion:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      detail: error.message,
    });
  }
};

module.exports = {
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  crearPublicacion,
};