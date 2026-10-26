import React, { useState } from 'react';
import { api } from '../services/api';
import { FloodPredictionResponse, LocationStation } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  HelpCircle,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface FloodPredictionProps {
  locations: LocationStation[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
}

export const FloodPrediction: React.FC<FloodPredictionProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
}) => {
  const selectedStation = locations.find((l) => l.id === selectedLocationId) || locations[0];

  // Prediction Form State
  const [stationId, setStationId] = useState(selectedLocationId || 'CBE-01');
  const [rainfall1h, setRainfall1h] = useState<number>(38.5);
  const [rainfall3h, setRainfall3h] = useState<number>(72.0);
  const [rainfall24h, setRainfall24h] = useState<number>(105.0);
  const [elevationM, setElevationM] = useState<number>(selectedStation ? selectedStation.elevation_m : 408.0);
  const [slopeDeg, setSlopeDeg] = useState<number>(selectedStation ? selectedStation.slope_deg : 1.1);
  const [drainageIndex, setDrainageIndex] = useState<number>(
    selectedStation ? selectedStation.drainage_capacity_index : 0.45
  );
  const [soilMoisture, setSoilMoisture] = useState<number>(80.0);
  const [imperviousRatio, setImperviousRatio] = useState<number>(
    selectedStation ? selectedStation.impervious_ratio : 0.85
  );

  const [predictionResult, setPredictionResult] = useState<FloodPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync station attributes when station selection changes
  const handleStationChange = (id: string) => {
    setStationId(id);
    onSelectLocation(id);
    const target = locations.find((l) => l.id === id);
    if (target) {
      setElevationM(target.elevation_m);
      setSlopeDeg(target.slope_deg);
      setDrainageIndex(target.drainage_capacity_index);
      setImperviousRatio(target.impervious_ratio);
    }
  };

  // Preset Scenario Presets
  const applyPreset = (type: 'dry' | 'moderate' | 'cloudburst' | 'cyclonic') => {
    if (type === 'dry') {
      setRainfall1h(1.2);
      setRainfall3h(3.5);
      setRainfall24h(8.0);
      setSoilMoisture(35.0);
    } else if (type === 'moderate') {
      setRainfall1h(16.5);
      setRainfall3h(32.0);
      setRainfall24h(48.0);
      setSoilMoisture(65.0);
    } else if (type === 'cloudburst') {
      setRainfall1h(62.0);
      setRainfall3h(78.0);
      setRainfall24h(92.0);
      setSoilMoisture(85.0);
    } else if (type === 'cyclonic') {
      setRainfall1h(42.0);
      setRainfall3h(95.0);
      setRainfall24h(148.0);
      setSoilMoisture(96.0);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.predictFloodRisk({
        location_id: stationId,
        rainfall_1h: Number(rainfall1h),
        rainfall_3h: Number(rainfall3h),
        rainfall_24h: Number(rainfall24h),
        elevation_m: Number(elevationM),
        slope_deg: Number(slopeDeg),
        drainage_capacity_index: Number(drainageIndex),
        soil_moisture_pct: Number(soilMoisture),
        impervious_ratio: Number(imperviousRatio),
      });
      setPredictionResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compute flood prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner */}
      <div
        className="dashboard-card"
        style={{
          borderLeft: '4px solid #6366f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BrainCircuit size={22} color="#6366f1" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              AI Flood Risk Inference Engine
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Trained Random Forest Classifier (120 Estimators, Stratified 4-Class Risk Topology)
          </p>
        </div>

        {/* Preset Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Test Scenarios:</span>
          <button onClick={() => applyPreset('dry')} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
            Dry / Normal
          </button>
          <button onClick={() => applyPreset('moderate')} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
            Monsoon Shower
          </button>
          <button onClick={() => applyPreset('cloudburst')} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: '#f97316' }}>
            Cloudburst Spike
          </button>
          <button onClick={() => applyPreset('cyclonic')} className="btn btn-outline" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: '#ef4444' }}>
            Cyclonic Deluge
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 460px) 1fr',
          gap: '1.25rem',
        }}
      >
        {/* Input Parameters Form */}
        <form onSubmit={handlePredict} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Hydrological Feature Inputs</strong>
            <Sliders size={16} color="var(--text-muted)" />
          </div>

          {/* Catchment Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Target Micro-Catchment Station
            </label>
            <select
              value={stationId}
              onChange={(e) => handleStationChange(e.target.value)}
              className="input-field"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.elevation_m}m MSL)
                </option>
              ))}
            </select>
          </div>

          {/* Rainfall Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Rainfall 1h (mm)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="250"
                value={rainfall1h}
                onChange={(e) => setRainfall1h(parseFloat(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Rainfall 3h (mm)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="500"
                value={rainfall3h}
                onChange={(e) => setRainfall3h(parseFloat(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Rainfall 24h (mm)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="1000"
                value={rainfall24h}
                onChange={(e) => setRainfall24h(parseFloat(e.target.value) || 0)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Terrain & Catchment Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Elevation MSL (m)
              </label>
              <input
                type="number"
                step="0.5"
                min="100"
                max="1500"
                value={elevationM}
                onChange={(e) => setElevationM(parseFloat(e.target.value) || 400)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Slope Gradient (deg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="45"
                value={slopeDeg}
                onChange={(e) => setSlopeDeg(parseFloat(e.target.value) || 1.0)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Drainage Capacity (0.1 - 1.0)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                value={drainageIndex}
                onChange={(e) => setDrainageIndex(parseFloat(e.target.value) || 0.5)}
                className="input-field"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Soil Moisture Saturation (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(parseFloat(e.target.value) || 50)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Impervious Surface Ratio (0.0 - 1.0)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              value={imperviousRatio}
              onChange={(e) => setImperviousRatio(parseFloat(e.target.value) || 0.8)}
              className="input-field"
            />
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {loading ? 'Evaluating Random Forest Decision Trees...' : 'Compute Nowcast Risk Estimate'}
          </button>
        </form>

        {/* Prediction Results & Explanation Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {predictionResult ? (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Prediction Horizon: <strong>{predictionResult.forecast_horizon_hours} Hours</strong>
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.2rem 0 0' }}>
                    {predictionResult.location_name || 'Selected Location'}
                  </h3>
                </div>
                <RiskBadge category={predictionResult.risk_category} size="lg" />
              </div>

              {/* Probability Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  background: 'var(--bg-secondary)',
                  padding: '1rem',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Flood Probability</span>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {(predictionResult.flood_probability * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uncertainty Level</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: predictionResult.uncertainty_level === 'Low' ? '#10b981' : '#f59e0b' }}>
                    {predictionResult.uncertainty_level} (Entropy: {predictionResult.uncertainty_score})
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Model Architecture</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {predictionResult.model_type} ({predictionResult.model_version})
                  </div>
                </div>
              </div>

              {/* Class Probability Breakdown */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  Model Class Softmax Distribution
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {Object.entries(predictionResult.probabilities).map(([cat, prob]) => (
                    <div key={cat} style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cat}</span>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {(prob * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Contributing Hydrological Factors (Feature Importances) */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  Primary Contributing Runoff Factors (Tree Importance Weights)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {predictionResult.top_contributing_factors.map((factor, i) => (
                    <div
                      key={factor.feature}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {i + 1}. <code>{factor.feature}</code> (Value: <strong>{factor.value}</strong>)
                      </span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                        Impact Weight: {(factor.weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Operational Action */}
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <strong style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'block', marginBottom: '0.25rem' }}>
                  Recommended Operational Action
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>
                  {predictionResult.recommended_action}
                </p>
              </div>

              {/* Limitations & Uncertainty Disclosure */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                <strong>Scientific Uncertainty & Limitations:</strong> {predictionResult.limitations}
              </div>
            </div>
          ) : (
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', textAlign: 'center', padding: '2rem' }}>
              <BrainCircuit size={48} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Ready to Compute Flood Nowcast
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.5 }}>
                Select a Coimbatore micro-catchment, adjust rainfall or terrain values, or pick a scenario preset above to run the machine learning decision model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
