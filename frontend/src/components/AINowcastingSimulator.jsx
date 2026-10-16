import React, { useState } from 'react';
import { Cpu, Play, Sliders, CheckCircle2, AlertOctagon, TrendingUp, Info, ShieldAlert } from 'lucide-react';
import { predictCustomFlood } from '../api';

export default function AINowcastingSimulator({ stations }) {
  const [formData, setFormData] = useState({
    location_id: 1,
    rainfall_15min: 35.0,
    rainfall_30min: 55.0,
    rainfall_60min: 80.0,
    rainfall_intensity: 75.0,
    water_level: 95.0,
    water_level_change: 12.0,
    elevation: 10.5,
    slope: 1.5,
    historical_flood_count: 7,
    drainage_risk: 0.85
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await predictCustomFlood(formData);
      setResult(res);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={24} color="#00F0FF" />
          <span>Interactive Machine Learning Nowcasting Engine</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
          Simulate severe storm precipitation, runoff, and topographic parameters to test the Random Forest Regressor model.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.75rem' }}>
        {/* Left: Input Form / Controls */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="#38BDF8" />
            <span>Hydrological Feature Parameters</span>
          </h3>

          <form onSubmit={handlePredict}>
            {/* Target Location Select */}
            <div className="form-group">
              <label className="form-label">Target Monitoring Station</label>
              <select className="form-select" name="location_id" value={formData.location_id} onChange={handleChange}>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.zone})</option>
                ))}
              </select>
            </div>

            {/* Precipitation Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">30-min Rainfall ({formData.rainfall_30min} mm)</label>
                <input type="range" className="range-slider" min="0" max="120" step="1" name="rainfall_30min" value={formData.rainfall_30min} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Precip Intensity ({formData.rainfall_intensity} mm/h)</label>
                <input type="range" className="range-slider" min="0" max="150" step="1" name="rainfall_intensity" value={formData.rainfall_intensity} onChange={handleChange} />
              </div>
            </div>

            {/* Water Sensor Sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Drain Depth ({formData.water_level} cm)</label>
                <input type="range" className="range-slider" min="0" max="250" step="1" name="water_level" value={formData.water_level} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Level Change (+{formData.water_level_change} cm/15m)</label>
                <input type="range" className="range-slider" min="-20" max="50" step="1" name="water_level_change" value={formData.water_level_change} onChange={handleChange} />
              </div>
            </div>

            {/* Elevation & Terrain */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Elevation ({formData.elevation} m ASL)</label>
                <input type="range" className="range-slider" min="2" max="60" step="0.5" name="elevation" value={formData.elevation} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label">Drainage Vulnerability Risk ({formData.drainage_risk})</label>
                <input type="range" className="range-slider" min="0.05" max="0.95" step="0.05" name="drainage_risk" value={formData.drainage_risk} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '0.85rem' }} disabled={loading}>
              <Play size={18} />
              <span>{loading ? 'Executing ML Pipeline...' : 'Run Random Forest ML Nowcast'}</span>
            </button>
          </form>
        </div>

        {/* Right: Real-time Prediction Output */}
        <div>
          {result ? (
            <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(18, 28, 51, 0.85) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="mono" style={{ fontSize: '0.75rem', color: '#00F0FF' }}>MODEL INFERENCE OUTPUT</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem' }}>{result.location_name || 'Simulated Location'}</h3>
                </div>
                <span className={`status-pill badge-${result.risk_level}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>
                  {result.risk_level} SEVERITY
                </span>
              </div>

              {/* Forecast Horizon Cards */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Multi-Horizon Nowcast Forecast
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>30 Minutes</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.forecast['30_min'] >= 0.6 ? '#EF4444' : '#38BDF8', marginTop: '0.2rem' }}>
                      {Math.round(result.forecast['30_min'] * 100)}%
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 240, 255, 0.08)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#00F0FF', fontWeight: 700 }}>60 Min (Peak)</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.forecast['60_min'] >= 0.6 ? '#EF4444' : '#00F0FF', marginTop: '0.2rem' }}>
                      {Math.round(result.forecast['60_min'] * 100)}%
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.85rem', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>120 Minutes</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: result.forecast['120_min'] >= 0.6 ? '#EF4444' : '#38BDF8', marginTop: '0.2rem' }}>
                      {Math.round(result.forecast['120_min'] * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Natural Language Explanation */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>AI Decision Explanation</div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#E2E8F0' }}>{result.explanation}</p>
              </div>

              {/* Key Contributing Factors */}
              {result.risk_factors && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Dominant Risk Drivers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {result.risk_factors.map((rf, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{rf.factor}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{rf.description}</div>
                        </div>
                        <span className={`status-pill badge-${rf.impact}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                          {rf.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <Cpu size={48} color="#38BDF8" style={{ marginBottom: '1rem', opacity: 0.7 }} />
              <h3 style={{ color: '#FFF', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Ready for Model Execution</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '360px' }}>
                Adjust parameters on the left and click "Run Random Forest ML Nowcast" to compute flood probability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
