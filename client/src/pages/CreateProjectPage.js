import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6'];
const ICONS = ['📋','🚀','🎨','💻','📊','🛒','🏗️','🎯','💡','🔬'];

export default function CreateProjectPage() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], icon: ICONS[0], startDate: '', endDate: '' });

  const create = useMutation({
    mutationFn: (data) => api.post(`/workspaces/${wsId}/projects`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries(['projects', wsId]);
      navigate(`/w/${wsId}/p/${data._id}/board`);
    },
  });

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 520 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>New Project</h1>
        <div className="card" style={{ padding: 24 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Website Redesign" autoFocus required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Icon</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: form.icon === ic ? 'var(--accent-light)' : 'var(--bg-tertiary)', border: `1px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer' }}>
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
                  style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 1, cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => create.mutate(form)} disabled={!form.name || create.isPending}>
              {create.isPending ? <><span className="spinner" />Creating...</> : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
