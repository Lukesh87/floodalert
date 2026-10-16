import React from 'react';
import { BarChart3, Award, Database, Cpu, Layers, CheckCircle } from 'lucide-react';

export default function HistoricalAnalytics() {
  const featureImportances = [
    { feature: "Rainfall Intensity (mm/h)", importance: 26.31, description: "Peak precipitation rate overloading urban storm catch basins." },
    { feature: "Topographic Elevation (m ASL)", importance: 16.13, description: "Lowland depression factor promoting overland runoff aggregation." },
    { feature: "60-Min Cumulative Rainfall", importance: 14.75, description: "Sustained storm volume exceeding sub-grade absorption capacity." },
    { feature: "Water Level Depth (cm)", importance: 9.17, description: "Direct ultrasonic water level sensor reading in storm channels." },
    { feature: "30-Min Cumulative Rainfall", importance: 8.00, description: "Short-term storm acceleration metric." },
    { feature: "Drainage Risk Factor", importance: 7.17, description: "Infrastructure vulnerability index based on conduit cross-section." },
    { feature: "Slope Steepness (%)", importance: 5.38, description: "Gravitational flow rate down urban street gradients." },
    { feature: "Water Level Change Rate", importance: 4.88, description: "Surge rate per 15-minute interval." }
  ];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={24} color="#00F0FF" />
          <span>Machine Learning Model Performance & Hydrological Analytics</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
          Evaluation metrics and feature importances extracted from the trained Random Forest model.
        </p>
      </div>

      {/* Model Benchmark Cards */}
      <div className="grid-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Accuracy (R² Score)</div>
            <div className="metric-value" style={{ color: '#10B981' }}>82.76%</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>High Nowcast Fidelity</div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#10B981' }}>
            <Award size={26} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Mean Squared Error</div>
            <div className="metric-value" style={{ color: '#00F0FF' }}>0.0021</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>Residual Variance</div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#00F0FF' }}>
            <Cpu size={26} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Training Samples</div>
            <div className="metric-value">2,500</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>Hydro-Sensor Telemetry</div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#38BDF8' }}>
            <Database size={26} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div>
            <div className="metric-title">Estimator Trees</div>
            <div className="metric-value">150</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>Max Depth: 12</div>
          </div>
          <div className="metric-icon-wrapper" style={{ color: '#F59E0B' }}>
            <Layers size={26} />
          </div>
        </div>
      </div>

      {/* Feature Importances Ranking */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Machine Learning Feature Importance Weights
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {featureImportances.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '240px 1fr 80px', alignItems: 'center', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item.feature}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.description}</div>
              </div>

              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${item.importance * 3.2}%`, 
                    background: 'linear-gradient(90deg, #0284C7 0%, #00F0FF 100%)', 
                    borderRadius: '999px' 
                  }} 
                />
              </div>

              <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00F0FF', textAlign: 'right' }}>
                {item.importance}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
