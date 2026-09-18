import {
  extractAddressLabel,
  locationCacheKey,
} from "../utils/location.js";

const REVERSE_URL =
  import.meta.env.VITE_GEOCODING_BASE_URL ??
  "https://nominatim.openstreetmap.org/reverse";

const SEARCH_URL =
  import.meta.env.VITE_GEOCODING_SEARCH_URL ??
  "https://nominatim.openstreetmap.org/search";

const CACHE_PREFIX = "reverse-geocode:";
const SEARCH_CACHE_PREFIX = "forward-geocode:";

function readCache(key) {
  try {
    const cached = localStorage.getItem(key);

    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // O cache é opcional; não deve impedir o funcionamento.
  }
}

const geocodingApi = {
  /*
   * Converte coordenadas em endereço.
   *
   * latitude + longitude
   *        ↓
   *     endereço
   */
  async reverse(latitude, longitude) {
    const key = locationCacheKey(latitude, longitude);

    if (!key) return null;

    const cacheKey = `${CACHE_PREFIX}${key}`;

    const cached = readCache(cacheKey);

    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "18",
      addressdetails: "1",
    });

    const response = await fetch(`${REVERSE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Falha HTTP ${response.status}`);
    }

    const result = await response.json();

    const location = {
      label: extractAddressLabel(result),
      displayName: result.display_name ?? null,
    };

    writeCache(cacheKey, location);

    return location;
  },

  /*
   * Converte um endereço em coordenadas.
   *
   * endereço
   *    ↓
   * latitude + longitude
   */
  async search(query) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      return null;
    }

    const cacheKey = `${SEARCH_CACHE_PREFIX}${normalizedQuery.toLowerCase()}`;

    const cached = readCache(cacheKey);

    if (cached) {
      return cached;
    }

    const params = new URLSearchParams({
      format: "jsonv2",
      q: normalizedQuery,
      limit: "1",
      addressdetails: "1",
    });

    const response = await fetch(`${SEARCH_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Falha HTTP ${response.status}`);
    }

    const results = await response.json();

    /*
     * O Nominatim retorna um array.
     * Como limitamos para 1 resultado, pegamos o primeiro.
     */
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const result = results[0];

    const location = {
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      label: result.display_name ?? normalizedQuery,
      displayName: result.display_name ?? null,
    };

    /*
     * Evita guardar algo inválido no cache.
     */
    if (
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      return null;
    }

    writeCache(cacheKey, location);

    return location;
  },
};

export default geocodingApi;
