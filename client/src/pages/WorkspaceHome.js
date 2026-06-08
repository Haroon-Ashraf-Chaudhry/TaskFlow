import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6'];
const ICONS = ['📋','🚀','🎨','💻','📊','🛒','🏗️','🎯','💡','🔬'];

export default function WorkspaceHome() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], icon: ICONS[0] });

  const { data: workspace } = useQuery({
    queryKey: ['workspace', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}`).then(r => r.data),
    enabled: !!wsId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}/projects`).then(r => r.data),
    enabled: !!wsId,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['activity', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}/activity`).then(r => r.data),
    enabled: !!wsId,
  });

  const createProject = useMutation({
    mutationFn: (data) => api.post(`/workspaces/${wsId}/projects`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['projects', wsId]);
      setShowCreate(false);
      setForm({ name: '', description: '', color: COLORS[0], icon: ICONS[0] });
      navigate(`/w/${wsId}/p/${data._id}/board`);
    },
  });

  const formatAction = (a) => {
    const map = {
      'task:created': 'created task',
      'task:updated': 'updated task',
      'task:moved': 'moved task',
      'comment:added': 'commented on',
      'member:added': 'joined workspace',
      'project:created': 'created project',
      'sprint:started': 'started sprint',
      'sprint:completed': 'completed sprint',
      'time:logged': 'logged time on',
    };
    return map[a.action] || a.action;
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: workspace?.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {workspace?.icon || '🏢'}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{workspace?.name || 'Workspace'}</h1>
          {workspace?.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{workspace.description}</p>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link to={`/w/${wsId}/members`} className="btn btn-secondary btn-sm">Members</Link>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Projects */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Projects</h2>
          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No projects yet</h3>
              <p>Create your first project to start managing tasks</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Project</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {projects.map(p => (
                <Link key={p._id} to={`/w/${wsId}/p/${p._id}/board`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 16, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: p.color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{p.status}</div>
                      </div>
                    </div>
                    {p.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }} className="truncate">{p.description}</p>}
                    <div style={{ display: 'flex', gap: -6, marginTop: 10 }}>
                      {(p.members || []).slice(0, 5).map((m, i) => (
                        <div key={m._id || m} style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', border: '1px solid var(--bg-card)', marginLeft: i > 0 ? -6 : 0, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                          {typeof m === 'object' ? m.name?.[0] : '?'}
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="card" style={{ padding: 16, cursor: 'pointer', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, minHeight: 100 }}
                onClick={() => setShowCreate(true)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                <span style={{ fontSize: 20 }}>+</span> New Project
              </div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Recent Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activity.slice(0, 15).map(a => (
              <div key={a._id} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {a.actor?.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600 }}>{a.actor?.name}</span>
                    {' '}<span style={{ color: 'var(--text-muted)' }}>{formatAction(a)}</span>
                    {a.task?.title && <span style={{ color: 'var(--text-secondary)' }}> "{a.task.title}"</span>}
                  </div>
                  {a.project?.name && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.project.name}</div>}
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12 }}>No activity yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, width: 480, padding: 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>New Project</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)} style={{ fontSize: 18 }}>×</button>
            </div>
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Website Redesign" autoFocus />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" />
            </div>
            <div className="form-group">
              <label>Icon</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                    style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, background: form.icon === ic ? 'var(--accent-light)' : 'var(--bg-tertiary)', border: `1px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 1, cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createProject.mutate(form)} disabled={!form.name}>Create Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
