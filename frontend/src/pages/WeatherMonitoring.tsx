import React, { useEffect, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { CurrentRainfall, CurrentWeather, HourlyForecast, LocationStation } from '../types';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  Key,
  Radio,
  RefreshCw,
  ShieldCheck,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { WeatherApiKeyModal } from '../components/WeatherApiKeyModal';

interface WeatherMonitoringProps {
  weather: CurrentWeather | null;
  rainfall: CurrentRainfall | null;
  locations: LocationStation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
}

export const WeatherMonitoring: React.FC<WeatherMonitoringProps> = ({
  weather,
  rainfall,
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [weatherStatus, setWeatherStatus] = useState<{
    active_provider: string;
    has_api_key: boolean;
    masked_api_key?: string;
    provider_status: string;
    source: string;
  } | null>(null);

  const loadWeatherStatus = async () => {
    try {
      const res = await api.getWeatherStatus();
      setWeatherStatus(res);
    } catch (e) {
      console.warn('Could not load weather provider status:', e);
    }
  };

  const loadForecast = async () => {
    setLoadingForecast(true);
    try {
      const res = await api.getWeatherForecast(selectedLocationId);
      if (res && res.hourly) {
        setHourlyForecast(res.hourly);
      }
    } catch (e) {
      console.warn('Failed to load hourly forecast:', e);
    } finally {
      setLoadingForecast(false);
    }
  };

  useEffect(() => {
    loadForecast();
    loadWeatherStatus();
  }, [selectedLocationId]);

  const formattedForecast = hourlyForecast.map((h) => {
    const dt = new Date(h.time);
    return {
      ...h,
      timeLabel: `${dt.getHours().toString().padStart(2, '0')}:00`,
    };
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Station Selector Bar */}
      <div
        className="dashboard-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Atmospheric Observations & Radar Nowcast
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
            Multi-sensor meteorological tracking across Coimbatore urban basin
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Provider Status Pill */}
          <div
            onClick={() => setIsKeyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: weatherStatus?.has_api_key ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-elevated)',
              border: weatherStatus?.has_api_key ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.78rem',
            }}
            title="Click to configure Real-Time Weather API Key"
          >
            <Key size={14} color={weatherStatus?.has_api_key ? '#10b981' : 'var(--accent-blue)'} />
            <span style={{ fontWeight: 600, color: weatherStatus?.has_api_key ? '#a7f3d0' : 'var(--text-main)' }}>
              {weatherStatus?.has_api_key
                ? `Real-Time Key Active (${weatherStatus.active_provider.toUpperCase()})`
                : 'Free Tier (Open-Meteo)'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-blue)',
                textDecoration: 'underline',
                marginLeft: '4px',
              }}
            >
              Configure
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Station:</span>
            <select
              value={selectedLocationId}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="input-field"
              style={{ minWidth: '220px' }}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Atmospheric Gauge Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.1)' }}>
            <Thermometer size={28} color="#eab308" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Surface Temperature</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {weather?.temperature_c !== null ? `${weather?.temperature_c}°C` : 'Unavailable'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              {weather?.weather_description || 'Clear'}
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.1)' }}>
            <Droplets size={28} color="#06b6d4" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Relative Humidity</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {weather?.relative_humidity_pct !== null ? `${weather?.relative_humidity_pct}%` : 'Unavailable'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>Dew point saturation</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)' }}>
            <Wind size={28} color="#a855f7" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wind Speed & Direction</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {weather?.wind_speed_kmh !== null ? `${weather?.wind_speed_kmh} km/h` : 'Unavailable'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              Bearing: {weather?.wind_direction_deg ?? 210}° (Southwest monsoon)
            </div>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)' }}>
            <Gauge size={28} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Surface Pressure</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {weather?.surface_pressure_hpa !== null ? `${weather?.surface_pressure_hpa} hPa` : 'Unavailable'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>MSL Barometric index</div>
          </div>
        </div>
      </div>

      {/* Hourly Short-Term Forecast: Precipitation Probability & Temperature */}
      <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              24-Hour Short-Term Precipitation Probability & Temperature Forecast
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Hourly prediction derived from Open-Meteo European Numerical Weather Model (ECMWF & GFS)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            <Radio size={14} /> Live Model Horizon
          </div>
        </div>

        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedForecast} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#38bdf8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} unit="°C" domain={[20, 40]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0c152a',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
                formatter={(val: any, name: any) => [
                  name === 'precipitation_probability' ? `${val}%` : `${val}°C`,
                  name === 'precipitation_probability' ? 'Precipitation Prob.' : 'Temperature',
                ]}
              />
              <Bar
                yAxisId="left"
                dataKey="precipitation_probability"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                barSize={16}
                opacity={0.8}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="temperature_c"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 3, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Station Rainfall Comparison Table */}
      <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Coimbatore Basin Micro-Catchment Precipitation Summary
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Station ID</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Catchment Name</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Ward</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Elevation</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Drainage Cap.</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Impervious</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Baseline Risk</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr
                  key={loc.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: loc.id === selectedLocationId ? 'var(--bg-elevated)' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectLocation(loc.id)}
                >
                  <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--accent-blue)' }}>{loc.id}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-main)', fontWeight: 500 }}>{loc.name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{loc.ward || 'Coimbatore'}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{loc.elevation_m} m</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{(loc.drainage_capacity_index * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{(loc.impervious_ratio * 100).toFixed(0)}%</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: loc.risk_baseline === 'Severe' ? '#ef4444' : loc.risk_baseline === 'High' ? '#f97316' : '#10b981' }}>
                      {loc.risk_baseline}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weather API Key Modal */}
      <WeatherApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyUpdated={() => {
          loadForecast();
          loadWeatherStatus();
        }}
      />
    </div>
  );
};
