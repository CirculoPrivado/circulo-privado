const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escaparPDF = (valor) =>
  normalizarTexto(valor)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const formatearMoneda = (valor) => {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(numero) ? numero : 0);
};

const formatearFecha = (valor) => {
  if (!valor) return "No registrada";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return normalizarTexto(valor);
  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

const formatearFechaHora = (valor) => {
  if (!valor) return "No registrada";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return normalizarTexto(valor);
  return fecha.toLocaleString("es-MX", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const limpiarNombreArchivo = (valor) =>
  normalizarTexto(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "pago";

const construirPDF = (lineas) => {
  const stream = lineas.join("\n");
  const objetos = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objetos.forEach((objeto, indice) => {
    offsets.push(pdf.length);
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
  });

  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;
  return pdf;
};

const crearTexto = (x, y, texto, tamano = 10, fuente = "F1", color = "0.12 0.22 0.28") =>
  `${color} rg BT /${fuente} ${tamano} Tf ${x} ${y} Td (${escaparPDF(texto)}) Tj ET`;

const crearLinea = (x1, y1, x2, y2, color = "0.78 0.88 0.91", ancho = 1) =>
  `${color} RG ${ancho} w ${x1} ${y1} m ${x2} ${y2} l S`;

const crearRectangulo = (x, y, ancho, alto, color = "0.94 0.98 0.98", relleno = true) =>
  relleno
    ? `${color} rg ${x} ${y} ${ancho} ${alto} re f`
    : `${color} RG 1 w ${x} ${y} ${ancho} ${alto} re S`;

const crearCodigoVerificacion = (pago) => {
  const base = `${pago.id || "0"}-${pago.usuario_id || "0"}-${pago.monto || "0"}`;
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return `CP-${String(pago.id || 0).padStart(6, "0")}-${hash.toString(16).toUpperCase().slice(0, 6)}`;
};

const agregarQrVisual = (lineas, x, y, pago) => {
  const codigo = crearCodigoVerificacion(pago);
  const bits = codigo.split("").map((c) => c.charCodeAt(0));
  lineas.push(crearRectangulo(x, y, 74, 74, "1 1 1", true));
  lineas.push(crearRectangulo(x, y, 74, 74, "0.15 0.55 0.58", false));

  for (let fila = 0; fila < 9; fila += 1) {
    for (let col = 0; col < 9; col += 1) {
      const valor = bits[(fila + col) % bits.length] + fila * 7 + col * 11;
      if (valor % 3 === 0 || (fila < 2 && col < 2) || (fila > 6 && col < 2) || (fila < 2 && col > 6)) {
        lineas.push(crearRectangulo(x + 7 + col * 6.5, y + 7 + fila * 6.5, 4.5, 4.5, "0.02 0.42 0.45", true));
      }
    }
  }
};

export function descargarComprobantePagoPDF(pago, usuarioActual = null) {
  const folio = `CP-PAGO-${String(pago.id || 0).padStart(6, "0")}`;
  const estado = normalizarTexto(pago.estado || "pendiente").toUpperCase();
  const proveedor = normalizarTexto(pago.proveedor_pago || "Administracion");
  const usuario = normalizarTexto(pago.usuario || pago.usuario_id || "Usuario no especificado");
  const generadoPor = normalizarTexto(usuarioActual?.name || usuarioActual?.nombre || "Sistema Mi Comunidad");
  const codigoVerificacion = crearCodigoVerificacion(pago);
  const fechaEmision = formatearFechaHora(new Date());
  const fechaPago = pago.pagado_en ? formatearFechaHora(pago.pagado_en) : estado === "PAGADO" ? fechaEmision : "Pendiente de liquidacion";

  const lineas = [];

  // Fondo y encabezado
  lineas.push(crearRectangulo(0, 0, 612, 792, "0.97 0.99 1", true));
  lineas.push(crearRectangulo(0, 702, 612, 90, "0.02 0.48 0.52", true));
  lineas.push(crearRectangulo(0, 676, 612, 26, "0.88 0.97 0.97", true));
  lineas.push(crearTexto(48, 748, "MI COMUNIDAD", 22, "F2", "1 1 1"));
  lineas.push(crearTexto(48, 728, "Comprobante de pago comunitario", 11, "F1", "0.88 1 1"));
  lineas.push(crearTexto(404, 748, "FOLIO", 9, "F2", "0.82 1 1"));
  lineas.push(crearTexto(404, 728, folio, 15, "F2", "1 1 1"));

  // Estado
  const colorEstado = estado === "PAGADO" ? "0.12 0.62 0.36" : estado.includes("VENC") ? "0.86 0.20 0.24" : "0.95 0.63 0.12";
  lineas.push(crearRectangulo(432, 648, 116, 30, colorEstado, true));
  lineas.push(crearTexto(457, 658, estado, 12, "F2", "1 1 1"));

  // Tarjeta principal
  lineas.push(crearRectangulo(42, 458, 528, 172, "1 1 1", true));
  lineas.push(crearRectangulo(42, 458, 528, 172, "0.77 0.88 0.90", false));
  lineas.push(crearTexto(64, 602, "RECIBO DE PAGO", 16, "F2", "0.02 0.33 0.38"));
  lineas.push(crearTexto(64, 579, "Este documento confirma el registro del pago dentro del sistema comunitario.", 9, "F1", "0.33 0.43 0.48"));
  lineas.push(crearTexto(64, 536, "MONTO PAGADO", 10, "F2", "0.36 0.45 0.48"));
  lineas.push(crearTexto(64, 507, formatearMoneda(pago.monto), 28, "F2", "0.02 0.48 0.52"));
  lineas.push(crearTexto(322, 536, "CONCEPTO", 10, "F2", "0.36 0.45 0.48"));
  lineas.push(crearTexto(322, 514, pago.concepto || "Pago comunitario", 14, "F2", "0.08 0.18 0.24"));
  lineas.push(crearTexto(322, 492, `Proveedor: ${proveedor}`, 10, "F1", "0.28 0.38 0.43"));
  lineas.push(crearTexto(322, 474, `Fecha de pago: ${fechaPago}`, 10, "F1", "0.28 0.38 0.43"));

  // Detalle del pago
  lineas.push(crearTexto(48, 418, "Detalle del movimiento", 14, "F2", "0.02 0.33 0.38"));
  lineas.push(crearRectangulo(48, 296, 516, 104, "1 1 1", true));
  lineas.push(crearRectangulo(48, 296, 516, 104, "0.82 0.90 0.92", false));
  lineas.push(crearLinea(48, 374, 564, 374));
  lineas.push(crearLinea(48, 348, 564, 348));
  lineas.push(crearLinea(48, 322, 564, 322));
  lineas.push(crearLinea(220, 296, 220, 400));

  lineas.push(crearTexto(64, 382, "Usuario", 9, "F2", "0.35 0.45 0.50"));
  lineas.push(crearTexto(236, 382, usuario, 10, "F1", "0.10 0.20 0.25"));
  lineas.push(crearTexto(64, 356, "Fecha de vencimiento", 9, "F2", "0.35 0.45 0.50"));
  lineas.push(crearTexto(236, 356, formatearFecha(pago.fecha_vencimiento), 10, "F1", "0.10 0.20 0.25"));
  lineas.push(crearTexto(64, 330, "Metodo / proveedor", 9, "F2", "0.35 0.45 0.50"));
  lineas.push(crearTexto(236, 330, proveedor, 10, "F1", "0.10 0.20 0.25"));
  lineas.push(crearTexto(64, 304, "Referencia externa", 9, "F2", "0.35 0.45 0.50"));
  lineas.push(crearTexto(236, 304, pago.external_reference || pago.paypal_capture_id || pago.mp_payment_id || folio, 10, "F1", "0.10 0.20 0.25"));

  // Validacion
  lineas.push(crearRectangulo(48, 172, 516, 90, "0.91 0.98 0.97", true));
  lineas.push(crearRectangulo(48, 172, 516, 90, "0.72 0.87 0.87", false));
  lineas.push(crearTexto(68, 236, "Validacion del comprobante", 13, "F2", "0.02 0.33 0.38"));
  lineas.push(crearTexto(68, 214, `Codigo de verificacion: ${codigoVerificacion}`, 10, "F2", "0.10 0.24 0.28"));
  lineas.push(crearTexto(68, 195, `Emitido el: ${fechaEmision}`, 9, "F1", "0.33 0.43 0.48"));
  lineas.push(crearTexto(68, 179, `Generado por: ${generadoPor}`, 9, "F1", "0.33 0.43 0.48"));
  agregarQrVisual(lineas, 462, 184, pago);

  // Firma y nota
  lineas.push(crearLinea(74, 118, 244, 118, "0.60 0.72 0.76", 1));
  lineas.push(crearTexto(96, 101, "Administracion de la comunidad", 9, "F1", "0.35 0.45 0.50"));
  lineas.push(crearLinea(340, 118, 510, 118, "0.60 0.72 0.76", 1));
  lineas.push(crearTexto(378, 101, "Firma / sello interno", 9, "F1", "0.35 0.45 0.50"));
  lineas.push(crearTexto(48, 62, "Nota: Este comprobante es valido como evidencia interna del sistema. Conserva este documento para cualquier aclaracion.", 8, "F1", "0.38 0.46 0.50"));
  lineas.push(crearTexto(48, 44, "Documento generado automaticamente por Mi Comunidad.", 8, "F1", "0.38 0.46 0.50"));

  const pdf = construirPDF(lineas);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-${limpiarNombreArchivo(pago.concepto)}-${folio}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
