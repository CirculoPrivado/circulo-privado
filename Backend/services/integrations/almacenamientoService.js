const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function subirArchivo(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "circulo-privado/mercado",
    resource_type: "image",
  });

  return result;
}

async function eliminarArchivo(publicId) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
}

module.exports = {
  subirArchivo,
  eliminarArchivo,
};