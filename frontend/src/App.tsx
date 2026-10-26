import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { MapView } from './pages/MapView';
import { WeatherMonitoring } from './pages/WeatherMonitoring';
import { FloodPrediction } from './pages/FloodPrediction';
import { HistoricalEvents } from './pages/HistoricalEvents';
import { AlertsManagement } from './pages/AlertsManagement';
import { AdminDataQuality } from './pages/AdminDataQuality';
import { api } from './services/api';
import {
  CityNowcastRisk,
  CurrentRainfall,
  CurrentWeather,
  EarlyWarningAlert,
  FloodEventItem,
  LocationStation,
  RainfallHistoryPoint,
} from './types';
import { AlertTriangle, PhoneCall, Radio, RefreshCw, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Application Data States
  const [locations, setLocations] = useState<LocationStation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('CBE-01');
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [rainfall, setRainfall] = useState<CurrentRainfall | null>(null);
  const [rainfallHistory, setRainfallHistory] = useState<RainfallHistoryPoint[]>([]);
  const [nowcast, setNowcast] = useState<CityNowcastRisk | null>(null);
  const [floodEvents, setFloodEvents] = useState<FloodEventItem[]>([]);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [dataFreshness, setDataFreshness] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  // Sync theme attribute on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Primary Data Loading Function
  const loadCoreData = async () => {
    try {
      const [locsRes, weatherRes, rainRes, histRes, riskRes, eventsRes, alertsRes] =
        await Promise.allSettled([
          api.getLocations(),
          api.getCurrentWeather(selectedLocationId),
          api.getCurrentRainfall(selectedLocationId),
          api.getRainfallHistory(selectedLocationId, '24h'),
          api.getFloodRiskNowcast(),
          api.getFloodEvents(),
          api.getAlerts(false),
        ]);

      if (locsRes.status === 'fulfilled') setLocations(locsRes.value);
      if (weatherRes.status === 'fulfilled') {
        setWeather(weatherRes.value);
        setDataFreshness(weatherRes.value.data_freshness_seconds || 0);
      }
      if (rainRes.status === 'fulfilled') setRainfall(rainRes.value);
      if (histRes.status === 'fulfilled') setRainfallHistory(histRes.value.history);
      if (riskRes.status === 'fulfilled') setNowcast(riskRes.value);
      if (eventsRes.status === 'fulfilled') setFloodEvents(eventsRes.value);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value);

      setBackendOnline(true);
    } catch (err) {
      console.warn('API sync warning:', err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic telemetry refresh every 60s
  useEffect(() => {
    loadCoreData();
    const interval = setInterval(() => {
      loadCoreData();
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedLocationId]);

  const activeAlertCount = alerts.filter((a) => a.is_active).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Top Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAlertCount={activeAlertCount}
        theme={theme}
        setTheme={setTheme}
        dataFreshnessSeconds={dataFreshness}
      />

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem',
        }}
      >
        {activeTab === 'overview' && (
          <OverviewDashboard
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
            weather={weather}
            rainfall={rainfall}
            rainfallHistory={rainfallHistory}
            nowcast={nowcast}
            alerts={alerts}
            historicalCount={floodEvents.length}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            stations={nowcast?.stations || []}
            historicalEvents={floodEvents}
            selectedStationId={selectedLocationId}
            onSelectStation={setSelectedLocationId}
            onNavigateToPrediction={(id) => {
              setSelectedLocationId(id);
              setActiveTab('prediction');
            }}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherMonitoring
            weather={weather}
            rainfall={rainfall}
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
          />
        )}

        {activeTab === 'prediction' && (
          <FloodPrediction
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
          />
        )}

        {activeTab === 'historical' && <HistoricalEvents events={floodEvents} />}

        {activeTab === 'alerts' && (
          <AlertsManagement
            alerts={alerts}
            locations={locations}
            onRefreshAlerts={loadCoreData}
          />
        )}

        {activeTab === 'admin' && <AdminDataQuality locations={locations} />}
      </main>

      {/* Emergency Hotline & Status Footer */}
      <footer
        style={{
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.5rem',
          marginTop: 'auto',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: backendOnline ? '#10b981' : '#f59e0b' }} />
            <span>FastAPI & Random Forest AI Engine: <strong>{backendOnline ? 'CONNECTED' : 'DISCONNECTED / OFFLINE SIMULATION'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 600 }}>
              <PhoneCall size={13} /> Coimbatore Disaster Control Room: 1077 / 0422-2301114
            </span>
            <span>TNSDMA State Emergency Desk: 1070</span>
            <span>Version 1.0.0 (Production Release)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
