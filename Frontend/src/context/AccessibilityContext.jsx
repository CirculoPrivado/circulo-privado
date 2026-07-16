import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { translations } from '../i18n/translations';

const DEFAULTS = {
  idioma: 'es',
  tema: 'claro',
  font_size: 'medium',
};

const AccessibilityContext = createContext(null);

function safeParseUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const user = safeParseUser();
    return {
      ...DEFAULTS,
      ...(user?.preferences || {}),
    };
  });
  const [savingError, setSavingError] = useState('');

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', preferences.idioma || 'es');
    html.setAttribute('data-theme', preferences.tema || 'claro');
    html.setAttribute('data-font-size', preferences.font_size || 'medium');
  }, [preferences]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get('/perfil/preferences');
        if (cancelled || !data) return;
        const merged = { ...DEFAULTS, ...data };
        setPreferences(merged);

        const user = safeParseUser();
        if (user) {
          user.preferences = merged;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch {
        // fallback silencioso a localStorage
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistPreferences = async (nextPreferences) => {
    const token = localStorage.getItem('token');
    setSavingError('');
    setPreferences(nextPreferences);

    const user = safeParseUser();
    if (user) {
      user.preferences = nextPreferences;
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (!token) return;

    try {
      await api.put('/perfil/preferences', nextPreferences);
    } catch {
      setSavingError(translations[nextPreferences.idioma || 'es']?.savePreferencesError || translations.es.savePreferencesError);
    }
  };

  const updatePreference = async (field, value) => {
    const nextPreferences = {
      ...preferences,
      [field]: value,
    };
    await persistPreferences(nextPreferences);
  };

  const t = (key, vars = {}) => {
    const language = translations[preferences.idioma] || translations.es;
    let text = language[key] || translations.es[key] || key;
    Object.entries(vars).forEach(([varKey, varValue]) => {
      text = text.replace(`{${varKey}}`, String(varValue));
    });
    return text;
  };

  const getRoleLabel = (role) => {
    const map = {
      resident: t('resident'),
      committee: t('committee'),
      security: t('security'),
      admin: t('admin'),
    };
    return map[role] || role;
  };

  const value = useMemo(() => ({
    preferences,
    updatePreference,
    t,
    getRoleLabel,
    savingError,
  }), [preferences, savingError]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }
  return context;
}
