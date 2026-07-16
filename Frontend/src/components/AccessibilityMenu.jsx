import { useId, useState, useRef, useEffect } from "react";
import { useAccessibility } from "../context/AccessibilityContext";

export default function AccessibilityMenu() {
  const { preferences, updatePreference, t, savingError } = useAccessibility();

  const menuId = useId();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const opcionesTema = [
    { value: "claro", label: t("light"), icon: "☀️" },
    { value: "oscuro", label: t("dark"), icon: "🌙" },
    { value: "contraste", label: t("contrast"), icon: "◐" },
  ];

  return (
    <div className="accesibilidad-menu" ref={ref}>
      <button
        className="btn btn-nav-pill d-flex align-items-center justify-content-center gap-2"
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        aria-controls={menuId}
      >
        <span aria-hidden="true">♿</span>
        <span>{t("accessibility")}</span>
      </button>

      {abierto && (
        <div id={menuId} className="accesibilidad-dropdown">
          <h2 className="h6 fw-bold mb-3">{t("accessibilityConfig")}</h2>

          <div className="mb-3">
            <label className="form-label fw-semibold">{t("language")}</label>
            <select
              className="form-select"
              value={preferences.idioma}
              onChange={(e) => updatePreference("idioma", e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="mb-3">
            <p className="form-label fw-semibold mb-2">{t("theme")}</p>
            <div className="theme-switcher" role="group" aria-label={t("theme")}>
              {opcionesTema.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  className={`theme-option ${preferences.tema === opcion.value ? "active" : ""}`}
                  onClick={() => updatePreference("tema", opcion.value)}
                >
                  <span aria-hidden="true">{opcion.icon}</span>
                  <span>{opcion.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="form-label fw-semibold">{t("fontSize")}</label>
            <select
              className="form-select"
              value={preferences.font_size}
              onChange={(e) => updatePreference("font_size", e.target.value)}
            >
              <option value="small">{t("small")}</option>
              <option value="medium">{t("medium")}</option>
              <option value="large">{t("large")}</option>
            </select>
          </div>

          {savingError && (
            <div className="alert alert-warning mt-3 mb-0 py-2">
              {savingError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
