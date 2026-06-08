import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import Avatar from '../components/common/Avatar';

const ROLES = ['owner','admin','member','viewer'];

export default function MembersPage() {
  const { wsId } = useParams();
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const { data: workspace } = useQuery({
    queryKey: ['workspace', wsId],
    queryFn: () => api.get(`/workspaces/${wsId}`).then(r => r.data),
    enabled: !!wsId,
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/workspaces/${wsId}/members`, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => { qc.invalidateQueries(['workspace', wsId]); setInviteEmail(''); },
  });

  const removeMembers = useMutation({
    mutationFn: (uid) => api.delete(`/workspaces/${wsId}/members/${uid}`),
    onSuccess: () => qc.invalidateQueries(['workspace', wsId]),
  });

  const changeRole = useMutation({
    mutationFn: ({ uid, role }) => api.patch(`/workspaces/${wsId}/members/${uid}/role`, { role }),
    onSuccess: () => qc.invalidateQueries(['workspace', wsId]),
  });

  const members = workspace?.members || [];
  const inviteCode = workspace?.inviteCode;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Members</h1>

        {/* Invite */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Invite Member</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" style={{ flex: 1 }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: 120 }}>
              {ROLES.filter(r => r !== 'owner').map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </div>
          {inviteCode && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Invite code:</span>
              <code style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>{inviteCode}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(inviteCode)}>Copy</button>
            </div>
          )}
        </div>

        {/* Members list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            {members.length} Members
          </div>
          {members.map(m => (
            <div key={m.user?._id || m.user} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <Avatar user={m.user} size="md" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{m.user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user?.email}</div>
              </div>
              <select value={m.role} onChange={e => changeRole.mutate({ uid: m.user?._id, role: e.target.value })}
                disabled={m.role === 'owner'}
                style={{ width: 110, fontSize: 13 }}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
              {m.role !== 'owner' && (
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { if (window.confirm('Remove member?')) removeMembers.mutate(m.user?._id); }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
