import { Link } from "react-router-dom";
import BarraNavegacion from "../components/BarraNavegacion";
import PiePagina from "../components/PiePagina";
import { useAccessibility } from "../context/AccessibilityContext";

export default function Inicio() {
  const { t } = useAccessibility();

  return (
    <>
      <BarraNavegacion />

      <main id="contenido-principal" className="inicio-main">
        <section className="container seccion">
          <div className="hero-principal text-center text-lg-start">
            <div className="row align-items-center">
              <div className="col-lg-7">
                <span className="badge bg-light text-primary mb-3 px-3 py-2 rounded-pill">
                  {t('securityAndCommunity')}
                </span>

                <h1 className="display-3 fw-bold mb-3">{t('welcome')}</h1>

                <p className="lead mb-4">{t('homeLead')}</p>

                <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                  <Link to="/iniciar-sesion" className="btn btn-light btn-lg boton-redondo">{t('loginAction')}</Link>
                  <Link to="/registro" className="btn btn-outline-light btn-lg boton-redondo">{t('createAccount')}</Link>
                </div>
              </div>

              <div className="col-lg-5 mt-4 mt-lg-0">
                <div className="tarjeta-suave p-4 text-dark">
                  <h2 className="h3 fw-bold mb-3">{t('quickSummary')}</h2>
                  <div className="row g-3">
                    <div className="col-6"><div className="bg-primary-subtle rounded-4 p-3 h-100"><p className="text-secondary mb-1">{t('incidents')}</p><h3 className="fw-bold mb-0">12</h3></div></div>
                    <div className="col-6"><div className="bg-danger-subtle rounded-4 p-3 h-100"><p className="text-secondary mb-1">{t('activeAlerts')}</p><h3 className="fw-bold mb-0">3</h3></div></div>
                    <div className="col-6"><div className="bg-success-subtle rounded-4 p-3 h-100"><p className="text-secondary mb-1">{t('payments')}</p><h3 className="fw-bold mb-0">84%</h3></div></div>
                    <div className="col-6"><div className="bg-warning-subtle rounded-4 p-3 h-100"><p className="text-secondary mb-1">{t('notices')}</p><h3 className="fw-bold mb-0">6</h3></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container seccion">
          <div className="text-center mb-5">
            <h2 className="titulo-principal">{t('mainFeatures')}</h2>
            <p className="subtitulo">{t('allCommunityNeeds')}</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4"><article className="tarjeta-suave p-4 h-100"><h3 className="h4 fw-bold mb-3">{t('incidents')}</h3><p className="mb-0">{t('incidentsDescription')}</p></article></div>
            <div className="col-md-4"><article className="tarjeta-suave p-4 h-100"><h3 className="h4 fw-bold mb-3">{t('emergency')}</h3><p className="mb-0">{t('emergencyDescription')}</p></article></div>
            <div className="col-md-4"><article className="tarjeta-suave p-4 h-100"><h3 className="h4 fw-bold mb-3">{t('payments')} &amp; {t('notices')}</h3><p className="mb-0">{t('paymentsNoticesDescription')}</p></article></div>
          </div>
        </section>
      </main>

      <PiePagina />
    </>
  );
}
