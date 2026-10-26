import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StationRiskItem } from '../types';

interface RiskTrendChartProps {
  stations: StationRiskItem[];
  onSelectStation?: (id: string) => void;
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({
  stations,
  onSelectStation,
}) => {
  const chartData = stations
    .map((s) => ({
      id: s.location_id,
      name: s.location_name.replace(/ Catchment| Junction| Underpass| Zone/g, ''),
      prob: Math.round(s.flood_probability * 100),
      rain: s.rainfall_1h_mm,
      category: s.risk_category,
    }))
    .sort((a, b) => b.prob - a.prob);

  const getBarColor = (category: string) => {
    switch (category) {
      case 'Severe':
        return '#ef4444';
      case 'High':
        return '#f97316';
      case 'Moderate':
        return '#eab308';
      default:
        return '#10b981';
    }
  };

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
          Micro-Catchment Risk Ranking
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          Nowcast flood probability comparison across Coimbatore stations
        </p>
      </div>

      <div style={{ width: '100%', height: '270px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const item = state.activePayload[0].payload;
                if (onSelectStation && item.id) {
                  onSelectStation(item.id);
                }
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              width={110}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c152a',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any, item: any) => [
                `${val}% (Category: ${item.payload.category})`,
                'Flood Probability',
              ]}
            />
            <Bar dataKey="prob" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.category)} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
