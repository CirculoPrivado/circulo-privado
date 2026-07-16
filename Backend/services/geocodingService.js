const axios = require("axios");

const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

const buildAddressFromParts = (parts = {}) => {
  const segmentos = [
    [parts.street, parts.ext_number].filter(Boolean).join(" ").trim(),
    parts.neighborhood,
    parts.city,
    parts.state,
    parts.postal_code,
    parts.country || "México",
  ].filter(Boolean);

  return segmentos.join(", ");
};

const geocodeAddress = async (parts = {}) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const address = buildAddressFromParts(parts);

  if (!apiKey || !address) {
    return null;
  }

  const { data } = await axios.get(GEOCODE_URL, {
    params: {
      address,
      key: apiKey,
      language: "es",
      region: "mx",
    },
    timeout: 10000,
  });

  if (!data.results || !data.results.length) {
    return null;
  }

  const result = data.results[0];

  return {
    formattedAddress: result.formatted_address,
    latitude: result.geometry?.location?.lat ?? null,
    longitude: result.geometry?.location?.lng ?? null,
    placeId: result.place_id ?? null,
    raw: result,
  };
};

const reverseGeocode = async (latitude, longitude) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || latitude == null || longitude == null) {
    return null;
  }

  const { data } = await axios.get(GEOCODE_URL, {
    params: {
      latlng: `${latitude},${longitude}`,
      key: apiKey,
      language: "es",
      region: "mx",
    },
    timeout: 10000,
  });

  if (!data.results || !data.results.length) {
    return null;
  }

  const result = data.results[0];

  return {
    formattedAddress: result.formatted_address,
    placeId: result.place_id ?? null,
    raw: result,
  };
};

module.exports = {
  buildAddressFromParts,
  geocodeAddress,
  reverseGeocode,
};
