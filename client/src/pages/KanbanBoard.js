import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../utils/api';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskCard from '../components/kanban/TaskCard';
import TaskModal from '../components/modals/TaskModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import ProjectHeader from '../components/layout/ProjectHeader';

export default function KanbanBoard() {
  const { wsId, pid } = useParams();
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [createCol, setCreateCol] = useState(null);
  const [search, setSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  const reorderMutation = useMutation({
    mutationFn: (updates) => api.post(`/workspaces/${wsId}/projects/${pid}/tasks/reorder`, { updates }),
  });

  const columns = project?.columns || [];

  const getTasksForColumn = useCallback((colId) =>
    tasks.filter(t => t.status === colId).sort((a, b) => a.order - b.order),
    [tasks]);

  const findColumnOfTask = (taskId) => tasks.find(t => t._id === taskId)?.status;

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const fromCol = findColumnOfTask(activeId);
    // Determine target column
    const toCol = columns.find(c => c.id === overId)?.id || findColumnOfTask(overId) || fromCol;

    const fromTasks = getTasksForColumn(fromCol);
    const toTasks = fromCol === toCol ? fromTasks : getTasksForColumn(toCol);

    let newToTasks;
    if (fromCol === toCol) {
      const oldIdx = fromTasks.findIndex(t => t._id === activeId);
      const newIdx = fromTasks.findIndex(t => t._id === overId);
      if (oldIdx === -1 || newIdx === -1) newToTasks = fromTasks;
      else newToTasks = arrayMove(fromTasks, oldIdx, newIdx);
    } else {
      newToTasks = [...toTasks];
      const insertIdx = toTasks.findIndex(t => t._id === overId);
      if (insertIdx === -1) newToTasks.push({ _id: activeId });
      else newToTasks.splice(insertIdx, 0, { _id: activeId });
    }

    // Build updates
    const updates = newToTasks.map((t, i) => ({ id: t._id, status: toCol, order: i }));
    if (fromCol !== toCol) {
      // Also reorder source column
      const remaining = fromTasks.filter(t => t._id !== activeId);
      remaining.forEach((t, i) => updates.push({ id: t._id, status: fromCol, order: i }));
    }

    // Optimistic update
    qc.setQueryData(['tasks', pid, search], old => {
      const map = {};
      updates.forEach(u => { map[u.id] = u; });
      return (old || []).map(t => map[t._id] ? { ...t, status: map[t._id].status, order: map[t._id].order } : t);
    });

    reorderMutation.mutate(updates);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader project={project} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          style={{ width: 220, fontSize: 13 }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => setCreateCol(columns[0]?.id || 'todo')}>+ Add Task</button>
      </div>

      {/* Board */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', minHeight: '100%' }}>
            {columns.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getTasksForColumn(col.id)}
                onAddTask={() => setCreateCol(col.id)}
                onTaskClick={(id) => setOpenTaskId(id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <div style={{ transform: 'rotate(2deg)', opacity: 0.9 }}><TaskCard task={activeTask} onClick={() => {}} /></div>}
          </DragOverlay>
        </DndContext>
      </div>

      {openTaskId && (
        <TaskModal
          taskId={openTaskId}
          open={!!openTaskId}
          onClose={() => setOpenTaskId(null)}
          project={project}
          wsId={wsId}
          onUpdated={() => qc.invalidateQueries(['tasks', pid])}
        />
      )}

      <CreateTaskModal
        open={!!createCol}
        onClose={() => setCreateCol(null)}
        project={project}
        wsId={wsId}
        defaultStatus={createCol}
        onCreated={() => qc.invalidateQueries(['tasks', pid])}
      />
    </div>
  );
}
