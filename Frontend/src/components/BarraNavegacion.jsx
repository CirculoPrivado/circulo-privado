import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AccessibilityMenu from "./AccessibilityMenu";
import { useAccessibility } from "../context/AccessibilityContext";
import logo from "../assets/logo.png";

const MIN_WIDTH = 230;
const MAX_WIDTH = 360;
const COLLAPSED_WIDTH = 92;
const MOBILE_BREAKPOINT = 992;

export default function BarraNavegacion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAccessibility();

  const resizingRef = useRef(false);

  const token = localStorage.getItem("token");

  const [esMovil, setEsMovil] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

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
    const manejarResize = () => {
      const movil = window.innerWidth < MOBILE_BREAKPOINT;

      setEsMovil(movil);

      if (!movil) {
        setMenuMovilAbierto(false);
      }
    };

    window.addEventListener("resize", manejarResize);

    return () => {
      window.removeEventListener("resize", manejarResize);
    };
  }, []);

  useEffect(() => {
    if (esMovil) {
      document.documentElement.style.setProperty(
        "--sidebar-width",
        "0px"
      );

      document.documentElement.classList.remove("sidebar-collapsed");
      document.documentElement.classList.remove("sidebar-hidden");

      return;
    }

    const finalWidth = sidebarCollapsed
      ? COLLAPSED_WIDTH
      : sidebarWidth;

    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${finalWidth}px`
    );

    document.documentElement.classList.toggle(
      "sidebar-hidden",
      sidebarHidden
    );

    document.documentElement.classList.toggle(
      "sidebar-collapsed",
      sidebarCollapsed && !sidebarHidden
    );

    localStorage.setItem(
      "sidebarHidden",
      String(sidebarHidden)
    );

    localStorage.setItem(
      "sidebarCollapsed",
      String(sidebarCollapsed)
    );

    localStorage.setItem(
      "sidebarWidth",
      String(sidebarWidth)
    );
  }, [
    esMovil,
    sidebarHidden,
    sidebarCollapsed,
    sidebarWidth,
  ]);

  useEffect(() => {
    const mover = (event) => {
      if (
        !resizingRef.current ||
        sidebarCollapsed ||
        sidebarHidden ||
        esMovil
      ) {
        return;
      }

      const nuevoAncho = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, event.clientX)
      );

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
  }, [sidebarCollapsed, sidebarHidden, esMovil]);

  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle(
      "menu-movil-abierto",
      menuMovilAbierto
    );

    return () => {
      document.body.classList.remove("menu-movil-abierto");
    };
  }, [menuMovilAbierto]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMenuMovilAbierto(false);

    navigate("/iniciar-sesion");
  };

  const esRutaActiva = (ruta) => {
    return location.pathname === ruta;
  };

  const claseNavLink = (ruta) => {
    return `nav-link-circulo ${
      esRutaActiva(ruta) ? "active" : ""
    }`;
  };

  const cerrarMenuMovil = () => {
    if (esMovil) {
      setMenuMovilAbierto(false);
    }
  };

  const enlacesPrincipales = [
    {
      ruta: "/panel",
      texto: t("panel"),
      icono: "🏠",
    },
    {
      ruta: "/avisos",
      texto: t("notices"),
      icono: "📣",
    },
    {
      ruta: "/incidentes",
      texto: t("incidents"),
      icono: "⚠️",
    },
    {
      ruta: "/emergencia",
      texto: t("emergency"),
      icono: "🚨",
    },
    {
      ruta: "/pagos",
      texto: t("payments"),
      icono: "💳",
    },
    {
      ruta: "/mercado-vecinal",
      texto: t("marketplace"),
      icono: "🛒",
    },
  ];

  if (!esMovil && sidebarHidden) {
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
    <>
      {esMovil && (
        <div className="mobile-navbar">
          <Link
            to={token ? "/panel" : "/"}
            className="mobile-navbar-brand"
          >
            <img
              src={logo}
              alt="Logo de Círculo Privado"
              className="mobile-navbar-logo"
            />

            <span>{t("appName")}</span>
          </Link>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMenuMovilAbierto((abierto) => !abierto)
            }
            aria-label={
              menuMovilAbierto
                ? "Cerrar menú"
                : "Abrir menú"
            }
            aria-expanded={menuMovilAbierto}
          >
            {menuMovilAbierto ? "✕" : "☰"}
          </button>
        </div>
      )}

      {esMovil && menuMovilAbierto && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMenuMovilAbierto(false)}
          aria-label="Cerrar menú"
        />
      )}

      <header
        className={`layout-nav-shell ${
          esMovil && menuMovilAbierto
            ? "mobile-open"
            : ""
        }`}
      >
        <a
          href="#contenido-principal"
          className="visually-hidden-focusable position-absolute top-0 start-0 m-2 p-2 bg-light text-dark rounded"
        >
          {t("skipToContent")}
        </a>

        <aside
          className="sidebar-circulo"
          aria-label="Navegación principal"
        >
          {!esMovil && (
            <div
              className="sidebar-toolbar"
              aria-label="Controles de barra lateral"
            >
              <button
                type="button"
                className="sidebar-tool-btn"
                onClick={() =>
                  setSidebarCollapsed((valor) => !valor)
                }
                title={
                  sidebarCollapsed
                    ? "Hacer barra más ancha"
                    : "Hacer barra compacta"
                }
              >
                {sidebarCollapsed ? "➡" : "⬅"}
              </button>

              <button
                type="button"
                className="sidebar-tool-btn"
                onClick={() => setSidebarHidden(true)}
                title="Ocultar barra lateral"
              >
                ✕
              </button>
            </div>
          )}

          <div className="sidebar-circulo-header">
            <Link
              className="sidebar-brand"
              to={token ? "/panel" : "/"}
              title={t("appName")}
              onClick={cerrarMenuMovil}
            >
              <img
                src={logo}
                alt="Logo de Círculo Privado"
                className="nav-logo"
              />

              <span className="brand-text">
                {t("appName")}
              </span>
            </Link>
          </div>

          <nav
            className="sidebar-menu"
            aria-label="Menú principal"
          >
            {enlacesPrincipales.map((enlace) => (
              <Link
                key={enlace.ruta}
                className={claseNavLink(enlace.ruta)}
                to={enlace.ruta}
                title={enlace.texto}
                onClick={cerrarMenuMovil}
              >
                <span
                  className="nav-icon"
                  aria-hidden="true"
                >
                  {enlace.icono}
                </span>

                <span className="nav-label">
                  {enlace.texto}
                </span>
              </Link>
            ))}

            {token && (
              <Link
                className={claseNavLink("/mi-perfil")}
                to="/mi-perfil"
                title={t("profile")}
                onClick={cerrarMenuMovil}
              >
                <span
                  className="nav-icon"
                  aria-hidden="true"
                >
                  👤
                </span>

                <span className="nav-label">
                  {t("profile")}
                </span>
              </Link>
            )}
          </nav>

          <div className="sidebar-actions">
            {token && (
              <Link
                className={`btn btn-nav-pill sidebar-action-link ${
                  esRutaActiva("/asistente")
                    ? "btn-nav-pill-active"
                    : ""
                }`}
                to="/asistente"
                title={t("aiAssistant")}
                onClick={cerrarMenuMovil}
              >
                <span aria-hidden="true">🤖</span>

                <span className="nav-label">
                  {t("aiAssistant")}
                </span>
              </Link>
            )}

            <AccessibilityMenu />
          </div>

          <div className="sidebar-session">
            {!token ? (
              <Link
                className="btn btn-nav-pill sidebar-action-link"
                to="/iniciar-sesion"
                title={t("login")}
                onClick={cerrarMenuMovil}
              >
                <span aria-hidden="true">🔐</span>

                <span className="nav-label">
                  {t("login")}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-nav-pill sidebar-action-link"
                onClick={cerrarSesion}
                title={t("logout")}
              >
                <span aria-hidden="true">↪</span>

                <span className="nav-label">
                  {t("logout")}
                </span>
              </button>
            )}
          </div>

          {!esMovil && !sidebarCollapsed && (
            <div
              className="sidebar-resize-handle"
              onMouseDown={() => {
                resizingRef.current = true;

                document.body.classList.add(
                  "sidebar-resizing"
                );
              }}
              role="separator"
              aria-orientation="vertical"
              aria-label="Arrastrar para cambiar ancho de la barra lateral"
              title="Arrastra para cambiar el ancho"
            />
          )}
        </aside>
      </header>
    </>
  );
}