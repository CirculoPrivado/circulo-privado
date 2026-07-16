import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { crearPublicacion } from "../services/mercadoService";
import { crearPago, obtenerPagoPorId } from "../services/pagosService";
import MercadoPagoButton from "../components/MercadoPagoButton";
import PayPalButton from "../components/PayPalButton";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api";

function MercadoVecinal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [orden, setOrden] = useState("recientes");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [carrito, setCarrito] = useState([]);
  const [comprando, setComprando] = useState(false);
  const [pagoPendienteId, setPagoPendienteId] = useState(null);
  const [mostrarOpcionesPago, setMostrarOpcionesPago] = useState(false);
  const [compraFinalizada, setCompraFinalizada] = useState(false);

  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
    precio: "",
    categoria: "Venta",
    stock: 1,
  });
  const [imagen, setImagen] = useState(null);
  const [publicando, setPublicando] = useState(false);

  const obtenerProductos = async () => {
    try {
      const res = await axios.get(
  `${API_URL}/mercado`
);
      setProductos(res.data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudieron cargar los productos");
    }
  };

  useEffect(() => {
    obtenerProductos();
  }, []);

  useEffect(() => {
    const carritoGuardado = localStorage.getItem("carritoMercado") || localStorage.getItem("carritoPendiente");

    if (!carritoGuardado) {
      return;
    }

    try {
      const carritoParseado = JSON.parse(carritoGuardado);

      if (Array.isArray(carritoParseado) && carritoParseado.length > 0) {
        setCarrito(carritoParseado);
      }
    } catch (error) {
      console.error("Error al recuperar carritoPendiente:", error);
    }
  }, []);

  useEffect(() => {
    const pagoIdParam = searchParams.get("external_reference") || searchParams.get("pagoId");
    const status = searchParams.get("status");
    const collectionStatus = searchParams.get("collection_status");
    const estadoRetorno = status || collectionStatus;

    if (!pagoIdParam || compraFinalizada) {
      return;
    }

    if (estadoRetorno && estadoRetorno !== "approved") {
      return;
    }

    const verificarPagoMercadoPago = async () => {
      try {
        const pago = await obtenerPagoPorId(pagoIdParam);

        if (pago?.estado === "pagado") {
          setPagoPendienteId(Number(pagoIdParam));
          await finalizarCompraDespuesDelPago(Number(pagoIdParam));

          const nuevosParams = new URLSearchParams(searchParams);
          nuevosParams.delete("external_reference");
          nuevosParams.delete("pagoId");
          nuevosParams.delete("status");
          nuevosParams.delete("collection_status");
          nuevosParams.delete("payment_id");
          nuevosParams.delete("merchant_order_id");
          nuevosParams.delete("preference_id");
          setSearchParams(nuevosParams, { replace: true });
        }
      } catch (error) {
        console.error("Error verificando pago de Mercado Pago:", error);
      }
    };

    verificarPagoMercadoPago();
  }, [searchParams, setSearchParams, compraFinalizada]);

  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejarImagen = (e) => {
    const archivo = e.target.files[0];
    setImagen(archivo || null);
  };

  const publicarProducto = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Debes iniciar sesión para publicar");
        navigate("/iniciar-sesion");
        return;
      }

      if (!formulario.titulo || !formulario.descripcion || !formulario.categoria) {
        alert("Completa título, descripción y categoría");
        return;
      }

      setPublicando(true);

      const formData = new FormData();
      formData.append("titulo", formulario.titulo);
      formData.append("descripcion", formulario.descripcion);
      formData.append("precio", formulario.precio);
      formData.append("categoria", formulario.categoria);
      formData.append("stock", formulario.stock);

      if (imagen) {
        formData.append("imagen", imagen);
      }

      await crearPublicacion(formData);

      setTipoMensaje("success");
      setMensaje("Publicación creada correctamente");

      setFormulario({
        titulo: "",
        descripcion: "",
        precio: "",
        categoria: "Venta",
        stock: 1,
      });
      setImagen(null);

      await obtenerProductos();
    } catch (error) {
      console.error("Error al crear publicación:", error);
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudo crear la publicación");
    } finally {
      setPublicando(false);
    }
  };

  useEffect(() => {
    if (carrito.length > 0) localStorage.setItem("carritoMercado", JSON.stringify(carrito));
    else localStorage.removeItem("carritoMercado");
  }, [carrito]);

  const productosFiltrados = useMemo(() => productos.filter((producto) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      producto.titulo?.toLowerCase().includes(texto) ||
      producto.descripcion?.toLowerCase().includes(texto);

    const coincideCategoria =
      categoriaFiltro === "Todas" || producto.categoria === categoriaFiltro;

    return coincideBusqueda && coincideCategoria;
  }).sort((a, b) => {
    if (orden === "precio-menor") return Number(a.precio || 0) - Number(b.precio || 0);
    if (orden === "precio-mayor") return Number(b.precio || 0) - Number(a.precio || 0);
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  }), [productos, busqueda, categoriaFiltro, orden]);

  const agregarAlCarrito = (producto) => {
    if (producto.estado_compra !== "disponible" || Number(producto.stock) <= 0) {
      setTipoMensaje("warning");
      setMensaje("Este producto no está disponible");
      return;
    }

    setMostrarOpcionesPago(false);
    setPagoPendienteId(null);
    setCompraFinalizada(false);

    setCarrito((prev) => {
      const existente = prev.find((item) => item.id === producto.id);

      if (existente) {
        const nuevaCantidad = existente.cantidad + 1;

        if (nuevaCantidad > Number(producto.stock)) {
          setTipoMensaje("warning");
          setMensaje("No puedes agregar más unidades que el stock disponible");
          return prev;
        }

        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: nuevaCantidad }
            : item
        );
      }

      return [
        ...prev,
        {
          ...producto,
          cantidad: 1,
        },
      ];
    });
  };

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
    setMostrarOpcionesPago(false);
    setPagoPendienteId(null);
  };

  const cambiarCantidad = (id, cambio) => {
    setMostrarOpcionesPago(false);
    setPagoPendienteId(null);

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const stockDisponible = Number(item.stock) || 0;
        const nuevaCantidad = item.cantidad + cambio;

        if (nuevaCantidad < 1) {
          return item;
        }

        if (nuevaCantidad > stockDisponible) {
          alert("No puedes superar el stock disponible");
          return item;
        }

        return { ...item, cantidad: nuevaCantidad };
      })
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setMostrarOpcionesPago(false);
    setPagoPendienteId(null);
    setCompraFinalizada(false);
    localStorage.removeItem("carritoPendiente");
  };

  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => {
      const precio = Number(item.precio) || 0;
      return acc + precio * item.cantidad;
    }, 0);
  }, [carrito]);

  const cantidadProductos = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }, [carrito]);

  const prepararPago = async () => {
    try {
      if (carrito.length === 0) {
        setTipoMensaje("warning"); setMensaje("Tu carrito está vacío");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró o no has iniciado sesión");
        navigate("/iniciar-sesion");
        return;
      }

      const usuarioGuardado = localStorage.getItem("user");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      if (!usuario?.id) {
        alert("No se encontró el usuario en sesión");
        return;
      }

      setComprando(true);

      const hoy = new Date().toISOString().split("T")[0];

      const respuesta = await crearPago({
        usuario_id: usuario.id,
        concepto: `Compra en Mercado Vecinal (${carrito.length} producto(s))`,
        monto: totalCarrito,
        fecha_vencimiento: hoy,
        estado: "pendiente",
      });

      localStorage.setItem("carritoPendiente", JSON.stringify(carrito));
      setPagoPendienteId(respuesta.id);
      setMostrarOpcionesPago(true);
      setCompraFinalizada(false);
    } catch (error) {
      console.error("Error al preparar pago:", error);
      alert(error.response?.data?.message || "No se pudo preparar el pago");
    } finally {
      setComprando(false);
    }
  };

  const finalizarCompraDespuesDelPago = async (pagoIdOverride = null) => {
    try {
      if (compraFinalizada) {
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Tu sesión expiró o no has iniciado sesión");
        navigate("/iniciar-sesion");
        return;
      }

      const pagoIdFinal = pagoIdOverride || pagoPendienteId;

      if (!pagoIdFinal) {
        alert("No se encontró el pago asociado a esta compra");
        return;
      }

      setComprando(true);

      const carritoActual = carrito.length
        ? carrito
        : JSON.parse(localStorage.getItem("carritoPendiente") || "[]");

      if (!Array.isArray(carritoActual) || carritoActual.length === 0) {
        alert("No se encontró el carrito pendiente para completar la compra");
        return;
      }

      const payload = {
        productos: carritoActual.map((item) => ({
          id: item.id,
          cantidad: item.cantidad,
        })),
        pagoId: pagoIdFinal,
      };

      const res = await axios.post(
        `${API_URL}/compras`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTipoMensaje("success"); setMensaje("Compra realizada correctamente");
      console.log("Compra realizada:", res.data);

      setCompraFinalizada(true);
      setCarrito([]);
      setPagoPendienteId(null);
      setMostrarOpcionesPago(false);
      localStorage.removeItem("carritoPendiente");
      localStorage.removeItem("carritoMercado");
      await obtenerProductos();
    } catch (error) {
      console.error("Error al finalizar compra:", error);
      setTipoMensaje("danger"); setMensaje(error.response?.data?.message || "No se pudo completar la compra");
    } finally {
      setComprando(false);
    }
  };

  return (
    <>
      <BarraNavegacion />

      <main id="contenido-principal" className="app-main marketplace-page">
        <section className="container-fluid app-page-shell">
          <div className="page-heading d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h1 className="page-title mb-2">Mercado vecinal</h1>
              <p className="subtitulo mb-0">Compra, vende y ofrece productos o servicios dentro de tu comunidad.</p>
            </div>
            <div className="cart-pill">🛒 {cantidadProductos} producto(s)</div>
          </div>

          {mensaje && <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">{mensaje}</div>}

          <div className="row g-4 mb-4 align-items-stretch">
            <div className="col-xl-8">
              <div className="tarjeta-suave p-4 h-100">
                <h2 className="section-title"><span className="soft-icon">🏷️</span> Publicar un producto</h2>
                <p className="subtitulo">Comparte lo que ofreces con tu comunidad.</p>
                <form onSubmit={publicarProducto}>
                  <div className="row g-3 align-items-end">
                    <div className="col-md-5"><label className="form-label">Título</label><input type="text" name="titulo" className="form-control form-control-lg" placeholder="Ej. Pastel casero, plomería, renta de sillas" value={formulario.titulo} onChange={manejarCambioFormulario} /></div>
                    <div className="col-md-3"><label className="form-label">Categoría</label><select name="categoria" className="form-select form-select-lg" value={formulario.categoria} onChange={manejarCambioFormulario}><option value="Venta">Venta</option><option value="Renta">Renta</option><option value="Servicios">Servicios</option><option value="Comida">Comida</option></select></div>
                    <div className="col-md-4"><label className="form-label">Descripción</label><textarea name="descripcion" className="form-control" rows="2" placeholder="Describe lo que ofreces" value={formulario.descripcion} onChange={manejarCambioFormulario} /></div>
                    <div className="col-md-3"><label className="form-label">Precio</label><input type="number" name="precio" className="form-control form-control-lg" placeholder="Ej. 150" value={formulario.precio} onChange={manejarCambioFormulario} /></div>
                    <div className="col-md-3"><label className="form-label">Stock</label><input type="number" name="stock" min="1" className="form-control form-control-lg" value={formulario.stock} onChange={manejarCambioFormulario} /></div>
                    <div className="col-md-4"><label className="form-label">Imagen</label><label className="upload-mini"><input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={manejarImagen} />📷 <span>{imagen ? imagen.name : "Subir imagen"}<small>PNG, JPG o WEBP</small></span></label></div>
                    <div className="col-md-2"><button type="submit" className="btn btn-primary boton-redondo w-100" disabled={publicando}>{publicando ? "..." : "Publicar"}</button></div>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-xl-4">
              <aside className="tarjeta-suave p-4 h-100 cart-preview-card">
                <div className="d-flex justify-content-between align-items-center mb-3"><h2 className="section-title mb-0">🛒 Mi carrito</h2><span className="status-badge blue">{cantidadProductos} productos</span></div>
                {carrito.length === 0 ? <p className="subtitulo mb-0">Aún no has agregado productos.</p> : <>
                  <div className="cart-preview-list">
                    {carrito.slice(0, 3).map((item) => <div className="cart-preview-item" key={item.id}>{item.imagen ? <img src={item.imagen} alt={item.titulo} /> : <span className="cart-thumb-placeholder">🛒</span>}<div><strong>{item.titulo}</strong><small>{item.cantidad} pieza(s)</small></div><b>${(Number(item.precio || 0) * item.cantidad).toFixed(2)}</b><button type="button" onClick={() => quitarDelCarrito(item.id)}>×</button></div>)}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3"><strong>Subtotal</strong><strong className="cart-total">${totalCarrito.toFixed(2)}</strong></div>
                  <div className="d-flex gap-2 mt-3"><button type="button" className="btn btn-outline-primary boton-redondo w-50" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Ver carrito</button><button type="button" className="btn btn-success boton-redondo w-50" onClick={prepararPago} disabled={comprando}>{comprando ? "Preparando..." : "Finalizar compra"}</button></div>
                </>}
              </aside>
            </div>
          </div>

          <div className="filter-bar mb-4">
            <div className="search-box"><span>🔎</span><input type="text" placeholder="Buscar productos o servicios..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
            <div className="chip-group">{["Todas", "Comida", "Servicios", "Venta", "Renta"].map((cat) => <button key={cat} type="button" className={`filter-chip ${categoriaFiltro === cat ? "active" : ""}`} onClick={() => setCategoriaFiltro(cat)}>{cat}</button>)}</div>
            <select className="form-select sort-select" value={orden} onChange={(e) => setOrden(e.target.value)}><option value="recientes">Más recientes</option><option value="precio-menor">Menor precio</option><option value="precio-mayor">Mayor precio</option></select>
          </div>

          <div className="market-grid mb-4">
            {productosFiltrados.length > 0 ? productosFiltrados.map((producto) => (
              <article className="product-card" key={producto.id}>
                <div className="product-img-wrap">{producto.imagen ? <img src={producto.imagen} alt={producto.titulo} /> : <span>🛒</span>}<button type="button" className="favorite-btn">♡</button><span className="status-badge blue product-category">{producto.categoria || "General"}</span></div>
                <div className="product-body"><h3>{producto.titulo}</h3><p>{producto.descripcion?.length > 90 ? `${producto.descripcion.slice(0, 90)}...` : producto.descripcion}</p><strong className="product-price">{producto.precio ? `$${Number(producto.precio).toFixed(2)}` : "Gratis"}</strong><small>Stock: {producto.stock ?? 0} disponibles</small><small>👤 {producto.nombre_usuario || "Usuario"}</small><div className="d-flex gap-2 mt-auto"><button type="button" className="btn btn-outline-primary boton-redondo flex-fill" onClick={() => navigate(`/mercado-vecinal/${producto.id}`)}>Detalle</button><button type="button" className="btn btn-primary boton-redondo flex-fill" onClick={() => agregarAlCarrito(producto)} disabled={producto.estado_compra !== "disponible" || Number(producto.stock) <= 0}>{Number(producto.stock) > 0 && producto.estado_compra === "disponible" ? "Agregar" : "Agotado"}</button></div></div>
              </article>
            )) : <div className="empty-state grid-span">🛒 <strong>No hay productos disponibles con esos filtros.</strong><span>Prueba con otra búsqueda o categoría.</span></div>}
          </div>

          {carrito.length > 0 && <section className="tarjeta-suave p-4 mb-4"><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="section-title mb-0">Detalle del carrito</h2><button type="button" className="btn btn-outline-danger boton-redondo" onClick={vaciarCarrito}>Vaciar carrito</button></div><div className="d-flex flex-column gap-3">{carrito.map((item) => <div key={item.id} className="cart-detail-item">{item.imagen ? <img src={item.imagen} alt={item.titulo} /> : <span className="cart-thumb-placeholder">🛒</span>}<div className="flex-grow-1"><h3>{item.titulo}</h3><small>Precio: ${Number(item.precio || 0).toFixed(2)} · Stock: {item.stock}</small></div><div className="qty-control"><button type="button" onClick={() => cambiarCantidad(item.id, -1)}>-</button><strong>{item.cantidad}</strong><button type="button" onClick={() => cambiarCantidad(item.id, 1)}>+</button></div><strong>${(Number(item.precio || 0) * item.cantidad).toFixed(2)}</strong><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => quitarDelCarrito(item.id)}>Quitar</button></div>)}</div><hr /><div className="d-flex justify-content-between align-items-center"><strong>Total</strong><strong className="cart-total">${totalCarrito.toFixed(2)}</strong></div><button type="button" className="btn btn-success boton-redondo mt-3" onClick={prepararPago} disabled={comprando}>{comprando ? "Preparando pago..." : "Elegir método de pago"}</button>{mostrarOpcionesPago && pagoPendienteId && <div className="mt-3 d-flex flex-column gap-3"><MercadoPagoButton pagoId={pagoPendienteId} onError={(error) => alert(error.response?.data?.message || "Error con Mercado Pago")} /><div className="border rounded-4 p-3 bg-light"><PayPalButton pagoId={pagoPendienteId} onSuccess={async () => { await finalizarCompraDespuesDelPago(); }} onError={(error) => alert(error.response?.data?.message || "Error con PayPal")} /></div></div>}</section>}
        </section>
      </main>

      <PiePagina />
    </>
  );
}

export default MercadoVecinal;
