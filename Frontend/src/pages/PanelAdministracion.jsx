import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { useAccessibility } from "../context/AccessibilityContext";
import {
  actualizarEstadoUsuarioAdmin,
  eliminarUsuarioAdmin,
  obtenerUsuariosAdmin,
  transferirAdministrador,
} from "../services/adminService";

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function PanelAdministracion() {
  const navigate = useNavigate();
  const { t, getRoleLabel } = useAccessibility();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [procesandoId, setProcesandoId] = useState(null);

  const usuarioActual = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const esAdmin = usuarioActual?.role === "admin";

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const data = await obtenerUsuariosAdmin();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setTipoMensaje("danger");
      setMensaje(error.response?.data?.message || "No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (esAdmin) {
      cargarUsuarios();
    }
  }, [esAdmin]);

  if (!esAdmin) {
    return <Navigate to="/panel" replace />;
  }

  const mostrarMensaje = (nuevoTipo, nuevoMensaje) => {
    setTipoMensaje(nuevoTipo);
    setMensaje(nuevoMensaje);
  };

  const manejarTransferencia = async (usuario) => {
    const confirmar = window.confirm(`¿Deseas ceder la administración a ${usuario.name}?`);
    if (!confirmar) return;

    try {
      setProcesandoId(usuario.id);
      const respuesta = await transferirAdministrador(usuario.id);
      mostrarMensaje("success", respuesta.message || "Administrador transferido correctamente");

      const userLocal = JSON.parse(localStorage.getItem("user") || "null");
      if (userLocal && Number(userLocal.id) === Number(respuesta.previousAdminId)) {
        userLocal.role = "resident";
        localStorage.setItem("user", JSON.stringify(userLocal));
        setTimeout(() => navigate("/panel", { replace: true }), 900);
        return;
      }

      await cargarUsuarios();
    } catch (error) {
      mostrarMensaje("danger", error.response?.data?.message || "No se pudo transferir la administración");
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEstado = async (usuario, activo) => {
    const accion = activo ? "desbloquear" : "bloquear";
    const confirmar = window.confirm(`¿Deseas ${accion} a ${usuario.name}?`);
    if (!confirmar) return;

    try {
      setProcesandoId(usuario.id);
      const respuesta = await actualizarEstadoUsuarioAdmin(usuario.id, activo);
      mostrarMensaje("success", respuesta.message || "Estado actualizado correctamente");
      await cargarUsuarios();
    } catch (error) {
      mostrarMensaje("danger", error.response?.data?.message || "No se pudo actualizar el acceso del usuario");
    } finally {
      setProcesandoId(null);
    }
  };

  const manejarEliminar = async (usuario) => {
    const confirmar = window.confirm(`¿Eliminar a ${usuario.name}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      setProcesandoId(usuario.id);
      const respuesta = await eliminarUsuarioAdmin(usuario.id);
      mostrarMensaje("success", respuesta.message || "Usuario eliminado correctamente");
      await cargarUsuarios();
    } catch (error) {
      mostrarMensaje("danger", error.response?.data?.message || "No se pudo eliminar el usuario");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <>
      <BarraNavegacion />
      <main id="contenido-principal">
        <section className="container seccion">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
            <div>
              <h1 className="titulo-principal mb-2">Administración de usuarios</h1>
              <p className="subtitulo mb-0">
                Visualiza a todos los usuarios registrados, bloquea accesos, elimina cuentas y cede el rol de administrador.
              </p>
            </div>
          </div>

          {mensaje && (
            <div className={`alert alert-${tipoMensaje} mb-4`} role="alert">
              {mensaje}
            </div>
          )}

          <div className="tarjeta-suave p-4">
            {cargando ? (
              <p className="mb-0">Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
              <p className="mb-0">No hay usuarios registrados.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => {
                      const esMismoUsuario = Number(usuario.id) === Number(usuarioActual?.id);
                      const esAdminActual = usuario.role === "admin";
                      const deshabilitado = procesandoId === usuario.id;

                      return (
                        <tr key={usuario.id}>
                          <td>
                            <strong>{usuario.name}</strong>
                            {esMismoUsuario && <div className="small text-muted">Tu cuenta actual</div>}
                          </td>
                          <td>{usuario.email}</td>
                          <td>{getRoleLabel(usuario.role)}</td>
                          <td>
                            <span className={`badge ${usuario.activo ? "text-bg-success" : "text-bg-secondary"}`}>
                              {usuario.activo ? "Activo" : "Bloqueado"}
                            </span>
                          </td>
                          <td>{formatearFecha(usuario.created_at)}</td>
                          <td>
                            <div className="d-flex flex-wrap justify-content-end gap-2">
                              {!esAdminActual && (
                                <button
                                  className="btn btn-outline-primary btn-sm boton-redondo"
                                  onClick={() => manejarTransferencia(usuario)}
                                  disabled={deshabilitado || !usuario.activo}
                                >
                                  Ceder admin
                                </button>
                              )}

                              {!esMismoUsuario && (
                                <button
                                  className={`btn btn-sm boton-redondo ${usuario.activo ? "btn-outline-warning" : "btn-outline-success"}`}
                                  onClick={() => manejarEstado(usuario, !usuario.activo)}
                                  disabled={deshabilitado || esAdminActual}
                                >
                                  {usuario.activo ? "Bloquear" : "Desbloquear"}
                                </button>
                              )}

                              {!esMismoUsuario && !esAdminActual && (
                                <button
                                  className="btn btn-outline-danger btn-sm boton-redondo"
                                  onClick={() => manejarEliminar(usuario)}
                                  disabled={deshabilitado}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
