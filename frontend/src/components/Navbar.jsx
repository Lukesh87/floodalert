import React from 'react';
import { ShieldAlert, Activity, Map, Cpu, Bell, BarChart3, Lock, CheckCircle2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, summary, user, setUser }) {
  return (
    <header className="navbar">
      <div className="logo-container">
        <div className="logo-icon">
          <ShieldAlert size={26} />
        </div>
        <div>
          <h1 className="logo-text">AQUA-CAST AI</h1>
          <div className="logo-sub">Urban Flood Nowcasting System</div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Activity size={18} />
          <span>Dashboard</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <Map size={18} />
          <span>GIS Risk Map</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Cpu size={18} />
          <span>AI Nowcasting</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={18} />
          <span>Alerts ({summary?.active_alerts || 0})</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="status-pill">
          <div className="pulse-dot" />
          <span>Live Telemetry</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#38BDF8" />
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span className="mono" style={{ fontSize: '0.7rem', background: '#0284C7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{user.role}</span>
          </div>
        ) : (
          <button 
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            onClick={() => setUser({ name: 'Emergency Operator', email: 'admin@floodwarning.gov', role: 'ADMIN' })}
          >
            <Lock size={15} />
            <span>Admin Auth</span>
          </button>
        )}
      </div>
    </header>
  );
}
