import React from 'react';

const TYPE_CONFIG = {
  task:    { label: 'Task',    color: '#3b82f6', icon: '✓' },
  bug:     { label: 'Bug',     color: '#ef4444', icon: '🐛' },
  feature: { label: 'Feature', color: '#10b981', icon: '★' },
  story:   { label: 'Story',   color: '#8b5cf6', icon: '📖' },
  epic:    { label: 'Epic',    color: '#f59e0b', icon: '⚡' },
};

export default function TypeBadge({ type = 'task', showLabel = false }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.task;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: cfg.color, background: `${cfg.color}22`, padding: '2px 6px', borderRadius: 4 }}>
      {cfg.icon} {showLabel && cfg.label}
    </span>
  );
}

export { TYPE_CONFIG };
