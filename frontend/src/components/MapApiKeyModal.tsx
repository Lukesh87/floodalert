import React, { useState } from 'react';
import {
  Check,
  ExternalLink,
  Globe,
  Key,
  Layers,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { loadMapApiKeys, MapApiKeys, saveMapApiKeys } from '../services/mapConfig';

interface MapApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysSaved: (keys: MapApiKeys) => void;
}

export const MapApiKeyModal: React.FC<MapApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysSaved,
}) => {
  const [keys, setKeys] = useState<MapApiKeys>(loadMapApiKeys());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMapApiKeys(keys);
    onKeysSaved(keys);

    // Also sync OpenWeatherMap key to backend weather telemetry if provided
    if (keys.openWeatherKey) {
      import('../services/api').then(({ api }) => {
        api.configureWeatherApiKey('openweathermap', keys.openWeatherKey).catch((err) => {
          console.warn('Backend weather key sync note:', err);
        });
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    const emptyKeys: MapApiKeys = {
      googleMapsKey: '',
      mapboxToken: '',
      openWeatherKey: '',
    };
    setKeys(emptyKeys);
    saveMapApiKeys(emptyKeys);
    onKeysSaved(emptyKeys);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 24, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="dashboard-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-hover)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          borderRadius: '12px',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Map Providers & API Keys
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Configure Google Maps, Mapbox, and Real-Time Weather APIs
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.6rem', border: 'none', background: 'transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature summary callout */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            color: '#a7f3d0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#10b981' }} />
          <div>
            <strong>Ready-to-use Real-time Maps:</strong> Google Maps (Satellite, Hybrid, Terrain & Roads)
            works seamlessly. Adding your own Google Cloud API key ensures dedicated API quotas and enables full Google Maps services.
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Google Maps API Key */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={15} color="#38bdf8" /> Google Maps API Key
              </label>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
              >
                Get Google Key <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="text"
              placeholder="e.g. AIzaSy..."
              className="input-field"
              value={keys.googleMapsKey}
              onChange={(e) => setKeys({ ...keys, googleMapsKey: e.target.value.trim() })}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Enables Google Maps Satellite, Hybrid, Terrain & Real-Time Traffic. If left blank, default real-time Google tiles are active.
            </div>
          </div>

          {/* Mapbox Access Token */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={15} color="#6366f1" /> Mapbox Access Token
              </label>
              <a
                href="https://account.mapbox.com/"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
              >
                Get Mapbox Token <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="text"
              placeholder="e.g. pk.eyJ1Ijo..."
              className="input-field"
              value={keys.mapboxToken}
              onChange={(e) => setKeys({ ...keys, mapboxToken: e.target.value.trim() })}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Required to unlock Mapbox Dark Matter, Mapbox 3D buildings, and Mapbox Satellite Streets layers.
            </div>
          </div>

          {/* OpenWeatherMap API Key */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} color="#eab308" /> OpenWeatherMap 2.0 API Key (Optional)
              </label>
              <a
                href="https://home.openweathermap.org/api_keys"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
              >
                Get Free OWM Key <ExternalLink size={11} />
              </a>
            </div>
            <input
              type="text"
              placeholder="e.g. 1a2b3c4d5e6f..."
              className="input-field"
              value={keys.openWeatherKey}
              onChange={(e) => setKeys({ ...keys, openWeatherKey: e.target.value.trim() })}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Provides additional live precipitation and cloud radar overlay tiles over Coimbatore catchments.
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
            >
              <RotateCcw size={14} /> Clear Keys
            </button>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  background: saveSuccess ? '#10b981' : undefined,
                }}
              >
                {saveSuccess ? (
                  <>
                    <Check size={16} /> Saved!
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save & Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
