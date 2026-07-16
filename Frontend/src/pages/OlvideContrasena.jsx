import { useState } from "react";
import { Link } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { solicitarRecuperacion } from "../services/authService";

export default function OlvideContrasena() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [enviando, setEnviando] = useState(false);

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");

    try {
      const respuesta = await solicitarRecuperacion(email);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Revisa tu correo para continuar.");
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo procesar la recuperación");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal">
        <section className="container seccion">
          <div className="row justify-content-center">
            <div className="col-lg-5">
              <div className="tarjeta-suave p-5">
                <h1 className="titulo-principal text-center mb-3">¿Olvidaste tu contraseña?</h1>
                <p className="subtitulo text-center mb-4">
                  Escribe tu correo y te enviaremos un enlace para restablecerla.
                </p>

                <form onSubmit={enviarFormulario}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Correo electrónico</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>

                  <button className="btn btn-primary btn-lg w-100 boton-redondo" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar enlace"}
                  </button>
                </form>

                {mensaje && <div className={`alert alert-${tipoMensaje} mt-4`} role="alert">{mensaje}</div>}

                <div className="text-center mt-4">
                  <Link to="/iniciar-sesion" className="fw-bold">Volver a iniciar sesión</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
