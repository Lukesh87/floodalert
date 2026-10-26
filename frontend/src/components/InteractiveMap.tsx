import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FloodEventItem, StationRiskItem } from '../types';
import {
  CloudRain,
  Compass,
  Filter,
  Key,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Radio,
  Search,
  TrafficCone,
} from 'lucide-react';
import {
  getActiveLayerId,
  getGoogleTrafficOverlayUrl,
  getLiveWeatherRadarUrl,
  getOpenWeatherPrecipitationUrl,
  LayerDefinition,
  loadMapApiKeys,
  MAP_LAYERS,
  MapApiKeys,
  MapLayerId,
  saveActiveLayerId,
} from '../services/mapConfig';
import { MapApiKeyModal } from './MapApiKeyModal';

interface InteractiveMapProps {
  stations: StationRiskItem[];
  historicalEvents?: FloodEventItem[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  stations,
  historicalEvents = [],
  selectedStationId,
  onSelectStation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Map state
  const [activeLayerId, setActiveLayerId] = useState<MapLayerId>(getActiveLayerId());
  const [apiKeys, setApiKeys] = useState<MapApiKeys>(loadMapApiKeys());
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Overlay state
  const [showTraffic, setShowTraffic] = useState(false);
  const [showLiveRadar, setShowLiveRadar] = useState(false);
  const [showHistorical, setShowHistorical] = useState(true);

  // Filter & UI state
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'ELEVATED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Coimbatore Coordinates: 11.0168° N, 76.9558° E
    const map = L.map(mapContainerRef.current, {
      center: [11.0168, 76.9558],
      zoom: 12,
      minZoom: 9,
      maxZoom: 19,
      zoomControl: true,
    });

    // Create Base Layer
    const layerDef = MAP_LAYERS[activeLayerId] || MAP_LAYERS['google-hybrid'];
    const tileLayer = L.tileLayer(layerDef.url(apiKeys), {
      subdomains: layerDef.subdomains || ['0', '1', '2', '3'],
      attribution: layerDef.attribution,
      maxZoom: layerDef.maxZoom,
    }).addTo(map);

    baseTileLayerRef.current = tileLayer;

    // Layer Groups for markers
    const markerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markerGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      baseTileLayerRef.current = null;
      trafficLayerRef.current = null;
      radarLayerRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when activeLayerId or apiKeys change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerDef = MAP_LAYERS[activeLayerId] || MAP_LAYERS['google-hybrid'];

    // If layer requires mapbox key and it's missing, prompt or fallback
    if (layerDef.requiresKey === 'mapboxToken' && !apiKeys.mapboxToken) {
      setIsApiKeyModalOpen(true);
      return;
    }

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(layerDef.url(apiKeys), {
      subdomains: layerDef.subdomains || ['0', '1', '2', '3'],
      attribution: layerDef.attribution,
      maxZoom: layerDef.maxZoom,
    });

    newTileLayer.addTo(map);
    baseTileLayerRef.current = newTileLayer;

    // Bring markers to front
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer: any) => {
        layer.bringToFront?.();
      });
    }

    saveActiveLayerId(activeLayerId);
  }, [activeLayerId, apiKeys]);

  // Handle Traffic Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        const trafficUrl = getGoogleTrafficOverlayUrl(apiKeys);
        const trafficLayer = L.tileLayer(trafficUrl, {
          subdomains: ['0', '1', '2', '3'],
          opacity: 0.85,
          zIndex: 10,
        });
        trafficLayer.addTo(map);
        trafficLayerRef.current = trafficLayer;
      }
    } else {
      if (trafficLayerRef.current) {
        map.removeLayer(trafficLayerRef.current);
        trafficLayerRef.current = null;
      }
    }
  }, [showTraffic, apiKeys]);

  // Handle Real-time Live Weather Doppler Radar Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showLiveRadar) {
      if (!radarLayerRef.current) {
        // If OpenWeatherMap key is available, use precipitation layer; otherwise use RainViewer live radar
        let radarUrl = '';
        let attribution = '';
        if (apiKeys.openWeatherKey) {
          radarUrl = getOpenWeatherPrecipitationUrl(apiKeys.openWeatherKey);
          attribution = '&copy; OpenWeatherMap';
        } else {
          const radarInfo = getLiveWeatherRadarUrl();
          radarUrl = radarInfo.url;
          attribution = radarInfo.attribution;
        }

        const radarLayer = L.tileLayer(radarUrl, {
          opacity: 0.65,
          zIndex: 12,
          attribution,
        });
        radarLayer.addTo(map);
        radarLayerRef.current = radarLayer;
      }
    } else {
      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
    }
  }, [showLiveRadar, apiKeys]);

  // Update Station & Event Markers
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer || !mapInstanceRef.current) return;

    layer.clearLayers();

    // 1. Render Active Monitoring Stations
    stations.forEach((st) => {
      if (riskFilter === 'CRITICAL' && st.risk_category !== 'Severe') return;
      if (riskFilter === 'ELEVATED' && !['Severe', 'High'].includes(st.risk_category)) return;

      if (
        searchTerm &&
        !st.location_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !st.ward?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return;
      }

      const color =
        st.risk_category === 'Severe'
          ? '#ef4444'
          : st.risk_category === 'High'
          ? '#f97316'
          : st.risk_category === 'Moderate'
          ? '#eab308'
          : '#10b981';

      const radius = st.risk_category === 'Severe' ? 14 : st.risk_category === 'High' ? 12 : 9;

      // Station Circle Marker
      const circle = L.circleMarker([st.latitude, st.longitude], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 0.95,
        fillOpacity: 0.88,
      });

      // Animated pulsing ring for Severe stations (e.g. Lanka Corner)
      if (st.risk_category === 'Severe' || st.risk_category === 'High') {
        const pulseRing = L.circle([st.latitude, st.longitude], {
          radius: 380,
          color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5,
        });
        layer.addLayer(pulseRing);
      }

      // Popup content
      const popupHtml = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; padding: 4px; min-width: 230px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #38bdf8; font-size: 0.95rem;">${st.location_name}</strong>
            <span style="background: ${color}25; color: ${color}; border: 1px solid ${color}; padding: 2px 7px; border-radius: 999px; font-size: 0.7rem; font-weight: 700;">
              ${st.risk_category.toUpperCase()}
            </span>
          </div>
          <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 8px;">
            ${st.ward || 'Coimbatore Municipal Ward'} • Elev: <strong>${st.elevation_m}m MSL</strong>
          </div>
          
          <div style="background: rgba(255,255,255,0.08); padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; font-size: 0.75rem;">
            <div>Rainfall (1h): <strong>${st.rainfall_1h_mm} mm/h</strong></div>
            <div>Rainfall (24h): <strong>${st.rainfall_24h_mm} mm</strong></div>
            <div>Drainage Index: <strong>${(st.drainage_capacity_index * 100).toFixed(0)}%</strong></div>
            <div>Impervious Surface: <strong>${(st.impervious_ratio * 100).toFixed(0)}%</strong></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 4px;">
            <span style="color: #94a3b8;">Est. Flood Prob:</span>
            <strong style="color: ${color};">${(st.flood_probability * 100).toFixed(1)}%</strong>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      circle.on('click', () => {
        if (onSelectStation) {
          onSelectStation(st.location_id);
        }
      });

      layer.addLayer(circle);
    });

    // 2. Render Historical Verified Flood Hotspots
    if (showHistorical && historicalEvents.length > 0) {
      historicalEvents.forEach((ev) => {
        const histIcon = L.divIcon({
          className: 'historical-marker',
          html: `
            <div style="
              width: 22px;
              height: 22px;
              background: #6366f1;
              border: 2px solid #ffffff;
              border-radius: 5px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
              font-size: 11px;
              color: white;
            ">🌊</div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([ev.latitude, ev.longitude], { icon: histIcon });

        const histPopup = `
          <div style="font-family: 'Inter', -apple-system, sans-serif; padding: 4px; min-width: 240px;">
            <div style="font-size: 0.7rem; color: #a5b4fc; text-transform: uppercase; font-weight: 700;">
              Historical Flood Incident
            </div>
            <strong style="color: #f1f5f9; font-size: 0.9rem; display: block; margin: 2px 0 4px;">
              ${ev.event_name}
            </strong>
            <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 6px;">
              ${ev.location_name} • ${new Date(ev.incident_timestamp).toLocaleDateString()}
            </div>
            <p style="font-size: 0.75rem; color: #cbd5e1; margin-bottom: 6px; line-height: 1.35;">
              ${ev.impact_summary}
            </p>
            <div style="font-size: 0.7rem; color: #10b981; background: rgba(16,185,129,0.12); padding: 3px 6px; border-radius: 4px;">
              ✓ ${ev.verification_status} (${ev.source})
            </div>
          </div>
        `;

        marker.bindPopup(histPopup);
        layer.addLayer(marker);
      });
    }
  }, [stations, historicalEvents, riskFilter, showHistorical, searchTerm, onSelectStation]);

  // Pan to selected station
  useEffect(() => {
    if (!selectedStationId || !mapInstanceRef.current) return;
    const target = stations.find((s) => s.location_id === selectedStationId);
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 14, { duration: 1.2 });
    }
  }, [selectedStationId, stations]);

  const handleCenterCoimbatore = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([11.0168, 76.9558], 12, { duration: 1 });
    }
  };

  const currentLayer = MAP_LAYERS[activeLayerId] || MAP_LAYERS['google-hybrid'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 999 : undefined,
        background: isFullscreen ? 'var(--bg-primary)' : undefined,
        padding: isFullscreen ? '1rem' : undefined,
      }}
    >
      {/* Top Map Control Bar */}
      <div
        className="dashboard-card"
        style={{
          padding: '0.65rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 220px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            placeholder="Search catchments (e.g. Lanka Corner, Ukkadam, Singanallur)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.35rem 0.65rem' }}
          />
        </div>

        {/* Layer Selector & Overlays */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Base Layer Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Layers size={15} color="var(--accent-blue)" />
            <select
              value={activeLayerId}
              onChange={(e) => setActiveLayerId(e.target.value as MapLayerId)}
              className="input-field"
              style={{
                padding: '0.3rem 0.5rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-hover)',
              }}
            >
              <optgroup label="Google Maps (Real-Time)">
                <option value="google-hybrid">🛰️ Google Hybrid (Satellite + Roads)</option>
                <option value="google-satellite">🌍 Google Satellite</option>
                <option value="google-terrain">🏔️ Google Terrain (Contours)</option>
                <option value="google-roadmap">🚗 Google Standard Roadmap</option>
              </optgroup>
              <optgroup label="OpenStreetMap">
                <option value="osm-standard">🌐 OSM Standard (Free)</option>
                <option value="osm-hot">💧 OSM Humanitarian (Hydrology)</option>
              </optgroup>
              <optgroup label="Mapbox GL">
                <option value="mapbox-dark">🌌 Mapbox Dark Telemetry</option>
                <option value="mapbox-satellite">🛰️ Mapbox Satellite Streets</option>
              </optgroup>
            </select>
          </div>

          {/* Real-time Weather Doppler Radar Toggle */}
          <button
            type="button"
            onClick={() => setShowLiveRadar(!showLiveRadar)}
            className={`btn ${showLiveRadar ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: showLiveRadar ? 'linear-gradient(135deg, #0284c7, #2563eb)' : undefined,
              borderColor: showLiveRadar ? '#38bdf8' : undefined,
            }}
            title="Toggle Live Rain & Cloud Doppler Radar overlay"
          >
            <CloudRain size={14} />
            <span>Live Radar</span>
            {showLiveRadar && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#38bdf8',
                  boxShadow: '0 0 6px #38bdf8',
                }}
              />
            )}
          </button>

          {/* Real-time Traffic Toggle */}
          <button
            type="button"
            onClick={() => setShowTraffic(!showTraffic)}
            className={`btn ${showTraffic ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title="Toggle Google Maps Live Traffic congestion"
          >
            <TrafficCone size={14} />
            <span>Traffic</span>
          </button>

          {/* Risk Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="input-field"
              style={{ padding: '0.3rem 0.5rem', width: 'auto', fontSize: '0.78rem' }}
            >
              <option value="ALL">All Stations (10)</option>
              <option value="ELEVATED">Elevated (High & Severe)</option>
              <option value="CRITICAL">Severe Only</option>
            </select>
          </div>

          {/* API Keys Configuration Button */}
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className="btn btn-secondary"
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: apiKeys.googleMapsKey || apiKeys.mapboxToken ? '1px solid #10b981' : undefined,
            }}
            title="Configure Google Maps API Key, Mapbox, or Weather API Keys"
          >
            <Key size={14} color={apiKeys.googleMapsKey ? '#10b981' : 'var(--text-muted)'} />
            <span>API Keys</span>
            {(apiKeys.googleMapsKey || apiKeys.mapboxToken) && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
            )}
          </button>

          {/* Recenter */}
          <button
            type="button"
            onClick={handleCenterCoimbatore}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.5rem' }}
            title="Recenter on Coimbatore"
          >
            <Compass size={15} />
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.5rem' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : '480px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Provider Badge */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(11, 19, 41, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-hover)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-main)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: '1.05rem' }}>{currentLayer.icon}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{currentLayer.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {currentLayer.provider} • Coimbatore 11.0168° N, 76.9558° E
            </div>
          </div>
          {apiKeys.googleMapsKey && currentLayer.provider === 'Google Maps' && (
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '2px 5px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              API KEY ACTIVE
            </span>
          )}
        </div>

        {/* Floating Map Legend & Overlay Status */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(11, 19, 41, 0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            maxWidth: '260px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Catchment Risk Legend</span>
            {showLiveRadar && (
              <span style={{ fontSize: '0.68rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CloudRain size={11} /> Live Radar
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span>Severe Risk Catchment (&gt;75%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
              <span>High Flood Probability (50-75%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
              <span>Moderate Ponding Risk (25-50%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span>Low Risk / Normal Flow (&lt;25%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '11px' }}>🌊</span>
              <span>Verified Historical Inundation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map API Key Modal */}
      <MapApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeysSaved={(newKeys) => setApiKeys(newKeys)}
      />
    </div>
  );
};
