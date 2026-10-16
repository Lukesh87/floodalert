import React from 'react';
import { CloudRain, Waves, Gauge, AlertTriangle, ArrowUpRight, Radio, Compass, RefreshCw, Zap } from 'lucide-react';

export default function DashboardOverview({ summary, stations, trend, onSelectStation, onOpenSimulator }) {
  const getRiskClass = (level) => `badge-${level || 'LOW'}`;

  return (
    <div>
      {/* Top 4 Metric Cards */}
      <div className="grid-metrics">
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Live Precipitation</div>
            <div className="metric-value">
              {summary?.current_rainfall || 0}
              <span className="metric-unit">mm/h</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.4rem' }}>
              Intensity: <strong style={{ color: '#00F0FF' }}>{summary?.rainfall_intensity || 0} mm/h</strong>
            </div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#38BDF8' }}>
            <CloudRain size={28} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Drain Depth Level</div>
            <div className="metric-value">
              {summary?.water_level || 0}
              <span className="metric-unit">cm</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.4rem' }}>
              Sensor Baseline: <strong style={{ color: '#10B981' }}>Normal Sub-grade</strong>
            </div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#00F0FF' }}>
            <Waves size={28} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">AI Max Risk Prediction</div>
            <div className="metric-value" style={{ color: summary?.current_flood_risk >= 70 ? '#EF4444' : '#F59E0B' }}>
              {summary?.current_flood_risk || 0}%
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span className={`status-pill ${getRiskClass(summary?.risk_status)}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}>
                {summary?.risk_status || 'LOW'} SEVERITY
              </span>
            </div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: summary?.current_flood_risk >= 70 ? '#EF4444' : '#F59E0B' }}>
            <Gauge size={28} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Active Emergency Warnings</div>
            <div className="metric-value" style={{ color: '#EF4444' }}>
              {summary?.active_alerts || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.4rem' }}>
              Stations Monitored: <strong style={{ color: '#FFF' }}>{summary?.monitored_locations || 8}</strong>
            </div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#EF4444' }}>
            <AlertTriangle size={28} />
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart & Quick AI Simulation Launcher */}
      <div className="dashboard-grid">
        {/* Left: Dynamic Hydrological Rainfall & Flood Risk Trend */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Radio size={20} color="#00F0FF" />
                <span>12-Hour Hydro-Meteorological Telemetry Trend</span>
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Correlating precipitation rates, drainage water level, and ML predicted inundation probability.
              </p>
            </div>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#00F0FF', background: 'rgba(0, 240, 255, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
              RF Regressor v1.0
            </span>
          </div>

          {/* Trend Bar Chart Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {trend.map((item, idx) => {
              const probPct = Math.round(item.predicted_probability * 100);
              const isHigh = probPct >= 60;
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 60px 100px', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>{item.time}</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#CBD5E1' }}>
                      <span>Rain: <strong>{item.rainfall} mm/h</strong></span>
                      <span>Drain: <strong>{item.water_level} cm</strong></span>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${probPct}%`, 
                          background: isHigh ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'linear-gradient(90deg, #10B981, #38BDF8)',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>

                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isHigh ? '#EF4444' : '#10B981', textAlign: 'right' }}>
                    {probPct}%
                  </span>

                  <span className={`status-pill ${getRiskClass(isHigh ? (probPct >= 80 ? 'CRITICAL' : 'HIGH') : (probPct >= 30 ? 'MODERATE' : 'LOW'))}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', justifyContent: 'center' }}>
                    {isHigh ? (probPct >= 80 ? 'CRITICAL' : 'HIGH') : (probPct >= 30 ? 'MODERATE' : 'LOW')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Station Status & Simulation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(13, 21, 39, 0.8) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Zap size={24} color="#00F0FF" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>AI Nowcasting Simulator</h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Input hypothetical rainfall rates, storm surge, and water levels to test machine learning predictions in real-time.
            </p>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onOpenSimulator}>
              <span>Launch Interactive Simulator</span>
              <ArrowUpRight size={18} />
            </button>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="#38BDF8" />
              <span>High-Risk Stations</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stations.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH').slice(0, 4).map(st => (
                <div 
                  key={st.id} 
                  onClick={() => onSelectStation(st)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{st.name}</span>
                    <span className={`status-pill ${getRiskClass(st.risk_level)}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                      {st.risk_level}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                    <span>Water: <strong style={{ color: '#FFF' }}>{st.water_level} cm</strong></span>
                    <span>Elevation: <strong style={{ color: '#00F0FF' }}>{st.elevation} m</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
