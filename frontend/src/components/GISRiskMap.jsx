import React, { useState } from 'react';
import { MapPin, Navigation, Droplets, Mountain, ShieldAlert, Activity, CheckCircle, Info } from 'lucide-react';

export default function GISRiskMap({ stations, onSelectStation }) {
  const [selected, setSelected] = useState(stations[0] || null);

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#EF4444';
      case 'HIGH': return '#F97316';
      case 'MODERATE': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Urban Hydro-Geographical Risk Map</h2>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
            Real-time elevation-aware spatial monitoring across 8 urban runoff corridors.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(13, 21, 39, 0.8)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} /> Critical (&gt;80%)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316' }} /> High (60–80%)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} /> Moderate (30–60%)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} /> Low (&lt;30%)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Spatial Interactive Visual Grid */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '520px', position: 'relative', overflow: 'hidden', background: '#090F1E', border: '1px solid var(--border-color)' }}>
          {/* Simulated Geographic Grid Lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

          {/* Contour elevation simulation background */}
          <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="mono" style={{ fontSize: '0.75rem', color: '#00F0FF', background: 'rgba(0, 240, 255, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                SPATIAL BOUNDS: 11.01° N, 76.96° E — METRO SECTOR 4
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Click marker for telemetry drilldown</span>
            </div>

            {/* Render Map Nodes based on relative coordinates */}
            <div style={{ position: 'relative', height: '420px', margin: '1rem 0' }}>
              {stations.map((st, idx) => {
                // Map latitude/longitude offsets onto relative percentage space
                const minLat = 10.99, maxLat = 11.05;
                const minLng = 76.93, maxLng = 77.02;
                
                const topPct = Math.max(10, Math.min(85, 100 - ((st.latitude - minLat) / (maxLat - minLat)) * 100));
                const leftPct = Math.max(10, Math.min(85, ((st.longitude - minLng) / (maxLng - minLng)) * 100));

                const color = getRiskColor(st.risk_level);
                const isSelected = selected?.id === st.id;

                return (
                  <div
                    key={st.id}
                    onClick={() => { setSelected(st); if (onSelectStation) onSelectStation(st); }}
                    style={{
                      position: 'absolute',
                      top: `${topPct}%`,
                      left: `${leftPct}%`,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: isSelected ? 20 : 10,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {/* Ripple animation for high/critical nodes */}
                    {(st.risk_level === 'CRITICAL' || st.risk_level === 'HIGH') && (
                      <div style={{
                        position: 'absolute',
                        inset: '-10px',
                        borderRadius: '50%',
                        border: `2px solid ${color}`,
                        animation: 'pulse 1.8s infinite',
                        opacity: 0.6
                      }} />
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)',
                      padding: '0.4rem 0.7rem',
                      borderRadius: '20px',
                      border: `2px solid ${color}`,
                      boxShadow: isSelected ? `0 0 20px ${color}` : `0 0 10px rgba(0,0,0,0.5)`
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFF' }}>{st.name.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Scale: 1 : 25,000</span>
              <span>Elevation Model: High-Res DEM (10m Resolution)</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Station Deep Details */}
        {selected && (
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div className="status-pill" style={{ display: 'inline-flex', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}>
                Station ID #{selected.id}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selected.name}</h3>
              <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Zone: <strong style={{ color: '#FFF' }}>{selected.zone}</strong>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Nowcast Risk Level</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span className={`status-pill badge-${selected.risk_level}`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
                  {selected.risk_level} SEVERITY
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: getRiskColor(selected.risk_level) }}>
                  {Math.round((selected.flood_probability || 0.5) * 100)}%
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Droplets size={14} color="#00F0FF" /> Water Depth
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {selected.water_level} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8' }}>cm</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mountain size={14} color="#38BDF8" /> Elevation
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {selected.elevation} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8' }}>m ASL</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.825rem', color: '#CBD5E1', background: 'rgba(56, 189, 248, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '0.35rem' }}>Hydro-Geological Risk Profile:</strong>
              Low elevation combined with dense urban infrastructure increases runoff accumulation time by 45%. Recommended pump dispatch ready.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
