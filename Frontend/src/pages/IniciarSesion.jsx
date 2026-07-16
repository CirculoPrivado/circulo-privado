import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { iniciarSesion } from "../services/authService";
import { useAccessibility } from "../context/AccessibilityContext";

export default function IniciarSesion() {
  const navigate = useNavigate();
  const { t } = useAccessibility();

  const [formulario, setFormulario] = useState({ email: "", password: "" });
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const cambiarValor = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await iniciarSesion(formulario);
      localStorage.setItem("token", respuesta.token);
      localStorage.setItem("user", JSON.stringify(respuesta.user));
      localStorage.setItem("usuario_id", respuesta.user.id);
      setTipoMensaje("success");
      setMensaje("Inicio de sesión correcto");
      setTimeout(() => navigate("/panel"), 1000);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo iniciar sesión");
    }
  };

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="login-main">
        <section className="container seccion login-seccion">
          <div className="row justify-content-center align-items-center login-row">
            <div className="col-lg-6 col-xl-5">
              <div className="tarjeta-suave p-4 p-md-5 login-card">
                <div className="text-center mb-4">
                  <h1 className="titulo-principal mb-3">{t("loginAction")}</h1>
                  <p className="subtitulo mb-0">{t("loginSubtitle")}</p>
                </div>

                <form onSubmit={enviarFormulario}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">{t("email")}</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      name="email"
                      value={formulario.email}
                      onChange={cambiarValor}
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-semibold">{t("password")}</label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      name="password"
                      value={formulario.password}
                      onChange={cambiarValor}
                      placeholder="********"
                      required
                    />
                  </div>

                  <div className="text-end mb-4">
                    <Link to="/olvide-contrasena" className="fw-semibold text-decoration-none">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button className="btn btn-primary btn-lg w-100 boton-redondo">
                    {t("loginAction")}
                  </button>
                </form>

                {mensaje && (
                  <div className={`alert alert-${tipoMensaje} mt-4`} role="alert">
                    {mensaje}
                  </div>
                )}

                <div className="text-center mt-4">
                  <span className="subtitulo">{t("noAccount")} </span>
                  <Link to="/registro" className="fw-bold">
                    {t("signUp")}
                  </Link>
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
