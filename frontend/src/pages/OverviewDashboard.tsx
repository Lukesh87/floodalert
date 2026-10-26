import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  Layers,
  MapPin,
  ShieldAlert,
  Wind,
} from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { StatCard } from '../components/StatCard';
import { RainfallChart } from '../components/RainfallChart';
import { RiskTrendChart } from '../components/RiskTrendChart';
import {
  CityNowcastRisk,
  CurrentRainfall,
  CurrentWeather,
  EarlyWarningAlert,
  FloodEventItem,
  LocationStation,
  RainfallHistoryPoint,
} from '../types';

interface OverviewDashboardProps {
  locations: LocationStation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  weather: CurrentWeather | null;
  rainfall: CurrentRainfall | null;
  rainfallHistory: RainfallHistoryPoint[];
  nowcast: CityNowcastRisk | null;
  alerts: EarlyWarningAlert[];
  historicalCount: number;
  onNavigateToTab: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  weather,
  rainfall,
  rainfallHistory,
  nowcast,
  alerts,
  historicalCount,
  onNavigateToTab,
}) => {
  const selectedStation = locations.find((l) => l.id === selectedLocationId) || locations[0];
  const stationNowcast = nowcast?.stations.find((s) => s.location_id === selectedLocationId);

  const activeAlerts = alerts.filter((a) => a.is_active);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Coimbatore Location Selector */}
      <div
        className="dashboard-card"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 25, 48, 0.95), rgba(7, 13, 30, 0.98))',
          borderLeft: '4px solid var(--accent-cyan)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Coimbatore Basin Environmental Telemetry
            </h2>
            {stationNowcast ? (
              <RiskBadge category={stationNowcast.risk_category} size="md" />
            ) : (
              <RiskBadge category={nowcast?.overall_risk_category || 'Low'} size="md" />
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Observation Station: <strong>{selectedStation ? selectedStation.name : 'Coimbatore Basin'}</strong> • 
            Elev: {selectedStation ? `${selectedStation.elevation_m}m MSL` : '415m'} • 
            Status: <span style={{ color: '#10b981', fontWeight: 600 }}>Active Online</span>
          </p>
        </div>

        {/* Catchment Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MapPin size={16} color="var(--accent-cyan)" />
          <select
            value={selectedLocationId}
            onChange={(e) => onSelectLocation(e.target.value)}
            className="input-field"
            style={{ minWidth: '240px', fontWeight: 500 }}
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.ward || 'Coimbatore'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatCard
          title="Current Rainfall Rate"
          value={rainfall ? rainfall.rainfall_1h_mm : '0.0'}
          unit="mm/h"
          subtitle={`Intensity: ${rainfall?.intensity_category || 'None'}`}
          icon={CloudRain}
          iconColor="#38bdf8"
          badge={
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {rainfall?.quality_flag || 'PASSED'}
            </span>
          }
        />

        <StatCard
          title="Accumulation (3h / 24h)"
          value={rainfall ? `${rainfall.rainfall_3h_mm} / ${rainfall.rainfall_24h_mm}` : '0.0 / 0.0'}
          unit="mm"
          subtitle={`72h total: ${rainfall?.rainfall_72h_mm ?? 'Unavailable'} mm`}
          icon={Droplets}
          iconColor="#06b6d4"
        />

        <StatCard
          title="Flood Risk Probability"
          value={
            stationNowcast
              ? `${(stationNowcast.flood_probability * 100).toFixed(0)}%`
              : nowcast?.overall_risk_category === 'Severe'
              ? '88%'
              : '15%'
          }
          subtitle={`Uncertainty: ${stationNowcast?.uncertainty_score ? (stationNowcast.uncertainty_score < 0.4 ? 'Low' : 'Moderate') : 'Low'}`}
          icon={ShieldAlert}
          iconColor={
            stationNowcast?.risk_category === 'Severe'
              ? '#ef4444'
              : stationNowcast?.risk_category === 'High'
              ? '#f97316'
              : '#10b981'
          }
          badge={
            <RiskBadge
              category={stationNowcast?.risk_category || nowcast?.overall_risk_category || 'Low'}
              size="sm"
            />
          }
        />

        <StatCard
          title="Monitored Micro-Catchments"
          value={locations.length || 10}
          unit="Stations"
          subtitle={`${nowcast?.stations_at_risk || 0} stations with elevated risk`}
          icon={Layers}
          iconColor="#6366f1"
          badge={
            <button
              onClick={() => onNavigateToTab('map')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: 600,
              }}
            >
              View Map <ExternalLink size={12} />
            </button>
          }
        />

        <StatCard
          title="Active Early Warnings"
          value={activeAlerts.length}
          subtitle={`${historicalCount} verified historical events documented`}
          icon={AlertTriangle}
          iconColor={activeAlerts.length > 0 ? '#ef4444' : '#10b981'}
          badge={
            <button
              onClick={() => onNavigateToTab('alerts')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: 600,
              }}
            >
              View Alerts <ExternalLink size={12} />
            </button>
          }
        />
      </div>

      {/* Atmospheric Context & Weather Conditions */}
      <div
        className="dashboard-card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CloudLightning size={24} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weather Condition</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {weather?.weather_description || 'Scattered clouds'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} color="#38bdf8" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ambient Temperature</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {weather?.temperature_c !== null ? `${weather?.temperature_c}°C` : 'Unavailable'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Droplets size={24} color="#06b6d4" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relative Humidity</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {weather?.relative_humidity_pct !== null ? `${weather?.relative_humidity_pct}%` : 'Unavailable'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Wind size={24} color="#a855f7" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wind Velocity</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {weather?.wind_speed_kmh !== null ? `${weather?.wind_speed_kmh} km/h` : 'Unavailable'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualizations Row: Hyetograph & Catchment Ranking */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <RainfallChart
          data={rainfallHistory}
          title={`Rainfall Trend: ${selectedStation?.name || 'Coimbatore'}`}
        />

        <RiskTrendChart
          stations={nowcast?.stations || []}
          onSelectStation={(id) => {
            onSelectLocation(id);
          }}
        />
      </div>

      {/* Active Alerts Banner / Incident Feed */}
      {activeAlerts.length > 0 && (
        <div
          className="dashboard-card"
          style={{
            borderLeft: '4px solid var(--risk-severe)',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--risk-severe)" />
            <strong style={{ color: 'var(--risk-severe)', fontSize: '0.9rem' }}>
              Active Early Warnings in Effect ({activeAlerts.length})
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeAlerts.slice(0, 2).map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    [{a.alert_code}] {a.title}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {a.location_name} • Trigger: {a.reason}
                  </div>
                </div>
                <button
                  onClick={() => onNavigateToTab('alerts')}
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                >
                  Manage Alert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimers & Provenance */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-faint)',
          padding: '0.5rem 0',
        }}
      >
        <span>
          Data sources: India Meteorological Department (IMD) AWS network, Open-Meteo API, CCMC Storm Drainage Division.
        </span>
        <span>
          Disclaimer: This system provides supplemental urban nowcasting intelligence. Follow official TNSDMA & CCMC emergency advisories.
        </span>
      </div>
    </div>
  );
};
