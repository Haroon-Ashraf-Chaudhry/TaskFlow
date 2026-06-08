const express = require('express');
const router = express.Router();
const { protect, workspaceMember, wsAdmin } = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { logActivity } = require('../utils/activity');
const { sendInviteEmail } = require('../utils/email');

// Nested project routes
const projectRouter = require('./projects');
router.use('/:wsId/projects', protect, workspaceMember, projectRouter);

// Get all workspaces for user
router.get('/', protect, async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email avatar');
    res.json(workspaces);
  } catch (err) { next(err); }
});

// Create workspace
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    const workspace = await Workspace.create({
      name, description, color, icon,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });
    await workspace.populate('members.user', 'name email avatar');
    res.status(201).json(workspace);
  } catch (err) { next(err); }
});

// Join by invite code
router.get('/join/:code', protect, async (req, res, next) => {
  try {
    const workspace = await Workspace.findOne({ inviteCode: req.params.code.toUpperCase() });
    if (!workspace) return res.status(404).json({ message: 'Invalid invite code' });
    if (workspace.hasMember(req.user._id)) {
      return res.json({ workspace, message: 'Already a member' });
    }
    workspace.members.push({ user: req.user._id, role: 'member' });
    await workspace.save();
    await workspace.populate('members.user', 'name email avatar');
    logActivity({ workspace: workspace._id, actor: req.user._id, action: 'member:added', meta: { userId: req.user._id } });
    res.json(workspace);
  } catch (err) { next(err); }
});

// Get single workspace
router.get('/:wsId', protect, workspaceMember, async (req, res) => {
  res.json(req.workspace);
});

// Update workspace
router.put('/:wsId', protect, workspaceMember, wsAdmin, async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    Object.assign(req.workspace, { name, description, color, icon });
    await req.workspace.save();
    res.json(req.workspace);
  } catch (err) { next(err); }
});

// Delete workspace
router.delete('/:wsId', protect, workspaceMember, async (req, res, next) => {
  try {
    if (req.workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete workspace' });
    }
    await Workspace.findByIdAndDelete(req.params.wsId);
    res.json({ message: 'Workspace deleted' });
  } catch (err) { next(err); }
});

// Invite member by email
router.post('/:wsId/members', protect, workspaceMember, wsAdmin, async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found. They must register first.' });
    if (req.workspace.hasMember(user._id)) {
      return res.status(400).json({ message: 'User already a member' });
    }
    req.workspace.members.push({ user: user._id, role });
    await req.workspace.save();
    await req.workspace.populate('members.user', 'name email avatar');
    await sendInviteEmail({
      to: email,
      workspaceName: req.workspace.name,
      inviteCode: req.workspace.inviteCode,
      inviterName: req.user.name,
    });
    logActivity({ workspace: req.workspace._id, actor: req.user._id, action: 'member:added', meta: { userId: user._id } });
    res.json(req.workspace);
  } catch (err) { next(err); }
});

// Remove member
router.delete('/:wsId/members/:uid', protect, workspaceMember, wsAdmin, async (req, res, next) => {
  try {
    if (req.workspace.owner.toString() === req.params.uid) {
      return res.status(400).json({ message: 'Cannot remove owner' });
    }
    req.workspace.members = req.workspace.members.filter(m => m.user._id.toString() !== req.params.uid);
    await req.workspace.save();
    logActivity({ workspace: req.workspace._id, actor: req.user._id, action: 'member:removed', meta: { userId: req.params.uid } });
    res.json(req.workspace);
  } catch (err) { next(err); }
});

// Update member role
router.patch('/:wsId/members/:uid/role', protect, workspaceMember, wsAdmin, async (req, res, next) => {
  try {
    const member = req.workspace.members.find(m => m.user._id.toString() === req.params.uid);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = req.body.role;
    await req.workspace.save();
    res.json(req.workspace);
  } catch (err) { next(err); }
});

// Get workspace activity
router.get('/:wsId/activity', protect, workspaceMember, async (req, res, next) => {
  try {
    const activities = await Activity.find({ workspace: req.params.wsId })
      .populate('actor', 'name avatar')
      .populate('task', 'title')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) { next(err); }
});

module.exports = router;
