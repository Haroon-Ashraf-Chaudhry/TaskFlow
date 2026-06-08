import React, { useState } from 'react';
import Modal from '../common/Modal';
import api from '../../utils/api';
import Avatar from '../common/Avatar';

const PRIORITIES = ['none','low','medium','high','urgent'];
const TYPES = ['task','bug','feature','story','epic'];

export default function CreateTaskModal({ open, onClose, project, wsId, onCreated, defaultStatus = 'todo' }) {
  const [form, setForm] = useState({ title: '', description: '', status: defaultStatus, priority: 'none', type: 'task', assignees: [], dueDate: '', estimatedMinutes: '', labels: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : 0,
        dueDate: form.dueDate || undefined,
      };
      const { data } = await api.post(`/workspaces/${wsId}/projects/${project._id}/tasks`, payload);
      onCreated?.(data);
      setForm({ title: '', description: '', status: defaultStatus, priority: 'none', type: 'task', assignees: [], dueDate: '', estimatedMinutes: '', labels: '' });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const members = project?.members || [];

  return (
    <Modal open={open} onClose={onClose} title="Create Task" width={520}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="What needs to be done?" autoFocus required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Add more details..." rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {(project?.columns || [{ id: 'todo', name: 'To Do' }, { id: 'in-progress', name: 'In Progress' }, { id: 'done', name: 'Done' }]).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>Assignees</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {members.map(m => {
              const selected = form.assignees.includes(m._id);
              return (
                <div
                  key={m._id}
                  onClick={() => set('assignees', selected ? form.assignees.filter(id => id !== m._id) : [...form.assignees, m._id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 20, border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, background: selected ? 'var(--accent-light)' : 'transparent', cursor: 'pointer', fontSize: 12 }}
                >
                  <Avatar user={m} size="sm" />
                  {m.name}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Estimate (minutes)</label>
            <input type="number" value={form.estimatedMinutes} onChange={e => set('estimatedMinutes', e.target.value)} placeholder="60" min={0} />
          </div>
          <div className="form-group">
            <label>Labels (comma separated)</label>
            <input type="text" value={form.labels} onChange={e => set('labels', e.target.value)} placeholder="frontend, urgent" />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !form.title.trim()}>
            {loading ? <><span className="spinner" />Creating...</> : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
