import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  badge?: React.ReactNode;
  trend?: {
    text: string;
    positive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor = '#06b6d4',
  badge,
  trend,
}) => {
  return (
    <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title}
        </span>
        <div
          style={{
            padding: '0.45rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {unit}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        {subtitle && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            {subtitle}
          </span>
        )}
        {badge}
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              color: trend.positive ? 'var(--risk-low)' : 'var(--risk-high)',
              fontWeight: 500,
            }}
          >
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};
