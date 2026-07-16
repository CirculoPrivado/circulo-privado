import { useEffect, useMemo, useState } from "react";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import PayPalButton from "../components/PayPalButton";
import MercadoPagoButton from "../components/MercadoPagoButton";
import { obtenerPagos, crearPago, marcarPagoComoPagado } from "../services/pagosService";
import { descargarComprobantePagoPDF } from "../utils/comprobantePagoPdf";

const estadoPagoClase = (estado = "") => String(estado).toLowerCase() === "pagado" ? "success" : String(estado).toLowerCase().includes("vencido") ? "danger" : "warning";

export default function Pagos() {
  const usuarioGuardado = localStorage.getItem("user");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const rol = usuario?.role || "";
  const puedeCrear = rol === "committee" || rol === "admin";

  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [filtro, setFiltro] = useState("Pendientes");
  const [busqueda, setBusqueda] = useState("");

  const [formulario, setFormulario] = useState({ usuario_id: "", concepto: "", monto: "", fecha_vencimiento: "", estado: "pendiente" });
  const [actualizandoId, setActualizandoId] = useState(null);

  const cargarPagos = async () => {
    try { setPagos(await obtenerPagos()); }
    catch (error) { setTipoMensaje("danger"); setMensaje(error.response?.data?.message || "No se pudieron cargar los pagos"); }
    finally { setCargando(false); }
  };
  useEffect(() => { cargarPagos(); }, []);
  const cambiarValor = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

  const registrarPago = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await crearPago(formulario);
      setTipoMensaje("success"); setMensaje(respuesta.message || "Pago registrado correctamente");
      setFormulario({ usuario_id: "", concepto: "", monto: "", fecha_vencimiento: "", estado: "pendiente" });
      await cargarPagos();
    } catch (error) { setTipoMensaje("danger"); setMensaje(error.response?.data?.message || "No se pudo registrar el pago"); }
  };

  const mostrarErrorPasarela = (error) => { setTipoMensaje("danger"); setMensaje(error.response?.data?.message || "No se pudo iniciar el pago"); };

  const marcarPagado = async (pago) => {
    if (!window.confirm(`¿Marcar como pagado el concepto "${pago.concepto}"?`)) return;
    try {
      setActualizandoId(pago.id);
      const respuesta = await marcarPagoComoPagado(pago.id);
      setTipoMensaje("success");
      setMensaje(respuesta.message || "Pago marcado como pagado");
      await cargarPagos();
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo marcar el pago");
    } finally {
      setActualizandoId(null);
    }
  };

  const descargarComprobante = (pago) => {
    try {
      descargarComprobantePagoPDF(pago, usuario);
      setTipoMensaje("success");
      setMensaje("Comprobante PDF generado correctamente.");
    } catch (error) {
      console.error("Error generando comprobante PDF:", error);
      setTipoMensaje("danger");
      setMensaje("No se pudo generar el comprobante PDF.");
    }
  };


  const resumen = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const pendientes = pagos.filter((p) => p.estado !== "pagado");
    const pagados = pagos.filter((p) => p.estado === "pagado");
    const vencidos = pendientes.filter((p) => p.fecha_vencimiento && new Date(p.fecha_vencimiento) < hoy);
    const totalPendiente = pendientes.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const totalPagado = pagados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const totalVencido = vencidos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    return { pendientes: pendientes.length, pagados: pagados.length, vencidos: vencidos.length, totalPendiente, totalPagado, totalVencido };
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    const txt = busqueda.toLowerCase();
    return pagos.filter((p) => {
      const contenido = `${p.concepto || ""} ${p.usuario || ""} ${p.proveedor_pago || ""}`.toLowerCase();
      const coincideTexto = !txt || contenido.includes(txt);
      const estado = String(p.estado || "").toLowerCase();
      const coincideFiltro = filtro === "Todos" || (filtro === "Pendientes" && estado !== "pagado") || (filtro === "Pagados" && estado === "pagado") || (filtro === "Vencidos" && estado.includes("venc"));
      return coincideTexto && coincideFiltro;
    });
  }, [pagos, busqueda, filtro]);

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal" className="app-main">
        <section className="container-fluid app-page-shell">
          <div className="page-heading"><h1 className="page-title">Pagos</h1><p className="subtitulo mb-0">Administra los pagos de la comunidad de forma fácil y segura.</p></div>
          {mensaje && <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">{mensaje}</div>}

          <div className="summary-strip mb-4">
            <div><span className="summary-icon blue">💳</span><small>Pagos pendientes</small><strong>{resumen.pendientes}</strong><em>${resumen.totalPendiente.toFixed(2)}</em></div>
            <div><span className="summary-icon danger">🔔</span><small>Pagos vencidos</small><strong>{resumen.vencidos}</strong><em>${resumen.totalVencido.toFixed(2)}</em></div>
            <div><span className="summary-icon success">💲</span><small>Recaudado del mes</small><strong>${resumen.totalPagado.toFixed(2)}</strong><em>Meta mensual activa</em></div>
            <div><span className="summary-icon blue">📅</span><small>Pagos del mes</small><strong>{pagos.length}</strong><em>Total registros</em></div>
          </div>

          {puedeCrear && <div className="tarjeta-suave p-4 mb-4"><h2 className="section-title mb-1">Registrar pago</h2><p className="subtitulo">Completa la información para registrar un nuevo pago.</p><form onSubmit={registrarPago}><div className="row g-3 align-items-end"><div className="col-md-2"><label className="form-label fw-semibold">Usuario</label><input type="number" className="form-control form-control-lg" name="usuario_id" value={formulario.usuario_id} onChange={cambiarValor} placeholder="Escribe el ID del usuario" required /></div><div className="col-md-3"><label className="form-label fw-semibold">Concepto</label><input type="text" className="form-control form-control-lg" name="concepto" value={formulario.concepto} onChange={cambiarValor} placeholder="Pago de mantenimiento" required /></div><div className="col-md-2"><label className="form-label fw-semibold">Monto</label><input type="number" step="0.01" className="form-control form-control-lg" name="monto" value={formulario.monto} onChange={cambiarValor} placeholder="0.00" required /></div><div className="col-md-2"><label className="form-label fw-semibold">Vencimiento</label><input type="date" className="form-control form-control-lg" name="fecha_vencimiento" value={formulario.fecha_vencimiento} onChange={cambiarValor} required /></div><div className="col-md-2"><label className="form-label fw-semibold">Estado</label><select className="form-select form-select-lg" name="estado" value={formulario.estado} onChange={cambiarValor}><option value="pendiente">Pendiente</option><option value="pagado">Pagado</option></select></div><div className="col-md-1"><button className="btn btn-primary boton-redondo w-100">Guardar</button></div></div></form></div>}

          <div className="filter-bar mb-4"><div className="chip-group">{["Pendientes", "Pagados", "Vencidos", "Todos"].map((tab) => <button key={tab} type="button" className={`filter-chip ${filtro === tab ? "active" : ""}`} onClick={() => setFiltro(tab)}>{tab}</button>)}</div><div className="search-box ms-auto"><span>🔎</span><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar pagos..." /></div></div>

          {cargando && <div className="alert alert-info">Cargando pagos...</div>}
          {!cargando && pagosFiltrados.length === 0 && <div className="empty-state">💳 <strong>No hay pagos para mostrar.</strong><span>Cuando se registren pagos aparecerán aquí.</span></div>}
          <div className="tarjeta-suave p-3">
            <div className="table-responsive"><table className="table align-middle modern-table payments-table"><thead><tr><th>Concepto</th><th>Monto</th><th>Vencimiento</th><th>Usuario</th><th>Proveedor</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{pagosFiltrados.map((pago) => (<tr key={pago.id}><td><div className="table-title"><span className="table-icon">{pago.concepto?.toLowerCase().includes("mercado") ? "🛒" : "💧"}</span><div><strong>{pago.concepto}</strong><small>Registro de pago comunitario</small></div></div></td><td><strong>${pago.monto}</strong></td><td>{pago.fecha_vencimiento}</td><td>{pago.usuario || pago.usuario_id}</td><td className="text-capitalize">{pago.proveedor_pago || "Administración"}</td><td><span className={`status-badge ${estadoPagoClase(pago.estado)}`}>{pago.estado}</span></td><td><div className="d-flex gap-2 flex-wrap"><button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setMensaje(`Detalle: ${pago.concepto} por $${Number(pago.monto || 0).toFixed(2)}`)}>Ver detalle</button>{pago.estado !== "pagado" && <button type="button" className="btn btn-sm btn-outline-success" disabled={actualizandoId === pago.id} onClick={() => marcarPagado(pago)}>{actualizandoId === pago.id ? "Marcando..." : "Marcar pagado"}</button>}{pago.estado !== "pagado" && <><MercadoPagoButton pagoId={pago.id} onError={mostrarErrorPasarela} /><PayPalButton pagoId={pago.id} onSuccess={async () => { setTipoMensaje("success"); setMensaje("Pago realizado correctamente con PayPal"); await cargarPagos(); }} onError={mostrarErrorPasarela} /></>}<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => descargarComprobante(pago)}>Descargar PDF</button></div></td></tr>))}</tbody></table></div>
          </div>
          {!cargando && <p className="subtitulo mt-3">Mostrando {pagosFiltrados.length} de {pagos.length} pagos</p>}
        </section>
      </main>
      <PiePagina />
    </>
  );
}
