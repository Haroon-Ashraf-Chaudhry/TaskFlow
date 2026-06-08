import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import useWorkspaceStore from '../../stores/workspaceStore';
import Avatar from '../common/Avatar';
import Dropdown, { DropdownItem } from '../common/Dropdown';

function ProjectNavItem({ project, wsId, currentPid }) {
  const [expanded, setExpanded] = useState(currentPid === project._id);
  const views = [
    { path: 'board', label: 'Board', icon: '▦' },
    { path: 'list', label: 'List', icon: '☰' },
    { path: 'sprint', label: 'Sprint', icon: '⚡' },
    { path: 'analytics', label: 'Analytics', icon: '📊' },
  ];
  return (
    <div>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', color: currentPid === project._id ? 'var(--text-primary)' : 'var(--text-secondary)', background: currentPid === project._id ? 'var(--bg-hover)' : 'transparent', fontSize: 13, fontWeight: 500 }}
        onMouseEnter={e => { if (currentPid !== project._id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseLeave={e => { if (currentPid !== project._id) e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ width: 20, height: 20, borderRadius: 4, background: project.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{project.icon}</span>
        <span className="truncate" style={{ flex: 1 }}>{project.name}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{expanded ? '▾' : '▸'}</span>
      </div>
      {expanded && (
        <div style={{ marginLeft: 20, marginTop: 2, marginBottom: 4 }}>
          {views.map(v => (
            <Link
              key={v.path}
              to={`/w/${wsId}/p/${project._id}/${v.path}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 11 }}>{v.icon}</span>{v.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { wsId, pid } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();

  useEffect(() => { fetchWorkspaces(); }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}/projects`).then(r => r.data),
    enabled: !!wsId,
  });

  const activeWs = workspaces.find(w => w._id === wsId);

  return (
    <div style={{ width: 240, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Workspace switcher */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
        <Dropdown
          trigger={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: 'var(--bg-tertiary)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: activeWs?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                {activeWs?.icon || '🏢'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeWs?.name || 'Select Workspace'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⌄</span>
            </div>
          }
        >
          {workspaces.map(w => (
            <DropdownItem key={w._id} onClick={() => navigate(`/w/${w._id}`)} icon={w.icon}>
              {w.name}
            </DropdownItem>
          ))}
          <div className="divider" />
          <DropdownItem onClick={() => navigate('/new-workspace')} icon="＋">New Workspace</DropdownItem>
        </Dropdown>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '8px 8px' }}>
        {wsId && (
          <>
            <div style={{ padding: '4px 12px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Workspace</div>
            {[
              { to: `/w/${wsId}`, label: 'Home', icon: '⌂' },
              { to: `/w/${wsId}/activity`, label: 'Activity', icon: '⚡' },
              { to: `/w/${wsId}/members`, label: 'Members', icon: '👥' },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px', marginTop: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Projects</span>
              <button
                className="btn btn-ghost btn-icon"
                style={{ fontSize: 16, width: 22, height: 22, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                onClick={() => navigate(`/w/${wsId}/new-project`)}
                title="New project"
              >+</button>
            </div>
            {projects.map(p => (
              <ProjectNavItem key={p._id} project={p} wsId={wsId} currentPid={pid} />
            ))}
            {projects.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>No projects yet</div>
            )}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
        <Dropdown
          trigger={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar user={user} size="sm" />
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⌄</span>
            </div>
          }
          align="right"
        >
          <DropdownItem onClick={() => navigate('/profile')} icon="👤">Profile</DropdownItem>
          <div className="divider" />
          <DropdownItem onClick={() => { logout(); navigate('/login'); }} danger icon="⎋">Sign Out</DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
}
