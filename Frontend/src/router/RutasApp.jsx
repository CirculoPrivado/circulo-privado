import { BrowserRouter, Routes, Route } from "react-router-dom";

import Inicio from "../pages/Inicio";
import IniciarSesion from "../pages/IniciarSesion";
import Registro from "../pages/Registro";
import OlvideContrasena from "../pages/OlvideContrasena";
import RestablecerContrasena from "../pages/RestablecerContrasena";
import PanelPrincipal from "../pages/PanelPrincipal";
import Incidentes from "../pages/Incidentes";
import DetalleIncidente from "../pages/DetalleIncidente";
import ReportarIncidente from "../pages/ReportarIncidente";
import Emergencia from "../pages/Emergencia";
import Pagos from "../pages/Pagos";
import MercadoVecinal from "../pages/MercadoVecinal";
import MiPerfil from "../pages/MiPerfil";
import Avisos from "../pages/Avisos";
import AsistenteVecinal from "../pages/AsistenteVecinal";
import RutaProtegida from "../components/RutaProtegida";
import DetalleProducto from "../pages/DetalleProducto";
import PanelAdministracion from "../pages/PanelAdministracion";

export default function RutasApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/iniciar-sesion" element={<IniciarSesion />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-contrasena" element={<OlvideContrasena />} />
        <Route path="/restablecer-contrasena/:token" element={<RestablecerContrasena />} />

        <Route
          path="/panel"
          element={
            <RutaProtegida>
              <PanelPrincipal />
            </RutaProtegida>
          }
        />

        <Route
          path="/incidentes"
          element={
            <RutaProtegida>
              <Incidentes />
            </RutaProtegida>
          }
        />

        <Route
          path="/incidentes/:id"
          element={
            <RutaProtegida>
              <DetalleIncidente />
            </RutaProtegida>
          }
        />

        <Route
          path="/reportar-incidente"
          element={
            <RutaProtegida>
              <ReportarIncidente />
            </RutaProtegida>
          }
        />

        <Route
          path="/emergencia"
          element={
            <RutaProtegida>
              <Emergencia />
            </RutaProtegida>
          }
        />

        <Route
          path="/pagos"
          element={
            <RutaProtegida>
              <Pagos />
            </RutaProtegida>
          }
        />

        <Route
          path="/mercado-vecinal"
          element={
            <RutaProtegida>
              <MercadoVecinal />
            </RutaProtegida>
          }
        />

        <Route
          path="/mercado-vecinal/:id"
          element={
            <RutaProtegida>
              <DetalleProducto />
            </RutaProtegida>
          }
        />

        <Route
          path="/mi-perfil"
          element={
            <RutaProtegida>
              <MiPerfil />
            </RutaProtegida>
          }
        />

        <Route
          path="/avisos"
          element={
            <RutaProtegida>
              <Avisos />
            </RutaProtegida>
          }
        />

        <Route
          path="/asistente"
          element={
            <RutaProtegida>
              <AsistenteVecinal />
            </RutaProtegida>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <RutaProtegida allowedRoles={["admin"]}>
              <PanelAdministracion />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  );
}
