/**
 * Map Configuration & Real-Time Tile Layer Service
 * Supports Google Maps (Satellite, Hybrid, Terrain, Roadmap, Traffic),
 * OpenStreetMap (Standard & Humanitarian), Mapbox GL styles,
 * and Live Doppler Weather Radar (RainViewer & OpenWeatherMap).
 */

export type MapLayerId =
  | 'google-hybrid'
  | 'google-satellite'
  | 'google-terrain'
  | 'google-roadmap'
  | 'osm-standard'
  | 'osm-hot'
  | 'mapbox-dark'
  | 'mapbox-satellite';

export interface MapApiKeys {
  googleMapsKey: string;
  mapboxToken: string;
  openWeatherKey: string;
}

export interface LayerDefinition {
  id: MapLayerId;
  name: string;
  provider: 'Google Maps' | 'OpenStreetMap' | 'Mapbox';
  icon: string;
  description: string;
  url: (keys: MapApiKeys) => string;
  subdomains?: string[];
  attribution: string;
  maxZoom: number;
  requiresKey?: 'googleMapsKey' | 'mapboxToken';
}

const STORAGE_KEY = 'urban_flood_map_api_keys';
const ACTIVE_LAYER_KEY = 'urban_flood_active_map_layer';

export const MAP_LAYERS: Record<MapLayerId, LayerDefinition> = {
  'google-hybrid': {
    id: 'google-hybrid',
    name: 'Google Hybrid',
    provider: 'Google Maps',
    icon: '🛰️',
    description: 'High-resolution Google satellite imagery with road & boundary labels',
    url: (keys) => {
      const keyParam = keys.googleMapsKey ? `&key=${encodeURIComponent(keys.googleMapsKey)}` : '';
      return `https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}${keyParam}`;
    },
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  'google-satellite': {
    id: 'google-satellite',
    name: 'Google Satellite',
    provider: 'Google Maps',
    icon: '🌍',
    description: 'Pure photographic satellite view without road overlays',
    url: (keys) => {
      const keyParam = keys.googleMapsKey ? `&key=${encodeURIComponent(keys.googleMapsKey)}` : '';
      return `https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}${keyParam}`;
    },
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  'google-terrain': {
    id: 'google-terrain',
    name: 'Google Terrain',
    provider: 'Google Maps',
    icon: '🏔️',
    description: 'Topographic contour shading & elevation features for flood paths',
    url: (keys) => {
      const keyParam = keys.googleMapsKey ? `&key=${encodeURIComponent(keys.googleMapsKey)}` : '';
      return `https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}${keyParam}`;
    },
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  'google-roadmap': {
    id: 'google-roadmap',
    name: 'Google Standard',
    provider: 'Google Maps',
    icon: '🚗',
    description: 'Official Google Maps standard road and urban topology',
    url: (keys) => {
      const keyParam = keys.googleMapsKey ? `&key=${encodeURIComponent(keys.googleMapsKey)}` : '';
      return `https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}${keyParam}`;
    },
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps',
    maxZoom: 20,
  },
  'osm-standard': {
    id: 'osm-standard',
    name: 'OSM Standard',
    provider: 'OpenStreetMap',
    icon: '🌐',
    description: 'Worldwide OpenStreetMap community cartography (No key required)',
    url: () => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  'osm-hot': {
    id: 'osm-hot',
    name: 'OSM Humanitarian',
    provider: 'OpenStreetMap',
    icon: '💧',
    description: 'Detailed hydrological and infrastructure layer for disaster response',
    url: () => 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Humanitarian Team',
    maxZoom: 19,
  },
  'mapbox-dark': {
    id: 'mapbox-dark',
    name: 'Mapbox Dark',
    provider: 'Mapbox',
    icon: '🌌',
    description: 'Sleek dark theme optimized for telemetry and sensor glowing nodes',
    url: (keys) =>
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(
        keys.mapboxToken || 'pk.eyJ1IjoiZGV2LW1hcGJveCIsImEiOiJjbTFrZXlhbXAwMDAwMm1xdnlvaHRsYWRuIn0.mock'
      )}`,
    subdomains: [],
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    requiresKey: 'mapboxToken',
  },
  'mapbox-satellite': {
    id: 'mapbox-satellite',
    name: 'Mapbox Satellite',
    provider: 'Mapbox',
    icon: '🛰️',
    description: 'Mapbox high-definition satellite streets with vector buildings',
    url: (keys) =>
      `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(
        keys.mapboxToken || 'pk.eyJ1IjoiZGV2LW1hcGJveCIsImEiOiJjbTFrZXlhbXAwMDAwMm1xdnlvaHRsYWRuIn0.mock'
      )}`,
    subdomains: [],
    attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    requiresKey: 'mapboxToken',
  },
};

/**
 * Google Maps Real-time Traffic Overlay URL
 */
export function getGoogleTrafficOverlayUrl(keys: MapApiKeys): string {
  const keyParam = keys.googleMapsKey ? `&key=${encodeURIComponent(keys.googleMapsKey)}` : '';
  return `https://mt{s}.google.com/vt/lyrs=h,traffic&x={x}&y={y}&z={z}${keyParam}`;
}

/**
 * Real-Time RainViewer Doppler Radar Overlay URL
 * RainViewer provides free live radar overlays updated continuously.
 */
export function getLiveWeatherRadarUrl(): { url: string; attribution: string } {
  return {
    url: 'https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png',
    attribution: '&copy; <a href="https://www.rainviewer.com/" target="_blank">RainViewer</a> Live Radar',
  };
}

/**
 * OpenWeatherMap Precipitation Layer (Requires OWM API key)
 */
export function getOpenWeatherPrecipitationUrl(apiKey: string): string {
  return `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${encodeURIComponent(apiKey)}`;
}

/**
 * Load API keys from localStorage or environment variables
 */
export function loadMapApiKeys(): MapApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        googleMapsKey: parsed.googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        mapboxToken: parsed.mapboxToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
        openWeatherKey: parsed.openWeatherKey || import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '',
      };
    }
  } catch (e) {
    console.warn('Could not read map keys from storage:', e);
  }

  return {
    googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
    openWeatherKey: import.meta.env.VITE_OPENWEATHERMAP_API_KEY || '',
  };
}

/**
 * Save API keys to localStorage
 */
export function saveMapApiKeys(keys: MapApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.warn('Could not persist map keys:', e);
  }
}

/**
 * Get active layer id
 */
export function getActiveLayerId(): MapLayerId {
  const saved = localStorage.getItem(ACTIVE_LAYER_KEY) as MapLayerId;
  if (saved && MAP_LAYERS[saved]) {
    return saved;
  }
  return 'google-hybrid';
}

/**
 * Save active layer id
 */
export function saveActiveLayerId(layerId: MapLayerId): void {
  localStorage.setItem(ACTIVE_LAYER_KEY, layerId);
}
