async function enviarSms({ telefono, mensaje }) {
  // Aquí después irá la integración real con Twilio o similar
  throw new Error("enviarSms no implementado");
}

async function enviarWhatsapp({ telefono, mensaje }) {
  // Aquí después irá la integración real con WhatsApp Cloud API o Twilio
  throw new Error("enviarWhatsapp no implementado");
}

async function enviarCorreo({ para, asunto, mensaje }) {
  // Aquí después puedes integrar correo si lo necesitas
  throw new Error("enviarCorreo no implementado");
}

module.exports = {
  enviarSms,
  enviarWhatsapp,
  enviarCorreo,
};