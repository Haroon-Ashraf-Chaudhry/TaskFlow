const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  edited: { type: Boolean, default: false },
}, { timestamps: true });

const timeEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  minutes: { type: Number, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, default: 'todo' },
  priority: { type: String, enum: ['none', 'low', 'medium', 'high', 'urgent'], default: 'none' },
  type: { type: String, enum: ['task', 'bug', 'feature', 'story', 'epic'], default: 'task' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  estimatedMinutes: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  labels: [String],
  comments: [commentSchema],
  timeEntries: [timeEntrySchema],
  checklist: [checklistItemSchema],
  attachments: [{ filename: String, originalname: String, mimetype: String, size: Number }],
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ workspace: 1 });

module.exports = mongoose.model('Task', taskSchema);
