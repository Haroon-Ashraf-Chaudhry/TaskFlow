import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays, isValid } from 'date-fns';
import api from '../utils/api';
import ProjectHeader from '../components/layout/ProjectHeader';
import TaskModal from '../components/modals/TaskModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import Avatar from '../components/common/Avatar';
import PriorityBadge from '../components/common/PriorityBadge';

function SprintTaskRow({ task, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <PriorityBadge priority={task.priority} />
      <span style={{ flex: 1, fontWeight: 500 }} className="truncate">{task.title}</span>
      <div style={{ display: 'flex', gap: -4 }}>
        {(task.assignees || []).slice(0, 3).map((a, i) => (
          <Avatar key={a._id} user={a} size="sm" style={{ marginLeft: i > 0 ? -6 : 0 }} />
        ))}
      </div>
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{task.status}</span>
    </div>
  );
}

export default function SprintView() {
  const { wsId, pid } = useParams();
  const qc = useQueryClient();
  const [openTaskId, setOpenTaskId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  const { data: project } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}/sprints`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', pid, ''],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}/tasks`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const createSprintMutation = useMutation({
    mutationFn: (data) => api.post(`/workspaces/${wsId}/projects/${pid}/sprints`, data),
    onSuccess: () => { qc.invalidateQueries(['sprints', pid]); setShowCreateSprint(false); setSprintForm({ name: '', goal: '', startDate: '', endDate: '' }); },
  });

  const startSprintMutation = useMutation({
    mutationFn: ({ sid, data }) => api.post(`/workspaces/${wsId}/projects/${pid}/sprints/${sid}/start`, data),
    onSuccess: () => qc.invalidateQueries(['sprints', pid]),
  });

  const completeSprintMutation = useMutation({
    mutationFn: (sid) => api.post(`/workspaces/${wsId}/projects/${pid}/sprints/${sid}/complete`),
    onSuccess: () => { qc.invalidateQueries(['sprints', pid]); qc.invalidateQueries(['tasks', pid]); },
  });

  const activeSprint = sprints.find(s => s.status === 'active');
  const planningSprints = sprints.filter(s => s.status === 'planning');
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const backlogTasks = tasks.filter(t => !t.sprint);

  const getSprintTasks = (sprintId) => tasks.filter(t => t.sprint === sprintId || t.sprint?._id === sprintId);
  const getDoneCount = (sprintId) => getSprintTasks(sprintId).filter(t => t.status === 'done').length;
  const daysLeft = activeSprint?.endDate ? Math.max(0, differenceInDays(new Date(activeSprint.endDate), new Date())) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader project={project} />

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Active Sprint Banner */}
        {activeSprint && (
          <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Sprint</span>
                  {daysLeft !== null && <span style={{ fontSize: 12, color: daysLeft <= 2 ? 'var(--danger)' : 'var(--text-muted)' }}>{daysLeft} days left</span>}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{activeSprint.name}</h2>
                {activeSprint.goal && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{activeSprint.goal}</p>}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => { if (window.confirm('Complete sprint? Incomplete tasks will move to backlog.')) completeSprintMutation.mutate(activeSprint._id); }}>
                Complete Sprint
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${getSprintTasks(activeSprint._id).length ? (getDoneCount(activeSprint._id) / getSprintTasks(activeSprint._id).length) * 100 : 0}%`, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{getDoneCount(activeSprint._id)}/{getSprintTasks(activeSprint._id).length} done</span>
            </div>
          </div>
        )}

        {/* Active sprint tasks */}
        {activeSprint && (
          <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Sprint Tasks</span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Add Task</button>
            </div>
            {getSprintTasks(activeSprint._id).map(t => (
              <SprintTaskRow key={t._id} task={t} onClick={() => setOpenTaskId(t._id)} />
            ))}
            {getSprintTasks(activeSprint._id).length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tasks in sprint</div>
            )}
          </div>
        )}

        {/* Planning Sprints */}
        {planningSprints.map(sprint => (
          <div key={sprint._id} className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{sprint.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8, background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>Planning</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => startSprintMutation.mutate({ sid: sprint._id, data: {} })}>Start Sprint</button>
            </div>
            {getSprintTasks(sprint._id).map(t => (
              <SprintTaskRow key={t._id} task={t} onClick={() => setOpenTaskId(t._id)} />
            ))}
          </div>
        ))}

        {/* Backlog */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Backlog <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({backlogTasks.length})</span></span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateSprint(true)}>+ New Sprint</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Add Task</button>
            </div>
          </div>
          {backlogTasks.map(t => (
            <SprintTaskRow key={t._id} task={t} onClick={() => setOpenTaskId(t._id)} />
          ))}
          {backlogTasks.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Backlog is empty 🎉</div>
          )}
        </div>

        {/* Completed Sprints */}
        {completedSprints.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Completed Sprints</div>
            {completedSprints.map(s => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>Velocity: {s.velocity} tasks</span>
                {s.endDate && <span style={{ color: 'var(--text-muted)' }}>Ended {format(new Date(s.endDate), 'MMM d, yyyy')}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Sprint Modal */}
      {showCreateSprint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreateSprint(false); }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, width: 440, padding: 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Create Sprint</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCreateSprint(false)} style={{ fontSize: 18 }}>×</button>
            </div>
            <div className="form-group">
              <label>Sprint Name</label>
              <input type="text" value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} placeholder="Sprint 2" />
            </div>
            <div className="form-group">
              <label>Goal</label>
              <input type="text" value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} placeholder="What do you want to achieve?" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={sprintForm.startDate} onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={sprintForm.endDate} onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowCreateSprint(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createSprintMutation.mutate(sprintForm)} disabled={!sprintForm.name}>Create Sprint</button>
            </div>
          </div>
        </div>
      )}

      {openTaskId && (
        <TaskModal taskId={openTaskId} open={!!openTaskId} onClose={() => setOpenTaskId(null)} project={project} wsId={wsId} onUpdated={() => { qc.invalidateQueries(['tasks', pid]); qc.invalidateQueries(['sprints', pid]); }} />
      )}
      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} project={project} wsId={wsId} onCreated={() => qc.invalidateQueries(['tasks', pid])} />
    </div>
  );
}
