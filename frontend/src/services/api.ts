/**
 * Centralized API Client for Urban Flood Nowcasting System
 * Handles typed requests, base URL configuration, and error recovery.
 */

import {
  CityNowcastRisk,
  CurrentRainfall,
  CurrentWeather,
  DataSourceItem,
  EarlyWarningAlert,
  FloodEventItem,
  FloodPredictionResponse,
  HourlyForecast,
  LocationStation,
  ModelMetricsData,
  RainfallHistoryPoint,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`API call failed for ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; service: string; ml_model_loaded: boolean }>('/health'),

  // Locations
  getLocations: () => fetchJson<LocationStation[]>('/locations'),
  getLocation: (id: string) => fetchJson<LocationStation>(`/locations/${id}`),

  // Weather
  getCurrentWeather: (locationId?: string) =>
    fetchJson<CurrentWeather>(`/weather/current${locationId ? `?location_id=${locationId}` : ''}`),
  getWeatherForecast: (locationId?: string) =>
    fetchJson<{ hourly: HourlyForecast[] }>(`/weather/forecast${locationId ? `?location_id=${locationId}` : ''}`),
  getWeatherStatus: () =>
    fetchJson<{
      active_provider: string;
      has_api_key: boolean;
      masked_api_key?: string;
      provider_status: string;
      cache_ttl_seconds: number;
      last_updated?: string;
      source: string;
    }>('/weather/status'),
  testWeatherApiKey: (provider: string, apiKey: string) =>
    fetchJson<{
      success: boolean;
      provider: string;
      message: string;
      sample_temp_c?: number;
      sample_condition?: string;
      sample_humidity_pct?: number;
    }>('/weather/test-key', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey }),
    }),
  configureWeatherApiKey: (provider: string, apiKey: string) =>
    fetchJson<{
      success: boolean;
      provider: string;
      message: string;
      sample_temp_c?: number;
      sample_condition?: string;
      sample_humidity_pct?: number;
    }>('/weather/configure-key', {
      method: 'POST',
      body: JSON.stringify({ provider, api_key: apiKey }),
    }),
  clearWeatherApiKey: () =>
    fetchJson<{ success: boolean; message: string }>('/weather/clear-key', {
      method: 'POST',
    }),

  // Rainfall
  getCurrentRainfall: (locationId?: string) =>
    fetchJson<CurrentRainfall>(`/rainfall${locationId ? `?location_id=${locationId}` : ''}`),
  getRainfallHistory: (locationId?: string, window: string = '24h') =>
    fetchJson<{
      total_rainfall_mm: number;
      peak_intensity_mmh: number;
      history: RainfallHistoryPoint[];
    }>(`/rainfall/history?window=${window}${locationId ? `&location_id=${locationId}` : ''}`),

  // Flood Risk & Predictions
  getFloodRiskNowcast: () => fetchJson<CityNowcastRisk>('/flood/risk'),
  getFloodEvents: (params?: { severity?: string; location_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.location_id) query.append('location_id', params.location_id);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return fetchJson<FloodEventItem[]>(`/flood/events${qs ? `?${qs}` : ''}`);
  },

  predictFloodRisk: (features: {
    location_id?: string;
    rainfall_1h: number;
    rainfall_3h: number;
    rainfall_24h: number;
    elevation_m?: number;
    slope_deg?: number;
    drainage_capacity_index?: number;
    soil_moisture_pct?: number;
    impervious_ratio?: number;
  }) =>
    fetchJson<FloodPredictionResponse>('/flood/predict', {
      method: 'POST',
      body: JSON.stringify(features),
    }),

  // Alerts
  getAlerts: (activeOnly: boolean = false, locationId?: string) => {
    const query = new URLSearchParams();
    if (activeOnly) query.append('active_only', 'true');
    if (locationId) query.append('location_id', locationId);
    const qs = query.toString();
    return fetchJson<EarlyWarningAlert[]>(`/alerts${qs ? `?${qs}` : ''}`);
  },

  createAlert: (alertData: {
    severity: string;
    location_id: string;
    location_name: string;
    title: string;
    description: string;
    reason: string;
  }) =>
    fetchJson<EarlyWarningAlert>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    }),

  updateAlertStatus: (alertId: string, status: 'Acknowledged' | 'Resolved', officerName?: string) =>
    fetchJson<EarlyWarningAlert>(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, acknowledged_by: officerName || 'Duty Officer' }),
    }),

  // Machine Learning & Admin
  getModelStatus: () => fetchJson<any>('/model/status'),
  getModelMetrics: () => fetchJson<ModelMetricsData>('/model/metrics'),
  getDataSources: () => fetchJson<DataSourceItem[]>('/admin/sources'),
  getAuditLogs: () => fetchJson<any[]>('/admin/audit'),

  // CSV Ingestion QA Upload
  uploadCSVDataset: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/admin/ingest`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`CSV Ingestion error: ${res.statusText}`);
    }
    return res.json();
  },
};
