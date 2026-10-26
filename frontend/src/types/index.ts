export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface LocationStation {
  id: string;
  name: string;
  ward?: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  drainage_capacity_index: number;
  impervious_ratio: number;
  risk_baseline: string;
  description?: string;
  is_active: boolean;
}

export interface CurrentWeather {
  location_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  observation_time: string;
  temperature_c: number | null;
  relative_humidity_pct: number | null;
  surface_pressure_hpa: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg: number | null;
  weather_code: number | null;
  weather_description: string;
  is_day: number;
  data_freshness_seconds: number;
  source: string;
  provider_status: string;
}

export interface HourlyForecast {
  time: string;
  temperature_c: number;
  precipitation_probability: number;
  rainfall_mm: number;
  weather_description: string;
}

export interface CurrentRainfall {
  location_id: string;
  location_name: string;
  timestamp: string;
  rainfall_1h_mm: number;
  rainfall_3h_mm: number;
  rainfall_6h_mm?: number;
  rainfall_24h_mm: number;
  rainfall_72h_mm?: number;
  intensity_category: string;
  quality_flag: string;
  source: string;
  data_freshness_seconds: number;
}

export interface RainfallHistoryPoint {
  timestamp: string;
  rainfall_mm: number;
  cumulative_24h_mm: number;
  intensity: string;
}

export interface StationRiskItem {
  location_id: string;
  location_name: string;
  ward?: string;
  latitude: number;
  longitude: number;
  elevation_m: number;
  slope_deg: number;
  drainage_capacity_index: number;
  impervious_ratio: number;
  risk_baseline: string;
  risk_category: RiskCategory;
  risk_level: number;
  flood_probability: number;
  uncertainty_score: number;
  rainfall_1h_mm: number;
  rainfall_3h_mm: number;
  rainfall_24h_mm: number;
  status: 'NORMAL' | 'WATCH' | 'WARNING' | 'CRITICAL';
  last_updated: string;
}

export interface CityNowcastRisk {
  city: string;
  state: string;
  country: string;
  timestamp: string;
  overall_risk_category: RiskCategory;
  overall_risk_level: number;
  total_stations_monitored: number;
  stations_at_risk: number;
  model_available: boolean;
  stations: StationRiskItem[];
}

export interface ContributingFactor {
  feature: string;
  value: number | string;
  weight: number;
}

export interface FloodPredictionResponse {
  location_id?: string;
  location_name?: string;
  prediction_timestamp: string;
  forecast_horizon_hours: number;
  risk_category: RiskCategory;
  risk_level: number;
  flood_probability: number;
  uncertainty_score: number;
  uncertainty_level: string;
  probabilities: Record<RiskCategory, number>;
  top_contributing_factors: ContributingFactor[];
  recommended_action: string;
  model_version: string;
  model_type: string;
  input_summary: Record<string, number | string>;
  limitations: string;
}

export interface FloodEventItem {
  id: string;
  event_name: string;
  incident_timestamp: string;
  location_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  rainfall_1h_mm?: number;
  rainfall_3h_mm?: number;
  rainfall_24h_mm?: number;
  flood_depth_cm?: number;
  severity: RiskCategory;
  impact_summary: string;
  source: string;
  verification_status: string;
}

export interface EarlyWarningAlert {
  id: string;
  alert_code: string;
  severity: 'Advisory' | 'Watch' | 'Warning' | 'Emergency';
  status: 'Active' | 'Acknowledged' | 'Resolved' | 'Expired';
  location_id: string;
  location_name: string;
  title: string;
  description: string;
  reason: string;
  source_trigger: string;
  triggered_at: string;
  expires_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  cooldown_until?: string;
  is_active: boolean;
}

export interface DataSourceItem {
  id: string;
  name: string;
  provider: string;
  endpoint_url?: string;
  update_frequency_min: number;
  status: string;
  last_sync_at?: string;
  last_status_code?: number;
}

export interface ModelMetricsData {
  model_version: string;
  model_type: string;
  evaluation_timestamp: string;
  training_samples: number;
  test_samples: number;
  target_region: string;
  accuracy: number;
  macro_precision: number;
  macro_recall: number;
  macro_f1: number;
  roc_auc_ovr: number;
  baseline_accuracy: number;
  confusion_matrix: number[][];
  classification_report: Record<string, any>;
  feature_importances: Record<string, number>;
  feature_names: string[];
  risk_classes: string[];
  data_provenance: string;
  notes: string;
}
