const jwt = require('jsonwebtoken');

const onlineUsers = new Map(); // userId -> socketId

exports.initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);

    socket.on('workspace:join', (wsId) => {
      socket.join(`ws:${wsId}`);
    });

    socket.on('workspace:leave', (wsId) => {
      socket.leave(`ws:${wsId}`);
    });

    socket.on('project:join', (pid) => {
      socket.join(`project:${pid}`);
    });

    socket.on('project:leave', (pid) => {
      socket.leave(`project:${pid}`);
    });

    socket.on('task:join', (tid) => {
      socket.join(`task:${tid}`);
    });

    socket.on('task:leave', (tid) => {
      socket.leave(`task:${tid}`);
    });

    socket.on('task:editing', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('task:editing', { userId, taskId });
    });

    socket.on('task:editing:stop', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('task:editing:stop', { userId, taskId });
    });

    socket.on('workspace:online', (wsId, callback) => {
      const onlineInWs = [];
      const room = io.sockets.adapter.rooms.get(`ws:${wsId}`);
      if (room) {
        for (const [uid, sid] of onlineUsers) {
          if (room.has(sid)) onlineInWs.push(uid);
        }
      }
      if (typeof callback === 'function') callback(onlineInWs);
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
    });
  });
};
