import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell } from 'recharts';
import api from '../utils/api';
import ProjectHeader from '../components/layout/ProjectHeader';
import Avatar from '../components/common/Avatar';

const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981', none: '#64748b' };
const STATUS_COLORS = { todo: '#94a3b8', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981' };

function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.fill || 'var(--text-primary)' }}>{p.value} tasks</div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { wsId, pid } = useParams();

  const { data: project } = useQuery({
    queryKey: ['project', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['project-stats', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}/stats`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ['sprints', pid],
    queryFn: () => api.get(`/workspaces/${wsId}/projects/${pid}/sprints`).then(r => r.data),
    enabled: !!wsId && !!pid,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ProjectHeader project={project} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    </div>
  );

  const totalTasks = (stats?.byStatus || []).reduce((s, i) => s + i.count, 0);
  const doneTasks = (stats?.byStatus || []).find(i => i._id === 'done')?.count || 0;
  const totalHours = Math.round((stats?.totalMinutes || 0) / 60 * 10) / 10;

  const statusData = (project?.columns || []).map(col => ({
    name: col.name,
    count: (stats?.byStatus || []).find(s => s._id === col.id)?.count || 0,
    color: col.color || STATUS_COLORS[col.id] || '#6366f1',
  }));

  const priorityData = ['urgent','high','medium','low','none'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    count: (stats?.byPriority || []).find(s => s._id === p)?.count || 0,
    color: PRIORITY_COLORS[p],
  }));

  const velocityData = sprints.filter(s => s.status === 'completed').map(s => ({
    name: s.name,
    velocity: s.velocity,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ProjectHeader project={project} />

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Tasks" value={totalTasks} />
          <StatCard label="Completed" value={doneTasks} color="var(--success)" sub={totalTasks ? `${Math.round(doneTasks / totalTasks * 100)}% done` : ''} />
          <StatCard label="Overdue" value={stats?.overdue || 0} color={stats?.overdue > 0 ? 'var(--danger)' : 'var(--success)'} />
          <StatCard label="Time Logged" value={`${totalHours}h`} color="var(--info)" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tasks by Status</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tasks by Priority</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocity */}
        {velocityData.length > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Sprint Velocity</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="velocity" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Assignee workload */}
        {stats?.byAssignee?.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Assignee Workload</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.byAssignee.filter(a => a._id).map(a => (
                <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar user={a.user} size="sm" />
                  <span style={{ fontSize: 13, width: 120 }} className="truncate">{a.user?.name || 'Unknown'}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${Math.min((a.count / Math.max(...stats.byAssignee.map(x => x.count))) * 100, 100)}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>{a.count} tasks</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
