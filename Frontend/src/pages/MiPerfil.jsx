import { useEffect, useMemo, useRef, useState } from "react";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import MapaPerfil from "../components/MapaPerfil";
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  actualizarUbicacionActual,
} from "../services/perfilService";
import { useAccessibility } from "../context/AccessibilityContext";

const formularioInicial = {
  name: "",
  email: "",
  telefono: "",
  fecha_nacimiento: "",
  foto_perfil: "",
  foto_public_id: "",
  role: "",
  created_at: "",
  street: "",
  ext_number: "",
  neighborhood: "",
  city: "",
  state: "",
  postal_code: "",
  country: "México",
  formatted_address: "",
  home_latitude: null,
  home_longitude: null,
  last_latitude: null,
  last_longitude: null,
  last_accuracy_meters: null,
  last_location_updated_at: null,
};

export default function MiPerfil() {
  const { t, preferences, updatePreference, getRoleLabel } = useAccessibility();

  const [formulario, setFormulario] = useState(formularioInicial);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [cargando, setCargando] = useState(true);
  const [ubicando, setUbicando] = useState(false);
  const [foto, setFoto] = useState(null);

  const watchIdRef = useRef(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const data = await obtenerMiPerfil();

        setFormulario({
          ...formularioInicial,
          ...data,
          fecha_nacimiento: data?.fecha_nacimiento
            ? String(data.fecha_nacimiento).split("T")[0]
            : "",
        });
      } catch (error) {
        setTipoMensaje("danger");
        setMensaje(error.response?.data?.message || "No se pudo cargar el perfil");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();

    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const cambiarValor = (e) => {
    setFormulario((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const manejarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setFoto(archivo);
    }
  };

  const guardarCambios = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();

      data.append("name", formulario.name || "");
      data.append("email", formulario.email || "");
      data.append("telefono", formulario.telefono || "");
      data.append("fecha_nacimiento", formulario.fecha_nacimiento || "");
      data.append("street", formulario.street || "");
      data.append("ext_number", formulario.ext_number || "");
      data.append("neighborhood", formulario.neighborhood || "");
      data.append("city", formulario.city || "");
      data.append("state", formulario.state || "");
      data.append("postal_code", formulario.postal_code || "");
      data.append("country", formulario.country || "México");

      if (foto) {
        data.append("foto", foto);
      }

      const respuesta = await actualizarMiPerfil(data);

      setTipoMensaje("success");
      setMensaje(
        respuesta.locationWarning
          ? `${respuesta.message} ${respuesta.locationWarning}`
          : respuesta.message || "Perfil actualizado correctamente"
      );

      const usuarioLocal = JSON.parse(localStorage.getItem("user") || "null");
      if (usuarioLocal) {
        usuarioLocal.name = formulario.name;
        usuarioLocal.email = formulario.email;
        usuarioLocal.telefono = formulario.telefono;
        usuarioLocal.fecha_nacimiento = formulario.fecha_nacimiento;

        if (respuesta.foto_perfil) {
          usuarioLocal.foto_perfil = respuesta.foto_perfil;
        }

        if (respuesta.foto_public_id) {
          usuarioLocal.foto_public_id = respuesta.foto_public_id;
        }

        localStorage.setItem("user", JSON.stringify(usuarioLocal));
      }

      const refrescado = await obtenerMiPerfil();

      setFormulario({
        ...formularioInicial,
        ...refrescado,
        fecha_nacimiento: refrescado?.fecha_nacimiento
          ? String(refrescado.fecha_nacimiento).split("T")[0]
          : "",
      });

      setFoto(null);
    } catch (error) {
      console.error(error);
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo actualizar el perfil");
    }
  };

  const manejarPosicion = async (position) => {
    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy_meters: position.coords.accuracy,
    };

    setFormulario((prev) => ({
      ...prev,
      last_latitude: payload.latitude,
      last_longitude: payload.longitude,
      last_accuracy_meters: payload.accuracy_meters,
      last_location_updated_at: new Date().toISOString(),
    }));

    try {
      const respuesta = await actualizarUbicacionActual(payload);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Ubicación actualizada correctamente");
    } catch (error) {
      setTipoMensaje("warning");
      setMensaje(
        error.response?.data?.message ||
          "Se obtuvo tu ubicación, pero no se pudo guardar en el servidor."
      );
    }
  };

  const activarUbicacionTiempoReal = () => {
    if (!navigator.geolocation) {
      setTipoMensaje("danger");
      setMensaje("Tu navegador no soporta geolocalización.");
      return;
    }

    setUbicando(true);
    setTipoMensaje("info");
    setMensaje("Solicitando permiso de ubicación…");

    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUbicando(false);
        manejarPosicion(position);
      },
      (error) => {
        setUbicando(false);
        setTipoMensaje("danger");

        const mensajes = {
          1: "Debes permitir el acceso a tu ubicación para verla en el mapa.",
          2: "No se pudo determinar tu ubicación actual.",
          3: "La solicitud de ubicación tardó demasiado.",
        };

        setMensaje(mensajes[error.code] || "No se pudo obtener tu ubicación.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const detenerSeguimiento = () => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setUbicando(false);
    setTipoMensaje("info");
    setMensaje("Seguimiento en tiempo real detenido.");
  };

  const nombreRol = getRoleLabel(formulario.role);

  const homeLocation = useMemo(() => {
    if (formulario.home_latitude == null || formulario.home_longitude == null) {
      return null;
    }

    return {
      lat: Number(formulario.home_latitude),
      lng: Number(formulario.home_longitude),
    };
  }, [formulario.home_latitude, formulario.home_longitude]);

  const currentLocation = useMemo(() => {
    if (formulario.last_latitude == null || formulario.last_longitude == null) {
      return null;
    }

    return {
      lat: Number(formulario.last_latitude),
      lng: Number(formulario.last_longitude),
    };
  }, [formulario.last_latitude, formulario.last_longitude]);

  const navigationUrl = useMemo(() => {
    if (currentLocation && homeLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${homeLocation.lat},${homeLocation.lng}&travelmode=driving`;
    }

    if (currentLocation) {
      return `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`;
    }

    if (homeLocation) {
      return `https://www.google.com/maps/search/?api=1&query=${homeLocation.lat},${homeLocation.lng}`;
    }

    return null;
  }, [currentLocation, homeLocation]);

  const fotoPreview = foto
    ? URL.createObjectURL(foto)
    : formulario.foto_perfil || "https://via.placeholder.com/120x120?text=Perfil";

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main profile-page">
        <section className="container-fluid app-page-shell">
          <div className="page-heading">
            <h1 className="page-title">{t("myProfile")}</h1>
            <p className="subtitulo mb-0">{t("profileSubtitle")}</p>
          </div>

          {mensaje && <div className={`alert alert-${tipoMensaje}`} role="alert">{mensaje}</div>}
          {cargando && <div className="alert alert-info">{t("loadingProfile")}</div>}

          {!cargando && (
            <form onSubmit={guardarCambios}>
              <section className="tarjeta-suave p-4 mb-4 profile-hero-card">
                <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
                  <div className="d-flex align-items-center gap-4">
                    <img src={fotoPreview} alt="Foto de perfil" className="profile-photo-modern" />
                    <div>
                      <h2 className="mb-1 fw-bold">{formulario.name || "Usuario"} <span className="status-badge blue">{nombreRol}</span></h2>
                      <p className="mb-1 subtitulo">✉️ {formulario.email}</p>
                      <p className="mb-0 subtitulo">📞 {formulario.telefono || "Sin teléfono"}</p>
                    </div>
                  </div>
                  <div className="d-flex flex-column flex-md-row gap-3 align-items-stretch align-items-md-center">
                    <label className="upload-mini profile-upload"><input type="file" accept="image/*" onChange={manejarFoto} />☁️ <span>Cambiar foto de perfil<small>JPG, PNG o WEBP. Máx. 2 MB.</small></span></label>
                    <button type="button" className="btn btn-outline-primary boton-redondo">✎ Editar perfil</button>
                    <button className="btn btn-primary boton-redondo">✓ {t("saveChanges")}</button>
                  </div>
                </div>
              </section>

              <div className="row g-4">
                <div className="col-xl-6">
                  <section className="tarjeta-suave p-4 h-100">
                    <h2 className="section-title">👤 Datos personales</h2>
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label fw-semibold">{t("fullName")} *</label><input type="text" className="form-control form-control-lg" name="name" value={formulario.name} onChange={cambiarValor} required /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">{t("email")} *</label><input type="email" className="form-control form-control-lg" name="email" value={formulario.email} onChange={cambiarValor} required /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">{t("phone")} *</label><input type="text" className="form-control form-control-lg" name="telefono" value={formulario.telefono || ""} onChange={cambiarValor} placeholder="5512345678" /><div className="form-text">Ingresa un número de 10 dígitos.</div></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Fecha de nacimiento</label><input type="date" className="form-control form-control-lg" name="fecha_nacimiento" value={formulario.fecha_nacimiento || ""} onChange={cambiarValor} /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">{t("role")}</label><input type="text" className="form-control form-control-lg" value={nombreRol} disabled /><div className="form-text">Rol asignado en la comunidad.</div></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">{t("registrationDate")}</label><input type="text" className="form-control form-control-lg" value={formulario.created_at ? new Date(formulario.created_at).toLocaleString() : ""} disabled /><div className="form-text">Fecha en la que te registraste.</div></div>
                    </div>
                  </section>
                </div>

                <div className="col-xl-6">
                  <section className="tarjeta-suave p-4 h-100">
                    <h2 className="section-title">📍 Dirección</h2>
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label fw-semibold">Código postal *</label><input type="text" className="form-control form-control-lg" name="postal_code" value={formulario.postal_code || ""} onChange={cambiarValor} placeholder="50000" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Calle *</label><input type="text" className="form-control form-control-lg" name="street" value={formulario.street || ""} onChange={cambiarValor} placeholder="Av. Principal" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Número exterior *</label><input type="text" className="form-control form-control-lg" name="ext_number" value={formulario.ext_number || ""} onChange={cambiarValor} placeholder="123" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Número interior</label><input type="text" className="form-control form-control-lg" placeholder="Opcional" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Colonia *</label><input type="text" className="form-control form-control-lg" name="neighborhood" value={formulario.neighborhood || ""} onChange={cambiarValor} placeholder="Centro" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Ciudad / Municipio *</label><input type="text" className="form-control form-control-lg" name="city" value={formulario.city || ""} onChange={cambiarValor} placeholder="Toluca" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">Estado *</label><input type="text" className="form-control form-control-lg" name="state" value={formulario.state || ""} onChange={cambiarValor} placeholder="Estado de México" /></div>
                      <div className="col-md-6"><label className="form-label fw-semibold">País *</label><input type="text" className="form-control form-control-lg" name="country" value={formulario.country || "México"} onChange={cambiarValor} placeholder="México" /></div>
                      <div className="col-12"><p className="subtitulo small mb-0">ℹ️ Tu dirección ayuda a la comunidad a brindarte información relevante.</p></div>
                    </div>
                  </section>
                </div>

                <div className="col-xl-6"><section className="tarjeta-suave p-4 h-100"><h2 className="section-title">🛡️ Seguridad de la cuenta</h2><div className="d-flex justify-content-between align-items-center gap-3 mb-4"><div><strong>Contraseña</strong><p className="subtitulo mb-0">Usa una contraseña segura para proteger tu cuenta.</p></div><button type="button" className="btn btn-outline-primary boton-redondo">🔒 Cambiar contraseña</button></div><hr /><div className="d-flex justify-content-between align-items-center gap-3"><div><strong>Verificación en dos pasos</strong><p className="subtitulo mb-0">Añade una capa extra de seguridad a tu cuenta.</p></div><span className="toggle-pill">Desactivado</span></div></section></div>

                <div className="col-xl-6"><section className="tarjeta-suave p-4 h-100"><h2 className="section-title">⚙️ Preferencias</h2><p className="subtitulo">Ajusta la aplicación a tus necesidades.</p><div className="theme-card-grid mb-3"><button type="button" className={`pref-card ${preferences.tema === "claro" ? "active" : ""}`} onClick={() => updatePreference("tema", "claro")}>☀️ <span>Modo claro<small>Interfaz clara</small></span></button><button type="button" className={`pref-card ${preferences.tema === "oscuro" ? "active" : ""}`} onClick={() => updatePreference("tema", "oscuro")}>🌙 <span>Modo oscuro<small>Interfaz oscura</small></span></button><button type="button" className={`pref-card ${preferences.tema === "contraste" ? "active" : ""}`} onClick={() => updatePreference("tema", "contraste")}>◐ <span>Alto contraste<small>Mejor visibilidad</small></span></button></div><div className="row g-3"><div className="col-md-6"><label className="form-label fw-semibold">{t("language")}</label><select className="form-select form-select-lg" value={preferences.idioma} onChange={(e) => updatePreference("idioma", e.target.value)}><option value="es">Español</option><option value="en">English</option></select></div><div className="col-md-6"><label className="form-label fw-semibold">{t("fontSize")}</label><select className="form-select form-select-lg" value={preferences.font_size} onChange={(e) => updatePreference("font_size", e.target.value)}><option value="small">{t("small")}</option><option value="medium">{t("medium")}</option><option value="large">{t("large")}</option></select></div></div></section></div>
              </div>
            </form>
          )}

          {!cargando && <section className="tarjeta-suave p-4 mt-4"><div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4"><div><h2 className="section-title mb-2">Ubicación y mapa en tiempo real</h2><p className="subtitulo mb-0">Abajo puedes ver tu domicilio registrado y tu ubicación actual en Google Maps.</p></div><div className="d-flex flex-wrap gap-2"><button type="button" className="btn btn-primary boton-redondo" onClick={activarUbicacionTiempoReal} disabled={ubicando}>{ubicando ? "Ubicando…" : "Compartir ubicación actual"}</button><button type="button" className="btn btn-outline-secondary boton-redondo" onClick={detenerSeguimiento}>Detener seguimiento</button>{navigationUrl && <a href={navigationUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary boton-redondo">Abrir navegación en Google Maps</a>}</div></div><div className="row g-4 mb-4"><div className="col-md-6"><div className="border rounded-4 p-3 h-100"><div className="fw-semibold mb-2">Dirección registrada</div><div>{formulario.formatted_address || "Aún no has guardado una dirección completa."}</div>{homeLocation && <div className="small text-muted mt-2">Lat: {homeLocation.lat} · Lng: {homeLocation.lng}</div>}</div></div><div className="col-md-6"><div className="border rounded-4 p-3 h-100"><div className="fw-semibold mb-2">Ubicación actual</div><div>{currentLocation ? `Lat: ${currentLocation.lat} · Lng: ${currentLocation.lng}` : "Activa el seguimiento para ver tu ubicación en tiempo real."}</div>{formulario.last_accuracy_meters != null && <div className="small text-muted mt-2">Precisión aproximada: {Number(formulario.last_accuracy_meters).toFixed(2)} m</div>}{formulario.last_location_updated_at && <div className="small text-muted mt-1">Última actualización: {new Date(formulario.last_location_updated_at).toLocaleString()}</div>}</div></div></div><MapaPerfil homeLocation={homeLocation} currentLocation={currentLocation} formattedAddress={formulario.formatted_address} /></section>}

          {!cargando && <div className="safe-info-strip mt-4">🔒 <div><strong>Tu información está segura</strong><span>Nos comprometemos a proteger tu privacidad.</span></div><em>Última actualización: {formulario.updated_at ? new Date(formulario.updated_at).toLocaleString() : "Sin cambios recientes"}</em></div>}
        </section>
      </main>
      <PiePagina />
    </>
  );
}