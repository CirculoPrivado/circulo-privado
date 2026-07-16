import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children, allowedRoles = null }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    try {
      const usuario = JSON.parse(localStorage.getItem("user") || "null");
      if (!usuario || !allowedRoles.includes(usuario.role)) {
        return <Navigate to="/panel" replace />;
      }
    } catch {
      return <Navigate to="/panel" replace />;
    }
  }

  return children;
}
