import React, { useState } from 'react';
import { FloodEventItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  Calendar,
  CheckCircle,
  Clock,
  Droplets,
  ExternalLink,
  Filter,
  History,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';

interface HistoricalEventsProps {
  events: FloodEventItem[];
}

export const HistoricalEvents: React.FC<HistoricalEventsProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredEvents = events.filter((ev) => {
    if (severityFilter !== 'ALL' && ev.severity !== severityFilter) {
      return false;
    }
    if (
      searchTerm &&
      !ev.event_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ev.location_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ev.impact_summary.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Filter Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <History size={22} color="#06b6d4" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Verified Historical Flood Incident Archive
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Documented urban inundation records across Coimbatore micro-catchments with meteorological correlation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search historical records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ width: '220px', padding: '0.35rem 0.65rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.65rem' }}
            >
              <option value="ALL">All Severities</option>
              <option value="Severe">Severe</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List / Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="dashboard-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              borderLeft:
                ev.severity === 'Severe'
                  ? '4px solid #ef4444'
                  : ev.severity === 'High'
                  ? '4px solid #f97316'
                  : ev.severity === 'Moderate'
                  ? '4px solid #eab308'
                  : '4px solid #10b981',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                    {ev.id}
                  </code>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {new Date(ev.incident_timestamp).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {ev.location_name}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {ev.event_name}
                </h3>
              </div>

              <RiskBadge category={ev.severity} size="md" />
            </div>

            {/* Impact Summary */}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
              {ev.impact_summary}
            </p>

            {/* Recorded Meteorological Measurements */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.65rem',
                background: 'var(--bg-secondary)',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rainfall (1h prior):</span>
                <strong style={{ display: 'block', color: 'var(--accent-blue)' }}>
                  {ev.rainfall_1h_mm !== undefined && ev.rainfall_1h_mm !== null ? `${ev.rainfall_1h_mm} mm` : 'Unavailable'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rainfall (24h prior):</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)' }}>
                  {ev.rainfall_24h_mm !== undefined && ev.rainfall_24h_mm !== null ? `${ev.rainfall_24h_mm} mm` : 'Unavailable'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Peak Flood Depth:</span>
                <strong style={{ display: 'block', color: ev.flood_depth_cm && ev.flood_depth_cm > 100 ? '#ef4444' : 'var(--text-main)' }}>
                  {ev.flood_depth_cm !== undefined && ev.flood_depth_cm !== null ? `${ev.flood_depth_cm} cm` : 'Not Measured'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Coordinates:</span>
                <strong style={{ display: 'block', color: 'var(--text-main)' }}>
                  {ev.latitude.toFixed(4)}°N, {ev.longitude.toFixed(4)}°E
                </strong>
              </div>
            </div>

            {/* Data Provenance & Verification Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span>Source Authority: <strong>{ev.source}</strong></span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#10b981',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} /> {ev.verification_status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
