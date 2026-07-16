import { useEffect, useMemo, useState } from "react";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { obtenerAvisos, crearAviso, actualizarAviso, fijarAviso, eliminarAviso } from "../services/avisosService";

const formularioVacio = { title: "", content: "", categoria: "Mantenimiento", prioridad: "normal" };
const etiquetaPrioridad = (prioridad = "normal") => prioridad === "alta" ? "Importante" : prioridad === "baja" ? "Baja" : "Normal";

export default function Avisos() {
  const usuarioGuardado = localStorage.getItem("user");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const rol = usuario?.role || "";
  const puedeGestionar = rol === "admin" || rol === "committee";

  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [formulario, setFormulario] = useState(formularioVacio);
  const [avisoEditando, setAvisoEditando] = useState(null);

  const mostrarMensaje = (tipo, texto) => { setTipoMensaje(tipo); setMensaje(texto); };

  const cargarAvisos = async () => {
    try {
      setCargando(true);
      setAvisos(await obtenerAvisos());
    } catch (error) {
      mostrarMensaje("danger", error.response?.data?.message || "No se pudieron cargar los avisos");
    } finally { setCargando(false); }
  };

  useEffect(() => { cargarAvisos(); }, []);

  const cambiarValor = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const cancelarEdicion = () => { setAvisoEditando(null); setFormulario(formularioVacio); };

  const iniciarEdicion = (aviso) => {
    setAvisoEditando(aviso);
    setFormulario({
      title: aviso.title || "",
      content: aviso.content || "",
      categoria: aviso.categoria || "Aviso",
      prioridad: aviso.prioridad || "normal",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarAviso = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      const respuesta = avisoEditando
        ? await actualizarAviso(avisoEditando.id, formulario)
        : await crearAviso(formulario);
      mostrarMensaje("success", respuesta.message || (avisoEditando ? "Aviso actualizado" : "Aviso publicado"));
      cancelarEdicion();
      await cargarAvisos();
    } catch (error) {
      mostrarMensaje("danger", error.response?.data?.message || "No se pudo guardar el aviso");
    } finally { setGuardando(false); }
  };

  const cambiarFijado = async (aviso) => {
    try {
      const respuesta = await fijarAviso(aviso.id, !aviso.fijado);
      mostrarMensaje("success", respuesta.message || "Aviso actualizado");
      await cargarAvisos();
    } catch (error) { mostrarMensaje("danger", error.response?.data?.message || "No se pudo fijar el aviso"); }
  };

  const borrarAviso = async (aviso) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el aviso "${aviso.title}"?`)) return;
    try {
      const respuesta = await eliminarAviso(aviso.id);
      mostrarMensaje("success", respuesta.message || "Aviso eliminado");
      if (avisoEditando?.id === aviso.id) cancelarEdicion();
      await cargarAvisos();
    } catch (error) { mostrarMensaje("danger", error.response?.data?.message || "No se pudo eliminar el aviso"); }
  };

  const avisosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return avisos.filter((aviso) => {
      const contenido = `${aviso.title || ""} ${aviso.content || ""} ${aviso.autor || ""} ${aviso.categoria || ""}`.toLowerCase();
      const coincideTexto = !texto || contenido.includes(texto);
      const categoria = String(aviso.categoria || "Aviso").toLowerCase();
      const prioridad = String(aviso.prioridad || "normal").toLowerCase();
      const coincideFiltro = filtro === "Todos"
        || (filtro === "Recientes")
        || (filtro === "Importantes" && prioridad === "alta")
        || categoria.includes(filtro.toLowerCase());
      return coincideTexto && coincideFiltro;
    });
  }, [avisos, busqueda, filtro]);

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main">
        <section className="container-fluid app-page-shell">
          <div className="page-heading"><h1 className="page-title">Avisos comunitarios</h1><p className="subtitulo mb-0">Publica y consulta los comunicados para la comunidad.</p></div>
          {mensaje && <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">{mensaje}</div>}

          {puedeGestionar && (
            <div className="row g-4 mb-4">
              <div className="col-xl-8">
                <div className="tarjeta-suave p-4 h-100">
                  <h2 className="section-title"><span className="soft-icon">📣</span> {avisoEditando ? "Editar aviso" : "Publicar nuevo aviso"}</h2>
                  <form onSubmit={guardarAviso}>
                    <div className="row g-3">
                      <div className="col-md-5"><label className="form-label fw-semibold">Título</label><input className="form-control form-control-lg" name="title" value={formulario.title} onChange={cambiarValor} placeholder="Ej. Suspensión temporal de acceso" required /></div>
                      <div className="col-md-4"><label className="form-label fw-semibold">Categoría</label><select className="form-select form-select-lg" name="categoria" value={formulario.categoria} onChange={cambiarValor}><option>Mantenimiento</option><option>Seguridad</option><option>Evento</option><option>Aviso</option></select></div>
                      <div className="col-md-3"><label className="form-label fw-semibold">Prioridad</label><select className="form-select form-select-lg" name="prioridad" value={formulario.prioridad} onChange={cambiarValor}><option value="baja">Baja</option><option value="normal">Normal</option><option value="alta">Alta</option></select></div>
                      <div className="col-12"><label className="form-label fw-semibold">Contenido</label><textarea className="form-control" name="content" rows="4" value={formulario.content} onChange={cambiarValor} placeholder="Escribe el aviso para la comunidad..." required /></div>
                      <div className="col-12 d-flex justify-content-end gap-2">{avisoEditando && <button type="button" className="btn btn-outline-secondary boton-redondo" onClick={cancelarEdicion}>Cancelar</button>}<button className="btn btn-primary btn-lg boton-redondo" disabled={guardando}>{guardando ? "Guardando..." : avisoEditando ? "Guardar cambios" : "✈️ Publicar aviso"}</button></div>
                    </div>
                  </form>
                </div>
              </div>
              <div className="col-xl-4"><aside className="tarjeta-suave p-4 aviso-tips h-100"><h2 className="h5 fw-bold mb-3">Consejos para un buen aviso</h2><ul><li>Usa un título claro y conciso.</li><li>Selecciona la categoría y prioridad adecuadas.</li><li>Incluye fecha, hora y alcance.</li><li>Revisa el aviso antes de publicarlo.</li></ul><div className="tips-illustration">📣</div></aside></div>
            </div>
          )}

          <div className="filter-bar mb-4"><div className="search-box"><span>🔎</span><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar avisos..." /></div><div className="chip-group">{["Todos", "Importantes", "Mantenimiento", "Seguridad", "Evento", "Recientes"].map((item) => <button key={item} className={`filter-chip ${filtro === item ? "active" : ""}`} onClick={() => setFiltro(item)} type="button">{item}</button>)}</div></div>

          {cargando && <div className="alert alert-info">Cargando avisos...</div>}
          {!cargando && avisosFiltrados.length === 0 && <div className="empty-state">📭 <strong>No hay avisos para mostrar.</strong><span>Cuando se publiquen comunicados aparecerán aquí.</span></div>}

          <div className="row g-4">
            {avisosFiltrados.map((aviso) => {
              const importante = String(aviso.prioridad || "normal") === "alta";
              const categoria = aviso.categoria || "Aviso";
              return (
                <div className="col-md-6 col-xl-4" key={aviso.id}>
                  <article className="notice-card h-100">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3"><div className="d-flex flex-wrap gap-2"><span className={`status-badge ${importante ? "danger" : "blue"}`}>{etiquetaPrioridad(aviso.prioridad)}</span><span className="status-badge success">{categoria}</span>{Boolean(aviso.fijado) && <span className="status-badge warning">📌 Fijado</span>}</div><button className="btn-icon" type="button" onClick={() => puedeGestionar && iniciarEdicion(aviso)}>⋮</button></div>
                    <h2 className="h5 fw-bold">{aviso.title}</h2>
                    <p className="notice-meta">• {aviso.created_at ? new Date(aviso.created_at).toLocaleDateString() : "Reciente"} • Por {aviso.autor || "Admin"}</p>
                    <p className="notice-preview">{aviso.content}</p>
                    {puedeGestionar && <div className="notice-actions"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => iniciarEdicion(aviso)}>✎ Editar</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => borrarAviso(aviso)}>🗑 Eliminar</button><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => cambiarFijado(aviso)}>{aviso.fijado ? "Quitar fijado" : "📌 Fijar"}</button></div>}
                  </article>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
