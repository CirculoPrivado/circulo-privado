import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { registrarUsuario } from "../services/authService";
import { useAccessibility } from "../context/AccessibilityContext";
import { PASSWORD_MIN_LENGTH, validarPasswordSegura } from "../utils/passwordValidation";

const formularioInicial = {
  nombre: "",
  email: "",
  password: "",
  confirmar: "",
  role: "resident",
  street: "",
  ext_number: "",
  neighborhood: "",
  city: "",
  state: "",
  postal_code: "",
  country: "México",
};

export default function Registro() {
  const navigate = useNavigate();
  const { t } = useAccessibility();

  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  const cambiarValor = (e) =>
    setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const enviarFormulario = async (e) => {
    e.preventDefault();

    const validacionPassword = validarPasswordSegura(
      formulario.password
    );

    if (!validacionPassword.esValida) {
      setTipoMensaje("danger");
      setMensaje(validacionPassword.message);
      return;
    }

    if (formulario.password !== formulario.confirmar) {
      setTipoMensaje("danger");
      setMensaje("Las contraseñas no coinciden");
      return;
    }

    if (
      !formulario.postal_code &&
      !(
        formulario.street &&
        formulario.city &&
        formulario.state
      )
    ) {
      setTipoMensaje("danger");
      setMensaje(
        "Ingresa al menos un código postal o una dirección válida."
      );
      return;
    }

    try {
      const payload = {
        name: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password,
        role: formulario.role,
        street: formulario.street.trim(),
        ext_number: formulario.ext_number.trim(),
        neighborhood: formulario.neighborhood.trim(),
        city: formulario.city.trim(),
        state: formulario.state.trim(),
        postal_code: formulario.postal_code.trim(),
        country: formulario.country.trim(),
      };

      const respuesta = await registrarUsuario(payload);

      setTipoMensaje("success");
      setMensaje(
        respuesta.locationWarning
          ? `Usuario registrado correctamente. ${respuesta.locationWarning}`
          : respuesta.message ||
              "Usuario registrado correctamente. Ahora puedes iniciar sesión."
      );

      setFormulario(formularioInicial);

      setTimeout(() => {
        navigate("/iniciar-sesion", {
          state: {
            mensaje:
              "Usuario registrado correctamente. Inicia sesión con tu correo y contraseña.",
          },
        });
      }, 3000);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(
        error.response?.data?.message ||
          "No se pudo registrar el usuario"
      );
    }
  };

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="registro-main">
        <section className="container seccion registro-seccion">
          <div className="row justify-content-center registro-row">
            <div className="col-lg-8">
              <div className="tarjeta-suave p-4 p-md-5 registro-card">
                <h1 className="titulo-principal text-center mb-3">{t("createAccount")}</h1>
                <p className="subtitulo text-center mb-4">{t("registerSubtitle")}</p>
                <form onSubmit={enviarFormulario}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("fullName")}</label>
                      <input type="text" className="form-control form-control-lg" name="nombre" value={formulario.nombre} onChange={cambiarValor} placeholder={t("fullName")} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("email")}</label>
                      <input type="email" className="form-control form-control-lg" name="email" value={formulario.email} onChange={cambiarValor} placeholder="correo@ejemplo.com" required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("role")}</label>
                      <select className="form-select form-select-lg" name="role" value={formulario.role} onChange={cambiarValor} required>
                        <option value="resident">{t("resident")}</option>
                        <option value="committee">{t("committee")}</option>
                        <option value="security">{t("security")}</option>
                        <option value="admin">{t("admin")}</option>
                      </select>
                      <div className="form-text">Solo puede existir una cuenta con rol de administrador.</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Código postal</label>
                      <input type="text" className="form-control form-control-lg" name="postal_code" value={formulario.postal_code} onChange={cambiarValor} placeholder="50000" />
                      <div className="form-text">Puedes registrar solo el código postal o completar toda tu dirección.</div>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Calle</label>
                      <input type="text" className="form-control form-control-lg" name="street" value={formulario.street} onChange={cambiarValor} placeholder="Av. Principal" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Número exterior</label>
                      <input type="text" className="form-control form-control-lg" name="ext_number" value={formulario.ext_number} onChange={cambiarValor} placeholder="123" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Colonia</label>
                      <input type="text" className="form-control form-control-lg" name="neighborhood" value={formulario.neighborhood} onChange={cambiarValor} placeholder="Centro" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ciudad / Municipio</label>
                      <input type="text" className="form-control form-control-lg" name="city" value={formulario.city} onChange={cambiarValor} placeholder="Toluca" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Estado</label>
                      <input type="text" className="form-control form-control-lg" name="state" value={formulario.state} onChange={cambiarValor} placeholder="Estado de México" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">País</label>
                      <input type="text" className="form-control form-control-lg" name="country" value={formulario.country} onChange={cambiarValor} placeholder="México" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("password")}</label>
                      <input type="password" className="form-control form-control-lg" name="password" value={formulario.password} onChange={cambiarValor} placeholder="********" required />
                      <div className="form-text">Debe tener al menos {PASSWORD_MIN_LENGTH} caracteres y un carácter especial.</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t("confirmPassword")}</label>
                      <input type="password" className="form-control form-control-lg" name="confirmar" value={formulario.confirmar} onChange={cambiarValor} placeholder="********" required />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 boton-redondo mt-4"
                  >
                    {t("createAccount")}
                  </button>
                </form>
                {mensaje && <div className={`alert alert-${tipoMensaje} mt-4`} role="alert">{mensaje}</div>}
                <div className="text-center mt-4"><span className="subtitulo">{t("accountExists")} </span><Link to="/iniciar-sesion" className="fw-bold">{t("signInHere")}</Link></div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
