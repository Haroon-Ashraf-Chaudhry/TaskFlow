const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#94a3b8' },
  order: { type: Number, default: 0 },
  wipLimit: { type: Number, default: 0 },
});

const projectSchema = new mongoose.Schema({
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '📋' },
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date,
  endDate: Date,
  columns: {
    type: [columnSchema],
    default: [
      { id: 'todo', name: 'To Do', color: '#94a3b8', order: 0 },
      { id: 'in-progress', name: 'In Progress', color: '#3b82f6', order: 1 },
      { id: 'review', name: 'In Review', color: '#f59e0b', order: 2 },
      { id: 'done', name: 'Done', color: '#10b981', order: 3 },
    ]
  },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
