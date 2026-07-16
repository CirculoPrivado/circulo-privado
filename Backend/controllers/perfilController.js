const fs = require("fs");
const db = require("../config/db");
const {
  geocodeAddress,
  reverseGeocode,
  buildAddressFromParts,
} = require("../services/geocodingService");
const {
  subirArchivo,
  eliminarArchivo,
} = require("../services/integrations/almacenamientoService");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizarDireccion = (body = {}) => ({
  street: body.street?.trim() || null,
  ext_number: body.ext_number?.trim() || null,
  neighborhood: body.neighborhood?.trim() || null,
  city: body.city?.trim() || null,
  state: body.state?.trim() || null,
  postal_code: body.postal_code?.trim() || null,
  country: body.country?.trim() || "México",
});

const obtenerPerfil = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  const sql = `
    SELECT 
      id,
      name,
      email,
      role,
      telefono,
      fecha_nacimiento,
      foto_perfil,
      foto_public_id,
      created_at,
      street,
      ext_number,
      neighborhood,
      city,
      state,
      postal_code,
      country,
      formatted_address,
      home_latitude,
      home_longitude,
      last_latitude,
      last_longitude,
      last_accuracy_meters,
      last_location_updated_at,
      COALESCE(idioma, 'es') AS idioma,
      COALESCE(tema, 'claro') AS tema,
      COALESCE(font_size, 'medium') AS font_size
    FROM usuarios
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error al obtener perfil:", err);
      return res.status(500).json({
        message: "Error al obtener perfil",
        detail: err.sqlMessage || err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json(results[0]);
  });
};

const actualizarPerfil = (req, res) => {
  const userId = req.user?.id;
  const { name, email, telefono, fecha_nacimiento } = req.body;
  const direccion = normalizarDireccion(req.body);

  if (!userId) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  if (!name || !email) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: "Nombre y correo son obligatorios",
    });
  }

  if (!emailRegex.test(email.trim())) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      message: "Correo electrónico inválido",
    });
  }

  const sqlCheckEmail = `
    SELECT id
    FROM usuarios
    WHERE email = ? AND id <> ?
    LIMIT 1
  `;

  db.query(sqlCheckEmail, [email.trim(), userId], async (checkErr, checkResults) => {
    if (checkErr) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error al validar correo:", checkErr);
      return res.status(500).json({
        message: "Error al validar correo",
        detail: checkErr.sqlMessage || checkErr.message,
      });
    }

    if (checkResults.length > 0) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: "El correo ya está en uso por otro usuario",
      });
    }

    let geocoded = null;

    try {
      const tieneDatosDireccion = Object.values(direccion).some(Boolean);
      if (tieneDatosDireccion) {
        geocoded = await geocodeAddress(direccion);
      }
    } catch (geoErr) {
      console.error("Error geocodificando dirección del perfil:", geoErr.message);
    }

    const formattedAddress =
      geocoded?.formattedAddress || buildAddressFromParts(direccion) || null;

    const sqlFotoAnterior = `
      SELECT foto_perfil, foto_public_id
      FROM usuarios
      WHERE id = ?
      LIMIT 1
    `;

    db.query(sqlFotoAnterior, [userId], async (fotoErr, fotoResults) => {
      if (fotoErr) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error("Error al consultar foto anterior:", fotoErr);
        return res.status(500).json({
          message: "Error al actualizar perfil",
          detail: fotoErr.sqlMessage || fotoErr.message,
        });
      }

      const fotoAnterior = fotoResults?.[0]?.foto_perfil || null;
      const fotoPublicIdAnterior = fotoResults?.[0]?.foto_public_id || null;

      let nuevaFotoUrl = null;
      let nuevoPublicId = null;

      try {
        if (req.file?.path) {
          const subida = await subirArchivo(req.file.path);
          nuevaFotoUrl = subida.secure_url;
          nuevoPublicId = subida.public_id;
        }
      } catch (uploadErr) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error("Error subiendo imagen a Cloudinary:", uploadErr);
        return res.status(500).json({
          message: "No se pudo subir la imagen de perfil",
          detail: uploadErr.message,
        });
      }

      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const sqlUpdate = `
        UPDATE usuarios
        SET
          name = ?,
          email = ?,
          telefono = ?,
          fecha_nacimiento = ?,
          foto_perfil = COALESCE(?, foto_perfil),
          foto_public_id = COALESCE(?, foto_public_id),
          street = ?,
          ext_number = ?,
          neighborhood = ?,
          city = ?,
          state = ?,
          postal_code = ?,
          country = ?,
          formatted_address = ?,
          home_latitude = ?,
          home_longitude = ?
        WHERE id = ?
      `;

      db.query(
        sqlUpdate,
        [
          name.trim(),
          email.trim(),
          telefono?.trim() || null,
          fecha_nacimiento || null,
          nuevaFotoUrl,
          nuevoPublicId,
          direccion.street,
          direccion.ext_number,
          direccion.neighborhood,
          direccion.city,
          direccion.state,
          direccion.postal_code,
          direccion.country,
          formattedAddress,
          geocoded?.latitude ?? null,
          geocoded?.longitude ?? null,
          userId,
        ],
        async (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error al actualizar perfil:", updateErr);
            return res.status(500).json({
              message: "Error al actualizar perfil",
              detail: updateErr.sqlMessage || updateErr.message,
            });
          }

          if (updateResult.affectedRows === 0) {
            return res.status(404).json({
              message: "Usuario no encontrado",
            });
          }

          if (
            nuevoPublicId &&
            fotoPublicIdAnterior &&
            fotoPublicIdAnterior !== nuevoPublicId
          ) {
            try {
              await eliminarArchivo(fotoPublicIdAnterior);
            } catch (deleteErr) {
              console.error(
                "No se pudo eliminar la foto anterior en Cloudinary:",
                deleteErr.message
              );
            }
          }

          return res.status(200).json({
            message: "Perfil actualizado correctamente",
            foto_perfil: nuevaFotoUrl || fotoAnterior,
            foto_public_id: nuevoPublicId || fotoPublicIdAnterior,
            locationWarning:
              geocoded === null
                ? "No se pudo actualizar la ubicación exacta con Google Maps."
                : null,
          });
        }
      );
    });
  });
};

const actualizarUbicacionActual = async (req, res) => {
  const userId = req.user?.id;
  const { latitude, longitude, accuracy_meters } = req.body;

  if (!userId) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  if (latitude == null || longitude == null) {
    return res.status(400).json({
      message: "Latitude y longitude son obligatorios",
    });
  }

  let currentAddress = null;

  try {
    const reverse = await reverseGeocode(latitude, longitude);
    currentAddress = reverse?.formattedAddress || null;
  } catch (geoErr) {
    console.error("Error obteniendo dirección actual:", geoErr.message);
  }

  const sql = `
    UPDATE usuarios
    SET
      last_latitude = ?,
      last_longitude = ?,
      last_accuracy_meters = ?,
      last_location_updated_at = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [latitude, longitude, accuracy_meters ?? null, userId],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar ubicación actual:", err);
        return res.status(500).json({
          message: "No se pudo guardar la ubicación actual",
          detail: err.sqlMessage || err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Usuario no encontrado",
        });
      }

      return res.status(200).json({
        message: "Ubicación actual guardada correctamente",
        currentAddress,
      });
    }
  );
};

const obtenerPreferenciasAccesibilidad = (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  const sql = `
    SELECT
      COALESCE(idioma, 'es') AS idioma,
      COALESCE(tema, 'claro') AS tema,
      COALESCE(font_size, 'medium') AS font_size
    FROM usuarios
    WHERE id = ?
    LIMIT 1
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error al obtener preferencias:", err);
      return res.status(500).json({
        message: "Error al obtener preferencias",
        detail: err.sqlMessage || err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json(results[0]);
  });
};

const actualizarPreferenciasAccesibilidad = (req, res) => {
  const userId = req.user?.id;
  const { idioma, tema, font_size } = req.body;

  const idiomasValidos = ["es", "en"];
  const temasValidos = ["claro", "oscuro", "contraste"];
  const tamanosValidos = ["small", "medium", "large"];

  if (!userId) {
    return res.status(401).json({
      message: "Usuario no autenticado",
    });
  }

  if (
    !idioma ||
    !tema ||
    !font_size ||
    !idiomasValidos.includes(idioma) ||
    !temasValidos.includes(tema) ||
    !tamanosValidos.includes(font_size)
  ) {
    return res.status(400).json({
      message: "Preferencias de accesibilidad inválidas",
    });
  }

  const sql = `
    UPDATE usuarios
    SET idioma = ?, tema = ?, font_size = ?
    WHERE id = ?
  `;

  db.query(sql, [idioma, tema, font_size, userId], (err, result) => {
    if (err) {
      console.error("Error al actualizar preferencias:", err);
      return res.status(500).json({
        message: "Error al actualizar preferencias",
        detail: err.sqlMessage || err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.status(200).json({
      message: "Preferencias actualizadas correctamente",
      preferences: {
        idioma,
        tema,
        font_size,
      },
    });
  });
};

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  actualizarUbicacionActual,
  obtenerPreferenciasAccesibilidad,
  actualizarPreferenciasAccesibilidad,
};