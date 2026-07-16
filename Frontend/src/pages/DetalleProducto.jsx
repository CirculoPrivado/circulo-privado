import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);

  useEffect(() => {
    obtenerProducto();
  }, [id]);

  const obtenerProducto = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/mercado/${id}`);
      setProducto(res.data);
    } catch (error) {
      console.error("Error al obtener detalle del producto:", error);
    }
  };

  if (!producto) {
    return (
      <>
        <BarraNavegacion />
        <main className="container seccion">
          <div className="tarjeta-suave p-4">
            <p>Cargando producto...</p>
          </div>
        </main>
        <PiePagina />
      </>
    );
  }

  return (
    <>
      <BarraNavegacion />

      <main className="container seccion">
        <div className="tarjeta-suave p-4">
          {producto.imagen && (
            <img
              src={producto.imagen}
              alt={producto.titulo}
              className="img-fluid rounded mb-4"
              style={{ maxHeight: "350px", objectFit: "cover", width: "100%" }}
            />
          )}

          <h1 className="titulo-principal mb-3">{producto.titulo}</h1>

          <p className="subtitulo mb-4">{producto.descripcion}</p>

          <p><strong>Precio:</strong> {producto.precio ? `$${producto.precio}` : "Gratis"}</p>
          <p><strong>Categoría:</strong> {producto.categoria || "General"}</p>
          <p><strong>Publicado por:</strong> {producto.nombre_usuario || "Usuario"}</p>
          <p><strong>Teléfono:</strong> {producto.telefono || "No disponible"}</p>

          <div className="mt-4">
            <button
              type="button"
              className="btn btn-outline-primary boton-redondo"
              onClick={() => navigate("/mercado-vecinal")}
            >
              Volver al mercado
            </button>
          </div>
        </div>
      </main>

      <PiePagina />
    </>
  );
}

export default DetalleProducto;