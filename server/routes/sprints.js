const express = require('express');
const router = express.Router({ mergeParams: true });
const Sprint = require('../models/Sprint');
const Task = require('../models/Task');
const { logActivity } = require('../utils/activity');

// Get sprints
router.get('/', async (req, res, next) => {
  try {
    const sprints = await Sprint.find({ project: req.params.pid }).sort({ createdAt: -1 });
    res.json(sprints);
  } catch (err) { next(err); }
});

// Create sprint
router.post('/', async (req, res, next) => {
  try {
    const sprint = await Sprint.create({ ...req.body, project: req.params.pid });
    logActivity({ workspace: req.params.wsId, project: req.params.pid, actor: req.user._id, action: 'sprint:created', meta: { name: sprint.name } });
    res.status(201).json(sprint);
  } catch (err) { next(err); }
});

// Update sprint
router.put('/:sid', async (req, res, next) => {
  try {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.sid, project: req.params.pid },
      req.body,
      { new: true }
    );
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    res.json(sprint);
  } catch (err) { next(err); }
});

// Start sprint
router.post('/:sid/start', async (req, res, next) => {
  try {
    const sprint = await Sprint.findOneAndUpdate(
      { _id: req.params.sid, project: req.params.pid },
      { status: 'active', startDate: req.body.startDate || new Date(), endDate: req.body.endDate },
      { new: true }
    );
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
    logActivity({ workspace: req.params.wsId, project: req.params.pid, actor: req.user._id, action: 'sprint:started', meta: { sprintId: sprint._id, name: sprint.name } });
    res.json(sprint);
  } catch (err) { next(err); }
});

// Complete sprint
router.post('/:sid/complete', async (req, res, next) => {
  try {
    const sprint = await Sprint.findOne({ _id: req.params.sid, project: req.params.pid });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    // Count done tasks for velocity
    const doneTasks = await Task.countDocuments({ sprint: sprint._id, status: 'done' });

    // Move incomplete tasks to backlog (unassign from sprint)
    await Task.updateMany(
      { sprint: sprint._id, status: { $ne: 'done' } },
      { $unset: { sprint: '' } }
    );

    sprint.status = 'completed';
    sprint.velocity = doneTasks;
    await sprint.save();

    logActivity({ workspace: req.params.wsId, project: req.params.pid, actor: req.user._id, action: 'sprint:completed', meta: { sprintId: sprint._id, velocity: doneTasks } });
    res.json(sprint);
  } catch (err) { next(err); }
});

// Delete sprint
router.delete('/:sid', async (req, res, next) => {
  try {
    await Sprint.findOneAndDelete({ _id: req.params.sid, project: req.params.pid });
    // Move tasks to backlog
    await Task.updateMany({ sprint: req.params.sid }, { $unset: { sprint: '' } });
    res.json({ message: 'Sprint deleted' });
  } catch (err) { next(err); }
});

// Get sprint tasks
router.get('/:sid/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find({ sprint: req.params.sid })
      .populate('assignees', 'name email avatar')
      .sort({ order: 1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

module.exports = router;
