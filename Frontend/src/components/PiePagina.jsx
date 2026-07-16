import { useAccessibility } from "../context/AccessibilityContext";

export default function PiePagina() {
  const { t } = useAccessibility();

  return (
    <footer className="py-4 border-top bg-body-tertiary mt-auto">
      <div className="container text-center">
        <p className="mb-1 fw-semibold">{t('appName')}</p>
        <small className="text-body-secondary">© 2026 · Plataforma comunitaria</small>
      </div>
    </footer>
  );
}
