import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

export default function KanbanColumn({ column, tasks, onAddTask, onTaskClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 8px' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: column.color || '#94a3b8' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{column.name}</span>
        <span style={{ marginLeft: 4, fontSize: 11, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{tasks.length}</span>
        {column.wipLimit > 0 && tasks.length >= column.wipLimit && (
          <span style={{ fontSize: 10, color: 'var(--warning)', background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 4 }}>WIP limit</span>
        )}
        <button className="btn btn-ghost btn-icon" style={{ marginLeft: 'auto', fontSize: 16, width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }} onClick={onAddTask}>+</button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{ flex: 1, overflowY: 'auto', padding: '4px', borderRadius: 8, background: isOver ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)', border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`, minHeight: 100, transition: 'all 0.15s' }}
      >
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 4 }}>
            {tasks.map(task => (
              <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task._id)} />
            ))}
          </div>
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--text-muted)', fontSize: 12 }}>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
