import React, { useState } from 'react';
import { api } from '../services/api';
import { EarlyWarningAlert, LocationStation } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  Info,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface AlertsManagementProps {
  alerts: EarlyWarningAlert[];
  locations: LocationStation[];
  onRefreshAlerts: () => void;
}

export const AlertsManagement: React.FC<AlertsManagementProps> = ({
  alerts,
  locations,
  onRefreshAlerts,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actingAlertId, setActingAlertId] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState<string>('Duty Officer');

  // New manual alert modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newLocationId, setNewLocationId] = useState<string>(locations[0]?.id || 'CBE-01');
  const [newSeverity, setNewSeverity] = useState<string>('Warning');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === 'ACTIVE') return a.status === 'Active';
    if (filterStatus === 'ACK') return a.status === 'Acknowledged';
    if (filterStatus === 'RESOLVED') return a.status === 'Resolved';
    return true;
  });

  const handleAcknowledge = async (id: string) => {
    setActingAlertId(id);
    try {
      await api.updateAlertStatus(id, 'Acknowledged', officerName);
      onRefreshAlerts();
    } catch (e) {
      console.error('Error acknowledging alert:', e);
    } finally {
      setActingAlertId(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActingAlertId(id);
    try {
      await api.updateAlertStatus(id, 'Resolved', officerName);
      onRefreshAlerts();
    } catch (e) {
      console.error('Error resolving alert:', e);
    } finally {
      setActingAlertId(null);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const targetLoc = locations.find((l) => l.id === newLocationId);
    try {
      await api.createAlert({
        location_id: newLocationId,
        location_name: targetLoc ? targetLoc.name : 'Coimbatore Catchment',
        severity: newSeverity,
        title: newTitle || `Severe Runoff Advisory for ${targetLoc?.name}`,
        description: newDescription || 'Hydrological gauges indicate storm drainage surcharge risk.',
        reason: newReason || 'Instantaneous rainfall exceeds 30 mm/h threshold.',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewReason('');
      onRefreshAlerts();
    } catch (e) {
      console.error('Error creating alert:', e);
    } finally {
      setCreating(false);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'emergency':
        return 'badge-severe';
      case 'warning':
        return 'badge-high';
      case 'watch':
        return 'badge-moderate';
      default:
        return 'badge-low';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Filter Bar */}
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
            <ShieldAlert size={22} color="#ef4444" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Early Warning & Emergency Dispatch System
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Automated alert generation, deduplication cooldown enforcement & incident tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '6px' }}>
            {[
              { id: 'ALL', label: `All (${alerts.length})` },
              { id: 'ACTIVE', label: `Active (${alerts.filter((a) => a.status === 'Active').length})` },
              { id: 'ACK', label: 'Acknowledged' },
              { id: 'RESOLVED', label: 'Resolved' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: filterStatus === tab.id ? 'var(--accent-blue)' : 'transparent',
                  color: filterStatus === tab.id ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <Send size={14} /> Dispatch Manual Alert
          </button>

          <button
            onClick={onRefreshAlerts}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
            title="Refresh alerts"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Official Warning Notice */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: '#fbbf24',
        }}
      >
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Emergency Protocol Notice:</strong> Alerts generated by this automated platform supplement official bulletins from the Tamil Nadu State Disaster Management Authority (TNSDMA) and the Coimbatore Municipal Control Room. Automatic deduplication enforces a 60-minute station cooldown to prevent warning fatigue.
        </span>
      </div>

      {/* Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredAlerts.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.4rem' }}>
              No Alerts In Selected Category
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              All Coimbatore micro-catchments are operating within safe runoff thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="dashboard-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                borderLeft:
                  alert.severity === 'Emergency'
                    ? '4px solid #ef4444'
                    : alert.severity === 'Warning'
                    ? '4px solid #f97316'
                    : alert.severity === 'Watch'
                    ? '4px solid #eab308'
                    : '4px solid #38bdf8',
                background: alert.status === 'Resolved' ? 'rgba(14, 25, 48, 0.5)' : 'var(--bg-card)',
                opacity: alert.status === 'Resolved' ? 0.75 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className={`badge ${getSeverityBadgeClass(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                      {alert.alert_code}
                    </code>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          alert.status === 'Active'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : alert.status === 'Acknowledged'
                            ? 'rgba(234, 179, 8, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          alert.status === 'Active'
                            ? '#ef4444'
                            : alert.status === 'Acknowledged'
                            ? '#f59e0b'
                            : '#10b981',
                      }}
                    >
                      ● {alert.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                    {alert.title}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {alert.location_name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Triggered: {new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>Expires: {new Date(alert.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {alert.status === 'Active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={actingAlertId === alert.id}
                      className="btn btn-outline"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    >
                      <UserCheck size={14} /> Acknowledge
                    </button>
                  )}
                  {alert.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={actingAlertId === alert.id}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                    >
                      <CheckCircle size={14} /> Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Description & Hydrological Trigger */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                {alert.description}
              </p>

              <div
                style={{
                  background: 'var(--bg-secondary)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <strong style={{ color: 'var(--accent-blue)' }}>Hydrological Trigger:</strong> {alert.reason}
              </div>

              {/* Audit Trail Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  color: 'var(--text-faint)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.45rem',
                }}
              >
                <span>Trigger Mechanism: <strong>{alert.source_trigger}</strong></span>
                {alert.acknowledged_by && (
                  <span>
                    Acknowledged by: <strong>{alert.acknowledged_by}</strong> (
                    {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleTimeString() : ''})
                  </span>
                )}
                {alert.resolved_at && (
                  <span>Resolved: {new Date(alert.resolved_at).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Alert Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
          }}
        >
          <div
            className="dashboard-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#0d172e',
              border: '1px solid var(--accent-blue)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Dispatch Early Warning Alert
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Target Location / Catchment
                </label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="input-field"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Warning Severity
                </label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  className="input-field"
                >
                  <option value="Advisory">Advisory (Routine Watch)</option>
                  <option value="Watch">Watch (Ponding Anticipated)</option>
                  <option value="Warning">Warning (Road Submergence)</option>
                  <option value="Emergency">Emergency (Severe Inundation)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Alert Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lanka Corner Underpass Water Accumulation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Incident Description & Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Details for disaster management teams, traffic police and public..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Hydrological Reason / Trigger
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inundation depth exceeds 45cm; pumps active."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                >
                  {creating ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
