import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import {
  obtenerIncidentePorId,
  actualizarEstadoIncidente,
} from "../services/incidentesService";

export default function DetalleIncidente() {
  const { id } = useParams();

  const usuarioGuardado = localStorage.getItem("user");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const rol = usuario?.role || "";

  const puedeActualizar =
    rol === "admin" || rol === "committee" || rol === "security";

  const [incidente, setIncidente] = useState(null);
  const [estado, setEstado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [cargando, setCargando] = useState(true);

  const cargarDetalle = async () => {
    try {
      const data = await obtenerIncidentePorId(id);
      setIncidente(data);
      setEstado(data.status || "reportado");
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(
        error.response?.data?.message || "No se pudo cargar el incidente"
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const guardarEstado = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await actualizarEstadoIncidente(id, estado);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Estado actualizado");
      await cargarDetalle();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(
        error.response?.data?.message || "No se pudo actualizar el estado"
      );
    }
  };

  return (
    <>
      <BarraNavegacion />

      <main id="contenido-principal">
        <section className="container seccion">
          <h1 className="titulo-principal mb-4">Detalle del incidente</h1>

          {mensaje && (
            <div className={`alert alert-${tipoMensaje}`} role="alert">
              {mensaje}
            </div>
          )}

          {cargando && <div className="alert alert-info">Cargando detalle...</div>}

          {!cargando && incidente && (
            <div className="tarjeta-suave p-4 p-lg-5">
              <h2 className="h3 fw-bold mb-3">{incidente.title}</h2>

              <p className="mb-2">
                <strong>Categoría:</strong> {incidente.category}
              </p>

              <p className="mb-2">
                <strong>Estado:</strong> {incidente.status}
              </p>

              <p className="mb-2">
                <strong>Ubicación:</strong> {incidente.location_text}
              </p>

              <p className="mb-2">
                <strong>Reportado por:</strong> {incidente.usuario}
              </p>

              <p className="mb-4">
                <strong>Descripción:</strong> {incidente.description}
              </p>

              {puedeActualizar && (
                <form onSubmit={guardarEstado}>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">
                        Cambiar estado
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      >
                        <option value="reportado">Reportado</option>
                        <option value="en revision">En revisión</option>
                        <option value="atendido">Atendido</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <button className="btn btn-primary btn-lg boton-redondo w-100">
                        Guardar estado
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      </main>

      <PiePagina />
    </>
  );
}