import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { obtenerIncidentes, actualizarEstadoIncidente } from "../services/incidentesService";

const normalizarEstado = (estado = "") => String(estado).toLowerCase();
const estadoClase = (estado = "") => {
  const e = normalizarEstado(estado);
  if (e.includes("resuelto")) return "success";
  if (e.includes("proceso")) return "blue";
  if (e.includes("rechaz")) return "danger";
  return "warning";
};

export default function Incidentes() {
  const usuarioGuardado = localStorage.getItem("user");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const puedeGestionar = ["admin", "committee", "security"].includes(usuario?.role);
  const [incidentes, setIncidentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [mensajeTipo, setMensajeTipo] = useState("danger");
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    const cargarIncidentes = async () => {
      try { setIncidentes(await obtenerIncidentes()); }
      catch (error) { setMensajeTipo("danger"); setMensaje(error.response?.data?.message || "No se pudieron cargar los incidentes"); }
      finally { setCargando(false); }
    };
    cargarIncidentes();
  }, []);

  const conteos = useMemo(() => ({
    todos: incidentes.length,
    pendientes: incidentes.filter((i) => normalizarEstado(i.status).includes("pend")).length,
    proceso: incidentes.filter((i) => normalizarEstado(i.status).includes("proceso")).length,
    resueltos: incidentes.filter((i) => normalizarEstado(i.status).includes("resuelto")).length,
  }), [incidentes]);



  const recargarIncidentes = async () => {
    setIncidentes(await obtenerIncidentes());
  };

  const cambiarEstado = async (incidente, estado) => {
    try {
      setActualizandoId(incidente.id);
      const respuesta = await actualizarEstadoIncidente(incidente.id, estado, `Cambio realizado desde panel de incidentes`);
      setMensajeTipo("success");
      setMensaje(respuesta.message || "Estado actualizado correctamente");
      await recargarIncidentes();
    } catch (error) {
      setMensajeTipo("danger");
      setMensaje(error.response?.data?.message || "No se pudo actualizar el estado");
    } finally {
      setActualizandoId(null);
    }
  };

  const siguienteEstado = (estado = "") => {
    const e = normalizarEstado(estado);
    if (e.includes("pend")) return "En proceso";
    if (e.includes("proceso")) return "Resuelto";
    return "Pendiente";
  };

  const incidentesFiltrados = useMemo(() => {
    const txt = busqueda.toLowerCase();
    return incidentes.filter((i) => {
      const texto = `${i.title || ""} ${i.location_text || ""} ${i.usuario || ""} ${i.category || ""}`.toLowerCase();
      const coincideTexto = !txt || texto.includes(txt);
      const estado = normalizarEstado(i.status);
      const coincideEstado = estadoFiltro === "Todos" || (estadoFiltro === "Pendientes" && estado.includes("pend")) || (estadoFiltro === "En proceso" && estado.includes("proceso")) || (estadoFiltro === "Resueltos" && estado.includes("resuelto"));
      const coincideCategoria = categoriaFiltro === "Todas" || String(i.category || "").toLowerCase().includes(categoriaFiltro.toLowerCase());
      return coincideTexto && coincideEstado && coincideCategoria;
    });
  }, [incidentes, busqueda, estadoFiltro, categoriaFiltro]);

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main">
        <section className="container-fluid app-page-shell">
          <div className="page-heading d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div><h1 className="page-title mb-2">Incidentes</h1><p className="subtitulo mb-0">Consulta y gestiona los reportes de incidentes de la comunidad.</p></div>
            <Link to="/reportar-incidente" className="btn btn-primary btn-lg boton-redondo">+ Nuevo incidente</Link>
          </div>

          <div className="summary-strip mb-3">
            <div><span className="summary-icon blue">📄</span><small>Todos</small><strong>{conteos.todos}</strong><em>incidentes</em></div>
            <div><span className="summary-icon warning">⏱</span><small>Pendientes</small><strong>{conteos.pendientes}</strong><em>incidentes</em></div>
            <div><span className="summary-icon blue">🔄</span><small>En proceso</small><strong>{conteos.proceso}</strong><em>incidentes</em></div>
            <div><span className="summary-icon success">✓</span><small>Resueltos</small><strong>{conteos.resueltos}</strong><em>incidentes</em></div>
          </div>

          <div className="filter-bar mb-4">
            <div className="search-box"><span>🔎</span><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar incidentes..." /></div>
            <div className="chip-group"><span className="filter-label">Estado:</span>{["Todos", "Pendientes", "En proceso", "Resueltos"].map((e) => <button type="button" key={e} onClick={() => setEstadoFiltro(e)} className={`filter-chip ${estadoFiltro === e ? "active" : ""}`}>{e}</button>)}</div>
            <div className="chip-group"><span className="filter-label">Categoría:</span>{["Todas", "Mantenimiento", "Ruido", "Seguridad"].map((c) => <button type="button" key={c} onClick={() => setCategoriaFiltro(c)} className={`filter-chip ${categoriaFiltro === c ? "active" : ""}`}>{c}</button>)}</div>
          </div>

          {cargando && <div className="alert alert-info">Cargando incidentes...</div>}
          {mensaje && <div className={`alert alert-${mensajeTipo}`}>{mensaje}</div>}
          {!cargando && !mensaje && incidentesFiltrados.length === 0 && <div className="empty-state">⚠️ <strong>No hay incidentes con esos filtros.</strong><span>Prueba cambiando el estado o la categoría.</span></div>}

          <div className="row g-4">
            {incidentesFiltrados.map((incidente) => (
              <div className="col-md-6 col-xl-4" key={incidente.id}>
                <article className="incident-card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3"><span className="status-badge blue">{incidente.category || "General"}</span><span className={`status-badge ${estadoClase(incidente.status)}`}>{incidente.status || "Pendiente"}</span></div>
                  <h2 className="h5 fw-bold">{incidente.title}</h2>
                  <ul className="data-list">
                    <li><span>📍</span><strong>Ubicación:</strong> {incidente.location_text || "Sin ubicación"}</li>
                    <li><span>👤</span><strong>Reportó:</strong> {incidente.usuario || "Usuario"}</li>
                    <li><span>📅</span><strong>Fecha:</strong> {incidente.created_at ? new Date(incidente.created_at).toLocaleString() : "Reciente"}</li>
                  </ul>
                  {incidente.description && <p className="subtitulo small mb-3">{incidente.description}</p>}
                  <div className="card-actions"><Link to={`/incidentes/${incidente.id}`} className="btn btn-outline-primary boton-redondo">Ver detalle</Link>{puedeGestionar && <button type="button" className="btn btn-link" disabled={actualizandoId === incidente.id} onClick={() => cambiarEstado(incidente, siguienteEstado(incidente.status))}>{actualizandoId === incidente.id ? "Actualizando..." : `Cambiar a ${siguienteEstado(incidente.status)}`}</button>}<button type="button" className="btn-icon" onClick={() => puedeGestionar && cambiarEstado(incidente, "En proceso")}>⋮</button></div>
                </article>
              </div>
            ))}
          </div>
          {!cargando && incidentesFiltrados.length > 0 && <p className="subtitulo mt-4">Mostrando 1–{incidentesFiltrados.length} de {incidentes.length} incidentes</p>}
        </section>
      </main>
      <PiePagina />
    </>
  );
}
