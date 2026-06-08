import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Avatar from '../common/Avatar';
import PriorityBadge from '../common/PriorityBadge';
import TypeBadge from '../common/TypeBadge';
import { format, isPast, isValid } from 'date-fns';

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const completedChecklist = task.checklist?.filter(i => i.completed).length || 0;
  const totalChecklist = task.checklist?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', userSelect: 'none' }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Labels */}
      {task.labels?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {task.labels.slice(0, 3).map(l => (
            <span key={l} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>{l}</span>
          ))}
        </div>
      )}

      {/* Title */}
      <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, marginBottom: 8, color: 'var(--text-primary)' }}>{task.title}</p>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />

        {totalChecklist > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            ☑ {completedChecklist}/{totalChecklist}
          </span>
        )}

        {task.dueDate && isValid(new Date(task.dueDate)) && (
          <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
            📅 {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}

        {task.comments?.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>💬 {task.comments.length}</span>
        )}

        {/* Assignees */}
        <div style={{ marginLeft: 'auto', display: 'flex' }}>
          {(task.assignees || []).slice(0, 3).map((a, i) => (
            <Avatar key={a._id} user={a} size="sm" style={{ marginLeft: i > 0 ? -6 : 0, border: '1px solid var(--bg-card)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
