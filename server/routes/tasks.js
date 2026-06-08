const express = require('express');
const router = express.Router({ mergeParams: true });
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { logActivity } = require('../utils/activity');
const { upload } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// Activity for a task (top-level /api/tasks/:tid/activity)
const topRouter = express.Router();
topRouter.get('/:tid/activity', protect, async (req, res, next) => {
  try {
    const activities = await Activity.find({ task: req.params.tid })
      .populate('actor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) { next(err); }
});

// Get tasks
router.get('/', async (req, res, next) => {
  try {
    const filter = { project: req.params.pid, isArchived: false };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.sprint) filter.sprint = req.query.sprint;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    if (req.query.assignee) filter.assignees = req.query.assignee;
    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar')
      .populate('reporter', 'name avatar')
      .sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

// Create task
router.post('/', async (req, res, next) => {
  try {
    const count = await Task.countDocuments({ project: req.params.pid, status: req.body.status || 'todo' });
    const task = await Task.create({
      ...req.body,
      project: req.params.pid,
      workspace: req.params.wsId,
      reporter: req.user._id,
      order: count,
    });
    await task.populate('assignees reporter', 'name email avatar');
    req.io?.to(`project:${req.params.pid}`).emit('task:created', task);
    logActivity({
      workspace: req.params.wsId,
      project: req.params.pid,
      task: task._id,
      actor: req.user._id,
      action: 'task:created',
      meta: { title: task.title },
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// Reorder (bulk drag-drop)
router.post('/reorder', async (req, res, next) => {
  try {
    const { updates } = req.body; // [{ id, status, order }]
    const ops = updates.map(u => ({
      updateOne: {
        filter: { _id: u.id },
        update: { status: u.status, order: u.order },
      }
    }));
    await Task.bulkWrite(ops);
    req.io?.to(`project:${req.params.pid}`).emit('tasks:reordered', { updates, projectId: req.params.pid });
    res.json({ message: 'Reordered' });
  } catch (err) { next(err); }
});

// Get single task
router.get('/:tid', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid)
      .populate('assignees reporter', 'name email avatar')
      .populate('comments.author', 'name avatar')
      .populate('timeEntries.user', 'name avatar')
      .populate('checklist.completedBy', 'name');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
});

// Update task
router.put('/:tid', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.tid, req.body, { new: true })
      .populate('assignees reporter', 'name email avatar')
      .populate('comments.author', 'name avatar');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    req.io?.to(`project:${req.params.pid}`).emit('task:updated', task);
    req.io?.to(`task:${req.params.tid}`).emit('task:updated', task);
    logActivity({
      workspace: req.params.wsId,
      project: req.params.pid,
      task: task._id,
      actor: req.user._id,
      action: 'task:updated',
      meta: { fields: Object.keys(req.body) },
    });
    res.json(task);
  } catch (err) { next(err); }
});

// Delete task
router.delete('/:tid', async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.tid);
    req.io?.to(`project:${req.params.pid}`).emit('task:deleted', { taskId: req.params.tid });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
});

// Add comment
router.post('/:tid/comments', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.comments.push({ author: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.author', 'name avatar');
    const comment = task.comments[task.comments.length - 1];
    req.io?.to(`task:${req.params.tid}`).emit('comment:added', { taskId: req.params.tid, comment });
    logActivity({ workspace: req.params.wsId, project: req.params.pid, task: task._id, actor: req.user._id, action: 'comment:added' });
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

// Edit comment
router.put('/:tid/comments/:cid', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid);
    const comment = task?.comments.id(req.params.cid);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not your comment' });
    comment.text = req.body.text;
    comment.edited = true;
    await task.save();
    res.json(comment);
  } catch (err) { next(err); }
});

// Delete comment
router.delete('/:tid/comments/:cid', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid);
    task.comments = task.comments.filter(c => c._id.toString() !== req.params.cid);
    await task.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
});

// Log time
router.post('/:tid/time', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    task.timeEntries.push({ user: req.user._id, minutes: req.body.minutes, note: req.body.note });
    await task.save();
    logActivity({ workspace: req.params.wsId, project: req.params.pid, task: task._id, actor: req.user._id, action: 'time:logged', meta: { minutes: req.body.minutes } });
    res.status(201).json(task.timeEntries[task.timeEntries.length - 1]);
  } catch (err) { next(err); }
});

// Update checklist
router.put('/:tid/checklist', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.tid, { checklist: req.body.checklist }, { new: true });
    res.json(task.checklist);
  } catch (err) { next(err); }
});

// Toggle checklist item
router.patch('/:tid/checklist/:iid/toggle', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.tid);
    const item = task?.checklist.id(req.params.iid);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.completed = !item.completed;
    item.completedBy = item.completed ? req.user._id : undefined;
    await task.save();
    res.json(item);
  } catch (err) { next(err); }
});

// Upload attachment
router.post('/:tid/attachments', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const task = await Task.findById(req.params.tid);
    task.attachments.push({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    await task.save();
    res.status(201).json(task.attachments[task.attachments.length - 1]);
  } catch (err) { next(err); }
});

module.exports = router;
module.exports.topRouter = topRouter;
