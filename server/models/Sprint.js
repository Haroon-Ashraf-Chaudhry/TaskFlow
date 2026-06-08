const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  goal: { type: String, default: '' },
  status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
  startDate: Date,
  endDate: Date,
  velocity: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Sprint', sprintSchema);
