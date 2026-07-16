const db = require("../config/db");
const { notificarNuevoIncidente } = require("../services/notificacionesService");

const crearIncidente = (req, res) => {
  const { title, category, description, location_text } = req.body;
  const userId = req.user.id;

  if (!title || !description || !location_text) {
    return res.status(400).json({
      message: "Faltan campos obligatorios"
    });
  }

  db.query(
    `INSERT INTO incidentes (user_id, title, category, description, location_text)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, title, category || "general", description, location_text],
    async (error, result) => {
      if (error) {
        console.error("Error SQL al crear incidente:", error);
        return res.status(500).json({
          message: "Error al crear incidente"
        });
      }

      try {
        await notificarNuevoIncidente(result.insertId);
      } catch (notificationError) {
        console.error("El incidente se creó, pero falló la notificación por correo:", notificationError.message);
      }

      res.status(201).json({
        message: "Incidente registrado correctamente",
        incidentId: result.insertId
      });
    }
  );
};

const obtenerIncidentes = (req, res) => {
  db.query(
    `SELECT incidentes.*, usuarios.name AS usuario
     FROM incidentes
     INNER JOIN usuarios ON incidentes.user_id = usuarios.id
     ORDER BY incidentes.created_at DESC`,
    (error, rows) => {
      if (error) {
        console.error("Error SQL al obtener incidentes:", error);
        return res.status(500).json({
          message: "Error al obtener incidentes"
        });
      }

      res.json(rows);
    }
  );
};

const obtenerIncidentePorId = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT incidentes.*, usuarios.name AS usuario, usuarios.role AS rol_usuario
     FROM incidentes
     INNER JOIN usuarios ON incidentes.user_id = usuarios.id
     WHERE incidentes.id = ?`,
    [id],
    (error, rows) => {
      if (error) {
        console.error("Error SQL al obtener detalle del incidente:", error);
        return res.status(500).json({
          message: "Error al obtener el incidente"
        });
      }

      if (rows.length === 0) {
        return res.status(404).json({
          message: "Incidente no encontrado"
        });
      }

      res.json(rows[0]);
    }
  );
};

const actualizarEstadoIncidente = (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const rolUsuario = req.user.role;

  if (!["admin", "committee", "security"].includes(rolUsuario)) {
    return res.status(403).json({
      message: "No tienes permisos para actualizar el estado"
    });
  }

  if (!estado) {
    return res.status(400).json({
      message: "El estado es obligatorio"
    });
  }

  db.query("SELECT status FROM incidentes WHERE id = ?", [id], (selectError, rows) => {
    if (selectError) {
      console.error("Error SQL al consultar incidente:", selectError);
      return res.status(500).json({ message: "Error al consultar el incidente" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Incidente no encontrado" });
    }

    const estadoAnterior = rows[0].status;
    const resueltoAt = String(estado).toLowerCase().includes("resuelto") ? new Date() : null;

    db.query(
      "UPDATE incidentes SET status = ?, resuelto_at = COALESCE(?, resuelto_at) WHERE id = ?",
      [estado, resueltoAt, id],
      (error) => {
        if (error) {
          console.error("Error SQL al actualizar estado:", error);
          return res.status(500).json({ message: "Error al actualizar el estado" });
        }

        db.query(
          `INSERT INTO historial_incidentes (incidente_id, usuario_id, estado_anterior, estado_nuevo, comentario)
           VALUES (?, ?, ?, ?, ?)`,
          [id, req.user.id, estadoAnterior, estado, req.body.comentario || null],
          (historialError) => {
            if (historialError) console.error("No se pudo registrar historial de incidente:", historialError.message);
            res.json({ message: "Estado del incidente actualizado correctamente" });
          }
        );
      }
    );
  });
};

module.exports = {
  crearIncidente,
  obtenerIncidentes,
  obtenerIncidentePorId,
  actualizarEstadoIncidente
};
