const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: [
      'task:created', 'task:updated', 'task:deleted', 'task:moved',
      'comment:added', 'comment:edited', 'comment:deleted',
      'member:added', 'member:removed', 'member:role_changed',
      'project:created', 'project:updated', 'project:deleted',
      'sprint:created', 'sprint:started', 'sprint:completed',
      'time:logged',
    ],
    required: true,
  },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
