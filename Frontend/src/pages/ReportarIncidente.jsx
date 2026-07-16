import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { crearIncidente } from "../services/incidentesService";

export default function ReportarIncidente() {
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    titulo: "",
    categoria: "",
    descripcion: "",
    ubicacion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const cambiarValor = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const limpiarFormulario = () => {
    setFormulario({
      titulo: "",
      categoria: "",
      descripcion: "",
      ubicacion: "",
    });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: formulario.titulo,
        category: formulario.categoria,
        description: formulario.descripcion,
        location_text: formulario.ubicacion,
      };

      const respuesta = await crearIncidente(payload);

      setTipoMensaje("success");
      setMensaje(respuesta.message || "Incidente registrado correctamente");
      limpiarFormulario();

      setTimeout(() => {
        navigate("/incidentes");
      }, 1200);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(
        error.response?.data?.message || "No se pudo registrar el incidente"
      );
    }
  };

  return (
    <>
      <BarraNavegacion />

      <main id="contenido-principal">
        <section className="container seccion">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="mb-4">
                <h1 className="titulo-principal">Reportar incidente</h1>
                <p className="subtitulo mb-0">
                  Completa el formulario para registrar un incidente en tu comunidad.
                </p>
              </div>

              <div className="tarjeta-suave p-4 p-lg-5">
                <form onSubmit={enviarFormulario}>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label htmlFor="titulo" className="form-label fw-semibold">
                        Título del incidente
                      </label>
                      <input
                        id="titulo"
                        type="text"
                        className="form-control form-control-lg"
                        name="titulo"
                        value={formulario.titulo}
                        onChange={cambiarValor}
                        placeholder="Ej. Ruido excesivo"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label htmlFor="categoria" className="form-label fw-semibold">
                        Categoría
                      </label>
                      <select
                        id="categoria"
                        className="form-select form-select-lg"
                        name="categoria"
                        value={formulario.categoria}
                        onChange={cambiarValor}
                        required
                      >
                        <option value="">Selecciona una categoría</option>
                        <option value="seguridad">Seguridad</option>
                        <option value="ruido">Ruido</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label htmlFor="descripcion" className="form-label fw-semibold">
                        Descripción
                      </label>
                      <textarea
                        id="descripcion"
                        className="form-control"
                        name="descripcion"
                        rows="5"
                        value={formulario.descripcion}
                        onChange={cambiarValor}
                        placeholder="Describe lo ocurrido con el mayor detalle posible"
                        required
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label htmlFor="ubicacion" className="form-label fw-semibold">
                        Ubicación
                      </label>
                      <input
                        id="ubicacion"
                        type="text"
                        className="form-control form-control-lg"
                        name="ubicacion"
                        value={formulario.ubicacion}
                        onChange={cambiarValor}
                        placeholder="Ej. Calle principal, frente al parque"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4 d-flex flex-wrap gap-3">
                    <button type="submit" className="btn btn-primary btn-lg boton-redondo">
                      Enviar reporte
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg boton-redondo"
                      onClick={limpiarFormulario}
                    >
                      Limpiar formulario
                    </button>
                  </div>
                </form>

                {mensaje && (
                  <div className={`alert alert-${tipoMensaje} mt-4 mb-0`} role="alert">
                    {mensaje}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PiePagina />
    </>
  );
}