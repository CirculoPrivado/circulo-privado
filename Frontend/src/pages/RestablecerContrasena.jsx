import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { restablecerContrasena, validarTokenRecuperacion } from "../services/authService";
import { PASSWORD_MIN_LENGTH, validarPasswordSegura } from "../utils/passwordValidation";

export default function RestablecerContrasena() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("Validando enlace...");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [tokenValido, setTokenValido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const validar = async () => {
      try {
        await validarTokenRecuperacion(token);
        setTokenValido(true);
        setMensaje("");
      } catch (error) {
        setTipoMensaje("danger");
        setMensaje(error.response?.data?.message || "El enlace no es válido");
      }
    };

    validar();
  }, [token]);

  const enviarFormulario = async (e) => {
    e.preventDefault();

    const validacionPassword = validarPasswordSegura(password);

    if (!validacionPassword.esValida) {
      setTipoMensaje("danger");
      setMensaje(validacionPassword.message);
      return;
    }

    if (password !== confirmar) {
      setTipoMensaje("danger");
      setMensaje("Las contraseñas no coinciden");
      return;
    }

    setEnviando(true);
    setMensaje("");

    try {
      const respuesta = await restablecerContrasena(token, password);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Contraseña actualizada correctamente");
      setTimeout(() => navigate("/iniciar-sesion"), 1600);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo restablecer la contraseña");
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
                <h1 className="titulo-principal text-center mb-3">Restablecer contraseña</h1>
                <p className="subtitulo text-center mb-4">
                  Crea una nueva contraseña para tu cuenta.
                </p>

                {mensaje && !tokenValido && <div className={`alert alert-${tipoMensaje}`} role="alert">{mensaje}</div>}

                {tokenValido && (
                  <form onSubmit={enviarFormulario}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nueva contraseña</label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                      />
                      <div className="form-text">Debe tener al menos {PASSWORD_MIN_LENGTH} caracteres y un carácter especial.</div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">Confirmar contraseña</label>
                      <input
                        type="password"
                        className="form-control form-control-lg"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        placeholder="********"
                        required
                      />
                      <div className="form-text">Debe tener al menos {PASSWORD_MIN_LENGTH} caracteres y un carácter especial.</div>
                    </div>

                    <button className="btn btn-primary btn-lg w-100 boton-redondo" disabled={enviando}>
                      {enviando ? "Guardando..." : "Actualizar contraseña"}
                    </button>
                  </form>
                )}

                {mensaje && tokenValido && <div className={`alert alert-${tipoMensaje} mt-4`} role="alert">{mensaje}</div>}

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
