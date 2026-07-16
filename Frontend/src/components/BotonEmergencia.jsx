import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return children;
}