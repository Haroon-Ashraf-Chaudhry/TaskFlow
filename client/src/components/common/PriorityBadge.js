import React from 'react';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#ef4444', icon: '🔴' },
  high:   { label: 'High',   color: '#f97316', icon: '🟠' },
  medium: { label: 'Medium', color: '#f59e0b', icon: '🟡' },
  low:    { label: 'Low',    color: '#10b981', icon: '🟢' },
  none:   { label: 'None',   color: '#64748b', icon: '⚪' },
};

export default function PriorityBadge({ priority = 'none', showLabel = false }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />
      {showLabel && cfg.label}
    </span>
  );
}

export { PRIORITY_CONFIG };
