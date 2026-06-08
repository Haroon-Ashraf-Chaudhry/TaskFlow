import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const VIEWS = [
  { path: 'board', label: 'Board', icon: '▦' },
  { path: 'list', label: 'List', icon: '☰' },
  { path: 'sprint', label: 'Sprint', icon: '⚡' },
  { path: 'analytics', label: 'Analytics', icon: '📊' },
  { path: 'settings', label: 'Settings', icon: '⚙' },
];

export default function ProjectHeader({ project }) {
  const { wsId, pid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = location.pathname.split('/').pop();

  return (
    <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 0' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: project?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
          {project?.icon || '📋'}
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>{project?.name || 'Project'}</h1>
          {project?.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{project.description}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, padding: '0 20px', marginTop: 8 }}>
        {VIEWS.map(v => {
          const active = currentView === v.path;
          return (
            <button
              key={v.path}
              onClick={() => navigate(`/w/${wsId}/p/${pid}/${v.path}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 500, color: active ? 'var(--text-primary)' : 'var(--text-muted)', background: 'none', border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', borderRadius: 0 }}
            >
              <span>{v.icon}</span>{v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
