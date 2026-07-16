const crypto = require("crypto");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  enviarBienvenida,
  enviarRecuperacionPassword,
} = require("../utils/mailer");
const { validarPasswordSegura } = require("../utils/passwordValidator");
const { geocodeAddress, buildAddressFromParts } = require("../services/geocodingService");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rolesValidos = ["resident", "committee", "security", "admin"];

const frontendBaseUrl = () => {
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
};

const generarTokenPlano = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const normalizarDireccion = (body = {}) => ({
  street: body.street?.trim() || null,
  ext_number: body.ext_number?.trim() || null,
  neighborhood: body.neighborhood?.trim() || null,
  city: body.city?.trim() || null,
  state: body.state?.trim() || null,
  postal_code: body.postal_code?.trim() || null,
  country: body.country?.trim() || "México",
});

const tieneDireccionMinima = (direccion) => {
  return Boolean(
    direccion.postal_code ||
      ((direccion.street || direccion.neighborhood) && direccion.city && direccion.state)
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const roleNormalizado = rolesValidos.includes(role) ? role : "resident";
    const direccion = normalizarDireccion(req.body);

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Completa todos los campos obligatorios",
      });
    }

    if (!tieneDireccionMinima(direccion)) {
      return res.status(400).json({
        message: "Ingresa al menos un código postal o una dirección válida.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Correo electrónico inválido",
      });
    }

    const validacionPassword = validarPasswordSegura(password);

    if (!validacionPassword.esValida) {
      return res.status(400).json({
        message: validacionPassword.message,
      });
    }

    db.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email.trim()],
      async (err, rows) => {
        if (err) {
          console.error("Error al validar usuario:", err);
          return res.status(500).json({
            message: "Error al validar usuario",
          });
        }

        if (rows.length > 0) {
          return res.status(400).json({
            message: "El correo ya está registrado",
          });
        }

        const continuarRegistro = async () => {
          try {
            const hashedPassword = await bcrypt.hash(password, 10);

            let geocoded = null;
            let warning = null;

            try {
              geocoded = await geocodeAddress(direccion);
              if (!geocoded) {
                warning = "Se guardó la dirección, pero no se pudo obtener la ubicación exacta.";
              }
            } catch (geoError) {
              console.error("Error geocodificando dirección de registro:", geoError.message);
              warning = "Se guardó la dirección, pero no se pudo obtener la ubicación exacta.";
            }

            const sql = `
              INSERT INTO usuarios
                (
                  name, email, password, role, activo, idioma, tema, font_size,
                  street, ext_number, neighborhood, city, state, postal_code, country,
                  formatted_address, home_latitude, home_longitude
                )
              VALUES
                (?, ?, ?, ?, 1, 'es', 'claro', 'medium', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const formattedAddress =
              geocoded?.formattedAddress || buildAddressFromParts(direccion) || null;

            db.query(
              sql,
              [
                name.trim(),
                email.trim(),
                hashedPassword,
                roleNormalizado,
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
              ],
              async (error, result) => {
                if (error) {
                  console.error("Error al registrar usuario:", error);
                  return res.status(500).json({
                    message: "Error al registrar usuario",
                    detail: error.sqlMessage || error.message,
                  });
                }

                let emailWarning = null;

                try {
                  await enviarBienvenida({
                    email: email.trim(),
                    name: name.trim(),
                  });
                } catch (mailError) {
                  emailWarning =
                    "Usuario registrado, pero no se pudo enviar el correo de bienvenida.";
                  console.error("Error enviando correo de bienvenida:", mailError.message);
                }

                return res.status(201).json({
                  message: "Usuario registrado correctamente",
                  userId: result.insertId,
                  emailWarning,
                  locationWarning: warning,
                });
              }
            );
          } catch (hashError) {
            console.error("Error al encriptar contraseña:", hashError);
            return res.status(500).json({
              message: "Error interno del servidor",
            });
          }
        };

        if (roleNormalizado === "admin") {
          db.query(
            "SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1",
            (adminErr, adminRows) => {
              if (adminErr) {
                console.error("Error al validar administrador existente:", adminErr);
                return res.status(500).json({
                  message: "Error al validar administrador",
                });
              }

              if (adminRows.length > 0) {
                return res.status(403).json({
                  message: "Ya existe un administrador registrado",
                });
              }

              return continuarRegistro();
            }
          );

          return;
        }

        return continuarRegistro();
      }
    );
  } catch (error) {
    console.error("Error general en register:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email y contraseña requeridos",
    });
  }

  db.query(
    "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
    [email.trim()],
    async (error, rows) => {
      if (error) {
        console.error("Error DB login:", error);
        return res.status(500).json({
          message: "Error del servidor",
        });
      }

      if (!rows.length) {
        return res.status(401).json({
          message: "Usuario no encontrado",
        });
      }

      try {
        const user = rows[0];

        if (Number(user.activo ?? 1) !== 1) {
          return res.status(403).json({
            message: "Tu acceso ha sido bloqueado por el administrador",
          });
        }

        const passwordValida = await bcrypt.compare(password, user.password);

        if (!passwordValida) {
          return res.status(401).json({
            message: "Contraseña incorrecta",
          });
        }

        if (!process.env.JWT_SECRET) {
          return res.status(500).json({
            message: "JWT no configurado",
          });
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );

        return res.json({
          message: "Inicio de sesión correcto",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            activo: Number(user.activo ?? 1) === 1,
            telefono: user.telefono || "",
            preferences: {
              idioma: user.idioma || "es",
              tema: user.tema || "claro",
              font_size: user.font_size || "medium",
            },
          },
        });
      } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({
          message: "Error interno al iniciar sesión",
        });
      }
    }
  );
};

const forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      message: "Ingresa un correo válido",
    });
  }

  db.query(
    "SELECT id, name, email, activo FROM usuarios WHERE email = ? LIMIT 1",
    [email.trim()],
    async (error, rows) => {
      if (error) {
        console.error("Error al buscar usuario para recuperación:", error);
        return res.status(500).json({
          message: "No se pudo procesar la solicitud",
        });
      }

      if (!rows.length) {
        return res.json({
          message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
        });
      }

      const user = rows[0];

      if (Number(user.activo ?? 1) !== 1) {
        return res.json({
          message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
        });
      }

      const tokenPlano = generarTokenPlano();
      const tokenHasheado = hashToken(tokenPlano);
      const expira = new Date(Date.now() + 1000 * 60 * 30);

      db.query(
        "UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id = ?",
        [tokenHasheado, expira, user.id],
        async (updateError) => {
          if (updateError) {
            console.error("Error al guardar token de recuperación:", updateError);
            return res.status(500).json({
              message: "No se pudo procesar la solicitud",
            });
          }

          const resetLink = `${frontendBaseUrl()}/restablecer-contrasena/${tokenPlano}`;

          try {
            await enviarRecuperacionPassword({
              email: user.email,
              name: user.name,
              resetLink,
            });
          } catch (mailError) {
            console.error("Error enviando recuperación:", mailError.message);
            return res.status(500).json({
              message: "No se pudo enviar el correo de recuperación",
            });
          }

          return res.json({
            message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña.",
          });
        }
      );
    }
  );
};

const validateResetToken = (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "Token inválido",
    });
  }

  const tokenHasheado = hashToken(token);

  db.query(
    `
      SELECT id
      FROM usuarios
      WHERE reset_token = ?
        AND reset_expires IS NOT NULL
        AND reset_expires > NOW()
      LIMIT 1
    `,
    [tokenHasheado],
    (error, rows) => {
      if (error) {
        console.error("Error validando token:", error);
        return res.status(500).json({
          message: "No se pudo validar el token",
        });
      }

      if (!rows.length) {
        return res.status(400).json({
          message: "El enlace de recuperación es inválido o ya expiró",
        });
      }

      return res.json({
        message: "Token válido",
      });
    }
  );
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Token inválido",
    });
  }

  const validacionPassword = validarPasswordSegura(password);

  if (!validacionPassword.esValida) {
    return res.status(400).json({
      message: validacionPassword.message,
    });
  }

  const tokenHasheado = hashToken(token);

  db.query(
    `
      SELECT id
      FROM usuarios
      WHERE reset_token = ?
        AND reset_expires IS NOT NULL
        AND reset_expires > NOW()
      LIMIT 1
    `,
    [tokenHasheado],
    async (error, rows) => {
      if (error) {
        console.error("Error buscando token de recuperación:", error);
        return res.status(500).json({
          message: "No se pudo restablecer la contraseña",
        });
      }

      if (!rows.length) {
        return res.status(400).json({
          message: "El enlace de recuperación es inválido o ya expiró",
        });
      }

      try {
        const passwordHash = await bcrypt.hash(password, 10);

        db.query(
          `
            UPDATE usuarios
            SET password = ?, reset_token = NULL, reset_expires = NULL
            WHERE id = ?
          `,
          [passwordHash, rows[0].id],
          (updateError) => {
            if (updateError) {
              console.error("Error actualizando contraseña:", updateError);
              return res.status(500).json({
                message: "No se pudo restablecer la contraseña",
              });
            }

            return res.json({
              message: "Contraseña restablecida correctamente",
            });
          }
        );
      } catch (hashError) {
        console.error("Error al hashear nueva contraseña:", hashError);
        return res.status(500).json({
          message: "No se pudo restablecer la contraseña",
        });
      }
    }
  );
};

module.exports = {
  register,
  login,
  forgotPassword,
  validateResetToken,
  resetPassword,
};
