import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AccessibilityMenu from "./AccessibilityMenu";
import { useAccessibility } from "../context/AccessibilityContext";
import logo from "../assets/logo.png";

const MIN_WIDTH = 230;
const MAX_WIDTH = 360;
const COLLAPSED_WIDTH = 92;

export default function BarraNavegacion() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const { t } = useAccessibility();
  const resizingRef = useRef(false);

  const [sidebarHidden, setSidebarHidden] = useState(
    localStorage.getItem("sidebarHidden") === "true"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );
  const [sidebarWidth, setSidebarWidth] = useState(
    Number(localStorage.getItem("sidebarWidth")) || 280
  );

  useEffect(() => {
    const finalWidth = sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth;
    document.documentElement.style.setProperty("--sidebar-width", `${finalWidth}px`);
    document.documentElement.classList.toggle("sidebar-hidden", sidebarHidden);
    document.documentElement.classList.toggle("sidebar-collapsed", sidebarCollapsed && !sidebarHidden);
    localStorage.setItem("sidebarHidden", String(sidebarHidden));
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed));
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarHidden, sidebarCollapsed, sidebarWidth]);

  useEffect(() => {
    const mover = (e) => {
      if (!resizingRef.current || sidebarCollapsed || sidebarHidden) return;
      const nuevoAncho = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(nuevoAncho);
    };

    const soltar = () => {
      resizingRef.current = false;
      document.body.classList.remove("sidebar-resizing");
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };
  }, [sidebarCollapsed, sidebarHidden]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/iniciar-sesion");
  };

  const esRutaActiva = (ruta) => location.pathname === ruta;
  const claseNavLink = (ruta) => `nav-link-circulo ${esRutaActiva(ruta) ? "active" : ""}`;

  const enlacesPrincipales = [
    { ruta: "/panel", texto: t("panel"), icono: "🏠" },
    { ruta: "/avisos", texto: t("notices"), icono: "📣" },
    { ruta: "/incidentes", texto: t("incidents"), icono: "⚠️" },
    { ruta: "/emergencia", texto: t("emergency"), icono: "🚨" },
    { ruta: "/pagos", texto: t("payments"), icono: "💳" },
    { ruta: "/mercado-vecinal", texto: t("marketplace"), icono: "🛒" },
  ];

  if (sidebarHidden) {
    return (
      <button
        type="button"
        className="sidebar-floating-open"
        onClick={() => setSidebarHidden(false)}
        title="Mostrar barra lateral"
        aria-label="Mostrar barra lateral"
      >
        ☰
      </button>
    );
  }

  return (
    <header className="layout-nav-shell">
      <a href="#contenido-principal" className="visually-hidden-focusable position-absolute top-0 start-0 m-2 p-2 bg-light text-dark rounded">
        {t("skipToContent")}
      </a>

      <aside className="sidebar-circulo" aria-label="Navegación principal">
        <div className="sidebar-toolbar" aria-label="Controles de barra lateral">
          <button type="button" className="sidebar-tool-btn" onClick={() => setSidebarCollapsed((v) => !v)} title={sidebarCollapsed ? "Hacer barra más ancha" : "Hacer barra compacta"}>
            {sidebarCollapsed ? "➡" : "⬅"}
          </button>
          <button type="button" className="sidebar-tool-btn" onClick={() => setSidebarHidden(true)} title="Ocultar barra lateral">
            ✕
          </button>
        </div>

        <div className="sidebar-circulo-header">
          <Link className="sidebar-brand" to={token ? "/panel" : "/"} title={t("appName")}>
            <img src={logo} alt="Logo de Círculo Privado" className="nav-logo" />
            <span className="brand-text">{t("appName")}</span>
          </Link>
        </div>

        <nav className="sidebar-menu" aria-label="Menú principal">
          {enlacesPrincipales.map((enlace) => (
            <Link key={enlace.ruta} className={claseNavLink(enlace.ruta)} to={enlace.ruta} title={enlace.texto}>
              <span className="nav-icon" aria-hidden="true">{enlace.icono}</span>
              <span className="nav-label">{enlace.texto}</span>
            </Link>
          ))}

          {token && (
            <Link className={claseNavLink("/mi-perfil")} to="/mi-perfil" title={t("profile")}>
              <span className="nav-icon" aria-hidden="true">👤</span>
              <span className="nav-label">{t("profile")}</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-actions">
          {token && (
            <Link className={`btn btn-nav-pill sidebar-action-link ${esRutaActiva("/asistente") ? "btn-nav-pill-active" : ""}`} to="/asistente" title={t("aiAssistant")}>
              <span aria-hidden="true">🤖</span>
              <span className="nav-label">{t("aiAssistant")}</span>
            </Link>
          )}
          <AccessibilityMenu />
        </div>

        <div className="sidebar-session">
          {!token ? (
            <Link className="btn btn-nav-pill sidebar-action-link" to="/iniciar-sesion" title={t("login")}>
              <span aria-hidden="true">🔐</span><span className="nav-label">{t("login")}</span>
            </Link>
          ) : (
            <button type="button" className="btn btn-nav-pill sidebar-action-link" onClick={cerrarSesion} title={t("logout")}>
              <span aria-hidden="true">↪</span><span className="nav-label">{t("logout")}</span>
            </button>
          )}
        </div>

        {!sidebarCollapsed && (
          <div
            className="sidebar-resize-handle"
            onMouseDown={() => {
              resizingRef.current = true;
              document.body.classList.add("sidebar-resizing");
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Arrastrar para cambiar ancho de la barra lateral"
            title="Arrastra para cambiar el ancho"
          />
        )}
      </aside>
    </header>
  );
}
