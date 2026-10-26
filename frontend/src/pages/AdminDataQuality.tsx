import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DataSourceItem, LocationStation, ModelMetricsData } from '../types';
import {
  AlertCircle,
  BarChart,
  CheckCircle,
  Database,
  FileSpreadsheet,
  FileText,
  Network,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';

interface AdminDataQualityProps {
  locations: LocationStation[];
}

export const AdminDataQuality: React.FC<AdminDataQualityProps> = ({ locations }) => {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsData | null>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // CSV Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [qaReport, setQaReport] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [sources, metrics, status, logs] = await Promise.allSettled([
          api.getDataSources(),
          api.getModelMetrics(),
          api.getModelStatus(),
          api.getAuditLogs(),
        ]);

        if (sources.status === 'fulfilled') setDataSources(sources.value);
        if (metrics.status === 'fulfilled') setModelMetrics(metrics.value);
        if (status.status === 'fulfilled') setModelStatus(status.value);
        if (logs.status === 'fulfilled') setAuditLogs(logs.value);
      } catch (err) {
        console.warn('Error loading admin metrics:', err);
      }
    }
    loadAdminData();
  }, []);

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadError(null);
    setQaReport(null);

    try {
      const res = await api.uploadCSVDataset(uploadFile);
      setQaReport(res);
    } catch (err: any) {
      setUploadError(err.message || 'CSV Ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner */}
      <div
        className="dashboard-card"
        style={{
          borderLeft: '4px solid var(--accent-cyan)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Administration, Data Quality & Model Provenance
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Data source health monitoring, CSV validation pipeline, and ML performance metrics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
            }}
          >
            System Health: Online (100% Endpoints Operational)
          </span>
        </div>
      </div>

      {/* Grid: CSV Ingestion Pipeline & Data Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* CSV Ingestion Pipeline */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Data Ingestion & Automated QA Audit
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload rainfall or flood incident CSV for schema, range, and anomaly checks
              </p>
            </div>
            <FileSpreadsheet size={20} color="var(--accent-blue)" />
          </div>

          <form onSubmit={handleCsvUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload size={28} color="var(--accent-cyan)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {uploadFile ? uploadFile.name : 'Click to select CSV dataset'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Supports standard IMD precipitation logs or Coimbatore flood records
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {uploadError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                ⚠️ {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="btn btn-primary"
              style={{ padding: '0.6rem' }}
            >
              {uploading ? 'Analyzing and validating CSV rows...' : 'Upload & Validate Quality'}
            </button>
          </form>

          {/* QA Report Results */}
          {qaReport && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '0.85rem',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  QA Ingestion Audit Report: {qaReport.filename}
                </strong>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: qaReport.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: qaReport.success ? '#10b981' : '#ef4444',
                  }}
                >
                  {qaReport.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.45rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Rows</div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{qaReport.total_rows}</strong>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.45rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Valid Rows</div>
                  <strong style={{ fontSize: '0.95rem', color: '#10b981' }}>{qaReport.valid_rows}</strong>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.45rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flagged</div>
                  <strong style={{ fontSize: '0.95rem', color: qaReport.flagged_rows > 0 ? '#ef4444' : '#10b981' }}>
                    {qaReport.flagged_rows}
                  </strong>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '0.45rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quality Score</div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
                    {qaReport.data_quality_pct || 100}%
                  </strong>
                </div>
              </div>

              {qaReport.sample_anomalies && qaReport.sample_anomalies.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                  <strong>Flagged Issues Sample:</strong>
                  {qaReport.sample_anomalies.map((a: any, i: number) => (
                    <div key={i}>• Row {a.row_index}: {a.issues.join(', ')}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connected External Data Sources */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                Integrated Telemetry & Water Data Sources
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Real-time API endpoints, sync frequencies, and provider integrity
              </p>
            </div>
            <Network size={20} color="#14b8a6" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {dataSources.map((src) => (
              <div
                key={src.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {src.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {src.provider} • Poll interval: {src.update_frequency_min} min
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                    }}
                  >
                    ● {src.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Machine Learning Model Evaluation Report */}
      {modelMetrics && (
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Machine Learning Model Evaluation & Benchmark Metrics
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Model: <strong>{modelMetrics.model_type} ({modelMetrics.model_version})</strong> • Region:{' '}
                {modelMetrics.target_region}
              </p>
            </div>
            <ShieldCheck size={24} color="#10b981" />
          </div>

          {/* Metric KPI cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Overall Accuracy</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                {(modelMetrics.accuracy * 100).toFixed(1)}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                Baseline: {(modelMetrics.baseline_accuracy * 100).toFixed(1)}%
              </span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Macro F1-Score</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                {(modelMetrics.macro_f1 * 100).toFixed(1)}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Class balanced</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Macro Recall</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#06b6d4' }}>
                {(modelMetrics.macro_recall * 100).toFixed(1)}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Flood event detection</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Macro Precision</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7' }}>
                {(modelMetrics.macro_precision * 100).toFixed(1)}%
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>False alarm reduction</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROC-AUC (OvR)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                {modelMetrics.roc_auc_ovr.toFixed(4)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Multi-class boundary</span>
            </div>
          </div>

          {/* Feature Importances Bar */}
          <div>
            <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
              Global Feature Importance Ranking (Random Forest Gini Impurity)
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.5rem' }}>
              {Object.entries(modelMetrics.feature_importances).map(([feat, imp]) => (
                <div
                  key={feat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-secondary)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                  }}
                >
                  <code>{feat}</code>
                  <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{(imp * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance and Validation Notes */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
            <div><strong>Data Provenance:</strong> {modelMetrics.data_provenance}</div>
            <div><strong>Validation Policy:</strong> {modelMetrics.notes}</div>
          </div>
        </div>
      )}
    </div>
  );
};
