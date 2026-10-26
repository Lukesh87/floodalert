import React from 'react';
import { RiskCategory } from '../types';

interface RiskBadgeProps {
  category: RiskCategory | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  category,
  size = 'md',
  showPulse = true,
}) => {
  const normCat = (category || 'Low').toLowerCase();

  let badgeClass = 'badge-low';
  let pulseClass = 'pulse-dot-low';
  let label = 'Low Risk';

  if (normCat.includes('mod')) {
    badgeClass = 'badge-moderate';
    pulseClass = 'pulse-dot-mod';
    label = 'Moderate Risk';
  } else if (normCat.includes('high')) {
    badgeClass = 'badge-high';
    pulseClass = 'pulse-dot-high';
    label = 'High Risk';
  } else if (normCat.includes('sev')) {
    badgeClass = 'badge-severe';
    pulseClass = 'pulse-dot-severe';
    label = 'Severe Risk';
  }

  const sizeStyle =
    size === 'sm'
      ? { padding: '0.15rem 0.45rem', fontSize: '0.7rem' }
      : size === 'lg'
      ? { padding: '0.35rem 0.9rem', fontSize: '0.85rem' }
      : {};

  return (
    <span className={`badge ${badgeClass}`} style={sizeStyle}>
      {showPulse && <span className={`pulse-dot ${pulseClass}`} />}
      {label}
    </span>
  );
};
