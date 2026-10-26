import React from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CloudRain,
  Database,
  History,
  Layers,
  MapPin,
  Moon,
  Radio,
  Sun,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeAlertCount: number;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  dataFreshnessSeconds?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAlertCount,
  theme,
  setTheme,
  dataFreshnessSeconds = 0,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'map', label: 'Flood Map', icon: Layers },
    { id: 'weather', label: 'Rainfall & Weather', icon: CloudRain },
    { id: 'prediction', label: 'AI Prediction', icon: Activity },
    { id: 'historical', label: 'Historical Events', icon: History },
    {
      id: 'alerts',
      label: 'Early Warnings',
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    { id: 'admin', label: 'Data Quality & QA', icon: Database },
  ];

  return (
    <header
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
            }}
          >
            <CloudRain size={24} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)', margin: 0 }}>
                Urban Flood Nowcasting
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  fontWeight: 600,
                }}
              >
                <MapPin size={11} /> Coimbatore, TN
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              AI-Powered Hydrological Nowcasting & Early Warning Monitoring Platform
            </p>
          </div>
        </div>

        {/* Status Indicators & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <Radio size={14} color="#10b981" />
            <span>Telemetry:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {dataFreshnessSeconds === 0 ? 'Live (Synced)' : `${dataFreshnessSeconds}s ago`}
            </span>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-outline"
            style={{ padding: '0.4rem 0.65rem', borderRadius: '8px' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '0 1.5rem',
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          overflowX: 'auto',
          gap: '0.5rem',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: 'var(--risk-severe)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
