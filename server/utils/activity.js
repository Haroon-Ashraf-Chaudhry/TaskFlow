const Activity = require('../models/Activity');

// Fire-and-forget activity logger
exports.logActivity = (data) => {
  Activity.create(data).catch(err => console.error('Activity log error:', err));
};
