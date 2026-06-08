import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import Avatar from '../common/Avatar';
import PriorityBadge from '../common/PriorityBadge';
import TypeBadge from '../common/TypeBadge';
import useAuthStore from '../../stores/authStore';
import { format, isValid } from 'date-fns';

const PRIORITIES = ['none','low','medium','high','urgent'];
const TYPES = ['task','bug','feature','story','epic'];

function MetaSelect({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 13, color: 'var(--text-primary)', width: '100%' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function TaskModal({ taskId, open, onClose, project, wsId, onUpdated }) {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editDesc, setEditDesc] = useState(false);
  const [descVal, setDescVal] = useState('');
  const [newComment, setNewComment] = useState('');
  const [logMinutes, setLogMinutes] = useState('');
  const [logNote, setLogNote] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${project?._id}/tasks/${taskId}`).then(r => r.data),
    enabled: open && !!taskId && !!wsId && !!project?._id,
    refetchInterval: open ? 15000 : false,
  });

  useEffect(() => {
    if (task) { setTitleVal(task.title); setDescVal(task.description || ''); }
  }, [task]);

  const updateTask = useMutation({
    mutationFn: (data) => api.put(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}`, data).then(r => r.data),
    onSuccess: (data) => { qc.setQueryData(['task', taskId], data); onUpdated?.(data); },
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}/comments`, { text: newComment }),
    onSuccess: () => { setNewComment(''); qc.invalidateQueries(['task', taskId]); },
  });

  const deleteComment = useMutation({
    mutationFn: (cid) => api.delete(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}/comments/${cid}`),
    onSuccess: () => qc.invalidateQueries(['task', taskId]),
  });

  const logTime = useMutation({
    mutationFn: () => api.post(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}/time`, { minutes: Number(logMinutes), note: logNote }),
    onSuccess: () => { setLogMinutes(''); setLogNote(''); qc.invalidateQueries(['task', taskId]); },
  });

  const toggleCheckItem = useMutation({
    mutationFn: (iid) => api.patch(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}/checklist/${iid}/toggle`),
    onSuccess: () => qc.invalidateQueries(['task', taskId]),
  });

  const addCheckItem = useMutation({
    mutationFn: () => {
      const checklist = [...(task.checklist || []), { text: newCheckItem, completed: false }];
      return api.put(`/workspaces/${wsId}/projects/${project._id}/tasks/${taskId}/checklist`, { checklist });
    },
    onSuccess: () => { setNewCheckItem(''); qc.invalidateQueries(['task', taskId]); },
  });

  if (!open) return null;

  const columns = project?.columns || [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(2px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><div className="spinner" /></div>
        ) : task ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left: content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24, borderRight: '1px solid var(--border)' }}>
              {/* Type + close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TypeBadge type={task.type} showLabel />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{task._id.slice(-6).toUpperCase()}</span>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ fontSize: 18 }}>×</button>
              </div>

              {/* Title */}
              {editTitle ? (
                <input value={titleVal} onChange={e => setTitleVal(e.target.value)}
                  onBlur={() => { updateTask.mutate({ title: titleVal }); setEditTitle(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') { updateTask.mutate({ title: titleVal }); setEditTitle(false); } if (e.key === 'Escape') setEditTitle(false); }}
                  autoFocus style={{ fontSize: 20, fontWeight: 700, background: 'var(--bg-tertiary)', border: '1px solid var(--accent)', borderRadius: 6, padding: '4px 8px', width: '100%', marginBottom: 12 }} />
              ) : (
                <h2 onClick={() => setEditTitle(true)} style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, cursor: 'text', lineHeight: 1.4 }}>{task.title}</h2>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                {['details','comments','time','activity'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: '6px 14px', fontSize: 13, fontWeight: 500, color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Tab: Details */}
              {tab === 'details' && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Description</div>
                  {editDesc ? (
                    <div>
                      <textarea value={descVal} onChange={e => setDescVal(e.target.value)} rows={5} style={{ resize: 'vertical', marginBottom: 8 }} autoFocus />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { updateTask.mutate({ description: descVal }); setEditDesc(false); }}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditDesc(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setEditDesc(true)} style={{ minHeight: 60, padding: 10, borderRadius: 6, border: '1px solid var(--border)', cursor: 'text', fontSize: 14, color: task.description ? 'var(--text-primary)' : 'var(--text-muted)', background: 'var(--bg-tertiary)', lineHeight: 1.6 }}>
                      {task.description || 'Add a description...'}
                    </div>
                  )}

                  {/* Checklist */}
                  {task.checklist?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checklist</div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.checklist.filter(i => i.completed).length}/{task.checklist.length}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--success)', width: `${(task.checklist.filter(i => i.completed).length / task.checklist.length) * 100}%`, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      {task.checklist.map(item => (
                        <div key={item._id} onClick={() => toggleCheckItem.mutate(item._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer', borderRadius: 6, marginBottom: 2 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${item.completed ? 'var(--success)' : 'var(--border-light)'}`, background: item.completed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: 'white' }}>
                            {item.completed && '✓'}
                          </div>
                          <span style={{ fontSize: 13, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add checklist item */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <input type="text" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                      placeholder="Add checklist item..."
                      onKeyDown={e => { if (e.key === 'Enter' && newCheckItem.trim()) addCheckItem.mutate(); }}
                      style={{ flex: 1, fontSize: 13 }} />
                    <button className="btn btn-secondary btn-sm" onClick={() => addCheckItem.mutate()} disabled={!newCheckItem.trim()}>Add</button>
                  </div>
                </div>
              )}

              {/* Tab: Comments */}
              {tab === 'comments' && (
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <Avatar user={user} size="sm" />
                    <div style={{ flex: 1 }}>
                      <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." rows={2} style={{ resize: 'vertical', marginBottom: 8 }} />
                      <button className="btn btn-primary btn-sm" onClick={() => addComment.mutate()} disabled={!newComment.trim()}>Comment</button>
                    </div>
                  </div>
                  {(task.comments || []).slice().reverse().map(c => (
                    <div key={c._id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                      <Avatar user={c.author} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{c.author?.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}</span>
                          {c.edited && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(edited)</span>}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</p>
                        {c.author?._id === user?._id && (
                          <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, color: 'var(--danger)', padding: '2px 6px' }} onClick={() => deleteComment.mutate(c._id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {task.comments?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No comments yet</p>}
                </div>
              )}

              {/* Tab: Time */}
              {tab === 'time' && (
                <div>
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', gap: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{Math.round((task.estimatedMinutes || 0) / 60 * 10) / 10}h</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Estimated</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{Math.round(((task.timeEntries || []).reduce((s, e) => s + e.minutes, 0)) / 60 * 10) / 10}h</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Logged</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input type="number" value={logMinutes} onChange={e => setLogMinutes(e.target.value)} placeholder="Minutes" min={1} style={{ width: 100 }} />
                    <input type="text" value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="Note (optional)" style={{ flex: 1 }} />
                    <button className="btn btn-primary btn-sm" onClick={() => logTime.mutate()} disabled={!logMinutes}>Log</button>
                  </div>
                  {(task.timeEntries || []).slice().reverse().map(e => (
                    <div key={e._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <Avatar user={e.user} size="sm" />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13 }}>{e.user?.name}</span>
                        {e.note && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>— {e.note}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{e.minutes}m</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Activity */}
              {tab === 'activity' && (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Activity log for this task will appear here.</div>
              )}
            </div>

            {/* Right: meta */}
            <div style={{ width: 220, overflow: 'auto', padding: 20, flexShrink: 0 }}>
              <MetaSelect label="Status" value={task.status} onChange={v => updateTask.mutate({ status: v })}
                options={(columns.length ? columns : [{ id: 'todo', name: 'To Do' }, { id: 'in-progress', name: 'In Progress' }, { id: 'done', name: 'Done' }]).map(c => ({ value: c.id, label: c.name }))} />
              <MetaSelect label="Priority" value={task.priority} onChange={v => updateTask.mutate({ priority: v })}
                options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} />
              <MetaSelect label="Type" value={task.type} onChange={v => updateTask.mutate({ type: v })}
                options={TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Assignees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                  {(task.assignees || []).map(a => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <Avatar user={a} size="sm" />{a.name}
                    </div>
                  ))}
                  {task.assignees?.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unassigned</span>}
                </div>
              </div>

              {task.reporter && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reporter</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <Avatar user={task.reporter} size="sm" />{task.reporter.name}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Due Date</div>
                <input type="date" value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                  onChange={e => updateTask.mutate({ dueDate: e.target.value || null })}
                  style={{ fontSize: 12, padding: '4px 8px' }} />
              </div>

              {task.labels?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Labels</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {task.labels.map(l => <span key={l} className="tag">{l}</span>)}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div>Created {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : ''}</div>
                <div>Updated {task.updatedAt ? format(new Date(task.updatedAt), 'MMM d, yyyy') : ''}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 24, color: 'var(--text-muted)' }}>Task not found</div>
        )}
      </div>
    </div>
  );
}
