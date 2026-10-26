import React from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RainfallHistoryPoint } from '../types';

interface RainfallChartProps {
  data: RainfallHistoryPoint[];
  title?: string;
  timeWindow?: string;
  onWindowChange?: (w: string) => void;
}

export const RainfallChart: React.FC<RainfallChartProps> = ({
  data,
  title = 'Rainfall Intensity & Cumulative Hyetograph',
  timeWindow = '24h',
  onWindowChange,
}) => {
  const formattedData = data.map((d) => {
    const dt = new Date(d.timestamp);
    const timeLabel = `${dt.getHours().toString().padStart(2, '0')}:00`;
    return {
      ...d,
      timeLabel,
    };
  });

  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Hourly precipitation rate (mm/h) and accumulated storm runoff (mm)
          </p>
        </div>

        {onWindowChange && (
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '6px' }}>
            {['24h', '72h', '7d'].map((w) => (
              <button
                key={w}
                onClick={() => onWindowChange(w)}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: timeWindow === w ? 'var(--accent-blue)' : 'transparent',
                  color: timeWindow === w ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: '270px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="cumRainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.ceil(formattedData.length / 8)}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit="mm"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#06b6d4"
              fontSize={11}
              tickLine={false}
              unit="mm"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c152a',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any) => [
                `${Number(val).toFixed(1)} mm`,
                name === 'rainfall_mm' ? 'Hourly Rain' : 'Cumulative 24h',
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              formatter={(val) => (val === 'rainfall_mm' ? 'Hourly Rate (mm/h)' : 'Accumulated Rain (mm)')}
            />
            <Bar yAxisId="left" dataKey="rainfall_mm" fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={12} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="cumulative_24h_mm"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cumRainGrad)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
