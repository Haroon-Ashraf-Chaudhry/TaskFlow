import React from 'react';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#10b981','#06b6d4','#3b82f6'];

function colorFor(name = '') {
  const code = name.charCodeAt(0) || 0;
  return COLORS[code % COLORS.length];
}

export default function Avatar({ user, size = 'sm', style = {} }) {
  const sizeMap = { sm: 28, md: 36, lg: 40, xl: 64 };
  const px = sizeMap[size] || 28;
  const fontSize = px * 0.38;
  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      title={user?.name}
      style={{
        width: px, height: px, borderRadius: '50%',
        background: user?.avatar ? 'transparent' : colorFor(user?.name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color: 'white', flexShrink: 0,
        overflow: 'hidden', ...style,
      }}
    >
      {user?.avatar
        ? <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        : initials}
    </div>
  );
}
