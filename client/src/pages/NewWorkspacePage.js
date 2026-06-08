import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6'];
const ICONS = ['🏢','🚀','🎨','💻','📊','🛒','🏗️','🎯','💡','🔬'];

export default function NewWorkspacePage() {
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0], icon: ICONS[0] });
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState('create');
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/workspaces', form);
      navigate(`/w/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get(`/workspaces/join/${joinCode.trim().toUpperCase()}`);
      navigate(`/w/${data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Create a workspace or join an existing one</p>
        </div>

        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-tertiary)', borderRadius: 8, padding: 4 }}>
          {['create','join'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 14, fontWeight: 500, background: tab === t ? 'var(--bg-card)' : 'transparent', color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', border: tab === t ? '1px solid var(--border)' : 'none', transition: 'all 0.15s' }}>
              {t === 'create' ? 'Create Workspace' : 'Join Workspace'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="card" style={{ padding: 24 }}>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Workspace Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Product Team" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does your team work on?" />
              </div>
              <div className="form-group">
                <label>Icon</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{ width: 36, height: 36, borderRadius: 8, fontSize: 18, background: form.icon === ic ? 'var(--accent-light)' : 'var(--bg-tertiary)', border: `1px solid ${form.icon === ic ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: 1 }}>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{form.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{form.name || 'My Workspace'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{form.description || 'No description'}</div>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !form.name}>
                {loading ? <><span className="spinner" />Creating...</> : 'Create Workspace'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ padding: 24 }}>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>Invite Code</label>
                <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="e.g. A1B2C3D4" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, fontSize: 16, textAlign: 'center' }} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || !joinCode}>
                {loading ? <><span className="spinner" />Joining...</> : 'Join Workspace'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
