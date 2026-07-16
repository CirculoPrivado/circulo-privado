const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    EMAIL_USER,
    EMAIL_PASS,
  } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE).toLowerCase() === "true" || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    return transporter;
  }

  if (EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    return transporter;
  }

  return null;
};

const getFromAddress = () => {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;
};

const escaparHtml = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const enviarCorreo = async ({ to, subject, html, text }) => {
  const currentTransporter = getTransporter();
  const from = getFromAddress();

  if (!currentTransporter || !from) {
    throw new Error("El servicio de correo no está configurado. Define SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS o EMAIL_USER/EMAIL_PASS.");
  }

  return currentTransporter.sendMail({
    from: `"CIRCULO PRIVADO" <${from}>`,
    to,
    subject,
    html,
    text,
  });
};

const enviarBienvenida = async ({ email, name }) => {
  return enviarCorreo({
    to: email,
    subject: "Bienvenido a CIRCULO PRIVADO",
    text: `Hola ${name}, bienvenido a CIRCULO PRIVADO. Tu cuenta ha sido creada correctamente.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h1 style="color: #0d6efd;">Bienvenido a CIRCULO PRIVADO</h1>
        <p>Hola <strong>${escaparHtml(name)}</strong>,</p>
        <p>Tu cuenta ha sido creada correctamente y ya puedes ingresar a la plataforma.</p>
        <p>Gracias por formar parte de la comunidad.</p>
      </div>
    `,
  });
};

const enviarRecuperacionPassword = async ({ email, name, resetLink }) => {
  return enviarCorreo({
    to: email,
    subject: "Restablece tu contraseña - CIRCULO PRIVADO",
    text: `Hola ${name || ""}. Para restablecer tu contraseña entra a este enlace: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h1 style="color: #0d6efd;">Restablecer contraseña</h1>
        <p>Hola <strong>${escaparHtml(name || "usuario")}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          <a href="${escaparHtml(resetLink)}" style="display: inline-block; background: #0d6efd; color: white; text-decoration: none; padding: 12px 20px; border-radius: 999px;">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>Este enlace vence en 1 hora.</p>
      </div>
    `,
  });
};

const enviarCorreoPagoExitoso = async ({
  email,
  nombreUsuario,
  nombreConcepto,
  formaPago,
  cantidad,
  fecha,
  tipo = "pago",
}) => {
  const esMercado = tipo === "mercado";
  const asunto = esMercado ? "Compra realizada con éxito" : "Pago exitoso realizado";
  const etiquetaNombre = esMercado ? "Nombre de tu compra" : "Nombre del pago";

  return enviarCorreo({
    to: email,
    subject: asunto,
    text: `Hola, ${nombreUsuario}.

Realizaste un pago exitoso.

Detalle:
- ${etiquetaNombre}: ${nombreConcepto}
- Forma de pago: ${formaPago}
- Cantidad pagada: $${Number(cantidad || 0).toFixed(2)}
- Fecha: ${fecha}

Gracias por utilizar el sistema.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #0d6efd;">Hola, ${escaparHtml(nombreUsuario)}</h2>
        <p><strong>Realizaste un pago exitoso.</strong></p>
        <p>Detalle:</p>
        <ul>
          <li><strong>${escaparHtml(etiquetaNombre)}:</strong> ${escaparHtml(nombreConcepto)}</li>
          <li><strong>Forma de pago:</strong> ${escaparHtml(formaPago)}</li>
          <li><strong>Cantidad pagada:</strong> $${Number(cantidad || 0).toFixed(2)}</li>
          <li><strong>Fecha:</strong> ${escaparHtml(fecha)}</li>
        </ul>
        <p>Gracias por utilizar el sistema.</p>
      </div>
    `,
  });
};

const construirListaHtml = (items) =>
  items
    .filter((item) => item && item.valor)
    .map((item) => `<li><strong>${escaparHtml(item.etiqueta)}:</strong> ${escaparHtml(item.valor)}</li>`)
    .join("");

const construirListaTexto = (items) =>
  items
    .filter((item) => item && item.valor)
    .map((item) => `- ${item.etiqueta}: ${item.valor}`)
    .join("\n");

const enviarCorreoEventoComunitario = async ({
  email,
  nombreUsuario,
  asunto,
  tituloEvento,
  mensajePrincipal,
  detalleLabel = "Título",
  detalles = [],
}) => {
  const detalleTexto = construirListaTexto([{ etiqueta: detalleLabel, valor: tituloEvento }, ...detalles]);
  const detalleHtml = construirListaHtml([{ etiqueta: detalleLabel, valor: tituloEvento }, ...detalles]);

  return enviarCorreo({
    to: email,
    subject: asunto,
    text: `Hola, ${nombreUsuario}.

${mensajePrincipal}

Detalle:
${detalleTexto}

Gracias por mantenerte informado con Círculo Privado.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <h2 style="color: #0d6efd;">Hola, ${escaparHtml(nombreUsuario)}</h2>
        <p><strong>${escaparHtml(mensajePrincipal)}</strong></p>
        <p>Detalle:</p>
        <ul>
          ${detalleHtml}
        </ul>
        <p>Gracias por mantenerte informado con Círculo Privado.</p>
      </div>
    `,
  });
};

module.exports = {
  enviarCorreo,
  enviarBienvenida,
  enviarRecuperacionPassword,
  enviarCorreoPagoExitoso,
  enviarCorreoEventoComunitario,
};
