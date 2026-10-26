import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Key,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

interface WeatherApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const WeatherApiKeyModal: React.FC<WeatherApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [provider, setProvider] = useState<'openweathermap' | 'weatherapi'>('openweathermap');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<{
    active_provider: string;
    has_api_key: boolean;
    masked_api_key?: string;
    provider_status: string;
    source: string;
  } | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sample_temp_c?: number;
    sample_condition?: string;
    sample_humidity_pct?: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current status on open
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const res = await api.getWeatherStatus();
      setStatus(res);
      if (res.active_provider === 'weatherapi') {
        setProvider('weatherapi');
      } else {
        setProvider('openweathermap');
      }
    } catch (e) {
      console.warn('Failed to fetch weather status:', e);
    }
  };

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key to test.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testWeatherApiKey(provider, apiKey.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to weather server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key to activate.',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await api.configureWeatherApiKey(provider, apiKey.trim());
      if (res.success) {
        setSaveSuccess(true);
        setTestResult(res);
        onKeyUpdated();
        setTimeout(() => {
          onClose();
        }, 1300);
      } else {
        setTestResult(res);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to activate weather key.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearKey = async () => {
    try {
      await api.clearWeatherApiKey();
      setApiKey('');
      setTestResult({
        success: true,
        message: 'Reverted to free Open-Meteo numerical weather model.',
      });
      loadStatus();
      onKeyUpdated();
    } catch (e) {
      console.warn('Failed to clear weather key:', e);
    }
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
          maxWidth: '560px',
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
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Real-Time Weather API Key
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Connect live meteorological telemetry for Coimbatore
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

        {/* Current Status Badge */}
        <div
          style={{
            background: status?.has_api_key ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
            border: status?.has_api_key ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <ShieldCheck
            size={18}
            style={{ flexShrink: 0, marginTop: '2px', color: status?.has_api_key ? '#10b981' : '#38bdf8' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: status?.has_api_key ? '#a7f3d0' : '#bae6fd' }}>
              {status?.has_api_key ? (
                <>🟢 Active API Key: <code>{status.masked_api_key}</code> ({status.active_provider.toUpperCase()})</>
              ) : (
                <>🔵 Current Provider: Open-Meteo High-Resolution (Free Tier)</>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.73rem', marginTop: '2px' }}>
              {status?.has_api_key
                ? 'Pulling authenticated real-time meteorological observations and 24h precipitation probability.'
                : 'Enter your OpenWeatherMap or WeatherAPI key below to unlock dedicated high-frequency observations.'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Provider Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
              Weather API Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setProvider('openweathermap')}
                className="btn"
                style={{
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  justifyContent: 'center',
                  background: provider === 'openweathermap' ? 'rgba(14, 165, 233, 0.2)' : 'var(--bg-elevated)',
                  border: provider === 'openweathermap' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  color: provider === 'openweathermap' ? '#38bdf8' : 'var(--text-muted)',
                }}
              >
                <Sparkles size={14} /> OpenWeatherMap 2.5/3.0
              </button>

              <button
                type="button"
                onClick={() => setProvider('weatherapi')}
                className="btn"
                style={{
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  justifyContent: 'center',
                  background: provider === 'weatherapi' ? 'rgba(14, 165, 233, 0.2)' : 'var(--bg-elevated)',
                  border: provider === 'weatherapi' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                  color: provider === 'weatherapi' ? '#38bdf8' : 'var(--text-muted)',
                }}
              >
                <Zap size={14} /> WeatherAPI.com
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={14} color="var(--accent-blue)" /> {provider === 'openweathermap' ? 'OpenWeatherMap' : 'WeatherAPI'} Key
              </label>

              {provider === 'openweathermap' ? (
                <a
                  href="https://home.openweathermap.org/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  Get OpenWeatherMap Key <ExternalLink size={11} />
                </a>
              ) : (
                <a
                  href="https://www.weatherapi.com/signup.aspx"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                >
                  Get WeatherAPI Key <ExternalLink size={11} />
                </a>
              )}
            </div>

            <input
              type="text"
              placeholder={provider === 'openweathermap' ? 'e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d' : 'e.g. 2b3c4d5e6f7a8b9c...'}
              className="input-field"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value.trim())}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
            />
          </div>

          {/* Test Feedback Box */}
          {testResult && (
            <div
              style={{
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.78rem',
                background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: testResult.success ? '#a7f3d0' : '#fca5a5',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
              {testResult.success && testResult.sample_temp_c !== undefined && (
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Live Reading: <strong>{testResult.sample_temp_c}°C</strong> • Condition: <strong>{testResult.sample_condition}</strong>
                  {testResult.sample_humidity_pct ? ` • Humidity: ${testResult.sample_humidity_pct}%` : ''}
                </div>
              )}
            </div>
          )}

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
              onClick={handleClearKey}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} /> Revert to Free Tier
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{
                  fontSize: '0.78rem',
                  background: saveSuccess ? '#10b981' : undefined,
                }}
              >
                {saveSuccess ? 'Activated!' : saving ? 'Activating...' : 'Save & Activate'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
