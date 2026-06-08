import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import ProjectHeader from '../components/layout/ProjectHeader';
import TaskModal from '../components/modals/TaskModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import Avatar from '../components/common/Avatar';
import PriorityBadge from '../components/common/PriorityBadge';
import TypeBadge from '../components/common/TypeBadge';
import { format, isPast, isValid } from 'date-fns';

function TaskRow({ task, onClick }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  return (
    <div onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: 13 }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <TypeBadge type={task.type} />
      <PriorityBadge priority={task.priority} />
      <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">{task.title}</span>
      {task.labels?.slice(0, 2).map(l => (
        <span key={l} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>{l}</span>
      ))}
      {task.dueDate && isValid(new Date(task.dueDate)) && (
        <span style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
      <div style={{ display: 'flex', gap: -4 }}>
        {(task.assignees || []).slice(0, 3).map((a, i) => (
          <Avatar key={a._id} user={a} size="sm" style={{ marginLeft: i > 0 ? -6 : 0 }} />
        ))}
        {task.assignees?.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unassigned</span>}
      </div>
    </div>
  );
}

export default function ListView() {
  const { wsId, pid } = useParams();
  const qc = useQueryClient();
  const [openTaskId, setOpenTaskId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', pid, search],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}/tasks${search ? `?search=${search}` : ''}`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const columns = project?.columns || [];
  const filtered = tasks.filter(t => !filterPriority || t.priority === filterPriority);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader project={project} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ width: 220, fontSize: 13 }} />
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 140, fontSize: 13 }}>
          <option value="">All Priorities</option>
          {['urgent','high','medium','low','none'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Add Task</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} tasks</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {columns.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id).sort((a, b) => a.order - b.order);
          return (
            <div key={col.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color || '#94a3b8' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 7px', borderRadius: 10 }}>{colTasks.length}</span>
              </div>
              {colTasks.map(t => <TaskRow key={t._id} task={t} onClick={() => setOpenTaskId(t._id)} />)}
              {colTasks.length === 0 && (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No tasks</div>
              )}
            </div>
          );
        })}
      </div>

      {openTaskId && (
        <TaskModal taskId={openTaskId} open={!!openTaskId} onClose={() => setOpenTaskId(null)} project={project} wsId={wsId} onUpdated={() => qc.invalidateQueries(['tasks', pid])} />
      )}
      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} project={project} wsId={wsId} onCreated={() => qc.invalidateQueries(['tasks', pid])} />
    </div>
  );
}
