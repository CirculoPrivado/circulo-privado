const db = require("../config/db");
const {
  enviarCorreoPagoExitoso,
  enviarCorreoEventoComunitario,
} = require("../utils/mailer");

function ejecutarQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function formatearMetodoPago(metodo) {
  const valor = String(metodo || "").toLowerCase().trim();

  if (valor === "mercadopago") return "Mercado Pago";
  if (valor === "paypal") return "PayPal";
  if (valor) {
    return valor.charAt(0).toUpperCase() + valor.slice(1);
  }

  return "No especificado";
}

function formatearFecha(fecha) {
  if (!fecha) return new Date().toLocaleString("es-MX");

  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) {
    return String(fecha);
  }

  return fechaObj.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function registrarNotificacion({
  usuarioId,
  tipo,
  referenciaId,
  destinatarioEmail,
  asunto,
  estado,
  errorText = null,
}) {
  try {
    await ejecutarQuery(
      `INSERT INTO notificaciones_email
       (usuario_id, tipo, referencia_id, destinatario_email, asunto, estado, error_text, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        usuarioId || null,
        tipo,
        referenciaId || null,
        destinatarioEmail,
        asunto,
        estado,
        errorText,
        estado === "enviado" ? new Date() : null,
      ]
    );
  } catch (error) {
    console.error("No se pudo registrar la notificación:", error.message);
  }
}

async function yaFueEnviada(tipo, referenciaId, usuarioId = null) {
  if (!referenciaId) return false;

  let sql = `SELECT id
             FROM notificaciones_email
             WHERE tipo = ? AND referencia_id = ? AND estado = 'enviado'`;
  const params = [tipo, referenciaId];

  if (usuarioId !== null && usuarioId !== undefined) {
    sql += " AND usuario_id = ?";
    params.push(usuarioId);
  }

  sql += " LIMIT 1";

  const rows = await ejecutarQuery(sql, params);
  return rows.length > 0;
}

async function obtenerUsuariosActivosConCorreo() {
  return ejecutarQuery(
    `SELECT id, name, email, role
     FROM usuarios
     WHERE COALESCE(activo, 1) = 1
       AND email IS NOT NULL
       AND TRIM(email) <> ''
     ORDER BY id ASC`
  );
}

async function enviarEventoATodos({
  tipo,
  referenciaId,
  asunto,
  tituloEvento,
  mensajePrincipal,
  detalleLabel,
  detallesPorUsuario = [],
}) {
  const usuarios = await obtenerUsuariosActivosConCorreo();
  let enviados = 0;
  let fallidos = 0;

  for (const usuario of usuarios) {
    if (await yaFueEnviada(tipo, referenciaId, usuario.id)) {
      continue;
    }

    try {
      await enviarCorreoEventoComunitario({
        email: usuario.email,
        nombreUsuario: usuario.name || "usuario",
        asunto,
        tituloEvento,
        mensajePrincipal,
        detalleLabel,
        detalles: detallesPorUsuario,
      });

      await registrarNotificacion({
        usuarioId: usuario.id,
        tipo,
        referenciaId,
        destinatarioEmail: usuario.email,
        asunto,
        estado: "enviado",
      });

      enviados += 1;
    } catch (error) {
      await registrarNotificacion({
        usuarioId: usuario.id,
        tipo,
        referenciaId,
        destinatarioEmail: usuario.email,
        asunto,
        estado: "fallido",
        errorText: error.message,
      });

      fallidos += 1;
      console.error(`Error enviando notificación ${tipo} a ${usuario.email}:`, error.message);
    }
  }

  return { enviados, fallidos };
}

async function notificarPagoExitoso(pagoId) {
  const tipo = "pago_exitoso";

  if (await yaFueEnviada(tipo, pagoId)) {
    return { skipped: true, reason: "already_sent" };
  }

  const rows = await ejecutarQuery(
    `SELECT
        p.id,
        p.usuario_id,
        p.concepto,
        p.monto,
        p.proveedor_pago,
        p.pagado_en,
        p.estado,
        u.name AS nombre_usuario,
        u.email
     FROM pagos p
     INNER JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.id = ?
     LIMIT 1`,
    [pagoId]
  );

  const pago = rows[0];

  if (!pago) {
    return { skipped: true, reason: "payment_not_found" };
  }

  if (pago.estado !== "pagado") {
    return { skipped: true, reason: "payment_not_paid" };
  }

  if (!pago.email) {
    return { skipped: true, reason: "email_not_found" };
  }

  try {
    await enviarCorreoPagoExitoso({
      email: pago.email,
      nombreUsuario: pago.nombre_usuario || "usuario",
      nombreConcepto: pago.concepto,
      formaPago: formatearMetodoPago(pago.proveedor_pago),
      cantidad: pago.monto,
      fecha: formatearFecha(pago.pagado_en || new Date()),
      tipo: "pago",
    });

    await registrarNotificacion({
      usuarioId: pago.usuario_id,
      tipo,
      referenciaId: pago.id,
      destinatarioEmail: pago.email,
      asunto: "Pago exitoso realizado",
      estado: "enviado",
    });

    return { sent: true };
  } catch (error) {
    await registrarNotificacion({
      usuarioId: pago.usuario_id,
      tipo,
      referenciaId: pago.id,
      destinatarioEmail: pago.email,
      asunto: "Pago exitoso realizado",
      estado: "fallido",
      errorText: error.message,
    });

    throw error;
  }
}

async function notificarCompraMercadoExitosa(compraId) {
  const tipo = "compra_mercado_exitosa";

  if (await yaFueEnviada(tipo, compraId)) {
    return { skipped: true, reason: "already_sent" };
  }

  const rows = await ejecutarQuery(
    `SELECT
        c.id,
        c.usuario_id,
        c.total,
        c.created_at,
        c.estado,
        c.pago_id,
        u.name AS nombre_usuario,
        u.email,
        p.proveedor_pago,
        COALESCE(
          GROUP_CONCAT(mv.titulo ORDER BY mv.titulo SEPARATOR ', '),
          'Compra en Mercado Vecinal'
        ) AS nombres_productos
     FROM compras c
     INNER JOIN usuarios u ON u.id = c.usuario_id
     LEFT JOIN pagos p ON p.id = c.pago_id
     LEFT JOIN compra_detalle cd ON cd.compra_id = c.id
     LEFT JOIN mercado_vecinal mv ON mv.id = cd.producto_id
     WHERE c.id = ?
     GROUP BY c.id, c.usuario_id, c.total, c.created_at, c.estado, c.pago_id, u.name, u.email, p.proveedor_pago
     LIMIT 1`,
    [compraId]
  );

  const compra = rows[0];

  if (!compra) {
    return { skipped: true, reason: "purchase_not_found" };
  }

  if (compra.estado !== "pagada") {
    return { skipped: true, reason: "purchase_not_paid" };
  }

  if (!compra.email) {
    return { skipped: true, reason: "email_not_found" };
  }

  try {
    await enviarCorreoPagoExitoso({
      email: compra.email,
      nombreUsuario: compra.nombre_usuario || "usuario",
      nombreConcepto: compra.nombres_productos,
      formaPago: formatearMetodoPago(compra.proveedor_pago),
      cantidad: compra.total,
      fecha: formatearFecha(compra.created_at),
      tipo: "mercado",
    });

    await registrarNotificacion({
      usuarioId: compra.usuario_id,
      tipo,
      referenciaId: compra.id,
      destinatarioEmail: compra.email,
      asunto: "Compra realizada con éxito",
      estado: "enviado",
    });

    return { sent: true };
  } catch (error) {
    await registrarNotificacion({
      usuarioId: compra.usuario_id,
      tipo,
      referenciaId: compra.id,
      destinatarioEmail: compra.email,
      asunto: "Compra realizada con éxito",
      estado: "fallido",
      errorText: error.message,
    });

    throw error;
  }
}

async function notificarNuevoAviso(avisoId) {
  const rows = await ejecutarQuery(
    `SELECT a.id, a.title, a.content, a.created_at, u.name AS autor, u.role AS rol_autor
     FROM avisos a
     INNER JOIN usuarios u ON u.id = a.user_id
     WHERE a.id = ?
     LIMIT 1`,
    [avisoId]
  );

  const aviso = rows[0];
  if (!aviso) {
    return { skipped: true, reason: "notice_not_found" };
  }

  return enviarEventoATodos({
    tipo: "aviso_nuevo",
    referenciaId: aviso.id,
    asunto: "Nuevo aviso publicado",
    tituloEvento: aviso.title,
    mensajePrincipal: "Se publicó un nuevo aviso para toda la comunidad.",
    detalleLabel: "Título del aviso",
    detallesPorUsuario: [
      { etiqueta: "Contenido", valor: aviso.content },
      { etiqueta: "Publicado por", valor: `${aviso.autor} (${aviso.rol_autor})` },
      { etiqueta: "Fecha", valor: formatearFecha(aviso.created_at) },
    ],
  });
}

async function notificarNuevoIncidente(incidenteId) {
  const rows = await ejecutarQuery(
    `SELECT i.id, i.title, i.category, i.description, i.location_text, i.status, i.created_at,
            u.name AS autor, u.role AS rol_autor
     FROM incidentes i
     INNER JOIN usuarios u ON u.id = i.user_id
     WHERE i.id = ?
     LIMIT 1`,
    [incidenteId]
  );

  const incidente = rows[0];
  if (!incidente) {
    return { skipped: true, reason: "incident_not_found" };
  }

  return enviarEventoATodos({
    tipo: "incidente_nuevo",
    referenciaId: incidente.id,
    asunto: "Nuevo incidente registrado",
    tituloEvento: incidente.title,
    mensajePrincipal: "Se registró un nuevo incidente en la comunidad.",
    detalleLabel: "Título del incidente",
    detallesPorUsuario: [
      { etiqueta: "Categoría", valor: incidente.category || "General" },
      { etiqueta: "Descripción", valor: incidente.description },
      { etiqueta: "Ubicación", valor: incidente.location_text },
      { etiqueta: "Estado", valor: incidente.status || "Pendiente" },
      { etiqueta: "Reportado por", valor: `${incidente.autor} (${incidente.rol_autor})` },
      { etiqueta: "Fecha", valor: formatearFecha(incidente.created_at) },
    ],
  });
}

async function notificarNuevaEmergencia(alertaId) {
  const rows = await ejecutarQuery(
    `SELECT ae.id, ae.latitude, ae.longitude, ae.status, ae.created_at, ae.place_address,
            u.name AS autor, u.role AS rol_autor
     FROM alertas_emergencia ae
     INNER JOIN usuarios u ON u.id = ae.user_id
     WHERE ae.id = ?
     LIMIT 1`,
    [alertaId]
  );

  const alerta = rows[0];
  if (!alerta) {
    return { skipped: true, reason: "alert_not_found" };
  }

  return enviarEventoATodos({
    tipo: "emergencia_nueva",
    referenciaId: alerta.id,
    asunto: "Alerta de emergencia activada",
    tituloEvento: `Emergencia #${alerta.id}`,
    mensajePrincipal: "Se activó una alerta de emergencia en la comunidad.",
    detalleLabel: "Folio",
    detallesPorUsuario: [
      { etiqueta: "Ubicación aproximada", valor: alerta.place_address || `${alerta.latitude}, ${alerta.longitude}` },
      { etiqueta: "Coordenadas", valor: `${alerta.latitude}, ${alerta.longitude}` },
      { etiqueta: "Estado", valor: alerta.status || "enviada" },
      { etiqueta: "Activada por", valor: `${alerta.autor} (${alerta.rol_autor})` },
      { etiqueta: "Fecha", valor: formatearFecha(alerta.created_at) },
    ],
  });
}

module.exports = {
  notificarPagoExitoso,
  notificarCompraMercadoExitosa,
  notificarNuevoAviso,
  notificarNuevoIncidente,
  notificarNuevaEmergencia,
};
