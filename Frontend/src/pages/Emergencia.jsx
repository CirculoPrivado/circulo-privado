import { useEffect, useMemo, useState } from "react";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { crearAlertaEmergencia, obtenerAlertasEmergencia, crearCanalEmergencias, actualizarEstadoAlertaEmergencia } from "../services/emergenciaService";

const estadoClase = (estado = "") => {
  const e = String(estado).toLowerCase();
  if (e.includes("atendida")) return "success";
  if (e.includes("atención")) return "warning";
  return "blue";
};

export default function Emergencia() {
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [cargando, setCargando] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [actualizandoId, setActualizandoId] = useState(null);

  const cargarAlertas = async () => {
    try { setAlertas(await obtenerAlertasEmergencia()); }
    catch (error) { console.error("No se pudieron cargar las alertas:", error); }
  };

  useEffect(() => {
    cargarAlertas();
    const canal = crearCanalEmergencias((nuevaAlerta) => setAlertas((previas) => [nuevaAlerta, ...previas]), () => console.error("Se perdió la conexión del stream"));
    return () => canal.close();
  }, []);

  const activarAlerta = () => {
    if (!window.confirm("¿Confirmas que deseas activar una alerta de emergencia real?")) return;
    if (!navigator.geolocation) { setTipoMensaje("danger"); setMensaje("Tu navegador no permite obtener la ubicación."); return; }
    setCargando(true);
    navigator.geolocation.getCurrentPosition(async (posicion) => {
      try {
        const respuesta = await crearAlertaEmergencia({ latitude: posicion.coords.latitude, longitude: posicion.coords.longitude });
        setTipoMensaje("success"); setMensaje(respuesta.message || "Alerta de emergencia enviada correctamente");
        await cargarAlertas();
      } catch (error) { setTipoMensaje("danger"); setMensaje(error.response?.data?.message || "No se pudo registrar la alerta"); }
      finally { setCargando(false); }
    }, () => { setTipoMensaje("danger"); setMensaje("No se pudo obtener tu ubicación."); setCargando(false); });
  };



  const cambiarEstadoAlerta = async (alerta, estado) => {
    try {
      setActualizandoId(alerta.id);
      const respuesta = await actualizarEstadoAlertaEmergencia(alerta.id, estado, `Cambio realizado desde panel de emergencias`);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Estado de alerta actualizado correctamente");
      await cargarAlertas();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo actualizar la alerta");
    } finally {
      setActualizandoId(null);
    }
  };

  const siguienteEstadoAlerta = (estado = "") => {
    const e = String(estado).toLowerCase();
    if (e.includes("enviada")) return "en atención";
    if (e.includes("atención")) return "atendida";
    return "en atención";
  };

  const ultimaAlerta = useMemo(() => alertas[0], [alertas]);

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main emergency-page">
        <section className="container-fluid app-page-shell">
          <div className="page-heading"><h1 className="page-title text-danger">Emergencia</h1><p className="subtitulo mb-0">Gestiona y responde a alertas en tiempo real para mantener segura a tu comunidad.</p></div>
          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-xl-8">
              <section className="emergency-hero-card h-100"><div className="emergency-icon-big">🚨</div><div><span className="status-badge danger mb-3">⚠ Atención inmediata</span><h2>Actúa ante una emergencia real</h2><p>Al activar la alerta, el sistema registrará tu ubicación y notificará al personal de seguridad y a los administradores para una respuesta inmediata.</p><button className="btn btn-danger btn-lg boton-emergencia" onClick={activarAlerta} disabled={cargando}>{cargando ? "Enviando alerta..." : "🚨 Activar alerta de emergencia"}</button><small className="d-block mt-3 text-muted">🔒 Solo úsalo en situaciones reales que requieran asistencia urgente.</small></div></section>
            </div>
            <div className="col-xl-4">
              <aside className="tarjeta-suave p-4 h-100"><h2 className="section-title">Estado de alerta</h2><div className="alert-status-box"><span>🛡️</span><div><strong>{ultimaAlerta ? "Alerta registrada" : "Sin alertas activas"}</strong><small>{ultimaAlerta ? "Revisa el seguimiento en la tabla inferior." : "Todo en calma. No hay emergencias activas."}</small></div></div><div className="info-rows mt-3"><div><span>Mi última alerta</span><strong>{ultimaAlerta?.id || "—"}</strong></div><div><span>Estado</span><strong>{ultimaAlerta?.status || "—"}</strong></div><div><span>Fecha</span><strong>{ultimaAlerta?.created_at ? new Date(ultimaAlerta.created_at).toLocaleString() : "—"}</strong></div></div></aside>
            </div>
          </div>
          {mensaje && <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">{mensaje}</div>}
          <section className="tarjeta-suave p-4"><div className="d-flex justify-content-between align-items-center mb-3"><div><h2 className="section-title mb-1">Alertas en tiempo real</h2><p className="subtitulo mb-0">Monitorea las alertas recientes y su estado de atención.</p></div><button type="button" className="btn btn-outline-primary boton-redondo" onClick={cargarAlertas}>↻ Actualizar</button></div>{alertas.length === 0 ? <div className="empty-state">🛡️ <strong>No hay alertas registradas.</strong><span>Cuando se active una emergencia aparecerá aquí.</span></div> : <div className="table-responsive"><table className="table align-middle modern-table"><thead><tr><th>ID</th><th>Usuario</th><th>Ubicación</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>{alertas.map((alerta) => (<tr key={alerta.id}><td>{alerta.id}</td><td>{alerta.usuario}</td><td>📍 {alerta.latitude}, {alerta.longitude}</td><td><span className={`status-badge ${estadoClase(alerta.status)}`}>{alerta.status}</span></td><td>{alerta.created_at ? new Date(alerta.created_at).toLocaleString() : "Sin fecha"}</td><td><div className="d-flex gap-2 flex-wrap"><a className="btn btn-sm btn-outline-primary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${alerta.latitude},${alerta.longitude}`}>Ver mapa</a><button className="btn btn-sm btn-outline-success" type="button" disabled={actualizandoId === alerta.id || String(alerta.status).toLowerCase().includes("atendida")} onClick={() => cambiarEstadoAlerta(alerta, siguienteEstadoAlerta(alerta.status))}>{actualizandoId === alerta.id ? "Actualizando..." : String(alerta.status).toLowerCase().includes("atendida") ? "Atendida" : "Atender"}</button></div></td></tr>))}</tbody></table></div>}</section>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
