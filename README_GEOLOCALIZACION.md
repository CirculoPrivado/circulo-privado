# Geolocalización integrada en registro y perfil

## Qué quedó integrado
- Registro con dirección real o código postal.
- Geocodificación en backend usando Google Maps Geocoding API.
- Perfil con mapa de Google Maps.
- Seguimiento de ubicación en tiempo real con `watchPosition()`.
- Botón para abrir navegación en Google Maps.

## Variables nuevas
### Backend
- `GOOGLE_MAPS_API_KEY`

### Frontend
- `VITE_GOOGLE_MAPS_API_KEY`

## Pasos
1. Copia los `.env.example` a `.env` si necesitas regenerarlos.
2. Coloca tu clave de Google Maps en backend y frontend.
3. Importa tu base de datos o ejecuta `sql/geolocalizacion_perfil.sql`.
4. Inicia backend: `npm install` y `npm run dev`
5. Inicia frontend: `npm install` y `npm run dev`

## Nota
En producción la geolocalización del navegador requiere HTTPS.
