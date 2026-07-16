const db = require("../config/db");
const { registrarCliente, emitirNuevaAlerta } = require("../utils/emergenciaStream");
const { notificarNuevaEmergencia } = require("../services/notificacionesService");

const crearAlerta = (req, res) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;

  if (!latitude || !longitude) {
    return res.status(400).json({
      message: "La ubicación es obligatoria"
    });
  }

  db.query(
    "INSERT INTO alertas_emergencia (user_id, latitude, longitude, status) VALUES (?, ?, ?, ?)",
    [userId, latitude, longitude, "enviada"],
    (error, result) => {
      if (error) {
        console.error("Error SQL al registrar alerta:", error);
        return res.status(500).json({
          message: "Error al registrar la alerta"
        });
      }

      db.query(
        `SELECT 
          ae.id,
          ae.user_id,
          ae.latitude,
          ae.longitude,
          ae.status,
          ae.created_at,
          u.name AS usuario
         FROM alertas_emergencia ae
         INNER JOIN usuarios u ON ae.user_id = u.id
         WHERE ae.id = ?`,
        [result.insertId],
        async (errorSelect, rows) => {
          if (errorSelect) {
            console.error("Error SQL al obtener alerta creada:", errorSelect);
            return res.status(201).json({
              message: "Alerta registrada, pero no se pudo recuperar el detalle",
              alertId: result.insertId
            });
          }

          const alertaCreada = rows[0];

          emitirNuevaAlerta({
            id: alertaCreada.id,
            usuario: alertaCreada.usuario,
            latitude: alertaCreada.latitude,
            longitude: alertaCreada.longitude,
            status: alertaCreada.status,
            created_at: alertaCreada.created_at
          });

          try {
            await notificarNuevaEmergencia(result.insertId);
          } catch (notificationError) {
            console.error("La alerta se creó, pero falló la notificación por correo:", notificationError.message);
          }

          res.status(201).json({
            message: "Alerta de emergencia registrada correctamente",
            alertId: result.insertId,
            alerta: alertaCreada
          });
        }
      );
    }
  );
};

const obtenerAlertas = (req, res) => {
  db.query(
    `SELECT 
      alertas_emergencia.*,
      usuarios.name AS usuario
     FROM alertas_emergencia
     INNER JOIN usuarios ON alertas_emergencia.user_id = usuarios.id
     ORDER BY alertas_emergencia.created_at DESC`,
    (error, rows) => {
      if (error) {
        console.error("Error SQL al obtener alertas:", error);
        return res.status(500).json({
          message: "Error al obtener alertas"
        });
      }

      res.json(rows);
    }
  );
};

const streamAlertas = (req, res) => {
  registrarCliente(req, res);
};

const actualizarEstadoAlerta = (req, res) => {
  const { id } = req.params;
  const { estado = "en atención", comentario = "" } = req.body;
  const rolUsuario = req.user.role;
  const usuarioId = req.user.id;
  const estadosValidos = ["enviada", "en atención", "atendida", "cancelada"];
  const estadoNormalizado = String(estado).toLowerCase();

  if (!["admin", "committee", "security"].includes(rolUsuario)) {
    return res.status(403).json({ message: "No tienes permisos para atender alertas" });
  }

  if (!estadosValidos.includes(estadoNormalizado)) {
    return res.status(400).json({ message: "Estado de alerta no válido" });
  }

  db.query("SELECT status FROM alertas_emergencia WHERE id = ?", [id], (selectError, rows) => {
    if (selectError) {
      console.error("Error SQL al consultar alerta:", selectError);
      return res.status(500).json({ message: "Error al consultar la alerta" });
    }

    if (rows.length === 0) return res.status(404).json({ message: "Alerta no encontrada" });

    const estadoAnterior = rows[0].status;
    const atendidaAt = estadoNormalizado === "atendida" ? new Date() : null;

    db.query(
      `UPDATE alertas_emergencia
       SET status = ?, atendida_por = ?, atendida_at = COALESCE(?, atendida_at), comentarios = ?
       WHERE id = ?`,
      [estadoNormalizado, usuarioId, atendidaAt, comentario || null, id],
      (updateError) => {
        if (updateError) {
          console.error("Error SQL al actualizar alerta:", updateError);
          return res.status(500).json({ message: "Error al actualizar la alerta" });
        }

        db.query(
          `INSERT INTO historial_alertas_emergencia (alerta_id, usuario_id, estado_anterior, estado_nuevo, comentario)
           VALUES (?, ?, ?, ?, ?)`,
          [id, usuarioId, estadoAnterior, estadoNormalizado, comentario || null],
          (historialError) => {
            if (historialError) console.error("No se pudo registrar historial de alerta:", historialError.message);
            res.json({ message: "Estado de alerta actualizado correctamente" });
          }
        );
      }
    );
  });
};


module.exports = {
  crearAlerta,
  obtenerAlertas,
  streamAlertas,
  actualizarEstadoAlerta
};
