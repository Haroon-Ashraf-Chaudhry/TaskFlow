import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import ProjectHeader from '../components/layout/ProjectHeader';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#94a3b8'];

export default function ProjectSettingsPage() {
  const { wsId, pid } = useParams();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '📋', status: 'active' });
  const [columns, setColumns] = useState([]);
  const [newColName, setNewColName] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  useEffect(() => {
    if (project) {
      setForm({ name: project.name, description: project.description || '', color: project.color || '#6366f1', icon: project.icon || '📋', status: project.status });
      setColumns(project.columns || []);
    }
  }, [project]);

  const updateProject = useMutation({
    mutationFn: (data) => api.put(`/workspaces/${wsId}/projects/${pid}`, data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['project', pid], data); alert('Project updated'); },
  });

  const updateColumns = useMutation({
    mutationFn: (cols) => api.put(`/workspaces/${wsId}/projects/${pid}/columns`, { columns: cols }).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['project', pid], data); },
  });

  const addColumn = () => {
    if (!newColName.trim()) return;
    const newCols = [...columns, { id: newColName.toLowerCase().replace(/\s+/g, '-'), name: newColName, color: '#94a3b8', order: columns.length }];
    setColumns(newCols);
    updateColumns.mutate(newCols);
    setNewColName('');
  };

  const removeColumn = (id) => {
    const newCols = columns.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i }));
    setColumns(newCols);
    updateColumns.mutate(newCols);
  };

  const updateColColor = (id, color) => {
    const newCols = columns.map(c => c.id === id ? { ...c, color } : c);
    setColumns(newCols);
    updateColumns.mutate(newCols);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader project={project} />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 600 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Project Settings</h2>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>General</h3>
          <div className="form-group">
            <label>Project Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
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
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => updateProject.mutate(form)}>Save Changes</button>
        </div>

        {/* Columns */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Board Columns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {columns.map(col => (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                <input type="color" value={col.color || '#94a3b8'} onChange={e => updateColColor(col.id, e.target.value)}
                  style={{ width: 24, height: 24, padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', background: 'none' }} />
                <span style={{ flex: 1, fontSize: 14 }}>{col.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{col.id}</span>
                {!['todo', 'done'].includes(col.id) && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeColumn(col.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Column name..." style={{ flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter') addColumn(); }} />
            <button className="btn btn-secondary" onClick={addColumn} disabled={!newColName.trim()}>Add Column</button>
          </div>
        </div>
      </div>
    </div>
  );
}
