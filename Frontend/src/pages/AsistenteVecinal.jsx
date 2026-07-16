import { useEffect, useRef, useState } from "react";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { enviarMensajeAsistente } from "../services/asistenteService";

const sugerencias = [
  "¿Cómo reporto un incidente?",
  "¿Qué hace el botón de emergencia?",
  "¿Cómo reviso mis pagos?",
  "¿Cómo actualizo mi perfil?"
];

const obtenerHora = () => {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function AsistenteVecinal() {
  const [mensaje, setMensaje] = useState("");
  const [mensajes, setMensajes] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy el Asistente Vecinal de Círculo Privado. Puedo ayudarte con incidentes, emergencias, avisos, pagos, perfil y uso general de la app.",
      hora: obtenerHora()
    }
  ]);
  const [cargando, setCargando] = useState(false);

  const contenedorMensajesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (contenedorMensajesRef.current) {
      contenedorMensajesRef.current.scrollTop =
        contenedorMensajesRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  const enviar = async (e) => {
    e.preventDefault();

    const texto = mensaje.trim();
    if (!texto || cargando) return;

    const nuevoMensajeUsuario = {
      role: "user",
      content: texto,
      hora: obtenerHora()
    };

    const nuevoHistorial = [...mensajes, nuevoMensajeUsuario];

    setMensajes(nuevoHistorial);
    setMensaje("");
    setCargando(true);

    try {
      const historialParaApi = nuevoHistorial.map((item) => ({
        role: item.role,
        content: item.content
      }));

      const data = await enviarMensajeAsistente(texto, historialParaApi);

      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          hora: obtenerHora()
        }
      ]);
    } catch (error) {
      console.error(error);

      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Ocurrió un error al consultar al asistente.",
          hora: obtenerHora()
        }
      ]);
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  };

  const enviarSugerencia = async (texto) => {
    if (cargando) return;
    setMensaje(texto);

    setTimeout(() => {
      const eventoFalso = { preventDefault: () => {} };
      setMensaje(texto);
      inputRef.current?.focus();
      setMensaje(texto);
    }, 0);

    const nuevoMensajeUsuario = {
      role: "user",
      content: texto,
      hora: obtenerHora()
    };

    const nuevoHistorial = [...mensajes, nuevoMensajeUsuario];

    setMensajes(nuevoHistorial);
    setMensaje("");
    setCargando(true);

    try {
      const historialParaApi = nuevoHistorial.map((item) => ({
        role: item.role,
        content: item.content
      }));

      const data = await enviarMensajeAsistente(texto, historialParaApi);

      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          hora: obtenerHora()
        }
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error.response?.data?.message ||
            "Ocurrió un error al consultar al asistente.",
          hora: obtenerHora()
        }
      ]);
    } finally {
      setCargando(false);
      inputRef.current?.focus();
    }
  };

  const limpiarChat = () => {
    setMensajes([
      {
        role: "assistant",
        content:
          "Hola, soy el Asistente Vecinal de Círculo Privado. Puedo ayudarte con incidentes, emergencias, avisos, pagos, perfil y uso general de la app.",
        hora: obtenerHora()
      }
    ]);
    setMensaje("");
    inputRef.current?.focus();
  };

  const manejarKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar(e);
    }
  };

  return (
    <>
      <BarraNavegacion />

      <main className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-body p-0">
                <div className="p-4 border-bottom bg-white">
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                      <h1 className="h2 mb-1">Asistente Vecinal</h1>
                      <p className="text-muted mb-0">
                        Consulta dudas sobre el uso de Círculo Privado.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm rounded-pill"
                      onClick={limpiarChat}
                    >
                      Limpiar chat
                    </button>
                  </div>
                </div>

                <div className="p-3 border-bottom bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {sugerencias.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={() => enviarSugerencia(item)}
                        disabled={cargando}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={contenedorMensajesRef}
                  className="p-3"
                  style={{
                    minHeight: "420px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    backgroundColor: "#f8f9fb"
                  }}
                >
                  {mensajes.map((item, index) => (
                    <div
                      key={index}
                      className={`d-flex mb-3 ${
                        item.role === "user"
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      <div style={{ maxWidth: "80%" }}>
                        <div
                          className={`px-3 py-2 rounded-4 shadow-sm ${
                            item.role === "user"
                              ? "bg-primary text-white"
                              : "bg-white border"
                          }`}
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {item.content}
                        </div>
                        <div
                          className={`mt-1 small text-muted ${
                            item.role === "user" ? "text-end" : "text-start"
                          }`}
                        >
                          {item.hora}
                        </div>
                      </div>
                    </div>
                  ))}

                  {cargando && (
                    <div className="d-flex justify-content-start mb-3">
                      <div style={{ maxWidth: "80%" }}>
                        <div className="px-3 py-2 rounded-4 bg-white border shadow-sm">
                          <span className="text-muted">
                            El asistente está escribiendo...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={enviar} className="p-3 border-top bg-white">
                  <div className="input-group">
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control"
                      placeholder="Escribe tu pregunta..."
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      onKeyDown={manejarKeyDown}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={cargando || !mensaje.trim()}
                    >
                      Enviar
                    </button>
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">
                      Puedes preguntar por incidentes, emergencias, pagos, avisos,
                      perfil y funciones generales de la app.
                    </small>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PiePagina />
    </>
  );
}