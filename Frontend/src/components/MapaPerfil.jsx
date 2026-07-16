import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

const DEFAULT_CENTER = { lat: 19.432608, lng: -99.133209 };

export default function MapaPerfil({
  homeLocation,
  currentLocation,
  formattedAddress,
  currentAddress,
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const homeMarker = useRef(null);
  const currentMarker = useRef(null);
  const [estado, setEstado] = useState({
    cargando: true,
    error: "",
  });

  useEffect(() => {
    let mounted = true;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mounted || !mapRef.current || mapInstance.current) {
          return;
        }

        const center = currentLocation || homeLocation || DEFAULT_CENTER;

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: currentLocation || homeLocation ? 16 : 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        if (homeLocation) {
          homeMarker.current = new window.google.maps.Marker({
            position: homeLocation,
            map: mapInstance.current,
            title: formattedAddress || "Dirección registrada",
          });

          if (formattedAddress) {
            const info = new window.google.maps.InfoWindow({
              content: `<div><strong>Dirección registrada</strong><br/>${formattedAddress}</div>`,
            });

            homeMarker.current.addListener("click", () => info.open(mapInstance.current, homeMarker.current));
          }
        }

        if (currentLocation) {
          currentMarker.current = new window.google.maps.Marker({
            position: currentLocation,
            map: mapInstance.current,
            title: currentAddress || "Ubicación actual",
          });
        }

        setEstado({ cargando: false, error: "" });
      })
      .catch((error) => {
        if (mounted) {
          setEstado({
            cargando: false,
            error: error.message || "No se pudo cargar el mapa",
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, [homeLocation, currentLocation, formattedAddress, currentAddress]);

  useEffect(() => {
    if (!mapInstance.current) {
      return;
    }

    if (homeLocation) {
      if (!homeMarker.current) {
        homeMarker.current = new window.google.maps.Marker({
          position: homeLocation,
          map: mapInstance.current,
          title: formattedAddress || "Dirección registrada",
        });
      } else {
        homeMarker.current.setPosition(homeLocation);
      }
    }

    if (currentLocation) {
      if (!currentMarker.current) {
        currentMarker.current = new window.google.maps.Marker({
          position: currentLocation,
          map: mapInstance.current,
          title: currentAddress || "Ubicación actual",
        });
      } else {
        currentMarker.current.setPosition(currentLocation);
      }

      mapInstance.current.panTo(currentLocation);
    } else if (homeLocation) {
      mapInstance.current.panTo(homeLocation);
    }
  }, [homeLocation, currentLocation, formattedAddress, currentAddress]);

  return (
    <div>
      {estado.error && <div className="alert alert-warning">{estado.error}</div>}
      {estado.cargando && !estado.error && (
        <div className="alert alert-info">Cargando mapa de Google Maps…</div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          minHeight: "420px",
          borderRadius: "1rem",
          overflow: "hidden",
          background: "#f3f4f6",
        }}
      />
    </div>
  );
}
