const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '🏢' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  inviteCode: { type: String, default: () => uuidv4().substring(0, 8).toUpperCase() },
}, { timestamps: true });

workspaceSchema.methods.hasMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

workspaceSchema.methods.getMemberRole = function(userId) {
  const m = this.members.find(m => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
