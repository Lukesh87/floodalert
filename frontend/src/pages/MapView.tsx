import React, { useState } from 'react';
import { InteractiveMap } from '../components/InteractiveMap';
import { RiskBadge } from '../components/RiskBadge';
import { FloodEventItem, StationRiskItem } from '../types';
import {
  Activity,
  Compass,
  Droplets,
  ExternalLink,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface MapViewProps {
  stations: StationRiskItem[];
  historicalEvents: FloodEventItem[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  onNavigateToPrediction: (stationId: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  stations,
  historicalEvents,
  selectedStationId,
  onSelectStation,
  onNavigateToPrediction,
}) => {
  const selectedStation = stations.find((s) => s.location_id === selectedStationId) || stations[0];

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 380px) 1fr',
        gap: '1.25rem',
        minHeight: 'calc(100vh - 190px)',
      }}
    >
      {/* Station Hydrological Inspection Drawer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {selectedStation ? (
          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Station Telemetry Profile
                </span>
                <RiskBadge category={selectedStation.risk_category} size="sm" />
              </div>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.2rem' }}>
                {selectedStation.location_name}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedStation.ward || 'Central Municipal Ward'} • Station ID: <code>{selectedStation.location_id}</code>
              </div>
            </div>

            {/* Estimated Risk Gauge */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '0.85rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nowcast Flood Probability</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  {(selectedStation.flood_probability * 100).toFixed(1)}%
                </strong>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, selectedStation.flood_probability * 100)}%`,
                    height: '100%',
                    background:
                      selectedStation.risk_category === 'Severe'
                        ? '#ef4444'
                        : selectedStation.risk_category === 'High'
                        ? '#f97316'
                        : selectedStation.risk_category === 'Moderate'
                        ? '#eab308'
                        : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                <span>Low (&lt;25%)</span>
                <span>Moderate (25-50%)</span>
                <span>High (50-75%)</span>
                <span>Severe (&gt;75%)</span>
              </div>
            </div>

            {/* Micro-Catchment Physical Attributes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Elevation MSL</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedStation.elevation_m} m</strong>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Slope Gradient</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedStation.slope_deg}°</strong>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Drainage Index</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {(selectedStation.drainage_capacity_index * 100).toFixed(0)}%
                </strong>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Impervious Ratio</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {(selectedStation.impervious_ratio * 100).toFixed(0)}%
                </strong>
              </div>
            </div>

            {/* Rainfall Accumulations */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Observed Precipitation
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>1h Rate</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                    {selectedStation.rainfall_1h_mm} mm/h
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>3h Total</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {selectedStation.rainfall_3h_mm} mm
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>24h Total</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedStation.rainfall_24h_mm} mm
                  </div>
                </div>
              </div>
            </div>

            {/* Run Custom ML Prediction on This Station */}
            <button
              onClick={() => onNavigateToPrediction(selectedStation.location_id)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              <Activity size={16} /> Simulate / Predict with ML
            </button>
          </div>
        ) : (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <MapPin size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Select a station on the map to inspect micro-catchment parameters.
            </p>
          </div>
        )}

        {/* Catchment Quick-Jump List */}
        <div className="dashboard-card" style={{ flex: 1, overflowY: 'auto', maxHeight: '350px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Coimbatore Monitoring Catchments ({stations.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {stations.map((st) => (
              <div
                key={st.location_id}
                onClick={() => onSelectStation(st.location_id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: selectedStationId === st.location_id ? 'var(--bg-elevated)' : 'transparent',
                  border: selectedStationId === st.location_id ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{st.location_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{st.elevation_m}m • {st.rainfall_1h_mm} mm/h</div>
                </div>
                <RiskBadge category={st.risk_category} size="sm" showPulse={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <div style={{ height: '100%', minHeight: '520px' }}>
        <InteractiveMap
          stations={stations}
          historicalEvents={historicalEvents}
          selectedStationId={selectedStationId}
          onSelectStation={onSelectStation}
        />
      </div>
    </div>
  );
};
