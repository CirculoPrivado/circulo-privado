import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import BotonEmergencia from "../components/BotonEmergencia";
import { useAccessibility } from "../context/AccessibilityContext";
import { obtenerResumenComunidad } from "../services/comunidadService";
import comunidadCard from "../assets/comunidad-card.png";

export default function PanelPrincipal() {
  const usuarioGuardado = localStorage.getItem("user");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const { t, getRoleLabel } = useAccessibility();

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [cargandoResumen, setCargandoResumen] = useState(true);

  const name = usuario?.name || "Usuario";
  const rol = usuario?.role || "resident";
  const nombreRol = getRoleLabel(rol);

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        const resumen = await obtenerResumenComunidad();
        setTotalUsuarios(Number(resumen?.totalUsuarios || 0));
      } catch (error) {
        console.error("Error al cargar resumen de la comunidad:", error);
        setTotalUsuarios(0);
      } finally {
        setCargandoResumen(false);
      }
    };
    cargarResumen();
  }, []);

  const accionesPorRol = useMemo(() => {
    const acciones = {
      resident: [
        { to: "/reportar-incidente", icon: "⚠️", title: "Reportar incidente", text: "Avisar un problema" },
        { to: "/pagos", icon: "💳", title: "Ver mis pagos", text: "Consultar pendientes" },
        { to: "/mercado-vecinal", icon: "🛒", title: "Mercado vecinal", text: "Comprar o vender" },
        { to: "/emergencia", icon: "🚨", title: "Emergencia", text: "Pedir apoyo rápido" },
      ],
      committee: [
        { to: "/avisos", icon: "📣", title: "Publicar aviso", text: "Comunicar novedades" },
        { to: "/incidentes", icon: "🛠️", title: "Revisar reportes", text: "Dar seguimiento" },
        { to: "/pagos", icon: "💳", title: "Registrar pagos", text: "Control comunitario" },
        { to: "/mercado-vecinal", icon: "🛒", title: "Revisar mercado", text: "Actividad vecinal" },
      ],
      security: [
        { to: "/emergencia", icon: "🚨", title: "Ver alertas", text: "Atención inmediata" },
        { to: "/incidentes", icon: "⚠️", title: "Atender incidentes", text: "Resolver reportes" },
        { to: "/avisos", icon: "📣", title: "Avisos", text: "Mantenerse informado" },
        { to: "/mi-perfil", icon: "👤", title: "Mi perfil", text: "Actualizar datos" },
      ],
      admin: [
        { to: "/admin/usuarios", icon: "👥", title: "Administrar usuarios", text: "Altas, bajas y roles" },
        { to: "/avisos", icon: "📣", title: "Publicar aviso", text: "Comunicación oficial" },
        { to: "/pagos", icon: "💳", title: "Revisar pagos", text: "Estado financiero" },
        { to: "/emergencia", icon: "🚨", title: "Ver alertas", text: "Monitoreo activo" },
      ],
    };
    return acciones[rol] || acciones.resident;
  }, [rol]);

  const kpis = [
    { to: "/incidentes", icon: "📄", label: t("openIncidents"), value: "12", helper: "Reportes pendientes de atención", tone: "blue" },
    { to: "/emergencia", icon: "🔔", label: t("activeAlerts"), value: "3", helper: "Requieren seguimiento", tone: "red" },
    { to: "/pagos", icon: "💲", label: t("monthlyPayments"), value: "84%", helper: "Meta mensual: 100%", tone: "green" },
    { to: "/avisos", icon: "📣", label: t("recentNotices"), value: "6", helper: "Publicados esta semana", tone: "blue" },
  ];

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main panel-principal-main dashboard-redesign">
        <section className="container-fluid app-page-shell">
          <div className="page-header-card mb-4">
            <div>
              <h1 className="page-title mb-2">¡Bienvenido, {name}!</h1>
              <div className="role-line"><span>🛡️</span> Rol actual: <strong>{nombreRol}</strong></div>
            </div>
            <Link to="/mi-perfil" className="profile-chip"><span className="profile-avatar">{name[0]}</span><span>Mi perfil</span></Link>
          </div>

          <div className="kpi-grid mb-4">
            {kpis.map((kpi) => (
              <Link to={kpi.to} className="kpi-card" key={kpi.label}>
                <span className={`kpi-icon kpi-${kpi.tone}`}>{kpi.icon}</span>
                <span className="kpi-content"><span className="kpi-label">{kpi.label}</span><strong>{kpi.value}</strong><small>{kpi.helper}</small></span>
                <span className="kpi-arrow">›</span>
              </Link>
            ))}
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-xl-7">
              <section className="tarjeta-suave p-4 h-100">
                <h2 className="section-title">Acciones rápidas</h2>
                <p className="subtitulo mb-4">Accede a las funciones más utilizadas según tu rol.</p>
                <div className="quick-grid">
                  {accionesPorRol.map((accion) => (
                    <Link to={accion.to} className="quick-action" key={accion.title}>
                      <span className="quick-icon">{accion.icon}</span>
                      <strong>{accion.title}</strong>
                      <small>{accion.text}</small>
                      <span className="quick-arrow">›</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-xl-5">
              <section className="tarjeta-suave p-4 h-100 comunidad-card-modern">
                <h2 className="section-title">Resumen de comunidad</h2>
                <div className="row g-3 align-items-center">
                  <div className="col-sm-6">
                    <div className="community-stat-main"><span>👥</span><small>Usuarios registrados</small><strong>{cargandoResumen ? "…" : totalUsuarios}</strong></div>
                    <div className="community-mini-stats mt-3">
                      <div><span>🏠</span><small>Familias</small><strong>{cargandoResumen ? "…" : totalUsuarios}</strong></div>
                      <div><span>👨‍👩‍👧‍👦</span><small>Miembros</small><strong>{Math.max(totalUsuarios * 2, totalUsuarios)}</strong></div>
                    </div>
                  </div>
                  <div className="col-sm-6"><img src={comunidadCard} alt="Ilustración de comunidad" className="community-illustration" /></div>
                </div>
              </section>
            </div>

            <div className="col-xl-7">
              <section className="tarjeta-suave p-4">
                <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="section-title mb-0">Pendientes de hoy</h2><Link to="/incidentes" className="btn btn-sm btn-outline-primary boton-redondo">Ver todos</Link></div>
                <div className="activity-list">
                  <Link to="/emergencia"><span className="activity-icon danger">🔔</span><div><strong>3 alertas activas requieren seguimiento</strong><small>Revisa las alertas para mantener segura a la comunidad.</small></div><em>Hace 15 min</em></Link>
                  <Link to="/incidentes"><span className="activity-icon blue">📄</span><div><strong>12 incidentes abiertos</strong><small>Asigna o actualiza el estado de los reportes pendientes.</small></div><em>Hace 32 min</em></Link>
                  <Link to="/pagos"><span className="activity-icon success">💲</span><div><strong>16 pagos pendientes por vencer</strong><small>Revisa los pagos próximos a su fecha límite.</small></div><em>Hace 1 h</em></Link>
                  <Link to="/avisos"><span className="activity-icon blue">📣</span><div><strong>2 avisos programados para hoy</strong><small>Se publicarán automáticamente durante el día.</small></div><em>Hace 2 h</em></Link>
                </div>
              </section>
            </div>

            <div className="col-xl-5">
              <section className="tarjeta-suave p-4">
                <h2 className="section-title">Actividad reciente</h2>
                <div className="activity-list compact">
                  <Link to="/pagos"><span className="activity-icon success">✓</span><div><strong>Pago recibido de {name}</strong><small>Compra en Mercado Vecinal</small></div><em>Hace 25 min</em></Link>
                  <Link to="/avisos"><span className="activity-icon blue">📣</span><div><strong>Aviso publicado: Mantenimiento programado</strong><small>Publicado por Admin</small></div><em>Hace 1 h</em></Link>
                  <Link to="/incidentes"><span className="activity-icon warning">⚠️</span><div><strong>Nuevo incidente: Ruido excesivo en la noche</strong><small>Reportado por Admin</small></div><em>Hace 2 h</em></Link>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-4"><BotonEmergencia /></div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
