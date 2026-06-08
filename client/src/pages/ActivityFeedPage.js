import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../utils/api';
import Avatar from '../components/common/Avatar';

const ACTION_LABELS = {
  'task:created': 'created task',
  'task:updated': 'updated task',
  'task:deleted': 'deleted task',
  'task:moved': 'moved task',
  'comment:added': 'commented on',
  'comment:edited': 'edited a comment on',
  'comment:deleted': 'deleted a comment on',
  'member:added': 'joined workspace',
  'member:removed': 'was removed from',
  'member:role_changed': 'role changed in',
  'project:created': 'created project',
  'project:updated': 'updated project',
  'project:deleted': 'deleted project',
  'sprint:created': 'created sprint',
  'sprint:started': 'started sprint',
  'sprint:completed': 'completed sprint',
  'time:logged': 'logged time on',
};

const ACTION_ICONS = {
  'task:created': '✦',
  'task:updated': '✎',
  'task:deleted': '✕',
  'comment:added': '💬',
  'member:added': '👤',
  'project:created': '📋',
  'sprint:started': '⚡',
  'sprint:completed': '✅',
  'time:logged': '⏱',
};

export default function ActivityFeedPage() {
  const { wsId } = useParams();

  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['activity', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}/activity`).then(r => r.data),
    enabled: !!wsId,
    refetchInterval: 30000,
  });

  // Group by date
  const grouped = activity.reduce((acc, item) => {
    const date = item.createdAt ? format(new Date(item.createdAt), 'MMMM d, yyyy') : 'Unknown date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Activity Feed</h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 50 events</span>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {!isLoading && activity.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <h3>No activity yet</h3>
            <p>Activity will show up here when your team starts working</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              {date}
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map(item => (
                <div key={item._id} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Avatar user={item.actor} size="sm" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600 }}>{item.actor?.name || 'Someone'}</span>
                      {' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{ACTION_LABELS[item.action] || item.action}</span>
                      {item.task?.title && (
                        <span style={{ color: 'var(--accent)', fontWeight: 500 }}> "{item.task.title}"</span>
                      )}
                      {item.project?.name && (
                        <span style={{ color: 'var(--text-muted)' }}> in {item.project.name}</span>
                      )}
                      {item.meta?.name && !item.task?.title && (
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}> "{item.meta.name}"</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.createdAt ? format(new Date(item.createdAt), 'h:mm a') : ''}
                    </div>
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    {ACTION_ICONS[item.action] || '•'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
