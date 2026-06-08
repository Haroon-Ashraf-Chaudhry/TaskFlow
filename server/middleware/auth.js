const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

exports.protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.workspaceMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.wsId).populate('members.user', 'name email avatar');
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    const member = workspace.members.find(m => m.user._id.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ message: 'Not a workspace member' });
    req.workspace = workspace;
    req.workspaceMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

exports.wsAdmin = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.workspaceMember?.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
