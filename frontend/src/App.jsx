import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardOverview from './components/DashboardOverview';
import GISRiskMap from './components/GISRiskMap';
import AINowcastingSimulator from './components/AINowcastingSimulator';
import AlertsManager from './components/AlertsManager';
import HistoricalAnalytics from './components/HistoricalAnalytics';

import { fetchSummary, fetchRiskMap, fetchRainfallTrend, fetchAlerts } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [stations, setStations] = useState([]);
  const [trend, setTrend] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);

  const loadAllData = async () => {
    try {
      const [sumData, mapData, trendData, alertsData] = await Promise.all([
        fetchSummary(),
        fetchRiskMap(),
        fetchRainfallTrend(),
        fetchAlerts()
      ]);
      setSummary(sumData);
      setStations(mapData);
      setTrend(trendData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    const timer = setInterval(loadAllData, 15000); // 15s auto-refresh
    return () => clearInterval(timer);
  }, []);

  const handleSelectStation = (st) => {
    setActiveTab('map');
  };

  const handleTriggerAlert = (newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
    if (summary) {
      setSummary(prev => ({ ...prev, active_alerts: (prev.active_alerts || 0) + 1 }));
    }
  };

  return (
    <div>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        summary={summary}
        user={user}
        setUser={setUser}
      />

      <main className="container">
        {activeTab === 'dashboard' && (
          <DashboardOverview 
            summary={summary}
            stations={stations}
            trend={trend}
            onSelectStation={handleSelectStation}
            onOpenSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'map' && (
          <GISRiskMap 
            stations={stations}
            onSelectStation={handleSelectStation}
          />
        )}

        {activeTab === 'simulator' && (
          <AINowcastingSimulator 
            stations={stations}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsManager 
            alerts={alerts}
            stations={stations}
            onTriggerAlert={handleTriggerAlert}
          />
        )}

        {activeTab === 'analytics' && (
          <HistoricalAnalytics />
        )}
      </main>
    </div>
  );
}
