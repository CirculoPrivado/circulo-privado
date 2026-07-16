const db = require("../config/db");
const { notificarCompraMercadoExitosa } = require("../services/notificacionesService");

const crearCompra = (req, res) => {
  const usuario_id = req.user.id;
  const { productos, pagoId } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ message: "Datos de compra inválidos" });
  }

  if (!pagoId) {
    return res.status(400).json({ message: "Falta el identificador del pago" });
  }

  const productoIds = productos.map((p) => p.id);

  const sqlProductos = `
    SELECT id, titulo, precio, stock, estado_compra
    FROM mercado_vecinal
    WHERE id IN (?)
  `;

  db.query(sqlProductos, [productoIds], (err, productosDB) => {
    if (err) {
      console.error("Error al consultar productos:", err);
      return res.status(500).json({ message: "Error al consultar productos" });
    }

    if (!productosDB.length) {
      return res.status(404).json({ message: "No se encontraron productos" });
    }

    let total = 0;
    const detalleCompra = [];

    for (const item of productos) {
      const productoDB = productosDB.find((p) => p.id === Number(item.id));

      if (!productoDB) {
        return res.status(404).json({
          message: `Producto con id ${item.id} no encontrado`,
        });
      }

      if (productoDB.estado_compra !== "disponible") {
        return res.status(400).json({
          message: `El producto "${productoDB.titulo}" ya no está disponible`,
        });
      }

      if ((Number(productoDB.stock) || 0) < Number(item.cantidad)) {
        return res.status(400).json({
          message: `Stock insuficiente para "${productoDB.titulo}"`,
        });
      }

      const precio = Number(productoDB.precio) || 0;
      const cantidad = Number(item.cantidad) || 1;
      const subtotal = precio * cantidad;

      total += subtotal;

      detalleCompra.push({
        producto_id: productoDB.id,
        cantidad,
        precio_unitario: precio,
        subtotal,
      });
    }

    const sqlPago = `
      SELECT id, usuario_id, monto, estado
      FROM pagos
      WHERE id = ?
      LIMIT 1
    `;

    db.query(sqlPago, [pagoId], (err, pagosDB) => {
      if (err) {
        console.error("Error al consultar pago:", err);
        return res.status(500).json({ message: "Error al consultar pago" });
      }

      const pago = pagosDB[0];

      if (!pago) {
        return res.status(404).json({ message: "Pago no encontrado" });
      }

      if (Number(pago.usuario_id) !== Number(usuario_id)) {
        return res.status(403).json({ message: "Este pago no pertenece al usuario" });
      }

      if (pago.estado !== "pagado") {
        return res.status(400).json({ message: "El pago todavía no ha sido aprobado" });
      }

      const sqlCompra = `
        INSERT INTO compras (usuario_id, total, estado, pago_id)
        VALUES (?, ?, 'pagada', ?)
      `;

      db.query(sqlCompra, [usuario_id, total, pagoId], (err, compraResult) => {
        if (err) {
          console.error("Error al crear compra:", err);
          return res.status(500).json({ message: "Error al crear compra" });
        }

        const compraId = compraResult.insertId;

        const valuesDetalle = detalleCompra.map((item) => [
          compraId,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
        ]);

        const sqlDetalle = `
          INSERT INTO compra_detalle
          (compra_id, producto_id, cantidad, precio_unitario, subtotal)
          VALUES ?
        `;

        db.query(sqlDetalle, [valuesDetalle], (err) => {
          if (err) {
            console.error("Error al guardar detalle de compra:", err);
            return res.status(500).json({ message: "Error al guardar detalle" });
          }

          let pendientes = detalleCompra.length;
          let respondido = false;

          detalleCompra.forEach((item) => {
            const sqlActualizar = `
              UPDATE mercado_vecinal
              SET stock = stock - ?,
                  estado_compra = CASE
                    WHEN stock - ? <= 0 THEN 'agotado'
                    ELSE 'disponible'
                  END
              WHERE id = ?
            `;

            db.query(
              sqlActualizar,
              [item.cantidad, item.cantidad, item.producto_id],
              (err) => {
                if (respondido) return;

                if (err) {
                  respondido = true;
                  console.error("Error al actualizar stock:", err);
                  return res.status(500).json({
                    message: "Error al actualizar inventario",
                  });
                }

                pendientes -= 1;

                if (pendientes === 0) {
                  respondido = true;

                  notificarCompraMercadoExitosa(compraId).catch((emailError) => {
                    console.error("No se pudo enviar el correo de compra exitosa:", emailError.message);
                  });

                  return res.status(201).json({
                    message: "Compra realizada correctamente",
                    compra_id: compraId,
                    total,
                  });
                }
              }
            );
          });
        });
      });
    });
  });
};

module.exports = {
  crearCompra,
};