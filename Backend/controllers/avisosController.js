const db = require("../config/db");
const { notificarNuevoAviso } = require("../services/notificacionesService");

const rolesPublicacion = ["admin", "committee"];
const normalizarCategoria = (categoria = "Aviso") => String(categoria || "Aviso").trim().slice(0, 60);
const normalizarPrioridad = (prioridad = "normal") => {
  const p = String(prioridad || "normal").toLowerCase();
  if (["alta", "importante", "urgente"].includes(p)) return "alta";
  if (["baja"].includes(p)) return "baja";
  return "normal";
};

const obtenerAvisos = (req, res) => {
  db.query(
    `SELECT avisos.*, usuarios.name AS autor, usuarios.role AS autor_rol
     FROM avisos
     INNER JOIN usuarios ON avisos.user_id = usuarios.id
     WHERE COALESCE(avisos.estado, 'activo') <> 'archivado'
     ORDER BY COALESCE(avisos.fijado, 0) DESC, avisos.created_at DESC`,
    (error, rows) => {
      if (error) {
        console.error("Error SQL al obtener avisos:", error);
        return res.status(500).json({ message: "Error al obtener avisos" });
      }
      res.json(rows);
    }
  );
};

const crearAviso = (req, res) => {
  const { title, content, categoria, prioridad } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!rolesPublicacion.includes(userRole)) {
    return res.status(403).json({ message: "Solo administrador o comité pueden publicar avisos" });
  }

  if (!title || !content) {
    return res.status(400).json({ message: "Título y contenido son obligatorios" });
  }

  db.query(
    "INSERT INTO avisos (user_id, title, content, categoria, prioridad, estado, fijado) VALUES (?, ?, ?, ?, ?, 'activo', 0)",
    [userId, title.trim(), content.trim(), normalizarCategoria(categoria), normalizarPrioridad(prioridad)],
    async (error, result) => {
      if (error) {
        console.error("Error SQL al crear aviso:", error);
        return res.status(500).json({ message: "Error al crear aviso" });
      }

      try { await notificarNuevoAviso(result.insertId); }
      catch (notificationError) { console.error("El aviso se creó, pero falló la notificación por correo:", notificationError.message); }

      res.status(201).json({ message: "Aviso publicado correctamente", noticeId: result.insertId });
    }
  );
};

const actualizarAviso = (req, res) => {
  const { id } = req.params;
  const { title, content, categoria, prioridad } = req.body;
  const userRole = req.user.role;

  if (!rolesPublicacion.includes(userRole)) {
    return res.status(403).json({ message: "No tienes permisos para editar avisos" });
  }

  if (!title || !content) {
    return res.status(400).json({ message: "Título y contenido son obligatorios" });
  }

  db.query(
    `UPDATE avisos
     SET title = ?, content = ?, categoria = ?, prioridad = ?
     WHERE id = ?`,
    [title.trim(), content.trim(), normalizarCategoria(categoria), normalizarPrioridad(prioridad), id],
    (error, result) => {
      if (error) {
        console.error("Error SQL al actualizar aviso:", error);
        return res.status(500).json({ message: "Error al actualizar aviso" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: "Aviso no encontrado" });
      res.json({ message: "Aviso actualizado correctamente" });
    }
  );
};

const fijarAviso = (req, res) => {
  const { id } = req.params;
  const { fijado } = req.body;
  const userRole = req.user.role;

  if (!rolesPublicacion.includes(userRole)) {
    return res.status(403).json({ message: "No tienes permisos para fijar avisos" });
  }

  db.query(
    "UPDATE avisos SET fijado = ? WHERE id = ?",
    [fijado ? 1 : 0, id],
    (error, result) => {
      if (error) {
        console.error("Error SQL al fijar aviso:", error);
        return res.status(500).json({ message: "Error al cambiar fijado del aviso" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: "Aviso no encontrado" });
      res.json({ message: fijado ? "Aviso fijado correctamente" : "Aviso desfijado correctamente" });
    }
  );
};

const eliminarAviso = (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (!rolesPublicacion.includes(userRole)) {
    return res.status(403).json({ message: "No tienes permisos para eliminar avisos" });
  }

  db.query(
    "UPDATE avisos SET estado = 'archivado' WHERE id = ?",
    [id],
    (error, result) => {
      if (error) {
        console.error("Error SQL al eliminar aviso:", error);
        return res.status(500).json({ message: "Error al eliminar aviso" });
      }
      if (result.affectedRows === 0) return res.status(404).json({ message: "Aviso no encontrado" });
      res.json({ message: "Aviso eliminado correctamente" });
    }
  );
};

module.exports = { obtenerAvisos, crearAviso, actualizarAviso, fijarAviso, eliminarAviso };
