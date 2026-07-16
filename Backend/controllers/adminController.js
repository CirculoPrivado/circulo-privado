const db = require("../config/db");

const listarUsuarios = (req, res) => {
  const sql = `
    SELECT
      id,
      name,
      email,
      role,
      telefono,
      created_at,
      COALESCE(activo, 1) AS activo
    FROM usuarios
    ORDER BY created_at DESC, id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error al listar usuarios:", err);
      return res.status(500).json({ message: "Error al obtener usuarios" });
    }

    return res.json(rows.map((usuario) => ({
      ...usuario,
      activo: Number(usuario.activo) === 1,
    })));
  });
};

const transferirAdministrador = (req, res) => {
  const { userId } = req.body;
  const adminActualId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ message: "El usuario destino es obligatorio" });
  }

  if (Number(userId) === Number(adminActualId)) {
    return res.status(400).json({ message: "Ya eres el administrador actual" });
  }

  db.query(
    "SELECT id, COALESCE(activo, 1) AS activo FROM usuarios WHERE id = ? LIMIT 1",
    [userId],
    (findErr, rows) => {
      if (findErr) {
        console.error("Error al validar usuario destino:", findErr);
        return res.status(500).json({ message: "Error al validar usuario destino" });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (Number(rows[0].activo) !== 1) {
        return res.status(400).json({ message: "No puedes ceder la administración a un usuario bloqueado" });
      }

      db.beginTransaction((txErr) => {
        if (txErr) {
          console.error("Error al iniciar transacción:", txErr);
          return res.status(500).json({ message: "Error al iniciar transferencia" });
        }

        db.query(
          "UPDATE usuarios SET role = 'resident' WHERE id = ?",
          [adminActualId],
          (removeErr) => {
            if (removeErr) {
              console.error("Error al remover admin actual:", removeErr);
              return db.rollback(() => res.status(500).json({ message: "Error al transferir administrador" }));
            }

            db.query(
              "UPDATE usuarios SET role = 'admin', activo = 1 WHERE id = ?",
              [userId],
              (assignErr) => {
                if (assignErr) {
                  console.error("Error al asignar nuevo admin:", assignErr);
                  return db.rollback(() => res.status(500).json({ message: "Error al transferir administrador" }));
                }

                db.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Error al confirmar transferencia:", commitErr);
                    return db.rollback(() => res.status(500).json({ message: "Error al transferir administrador" }));
                  }

                  return res.json({
                    message: "Administrador transferido correctamente",
                    transferredTo: Number(userId),
                    previousAdminId: Number(adminActualId),
                  });
                });
              }
            );
          }
        );
      });
    }
  );
};

const actualizarEstadoUsuario = (req, res) => {
  const { userId } = req.params;
  const { activo } = req.body;
  const adminActualId = req.user?.id;

  if (typeof activo !== "boolean") {
    return res.status(400).json({ message: "El estado activo debe ser booleano" });
  }

  if (Number(userId) === Number(adminActualId)) {
    return res.status(400).json({ message: "No puedes bloquear tu propia cuenta de administrador" });
  }

  db.query(
    "SELECT id, role FROM usuarios WHERE id = ? LIMIT 1",
    [userId],
    (findErr, rows) => {
      if (findErr) {
        console.error("Error al validar usuario:", findErr);
        return res.status(500).json({ message: "Error al validar usuario" });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (rows[0].role === "admin") {
        return res.status(400).json({ message: "No puedes bloquear al administrador actual" });
      }

      db.query(
        "UPDATE usuarios SET activo = ? WHERE id = ?",
        [activo ? 1 : 0, userId],
        (updateErr) => {
          if (updateErr) {
            console.error("Error al actualizar estado del usuario:", updateErr);
            return res.status(500).json({ message: "Error al actualizar el acceso del usuario" });
          }

          return res.json({
            message: activo ? "Usuario desbloqueado correctamente" : "Usuario bloqueado correctamente",
          });
        }
      );
    }
  );
};

const eliminarUsuario = (req, res) => {
  const { userId } = req.params;
  const adminActualId = req.user?.id;

  if (Number(userId) === Number(adminActualId)) {
    return res.status(400).json({ message: "No puedes eliminar tu propia cuenta de administrador" });
  }

  db.query(
    "SELECT id, role FROM usuarios WHERE id = ? LIMIT 1",
    [userId],
    (findErr, rows) => {
      if (findErr) {
        console.error("Error al validar usuario a eliminar:", findErr);
        return res.status(500).json({ message: "Error al validar usuario" });
      }

      if (!rows.length) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (rows[0].role === "admin") {
        return res.status(400).json({ message: "No puedes eliminar al administrador actual" });
      }

      db.query("DELETE FROM usuarios WHERE id = ?", [userId], (deleteErr) => {
        if (deleteErr) {
          console.error("Error al eliminar usuario:", deleteErr);
          return res.status(500).json({ message: "Error al eliminar usuario" });
        }

        return res.json({ message: "Usuario eliminado correctamente" });
      });
    }
  );
};

module.exports = {
  listarUsuarios,
  transferirAdministrador,
  actualizarEstadoUsuario,
  eliminarUsuario,
};
