const express = require('express');
const router = express.Router({ mergeParams: true });
const Project = require('../models/Project');
const Task = require('../models/Task');
const { logActivity } = require('../utils/activity');

// Get all projects in workspace
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({ workspace: req.params.wsId })
      .populate('members', 'name email avatar');
    res.json(projects);
  } catch (err) { next(err); }
});

// Create project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, color, icon, startDate, endDate } = req.body;
    const project = await Project.create({
      workspace: req.params.wsId,
      name, description, color, icon, startDate, endDate,
      members: [req.user._id],
    });
    logActivity({ workspace: req.params.wsId, project: project._id, actor: req.user._id, action: 'project:created', meta: { name } });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// Get single project
router.get('/:pid', async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.pid, workspace: req.params.wsId })
      .populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { next(err); }
});

// Update project
router.put('/:pid', async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.pid, workspace: req.params.wsId },
      req.body,
      { new: true }
    ).populate('members', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { next(err); }
});

// Delete project
router.delete('/:pid', async (req, res, next) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.pid, workspace: req.params.wsId });
    await Task.deleteMany({ project: req.params.pid });
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
});

// Update columns
router.put('/:pid/columns', async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.pid, workspace: req.params.wsId },
      { columns: req.body.columns },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { next(err); }
});

// Project stats (parallel aggregation)
router.get('/:pid/stats', async (req, res, next) => {
  try {
    const pid = req.params.pid;
    const [byStatus, byPriority, byAssignee, overdue, timeLogged] = await Promise.all([
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(pid), isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(pid), isArchived: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(pid), isArchived: false } },
        { $unwind: { path: '$assignees', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$assignees', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, 'user.name': 1, 'user.avatar': 1, 'user.email': 1 } }
      ]),
      Task.countDocuments({ project: pid, isArchived: false, dueDate: { $lt: new Date() }, status: { $ne: 'done' } }),
      Task.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(pid) } },
        { $unwind: { path: '$timeEntries', preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, total: { $sum: '$timeEntries.minutes' } } }
      ]),
    ]);
    res.json({
      byStatus,
      byPriority,
      byAssignee,
      overdue,
      totalMinutes: timeLogged[0]?.total || 0,
    });
  } catch (err) { next(err); }
});

// Task routes nested under projects
const taskRouter = require('./tasks');
router.use('/:pid/tasks', taskRouter);

const sprintRouter = require('./sprints');
router.use('/:pid/sprints', sprintRouter);

module.exports = router;
