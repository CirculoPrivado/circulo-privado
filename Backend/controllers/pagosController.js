const db = require("../config/db");
const paypalService = require("../services/integrations/paypalService");
const mercadoPagoService = require("../services/integrations/mercadoPagoService");
const { notificarPagoExitoso } = require("../services/notificacionesService");

function ejecutarQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function obtenerPagoPorId(pagoId) {
  const results = await ejecutarQuery(
    `SELECT p.*, u.name AS usuario
     FROM pagos p
     LEFT JOIN usuarios u ON p.usuario_id = u.id
     WHERE p.id = ?
     LIMIT 1`,
    [pagoId]
  );

  return results[0] || null;
}

const obtenerPagos = async (req, res) => {
  try {
    const results = await ejecutarQuery(
      `SELECT p.*, u.name AS usuario
       FROM pagos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.id DESC`
    );

    return res.json(results);
  } catch (error) {
    console.error("Error DB obtenerPagos:", error);
    return res.status(500).json({ message: "Error al obtener pagos" });
  }
};

const obtenerPago = async (req, res) => {
  try {
    const { id } = req.params;
    const pago = await obtenerPagoPorId(id);

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    return res.json(pago);
  } catch (error) {
    console.error("Error DB obtenerPago:", error);
    return res.status(500).json({ message: "Error al obtener el pago" });
  }
};

const crearPago = async (req, res) => {
  let { usuario_id, concepto, monto, fecha_vencimiento, estado } = req.body;

  if (!usuario_id || !concepto || !monto || !fecha_vencimiento) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  try {
    usuario_id = Number(usuario_id);
    monto = Number(monto);
    concepto = String(concepto).trim();
    estado = (estado || "pendiente").toLowerCase().trim();

    const fecha = new Date(fecha_vencimiento);
    if (Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    fecha_vencimiento = fecha.toISOString().split("T")[0];

    if (!["pendiente", "pagado"].includes(estado)) {
      return res.status(400).json({ message: "Estado no válido" });
    }

    const usuario = await ejecutarQuery(
      "SELECT id FROM usuarios WHERE id = ? LIMIT 1",
      [usuario_id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ message: "El usuario no existe" });
    }

    const result = await ejecutarQuery(
      `INSERT INTO pagos
       (usuario_id, concepto, monto, fecha_vencimiento, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, concepto, monto, fecha_vencimiento, estado]
    );

    return res.status(201).json({
      message: "Pago registrado correctamente",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error DB crearPago:", error);
    return res.status(500).json({
      message: error.sqlMessage || error.message || "Error al registrar pago",
    });
  }
};

const crearCheckout = async (req, res) => {
  const { pagoId, proveedor } = req.body;

  if (!pagoId || !proveedor) {
    return res
      .status(400)
      .json({ message: "pagoId y proveedor son obligatorios" });
  }

  try {
    const pago = await obtenerPagoPorId(pagoId);

    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    if (pago.estado === "pagado") {
      return res.status(400).json({ message: "Este pago ya fue liquidado" });
    }

    if (proveedor === "paypal") {
      const order = await paypalService.createOrder({
        pagoId: pago.id,
        concepto: pago.concepto,
        monto: pago.monto,
        currency: "MXN",
      });

      await ejecutarQuery(
        `UPDATE pagos
         SET proveedor_pago = 'paypal',
             paypal_order_id = ?,
             external_reference = ?
         WHERE id = ?`,
        [order.id, String(pago.id), pago.id]
      );

      return res.json({
        proveedor: "paypal",
        orderID: order.id,
      });
    }

    if (proveedor === "mercadopago") {
      const preference = await mercadoPagoService.crearPreferencia({
        pagoId: pago.id,
        concepto: pago.concepto,
        monto: pago.monto,
      });

      await ejecutarQuery(
        `UPDATE pagos
         SET proveedor_pago = 'mercadopago',
             mp_preference_id = ?,
             external_reference = ?
         WHERE id = ?`,
        [preference.id, String(pago.id), pago.id]
      );

      return res.json({
        proveedor: "mercadopago",
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      });
    }

    return res.status(400).json({ message: "Proveedor no soportado" });
  } catch (error) {
    console.error("Error crearCheckout:", error.response?.data || error.message);
    return res.status(500).json({ message: "No se pudo iniciar el checkout" });
  }
};

const capturarOrdenPayPal = async (req, res) => {
  const { orderID, pagoId } = req.body;

  if (!orderID || !pagoId) {
    return res
      .status(400)
      .json({ message: "orderID y pagoId son obligatorios" });
  }

  try {
    const capture = await paypalService.captureOrder(orderID);
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0];

    if (capture.status !== "COMPLETED" || !paymentCapture?.id) {
      return res.status(400).json({
        message: "La captura no se completó correctamente",
        paypal: capture,
      });
    }

    await ejecutarQuery(
      `UPDATE pagos
       SET estado = 'pagado',
           proveedor_pago = 'paypal',
           paypal_order_id = ?,
           paypal_capture_id = ?,
           pagado_en = NOW()
       WHERE id = ?`,
      [orderID, paymentCapture.id, pagoId]
    );

    try {
      await notificarPagoExitoso(pagoId);
    } catch (emailError) {
      console.error("No se pudo enviar el correo de pago exitoso:", emailError.message);
    }

    return res.json({
      message: "Pago completado correctamente",
      captureId: paymentCapture.id,
      paypalStatus: capture.status,
    });
  } catch (error) {
    console.error(
      "Error PayPal captureOrder:",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ message: "No se pudo capturar la orden PayPal" });
  }
};

const iniciarPago = async (req, res) => {
  req.body.proveedor = req.body.proveedor || "mercadopago";
  return crearCheckout(req, res);
};

const marcarPagoManual = async (req, res) => {
  const { id } = req.params;
  const rolUsuario = req.user?.role;

  if (!["admin", "committee"].includes(rolUsuario)) {
    return res.status(403).json({ message: "No tienes permisos para marcar pagos" });
  }

  try {
    const pago = await obtenerPagoPorId(id);
    if (!pago) return res.status(404).json({ message: "Pago no encontrado" });

    if (pago.estado === "pagado") {
      return res.json({ message: "El pago ya estaba marcado como pagado" });
    }

    await ejecutarQuery(
      `UPDATE pagos
       SET estado = 'pagado', proveedor_pago = COALESCE(proveedor_pago, 'paypal'), pagado_en = COALESCE(pagado_en, NOW())
       WHERE id = ?`,
      [id]
    );

    try { await notificarPagoExitoso(id); }
    catch (emailError) { console.error("No se pudo enviar el correo de pago exitoso:", emailError.message); }

    return res.json({ message: "Pago marcado como pagado correctamente" });
  } catch (error) {
    console.error("Error DB marcarPagoManual:", error);
    return res.status(500).json({ message: "Error al marcar pago como pagado" });
  }
};


module.exports = {
  obtenerPagos,
  obtenerPago,
  crearPago,
  crearCheckout,
  capturarOrdenPayPal,
  iniciarPago,
  marcarPagoManual,
};