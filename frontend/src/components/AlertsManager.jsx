import React, { useState } from 'react';
import { Bell, AlertTriangle, ShieldCheck, Plus, CheckCircle, Radio, ExternalLink } from 'lucide-react';

export default function AlertsManager({ alerts, stations, onTriggerAlert }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location_id: stations[0]?.id || 1,
    severity: 'HIGH',
    title: '⚠️ HIGH RISK FLOOD WARNING: Inundation Risk',
    message: 'Water levels approaching critical urban storm drain limits.',
    recommendation: 'Close underpass access and issue local citizen warning push notification.'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const loc = stations.find(s => s.id === parseInt(formData.location_id));
    const newAlert = {
      id: Date.now(),
      severity: formData.severity,
      title: formData.title || `🚨 ${formData.severity} FLOOD WARNING: ${loc?.name || 'Monitoring Station'}`,
      message: formData.message,
      recommendation: formData.recommendation,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
    if (onTriggerAlert) onTriggerAlert(newAlert);
    setShowForm(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={24} color="#EF4444" />
            <span>Emergency Alert Operations & Civil Defense Protocol</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            Live early warning broadcast stream for city municipal authorities and civil response teams.
          </p>
        </div>

        <button className="btn-danger" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          <span>{showForm ? 'Cancel Form' : 'Broadcast New Early Warning'}</span>
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: '#EF4444' }}>Broadcast Emergency Early Warning</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Affected Monitoring Station</label>
                <select className="form-select" value={formData.location_id} onChange={(e) => setFormData({...formData, location_id: e.target.value})}>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.risk_level})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Threshold Level</label>
                <select className="form-select" value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})}>
                  <option value="CRITICAL">CRITICAL (Immediate Inundation)</option>
                  <option value="HIGH">HIGH (Rising Water Level)</option>
                  <option value="MODERATE">MODERATE (Precautionary Advisory)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Broadcast Title</label>
              <input className="form-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Warning Message Detail</label>
              <textarea className="form-input" rows={2} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Civil Defense Recommendation</label>
              <input className="form-input" value={formData.recommendation} onChange={(e) => setFormData({...formData, recommendation: e.target.value})} />
            </div>

            <button type="submit" className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
              <Radio size={18} />
              <span>Broadcast Warning to Municipal Grid</span>
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left: Active Alerts Feed */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>Active System Broadcasts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {alerts.map((al) => (
              <div key={al.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: al.severity === 'CRITICAL' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className={`status-pill badge-${al.severity}`} style={{ fontSize: '0.75rem' }}>
                    {al.severity} ALERT
                  </span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {new Date(al.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{al.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '0.75rem' }}>{al.message}</p>
                
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} />
                  <span><strong>Action Directive:</strong> {al.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: SOP Response Guidelines */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Standard Operating Procedures</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem', color: '#94A3B8' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              <strong style={{ color: '#EF4444' }}>Phase 1 (Critical Probability &gt; 80%):</strong>
              <p style={{ marginTop: '0.25rem' }}>Deploy automated barrier drops at subway underpasses & initiate storm sump pump station generators.</p>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              <strong style={{ color: '#F59E0B' }}>Phase 2 (High Risk 60–80%):</strong>
              <p style={{ marginTop: '0.25rem' }}>Route municipal traffic away from low-elevation river basins.</p>
            </div>

            <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
              <strong style={{ color: '#10B981' }}>Phase 3 (Monitoring):</strong>
              <p style={{ marginTop: '0.25rem' }}>Continuous sensor heartbeat check every 30 seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
